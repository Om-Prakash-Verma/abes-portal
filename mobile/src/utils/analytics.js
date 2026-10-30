// Google Analytics 4 (GA4) Integration for Android Mobile APK
export const GA_MEASUREMENT_ID = import.meta.env?.VITE_GA_MEASUREMENT_ID || 'G-D148LWSM0J';

let isInitialized = false;

export function initGA() {
  if (typeof window === 'undefined') return;
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') return;
  if (isInitialized) return;

  try {
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
      send_page_view: false,
      custom_map: { dimension1: 'platform' }
    });

    isInitialized = true;
    trackEvent('page_view', { page_title: 'ABES Portal Mobile', page_location: 'android_app' });
  } catch (err) {
    console.warn('Google Analytics failed to initialize on mobile:', err);
  }
}

export function trackEvent(eventName, params = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, {
        platform: 'android_apk', // Automatically marks events from the mobile APK!
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
    source: 'mobile_app'
  });
}
