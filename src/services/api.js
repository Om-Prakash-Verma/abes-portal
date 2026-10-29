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
    clearSession();
    throw new Error('SESSION_EXPIRED');
  }

  if (!res.ok) {
    throw new Error(`ERP returned HTTP ${res.status}`);
  }

  // Handle HTML responses (like pages)
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    const html = await res.text();
    if (html.includes('Login.aspx')) {
      clearSession();
      throw new Error('SESSION_EXPIRED');
    }
    return html;
  }

  const json = await res.json();

  if (typeof json === 'string' && json.includes('Login.aspx')) {
    clearSession();
    throw new Error('SESSION_EXPIRED');
  }

  let data = json.d;
  if (typeof data === 'string' && (data.startsWith('[') || data.startsWith('{'))) {
    data = JSON.parse(data);
  }
  return data;
}

// 1. Fetch available semesters dynamically for the logged-in student
export async function fetchAvailableSemesters() {
  try {
    const html = await fetchErp('ERP/Dashboard/Student/Attendance/Default.aspx', 'GET');
    if (typeof html === 'string') {
      const selectMatch = html.match(/<select[^>]*ddlsem[^>]*>(.*?)<\/select>/si);
      if (selectMatch) {
        const options = [];
        const optRegex = /<option[^>]*value=['"]([^'"]*)['"][^>]*>(.*?)<\/option>/gi;
        let match;
        while ((match = optRegex.exec(selectMatch[1])) !== null) {
          if (match[1]) {
            options.push({
              id: match[1].trim(),
              name: match[2].replace(/<\/?[^>]+>/g, '').trim()
            });
          }
        }
        if (options.length > 0) return options;
      }
    }
  } catch (err) {
    console.warn('Could not extract dynamic semesters from HTML, falling back:', err.message);
  }
  return [{ id: 'CS05', name: 'Sem V' }];
}

// 2. Fetch live student profile
export async function fetchProfile() {
  const raw = await fetchErp('ERP/Dashboard/Student/MyProfile/Default.aspx/getStudentProfile', 'POST', {
    StudentDash: { mode: 'StudentProfile' }
  });

  if (Array.isArray(raw) && raw.length > 0) {
    return raw[0];
  }
  throw new Error('Could not retrieve student profile from ERP');
}

// 3. Fetch live student attendance dynamically for any student / semester
export async function fetchAttendance(semId) {
  if (!semId) {
    const sems = await fetchAvailableSemesters();
    semId = sems[0]?.id || 'CS05';
  }

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
      ? item.SubName.replace(/<\/?[^>]+(>|$)/g, '').replace(':-', '').trim()
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

// 4. Fetch day-by-day live lecture logs for a subject
export async function fetchSubjectDetail(subjectId, semId) {
  if (!subjectId) return [];

  const raw = await fetchErp('ERP/Dashboard/Student/Attendance/Default.aspx/getSubjectAtt', 'POST', {
    StudentDashBAL: { semid: semId || 'CS05', subjectid: subjectId, mode: 'MySubjectAttendance' }
  });

  if (!Array.isArray(raw)) return [];

  return raw.filter(r => r.AttDate).map(r => {
    let status = 'A';
    if (r.Attendance && r.Attendance.includes('>P<')) {
      status = 'P';
    } else if (r.Attendance && r.Attendance.includes('>A<')) {
      status = 'A';
    } else if (typeof r.Attendance === 'string') {
      status = r.Attendance.replace(/<\/?[^>]+(>|$)/g, '').trim();
    }

    return {
      AttDate: r.AttDate,
      NoOfLecture: r.NoOfLecture || 1,
      Attendance: status,
      Topic: r.Topic || 'Regular Lecture'
    };
  });
}

// 5. Fetch live fee receipts
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
