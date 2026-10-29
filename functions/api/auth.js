// Cloudflare Pages Function - Native Auth Handler for ABES ERP
export async function onRequest(context) {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action'); // 'send-otp' or 'verify-otp'

  try {
    const body = await request.json();

    if (action === 'send-otp') {
      return await handleSendOtp(body);
    } else if (action === 'verify-otp') {
      return await handleVerifyOtp(body);
    } else {
      return jsonResponse({ error: 'Invalid action. Expected action=send-otp or action=verify-otp' }, 400);
    }
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

function parseSetCookies(res, existing = '') {
  const map = new Map();

  if (existing) {
    existing.split(';').forEach(c => {
      const parts = c.trim().split('=');
      if (parts[0] && parts.length > 1) {
        map.set(parts[0].trim(), parts.slice(1).join('='));
      }
    });
  }

  let cookieHeaders = [];
  if (typeof res.headers.getSetCookie === 'function') {
    cookieHeaders = res.headers.getSetCookie();
  } else {
    const sc = res.headers.get('set-cookie');
    if (sc) cookieHeaders = [sc];
  }

  cookieHeaders.forEach(header => {
    const cookiePart = header.split(';')[0];
    const parts = cookiePart.trim().split('=');
    if (parts[0] && parts.length > 1) {
      map.set(parts[0].trim(), parts.slice(1).join('='));
    }
  });

  return Array.from(map.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
}

// STEP 1: Verify ID existence & Password, then trigger OTP
async function handleSendOtp({ username, password }) {
  if (!username || !password) {
    return jsonResponse({ success: false, error: 'Username and Password are required.' }, 400);
  }

  const cleanUser = username.trim();

  // 1. Verify if user exists in ABES system
  try {
    const userCheckRes = await fetch('https://erp.abes.ac.in/Login.aspx/GetUserLoginType', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ UserID: cleanUser })
    });
    const userCheckData = await userCheckRes.json();
    if (!userCheckData.d) {
      return jsonResponse({ success: false, error: `ERP ID "${cleanUser}" was not found in the ABES database.` }, 404);
    }
  } catch (e) {
    // Non-blocking if check endpoint is temporarily unreachable
  }

  // 2. GET initial login page to acquire __VIEWSTATE and session cookies
  const getRes = await fetch('https://erp.abes.ac.in/Login.aspx', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
    }
  });

  const html = await getRes.text();
  const vsMatch = html.match(/id="__VIEWSTATE" value="([^"]+)"/);
  const genMatch = html.match(/id="__VIEWSTATEGENERATOR" value="([^"]+)"/);
  const initialCookies = parseSetCookies(getRes);

  if (!vsMatch) {
    return jsonResponse({ success: false, error: 'Could not connect to ERP portal.' }, 502);
  }

  // 3. Submit credentials to check password and trigger OTP
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

  const postRes = await fetch('https://erp.abes.ac.in/Login.aspx', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      'Cookie': initialCookies,
      'Referer': 'https://erp.abes.ac.in/Login.aspx',
      'Origin': 'https://erp.abes.ac.in'
    },
    body: params.toString()
  });

  const postHtml = await postRes.text();
  const postCookies = parseSetCookies(postRes, initialCookies);
  const newVsMatch = postHtml.match(/id="__VIEWSTATE" value="([^"]+)"/);

  // STRICT CHECK: The server ONLY outputs "OTP has been Sent" if the password was correct!
  const isOtpSent = postHtml.includes('OTP has been Sent') || postHtml.includes('Sent on your Mobile');

  if (isOtpSent) {
    return jsonResponse({
      success: true,
      message: 'OTP has been sent to your official college email ID.',
      viewState: newVsMatch ? newVsMatch[1] : vsMatch[1],
      sessionCookie: postCookies
    });
  }

  // If "OTP has been Sent" is NOT present, the password was rejected!
  let errorMsg = 'Incorrect Password. Please check your credentials and try again.';
  const alertMatch = postHtml.match(/<div class=['"]alert[^>]*>(.*?)<\/div>/si);
  if (alertMatch) {
    const cleanAlert = alertMatch[1].replace(/<[^>]+>/g, '').trim();
    if (cleanAlert && cleanAlert.length > 2) {
      errorMsg = cleanAlert;
    }
  }

  return jsonResponse({ success: false, error: errorMsg }, 401);
}

// STEP 2: Verify OTP and extract final session cookies
async function handleVerifyOtp({ username, password, otp, viewState, sessionCookie }) {
  if (!username || !password || !otp) {
    return jsonResponse({ success: false, error: 'Username, Password and OTP are required.' }, 400);
  }

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

  const verifyRes = await fetch('https://erp.abes.ac.in/Login.aspx', {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      'Cookie': sessionCookie || '',
      'Referer': 'https://erp.abes.ac.in/Login.aspx',
      'Origin': 'https://erp.abes.ac.in'
    },
    body: params.toString()
  });

  const location = verifyRes.headers.get('location') || '';
  const finalCookies = parseSetCookies(verifyRes, sessionCookie);

  if (verifyRes.status === 302 || location.includes('Home/Student/Default.aspx')) {
    return jsonResponse({
      success: true,
      message: 'Login successful!',
      cookies: finalCookies
    });
  }

  const verifyHtml = await verifyRes.text();
  const alertMatch = verifyHtml.match(/<div class=['"]alert[^>]*>(.*?)<\/div>/si);
  const errorMsg = alertMatch
    ? alertMatch[1].replace(/<[^>]+>/g, '').trim()
    : 'Invalid OTP. Please check the OTP received on your mobile and try again.';

  return jsonResponse({ success: false, error: errorMsg }, 401);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
