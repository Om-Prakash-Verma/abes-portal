const STORAGE_KEY = 'abes_erp_session_cookie';
const CACHE_PREFIX = 'abes_cache_';

// -------------------------------------------------------------
// High-Efficiency Multi-Tier Cache Lifetimes
// Slashes 95%+ of Worker Requests
// -------------------------------------------------------------
export const TTL_ATTENDANCE = 12 * 60 * 60 * 1000;    // 12 hours for academic attendance
export const TTL_TIMELINE = 12 * 60 * 60 * 1000;      // 12 hours for date-wise timeline
export const TTL_PROFILE = 30 * 24 * 60 * 60 * 1000;  // 30 days for static student profile
export const TTL_FEES = 7 * 24 * 60 * 60 * 1000;      // 7 days for financial receipts

// In-memory cache for subject drilldowns to avoid repeated requests during a session
const inMemorySubjectCache = new Map();

export function getStoredCookie() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function setStoredCookie(cookie) {
  if (cookie && cookie.trim()) {
    localStorage.setItem(STORAGE_KEY, cookie.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function hasValidSession() {
  return Boolean(getStoredCookie());
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
  clearAllCaches();
}

// -------------------------------------------------------------
// Cache Utilities
// -------------------------------------------------------------

export function getCachedItem(key, ttl = TTL_ATTENDANCE) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { timestamp, data } = JSON.parse(raw);
    if (Date.now() - timestamp < ttl) {
      return data;
    }
  } catch (e) {}
  return null;
}

export function setCachedItem(key, data) {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ timestamp: Date.now(), data })
    );
  } catch (e) {}
}

export function clearAllCaches() {
  inMemorySubjectCache.clear();
  try {
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (k.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(k);
      }
    }
  } catch (e) {}
}

// -------------------------------------------------------------
// Authentication Endpoints (Send OTP & Verify OTP)
// -------------------------------------------------------------

export async function sendLoginOtp(username, password) {
  const res = await fetch('/api/auth?action=send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to trigger OTP.');
  }
  return data;
}

export async function verifyLoginOtp({ username, password, otp, viewState, sessionCookie }) {
  const res = await fetch('/api/auth?action=verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, otp, viewState, sessionCookie })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to verify OTP.');
  }

  if (data.cookies) {
    setStoredCookie(data.cookies);
    clearAllCaches(); // Ensure fresh data upon new login
  }
  return data;
}

// -------------------------------------------------------------
// Low-level helper to make calls to ABES ERP through proxy
// -------------------------------------------------------------

async function fetchErp(endpoint, method = 'POST', payload = null) {
  const cookie = getStoredCookie();

  if (!cookie) {
    throw new Error('NO_SESSION');
  }

  const targetUrl = `/api/abes/${endpoint.replace(/^\//, '')}`;

  const headers = {
    'x-cookie': cookie,
  };

  if (method === 'POST') {
    headers['Content-Type'] = 'application/json; charset=utf-8';
  }

  const res = await fetch(targetUrl, {
    method,
    headers,
    body: method === 'POST' ? JSON.stringify(payload) : undefined,
  });

  if (res.status === 401 || res.status === 403) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('abes:session_expired'));
    }
    throw new Error('SESSION_EXPIRED');
  }

  if (!res.ok) {
    throw new Error(`ERP returned HTTP ${res.status}`);
  }

  const json = await res.json();

  if (typeof json === 'string' && json.includes('Login.aspx')) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('abes:session_expired'));
    }
    throw new Error('SESSION_EXPIRED');
  }

  let data = json.d;
  if (typeof data === 'string' && (data.startsWith('[') || data.startsWith('{'))) {
    data = JSON.parse(data);
  }
  return data;
}

