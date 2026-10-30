// Google Analytics 4 (GA4) Integration Helper
// Put your GA4 Measurement ID here, or define VITE_GA_MEASUREMENT_ID in .env
export const GA_MEASUREMENT_ID = import.meta.env?.VITE_GA_MEASUREMENT_ID || 'G-D148LWSM0J';

let isInitialized = false;

export function initGA() {
  if (typeof window === 'undefined') return;
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
    // Analytics is ready, awaiting user's real GA4 ID
    return;
  }
  if (isInitialized) return;

  try {
    // Inject gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: false, // We track page views explicitly with platform tag
      custom_map: { dimension1: 'platform' }
    });

    isInitialized = true;
    trackEvent('page_view', { page_title: document.title, page_location: window.location.href });
  } catch (err) {
    console.warn('Google Analytics failed to initialize:', err);
  }
}

export function trackEvent(eventName, params = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, {
        platform: 'web', // Differentiates web vs mobile APK in GA4
        ...params
      });
    }
  } catch (err) {}
}

export function trackLoginSuccess(userId) {
  trackEvent('login_success', {
    method: 'otp',
    user_branch: userId ? userId.substring(0, 5) : 'unknown'
  });
}

export function trackAttendanceView(semId, totalPercent) {
  trackEvent('view_attendance', {
    semester: semId,
    percentage_tier: totalPercent >= 75 ? 'safe' : 'danger'
  });
}

export function trackApkDownloadClick() {
  trackEvent('apk_download_click', {
    source: 'web_portal_prompt'
  });
}
