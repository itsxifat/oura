/**
 * Client-side Meta Pixel + Conversions API helper.
 *
 * Every call fires BOTH:
 *   1. Browser pixel via window.fbq()  — for cookie-based matching
 *   2. /api/meta-capi                  — server-side CAPI for deduplication & resilience
 *
 * The same event_id is passed to both so Facebook can deduplicate them.
 */

function getCookie(name) {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : '';
}

function genEventId(eventName) {
  return `${eventName}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Fire a pixel event + CAPI event with deduplication.
 *
 * @param {string} eventName  - Standard event name, e.g. 'AddToCart'
 * @param {object} pixelData  - Data passed to fbq() as custom data
 * @param {object} userData   - Extra user data forwarded to CAPI (fbp, fbc auto-attached)
 * @param {object} customData - Custom data forwarded to CAPI
 */
export function trackEvent(eventName, pixelData = {}, userData = {}, customData = {}) {
  if (typeof window === 'undefined') return;

  const eventId      = genEventId(eventName);
  const eventSrcUrl  = window.location.href;
  const fbp          = getCookie('_fbp');
  const fbc          = getCookie('_fbc');

  // 1. Fire browser pixel
  if (typeof window.fbq === 'function') {
    window.fbq('track', eventName, pixelData, { eventID: eventId });
  }

  // 2. Fire CAPI (non-blocking, best-effort)
  fetch('/api/meta-capi', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName,
      eventId,
      eventSourceUrl: eventSrcUrl,
      userData: {
        ...userData,
        client_user_agent: navigator.userAgent,
        fbp: fbp || undefined,
        fbc: fbc || undefined,
      },
      customData: Object.keys(customData).length > 0 ? customData : pixelData,
    }),
  }).catch((err) => console.warn('[Pixel] CAPI request failed:', err));
}