// Helper: Derive semid dynamically from student profile
export function deriveSemId(profile) {
  if (!profile) return 'CS01';

  // Check direct semid property if ERP returns it
  const directSemId = profile.samester_id || profile.semester_id || profile.Samester_Id || profile.Semester_Id || profile.semid || profile.SemId;
  if (directSemId && typeof directSemId === 'string' && /^[A-Z]{2,4}\d{2}$/i.test(directSemId.trim())) {
    return directSemId.trim().toUpperCase();
  }

  // Find semester string across all possible profile fields
  const semStr = (
    profile.Samester_Name ||
    profile.Semester_Name ||
    profile.samester_name ||
    profile.semester_name ||
    profile.adm_samester_name ||
    profile.adm_semester_name ||
    profile.CurrentSemester ||
    profile.Semester ||
    profile.Samester ||
    ''
  ).toLowerCase();

  let num = '01'; // Default to Sem 1 for incoming students

  if (/\b(viii|8th|eighth|sem[-_\s]*8|semester[-_\s]*8)\b/i.test(semStr) || /\b8\b/.test(semStr)) {
    num = '08';
  } else if (/\b(vii|7th|seventh|sem[-_\s]*7|semester[-_\s]*7)\b/i.test(semStr) || /\b7\b/.test(semStr)) {
    num = '07';
  } else if (/\b(vi|6th|sixth|sem[-_\s]*6|semester[-_\s]*6)\b/i.test(semStr) || /\b6\b/.test(semStr)) {
    num = '06';
  } else if (/\b(v|5th|fifth|sem[-_\s]*5|semester[-_\s]*5)\b/i.test(semStr) || /\b5\b/.test(semStr)) {
    num = '05';
  } else if (/\b(iv|4th|fourth|sem[-_\s]*4|semester[-_\s]*4)\b/i.test(semStr) || /\b4\b/.test(semStr)) {
    num = '04';
  } else if (/\b(iii|3rd|third|sem[-_\s]*3|semester[-_\s]*3)\b/i.test(semStr) || /\b3\b/.test(semStr)) {
    num = '03';
  } else if (/\b(ii|2nd|second|sem[-_\s]*2|semester[-_\s]*2)\b/i.test(semStr) || /\b2\b/.test(semStr)) {
    num = '02';
  } else if (/\b(i|1st|first|sem[-_\s]*1|semester[-_\s]*1)\b/i.test(semStr) || /\b1\b/.test(semStr)) {
    num = '01';
  }

  const branchStr = (
    profile.Branch_Name ||
    profile.branch_name ||
    profile.adm_branch ||
    profile.Program_Name ||
    ''
  ).toUpperCase();

  let branch = 'CS';
  if (/\b(IT|INFORMATION)\b/.test(branchStr)) branch = 'IT';
  else if (/\b(AIML|AI|ARTIFICIAL)\b/.test(branchStr)) branch = 'AIML';
  else if (/\b(DS|DATA)\b/.test(branchStr)) branch = 'DS';
  else if (/\b(EC|ECE|ELECTRONIC|ELECTRONICS)\b/.test(branchStr)) branch = 'EC';
  else if (/\b(ME|MECHANIC|MECHANICAL)\b/.test(branchStr)) branch = 'ME';
  else if (/\b(EN|EEE|ELECTRICAL)\b/.test(branchStr)) branch = 'EN';
  else if (/\b(CE|CIVIL)\b/.test(branchStr)) branch = 'CE';

  return `${branch}${num}`;
}

// Generate semester options based on student branch and active semester
export function getAvailableSemesters(profile) {
  const currentSem = deriveSemId(profile);
  const branch = currentSem.replace(/[0-9]/g, '');

  const semNumbers = [
    { num: '01', name: 'Sem I' },
    { num: '02', name: 'Sem II' },
    { num: '03', name: 'Sem III' },
    { num: '04', name: 'Sem IV' },
    { num: '05', name: 'Sem V' },
    { num: '06', name: 'Sem VI' },
    { num: '07', name: 'Sem VII' },
    { num: '08', name: 'Sem VIII' }
  ];

  return semNumbers.map(s => ({
    id: `${branch}${s.num}`,
    name: s.name
  }));
}

// 1. Fetch live student profile (with 30-day local cache)
export async function fetchProfile(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = getCachedItem('profile', TTL_PROFILE);
    if (cached) return cached;
  }

  const raw = await fetchErp('ERP/Dashboard/Student/MyProfile/Default.aspx/getStudentProfile', 'POST', {
    StudentDash: { mode: 'StudentProfile' }
  });

  if (Array.isArray(raw) && raw.length > 0) {
    const profile = raw[0];
    setCachedItem('profile', profile);
    return profile;
  }
  throw new Error('Could not retrieve student profile from ERP');
}

// 2. Fetch live student attendance (with 12-hour local cache)
export async function fetchAttendance(semId = 'CS01', forceRefresh = false) {
  const cacheKey = `att_${semId}`;
  if (!forceRefresh) {
    const cached = getCachedItem(cacheKey, TTL_ATTENDANCE);
    if (cached) return cached;
  }

  const raw = await fetchErp('ERP/Dashboard/Student/Attendance/Default.aspx/getStudentAtt', 'POST', {
    StudentDashBAL: { semid: semId, mode: 'MyAttendance' }
  });

  if (!Array.isArray(raw)) {
    throw new Error('Invalid attendance response format from ERP');
  }

  const cleaned = raw.map(item => {
    let subjectId = null;
    if (item.Action && typeof item.Action === 'string') {
      const match = item.Action.match(/show\('([^']+)'\)/);
      if (match) subjectId = match[1];
    }

    const isTotal = item.SubName && item.SubName.toLowerCase().includes('total');
    const cleanSubName = item.SubName
      ? item.SubName.replace(/<\/?[^>]+>/g, '').replace(':-', '').trim()
      : '';

    return {
      ...item,
      SubName: cleanSubName,
      isTotal,
      subjectId,
      Percentage: typeof item.Percentage === 'number'
        ? Number(item.Percentage.toFixed(1))
        : parseFloat(item.Percentage) || 0
    };
  });

  setCachedItem(cacheKey, cleaned);
  return cleaned;
}

// Helper: Robust Date Parser for ERP date formats (e.g. "14 Aug 2026", "14/08/2026", "2026-08-14")
export function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return new Date(0);
  const clean = dateStr.trim();
  const standard = new Date(clean);
  if (!isNaN(standard.getTime())) return standard;

  const parts = clean.split(/[-/]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) return parsed;
    }
  }
  return new Date(0);
}

