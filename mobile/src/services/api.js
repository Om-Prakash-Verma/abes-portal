import { Capacitor, CapacitorHttp, CapacitorCookies } from '@capacitor/core';

const ERP_BASE_URL = 'https://erp.abes.ac.in';
const STORAGE_KEY = 'abes_erp_session_cookie';
const CACHE_PREFIX = 'abes_cache_';
const SAVED_CREDS_KEY = 'abes_saved_credentials';
const SESSION_START_KEY = 'abes_session_started_at';
export const ERP_SESSION_DURATION_MS = 20 * 60 * 1000;

// High-Efficiency Cache
export const TTL_ATTENDANCE = 12 * 60 * 60 * 1000;
export const TTL_TIMELINE = 12 * 60 * 60 * 1000;
export const TTL_PROFILE = 30 * 24 * 60 * 60 * 1000;
export const TTL_FEES = 7 * 24 * 60 * 60 * 1000;

const inMemorySubjectCache = new Map();

// -------------------------------------------------------------
// Credentials & Session Storage
// -------------------------------------------------------------

export function getSavedCredentials() {
  try {
    const raw = localStorage.getItem(SAVED_CREDS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setSavedCredentials(username, password) {
  try {
    if (username && password) {
      localStorage.setItem(SAVED_CREDS_KEY, JSON.stringify({ username: username.trim(), password }));
    }
  } catch (e) {}
}

export function clearSavedCredentials() {
  localStorage.removeItem(SAVED_CREDS_KEY);
}

export function setSessionStartTime(ts = Date.now()) {
  try {
    localStorage.setItem(SESSION_START_KEY, ts.toString());
  } catch (e) {}
}

export function getSessionStartTime() {
  try {
    const val = localStorage.getItem(SESSION_START_KEY);
    return val ? parseInt(val, 10) : null;
  } catch (e) {
    return null;
  }
}

export function getSessionRemainingSeconds() {
  const start = getSessionStartTime();
  if (!start) return 0;
  const elapsed = Date.now() - start;
  return Math.max(0, Math.floor((ERP_SESSION_DURATION_MS - elapsed) / 1000));
}

export function getStoredCookie() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function setStoredCookie(cookie) {
  if (cookie && cookie.trim()) {
    localStorage.setItem(STORAGE_KEY, cookie.trim());
    setSessionStartTime(Date.now());
  } else {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_START_KEY);
  }
}

export function hasValidSession() {
  return Boolean(getStoredCookie());
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SESSION_START_KEY);
  try {
    CapacitorCookies.clearAllCookies();
  } catch (e) {}
  clearAllCaches();
}

// -------------------------------------------------------------
// Local Caching
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

// Helper: Read all cookies from native Android cookie manager
async function getNativeCookiesString() {
  try {
    const cookieObj = await CapacitorCookies.getCookies({ url: ERP_BASE_URL });
    if (cookieObj && typeof cookieObj === 'object') {
      const parts = Object.entries(cookieObj).map(([k, v]) => `${k}=${v}`);
      if (parts.length > 0) return parts.join('; ');
    }
  } catch (e) {}
  return getStoredCookie();
}

// -------------------------------------------------------------
// 100% PURE NATIVE DIRECT AUTHENTICATION (0 CLOUDFLARE WORKER USAGE)
// -------------------------------------------------------------

// STEP 1: Direct native request to trigger OTP to student email
export async function sendLoginOtp(username, password) {
  const cleanUser = username.trim();

  // 1. Acquire initial Login page to read __VIEWSTATE
  const getRes = await CapacitorHttp.get({
    url: `${ERP_BASE_URL}/Login.aspx`,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36'
    }
  });

  const html = typeof getRes.data === 'string' ? getRes.data : '';
  const vsMatch = html.match(/id="__VIEWSTATE" value="([^"]+)"/);
  const genMatch = html.match(/id="__VIEWSTATEGENERATOR" value="([^"]+)"/);

  if (!vsMatch) {
    throw new Error('Could not establish direct connection to ABES ERP server.');
  }

  // 2. Submit credentials to trigger OTP directly
  const params = new URLSearchParams();
  params.append('__EVENTTARGET', '');
  params.append('__EVENTARGUMENT', '');
  params.append('__VIEWSTATE', vsMatch[1]);
  params.append('__VIEWSTATEGENERATOR', genMatch ? genMatch[1] : 'C2EE9ABB');
  params.append('txtuser', cleanUser);
  params.append('txtPassword', password);
  params.append('txtOTP', '');
  params.append('g-recaptcha-response', '');
  params.append('btnOTP', 'Get OTP');

  const postRes = await CapacitorHttp.post({
    url: `${ERP_BASE_URL}/Login.aspx`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': `${ERP_BASE_URL}/Login.aspx`
    },
    data: params.toString()
  });

  const postHtml = typeof postRes.data === 'string' ? postRes.data : '';
  const newVsMatch = postHtml.match(/id="__VIEWSTATE" value="([^"]+)"/);
  const isOtpSent = postHtml.includes('OTP has been Sent') || postHtml.includes('Sent on your Mobile');

  if (isOtpSent) {
    const cookiesStr = await getNativeCookiesString();
    return {
      success: true,
      message: 'OTP has been sent to your official college email ID.',
      viewState: newVsMatch ? newVsMatch[1] : vsMatch[1],
      sessionCookie: cookiesStr
    };
  }

  let errorMsg = 'Incorrect Password. Please check your credentials and try again.';
  const alertMatch = postHtml.match(/<div class=['"]alert[^>]*>(.*?)<\/div>/si);
  if (alertMatch) {
    const cleanAlert = alertMatch[1].replace(/<[^>]+>/g, '').trim();
    if (cleanAlert && cleanAlert.length > 2) errorMsg = cleanAlert;
  }
  throw new Error(errorMsg);
}

// STEP 2: Direct native verification of OTP on college server (0 Worker usage)
export async function verifyLoginOtp({ username, password, otp, viewState, sessionCookie }) {
  const params = new URLSearchParams();
  params.append('__EVENTTARGET', '');
  params.append('__EVENTARGUMENT', '');
  params.append('__VIEWSTATE', viewState || '');
  params.append('__VIEWSTATEGENERATOR', 'C2EE9ABB');
  params.append('txtuser', username.trim());
  params.append('txtPassword', password);
  params.append('txtOTP', otp.trim());
  params.append('g-recaptcha-response', '');
  params.append('btnLogin', 'Verify OTP');

  // Disable redirects so the native client captures the 302 Found response and Set-Cookie
  const verifyRes = await CapacitorHttp.post({
    url: `${ERP_BASE_URL}/Login.aspx`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': sessionCookie || '',
      'Referer': `${ERP_BASE_URL}/Login.aspx`
    },
    data: params.toString(),
    disableRedirects: true
  });

  const bodyStr = typeof verifyRes.data === 'string' ? verifyRes.data : '';
  const locationHeader = verifyRes.headers?.['location'] || verifyRes.headers?.['Location'] || '';
  const finalUrl = verifyRes.url || '';

  // Get all session cookies directly from the Android cookie store
  let cookiesStr = await getNativeCookiesString();

  // If set-cookie was in header, parse it too
  const rawSetCookie = verifyRes.headers?.['set-cookie'] || verifyRes.headers?.['Set-Cookie'];
  if (rawSetCookie) {
    const scArray = Array.isArray(rawSetCookie) ? rawSetCookie : [rawSetCookie];
    const extracted = scArray.map(c => c.split(';')[0].trim()).join('; ');
    if (extracted) {
      cookiesStr = cookiesStr ? `${cookiesStr}; ${extracted}` : extracted;
    }
  }

  const isSuccess =
    verifyRes.status === 302 ||
    locationHeader.includes('Home/Student') ||
    finalUrl.includes('Home/Student') ||
    bodyStr.includes('Home/Student') ||
    cookiesStr.includes('MyAuth');

  if (isSuccess) {
    setStoredCookie(cookiesStr);
    clearAllCaches();
    return { success: true, cookies: cookiesStr };
  }

  // If login failed, extract college error message
  const alertMatch = bodyStr.match(/<div class=['"]alert[^>]*>(.*?)<\/div>/si);
  const errorMsg = alertMatch
    ? alertMatch[1].replace(/<[^>]+>/g, '').trim()
    : 'Invalid OTP. Please check the OTP sent to your college email.';
  throw new Error(errorMsg);
}

// Low-level helper: native direct request to ERP endpoints (0 Worker usage)
async function fetchErp(endpoint, method = 'POST', payload = null) {
  const cookie = getStoredCookie();
  if (!cookie) throw new Error('NO_SESSION');

  const cleanEndpoint = endpoint.replace(/^\//, '');
  const targetUrl = `${ERP_BASE_URL}/${cleanEndpoint}`;

  const res = await CapacitorHttp.request({
    url: targetUrl,
    method,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cookie': cookie,
      'Referer': `${ERP_BASE_URL}/`
    },
    data: payload ? payload : undefined
  });

  if (res.status === 401 || res.status === 403) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('abes:session_expired'));
    throw new Error('SESSION_EXPIRED');
  }

  let json = res.data;
  if (typeof json === 'string') {
    if (json.includes('Login.aspx')) {
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('abes:session_expired'));
      throw new Error('SESSION_EXPIRED');
    }
    try {
      json = JSON.parse(json);
    } catch (e) {}
  }

  let data = json?.d !== undefined ? json.d : json;
  if (typeof data === 'string' && (data.startsWith('[') || data.startsWith('{'))) {
    data = JSON.parse(data);
  }
  return data;
}

// Dynamic Semester Derivation
export function deriveSemId(profile) {
  if (!profile) return 'CS01';

  const directSemId = profile.samester_id || profile.semester_id || profile.Samester_Id || profile.Semester_Id || profile.semid || profile.SemId;
  if (directSemId && typeof directSemId === 'string' && /^[A-Z]{2,4}\d{2}$/i.test(directSemId.trim())) {
    return directSemId.trim().toUpperCase();
  }

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

  let num = '01';

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

// 3. Fetch day-by-day live lecture logs
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

  lectures.sort((a, b) => b.timestamp - a.timestamp);
  inMemorySubjectCache.set(memoryKey, lectures);
  return lectures;
}

// 4. Fetch aggregated date-wise attendance timeline
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

// 5. Fetch live fee receipts
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
