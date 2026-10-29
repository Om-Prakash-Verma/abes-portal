import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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

// Custom Vite middleware to emulate Cloudflare Function /api/auth in local dev
function authDevPlugin() {
  return {
    name: 'abes-auth-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/auth')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost:3000');
        const action = url.searchParams.get('action');

        let rawBody = '';
        req.on('data', chunk => rawBody += chunk);
        req.on('end', async () => {
          try {
            const body = rawBody ? JSON.parse(rawBody) : {};
            res.setHeader('Content-Type', 'application/json');

            if (action === 'send-otp') {
              const { username, password } = body;
              if (!username || !password) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ success: false, error: 'Username and Password are required.' }));
              }

              const cleanUser = username.trim();

              // 1. Verify User ID in ABES database
              try {
                const userCheckRes = await fetch('https://erp.abes.ac.in/Login.aspx/GetUserLoginType', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json; charset=utf-8' },
                  body: JSON.stringify({ UserID: cleanUser })
                });
                const userCheckData = await userCheckRes.json();
                if (!userCheckData.d) {
                  res.statusCode = 404;
                  return res.end(JSON.stringify({ success: false, error: `ERP ID "${cleanUser}" was not found in the ABES database.` }));
                }
              } catch (e) {}

              // 2. Fetch fresh __VIEWSTATE
              const getRes = await fetch('https://erp.abes.ac.in/Login.aspx', {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
              });
              const html = await getRes.text();
              const vsMatch = html.match(/id="__VIEWSTATE" value="([^"]+)"/);
              const genMatch = html.match(/id="__VIEWSTATEGENERATOR" value="([^"]+)"/);
              const initialCookies = parseSetCookies(getRes);

              if (!vsMatch) {
                res.statusCode = 502;
                return res.end(JSON.stringify({ success: false, error: 'Could not connect to ERP portal.' }));
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
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  'Cookie': initialCookies,
                  'Referer': 'https://erp.abes.ac.in/Login.aspx',
                  'Origin': 'https://erp.abes.ac.in'
                },
                body: params.toString()
              });

              const postHtml = await postRes.text();
              const postCookies = parseSetCookies(postRes, initialCookies);
              const newVsMatch = postHtml.match(/id="__VIEWSTATE" value="([^"]+)"/);

              // STRICT CHECK: The server only returns "OTP has been Sent" if the password was correct!
              const isOtpSent = postHtml.includes('OTP has been Sent') || postHtml.includes('Sent on your Mobile');

              if (isOtpSent) {
                res.statusCode = 200;
                return res.end(JSON.stringify({
                  success: true,
                  message: 'OTP has been sent to your official college email ID.',
                  viewState: newVsMatch ? newVsMatch[1] : vsMatch[1],
                  sessionCookie: postCookies
                }));
              }

              // If OTP was not sent, password was rejected
              let errorMsg = 'Incorrect Password. Please check your credentials and try again.';
              const alertMatch = postHtml.match(/<div class=['"]alert[^>]*>(.*?)<\/div>/si);
              if (alertMatch) {
                const cleanAlert = alertMatch[1].replace(/<[^>]+>/g, '').trim();
                if (cleanAlert && cleanAlert.length > 2) {
                  errorMsg = cleanAlert;
                }
              }

              res.statusCode = 401;
              return res.end(JSON.stringify({ success: false, error: errorMsg }));

            } else if (action === 'verify-otp') {
              const { username, password, otp, viewState, sessionCookie } = body;
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
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  'Cookie': sessionCookie || '',
                  'Referer': 'https://erp.abes.ac.in/Login.aspx',
                  'Origin': 'https://erp.abes.ac.in'
                },
                body: params.toString()
              });

              const location = verifyRes.headers.get('location') || '';
              const finalCookies = parseSetCookies(verifyRes, sessionCookie);

              if (verifyRes.status === 302 || location.includes('Home/Student/Default.aspx')) {
                res.statusCode = 200;
                return res.end(JSON.stringify({
                  success: true,
                  message: 'Login successful!',
                  cookies: finalCookies
                }));
              }

              const verifyHtml = await verifyRes.text();
              const alertMatch = verifyHtml.match(/<div class=['"]alert[^>]*>(.*?)<\/div>/si);
              const errorMsg = alertMatch
                ? alertMatch[1].replace(/<[^>]+>/g, '').trim()
                : 'Invalid OTP. Please check the OTP on your phone and try again.';

              res.statusCode = 401;
              return res.end(JSON.stringify({ success: false, error: errorMsg }));
            }
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: e.message }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), authDevPlugin()],
  server: {
    port: 3000,
    proxy: {
      '/api/abes': {
        target: 'https://erp.abes.ac.in',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/abes/, ''),
        headers: {
          'Origin': 'https://erp.abes.ac.in',
          'Referer': 'https://erp.abes.ac.in/Home/Student/Default.aspx'
        },
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            const incomingCookie = req.headers['x-cookie'] || req.headers['cookie'];
            if (incomingCookie) {
              proxyReq.setHeader('Cookie', incomingCookie);
            }
            proxyReq.setHeader('Origin', 'https://erp.abes.ac.in');
            proxyReq.setHeader('Referer', 'https://erp.abes.ac.in/Home/Student/Default.aspx');
          });
        }
      }
    }
  }
});
