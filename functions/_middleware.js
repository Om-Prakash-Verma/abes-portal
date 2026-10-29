/**
 * Cloudflare Pages Middleware
 * Dynamically rewrites Open Graph and Twitter image URLs to absolute HTTPS URLs
 * based on the incoming request origin (essential for WhatsApp, Telegram, and Twitter scrapers).
 */
export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // Skip API routes
  if (url.pathname.startsWith('/api/')) {
    return next();
  }

  const response = await next();
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('text/html')) {
    const origin = url.origin;

    return new HTMLRewriter()
      .on('meta[property="og:image"]', {
        element(el) {
          const content = el.getAttribute('content') || '';
          if (content.startsWith('/')) {
            el.setAttribute('content', `${origin}${content}`);
          }
        }
      })
      .on('meta[property="og:image:secure_url"]', {
        element(el) {
          const content = el.getAttribute('content') || '';
          if (content.startsWith('/')) {
            el.setAttribute('content', `${origin}${content}`);
          }
        }
      })
      .on('meta[name="twitter:image"]', {
        element(el) {
          const content = el.getAttribute('content') || '';
          if (content.startsWith('/')) {
            el.setAttribute('content', `${origin}${content}`);
          }
        }
      })
      .on('meta[property="og:url"]', {
        element(el) {
          el.setAttribute('content', url.href);
        }
      })
      .transform(response);
  }

  return response;
}