// Helper: Format date with weekday and readable label
export function formatDate(dateStr) {
  const d = parseDate(dateStr);
  if (!d.getTime()) return dateStr;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// 3. Fetch day-by-day live lecture logs (with in-memory session cache and date sorting)
export async function fetchSubjectDetail(subjectId, semId = 'CS01', forceRefresh = false) {
  if (!subjectId) return [];

  const memoryKey = `${semId}_${subjectId}`;
  if (!forceRefresh && inMemorySubjectCache.has(memoryKey)) {
    return inMemorySubjectCache.get(memoryKey);
  }

  const raw = await fetchErp('ERP/Dashboard/Student/Attendance/Default.aspx/getSubjectAtt', 'POST', {
    StudentDashBAL: { semid: semId, subjectid: subjectId, mode: 'MySubjectAttendance' }
  });

  if (!Array.isArray(raw)) return [];

  const lectures = raw.filter(r => r.AttDate).map(r => {
    let status = 'A';
    if (r.Attendance && r.Attendance.includes('>P<')) {
      status = 'P';
    } else if (r.Attendance && r.Attendance.includes('>A<')) {
      status = 'A';
    } else if (typeof r.Attendance === 'string') {
      status = r.Attendance.replace(/<\/?[^>]+>/g, '').trim();
    }

    const parsedDate = parseDate(r.AttDate);
    const timestamp = parsedDate.getTime();

    return {
      AttDate: r.AttDate,
      dateObj: parsedDate,
      timestamp,
      formattedDate: formatDate(r.AttDate),
      NoOfLecture: Number(r.NoOfLecture) || 1,
      Attendance: status,
      Topic: r.Topic || 'Regular Lecture'
    };
  });

  // Sort strictly by date descending (newest dates first)
  lectures.sort((a, b) => b.timestamp - a.timestamp);

  inMemorySubjectCache.set(memoryKey, lectures);
  return lectures;
}

// 4. Fetch aggregated date-wise attendance timeline across all registered subjects (with 12-hour local cache)
export async function fetchAllDateWiseAttendance(semId = 'CS01', subjects = [], forceRefresh = false) {
  const validSubjects = subjects.filter(s => s.subjectId && !s.isTotal);
  if (validSubjects.length === 0) return [];

  const cacheKey = `timeline_${semId}`;
  if (!forceRefresh) {
    const cached = getCachedItem(cacheKey, TTL_TIMELINE);
    if (cached) return cached;
  }

  const promises = validSubjects.map(async (sub) => {
    const details = await fetchSubjectDetail(sub.subjectId, semId, forceRefresh);
    return details.map(d => ({
      ...d,
      subjectId: sub.subjectId,
      SubCollegeCode: sub.SubCollegeCode,
      SubName: sub.SubName
    }));
  });

  const allRecords = (await Promise.all(promises)).flat();

  // Group lectures by date
  const dateGroups = {};
  for (const rec of allRecords) {
    const key = rec.AttDate;
    if (!dateGroups[key]) {
      dateGroups[key] = {
        date: rec.AttDate,
        timestamp: rec.timestamp,
        formattedDate: rec.formattedDate,
        lectures: [],
        totalPresent: 0,
        totalAbsent: 0,
        totalCount: 0
      };
    }
    dateGroups[key].lectures.push(rec);
    dateGroups[key].totalCount += rec.NoOfLecture;
    if (rec.Attendance === 'P') {
      dateGroups[key].totalPresent += rec.NoOfLecture;
    } else {
      dateGroups[key].totalAbsent += rec.NoOfLecture;
    }
  }

  // Calculate day percentage and sort by date descending
  const sortedDays = Object.values(dateGroups).map(day => {
    const percentage = day.totalCount > 0
      ? Number(((day.totalPresent / day.totalCount) * 100).toFixed(1))
      : 0;
    return {
      ...day,
      percentage
    };
  }).sort((a, b) => b.timestamp - a.timestamp);

  setCachedItem(cacheKey, sortedDays);
  return sortedDays;
}

// 5. Fetch live fee receipts (with 7-day local cache)
export async function fetchFeeHistory(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = getCachedItem('fees', TTL_FEES);
    if (cached) return cached;
  }

  const raw = await fetchErp('ERP/Dashboard/Student/Fina_StuDetail/RcptHistory.aspx/get_StuFeeHistory', 'POST', {
    objStudFee: { fromdate: '', todate: '' }
  });

  if (!Array.isArray(raw)) return [];

  const receipts = raw.map(r => ({
    FeeRecieptNo: r.FeeRecieptNo,
    ReceiptDate: r.ReceiptDate,
    AdmNo: r.AdmNo,
    StudentName: (r.StudentName || '').trim(),
    AmountReceived: r.AmountReceived,
    Mode: 'Online / Bank',
    Status: r.iscancel === '0' ? 'Paid' : 'Cancelled'
  }));

  setCachedItem('fees', receipts);
  return receipts;
}
