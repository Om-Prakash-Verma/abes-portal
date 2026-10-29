const STORAGE_KEY = 'abes_erp_session_cookie';

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
    throw new Error('SESSION_EXPIRED');
  }

  if (!res.ok) {
    throw new Error(`ERP returned HTTP ${res.status}`);
  }

  const json = await res.json();

  if (typeof json === 'string' && json.includes('Login.aspx')) {
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
  if (!profile) return 'CS05';

  const semStr = (profile.Samester_Name || '').toLowerCase();
  let num = '05';
  if (semStr.includes('viii') || semStr.includes('8')) num = '08';
  else if (semStr.includes('vii') || semStr.includes('7')) num = '07';
  else if (semStr.includes('vi') || semStr.includes('6')) num = '06';
  else if (semStr.includes('v') || semStr.includes('5')) num = '05';
  else if (semStr.includes('iv') || semStr.includes('4')) num = '04';
  else if (semStr.includes('iii') || semStr.includes('3')) num = '03';
  else if (semStr.includes('ii') || semStr.includes('2')) num = '02';
  else if (semStr.includes('i') || semStr.includes('1')) num = '01';

  const branchStr = (profile.Branch_Name || '').toUpperCase();
  let branch = 'CS';
  if (branchStr.includes('IT') || branchStr.includes('INFORMATION')) branch = 'IT';
  else if (branchStr.includes('AIML')) branch = 'AIML';
  else if (branchStr.includes('DS') || branchStr.includes('DATA')) branch = 'DS';
  else if (branchStr.includes('EC') || branchStr.includes('ELECTRONIC')) branch = 'EC';
  else if (branchStr.includes('ME') || branchStr.includes('MECHANIC')) branch = 'ME';
  else if (branchStr.includes('EN') || branchStr.includes('ELECTRICAL')) branch = 'EN';
  else if (branchStr.includes('CE') || branchStr.includes('CIVIL')) branch = 'CE';

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

// 1. Fetch live student profile
export async function fetchProfile() {
  const raw = await fetchErp('ERP/Dashboard/Student/MyProfile/Default.aspx/getStudentProfile', 'POST', {
    StudentDash: { mode: 'StudentProfile' }
  });

  if (Array.isArray(raw) && raw.length > 0) {
    return raw[0];
  }
  throw new Error('Could not retrieve student profile from ERP');
}

// 2. Fetch live student attendance dynamically for any student / semester
export async function fetchAttendance(semId = 'CS05') {
  const raw = await fetchErp('ERP/Dashboard/Student/Attendance/Default.aspx/getStudentAtt', 'POST', {
    StudentDashBAL: { semid: semId, mode: 'MyAttendance' }
  });

  if (!Array.isArray(raw)) {
    throw new Error('Invalid attendance response format from ERP');
  }

  return raw.map(item => {
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
}

// 3. Fetch day-by-day live lecture logs for a subject
export async function fetchSubjectDetail(subjectId, semId = 'CS05') {
  if (!subjectId) return [];

  const raw = await fetchErp('ERP/Dashboard/Student/Attendance/Default.aspx/getSubjectAtt', 'POST', {
    StudentDashBAL: { semid: semId, subjectid: subjectId, mode: 'MySubjectAttendance' }
  });

  if (!Array.isArray(raw)) return [];

  return raw.filter(r => r.AttDate).map(r => {
    let status = 'A';
    if (r.Attendance && r.Attendance.includes('>P<')) {
      status = 'P';
    } else if (r.Attendance && r.Attendance.includes('>A<')) {
      status = 'A';
    } else if (typeof r.Attendance === 'string') {
      status = r.Attendance.replace(/<\/?[^>]+>/g, '').trim();
    }

    return {
      AttDate: r.AttDate,
      NoOfLecture: r.NoOfLecture || 1,
      Attendance: status,
      Topic: r.Topic || 'Regular Lecture'
    };
  });
}

// 4. Fetch live fee receipts
export async function fetchFeeHistory() {
  const raw = await fetchErp('ERP/Dashboard/Student/Fina_StuDetail/RcptHistory.aspx/get_StuFeeHistory', 'POST', {
    objStudFee: { fromdate: '', todate: '' }
  });

  if (!Array.isArray(raw)) return [];

  return raw.map(r => ({
    FeeRecieptNo: r.FeeRecieptNo,
    ReceiptDate: r.ReceiptDate,
    AdmNo: r.AdmNo,
    StudentName: (r.StudentName || '').trim(),
    AmountReceived: r.AmountReceived,
    Mode: 'Online / Bank',
    Status: r.iscancel === '0' ? 'Paid' : 'Cancelled'
  }));
}
