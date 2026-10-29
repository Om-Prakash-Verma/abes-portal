// Cloudflare Pages Function - Catch-all Edge Proxy for ABES ERP
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Cookie, x-cookie, x-session-id',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Determine the upstream target URL
  // e.g. /api/ERP/Dashboard/Student/Attendance/Default.aspx/getStudentAtt -> https://erp.abes.ac.in/ERP/Dashboard/Student/Attendance/Default.aspx/getStudentAtt
  const upstreamPath = url.pathname.replace(/^\/api(\/abes)?/, '');
  const targetUrl = new URL(upstreamPath + url.search, 'https://erp.abes.ac.in');

  // Forward cookies either from standard Cookie header or custom x-cookie header (helps when client-side fetch has restricted cookie headers)
  const incomingCookie = request.headers.get('x-cookie') || request.headers.get('cookie') || '';

  const headers = new Headers();
  headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0');
  headers.set('Origin', 'https://erp.abes.ac.in');
  headers.set('Referer', 'https://erp.abes.ac.in/Home/Student/Default.aspx');
  headers.set('Accept', 'application/json, text/javascript, */*; q=0.01');
  headers.set('X-Requested-With', 'XMLHttpRequest');

  if (request.headers.get('content-type')) {
    headers.set('Content-Type', request.headers.get('content-type'));
  } else {
    headers.set('Content-Type', 'application/json; charset=utf-8');
  }

  if (incomingCookie) {
    headers.set('Cookie', incomingCookie);
  }

  try {
    const upstreamResponse = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: headers,
      body: request.method === 'POST' ? await request.text() : undefined,
    });

    const responseBody = await upstreamResponse.arrayBuffer();
    const responseHeaders = new Headers(upstreamResponse.headers);

    // Add CORS headers to response
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Cookie, x-cookie');

    // Also pass through any Set-Cookie headers if upstream sent them
    return new Response(responseBody, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
