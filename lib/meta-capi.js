/**
 * Meta Conversions API — server-side event sender.
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

const API_VERSION = 'v19.0';

/**
 * Hash a string with SHA-256 (for PII fields like email, phone, name).
 * Returns lowercase hex string, or null if value is empty.
 */
async function sha256(value) {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Send one or more events to Meta Conversions API.
 *
 * @param {Array<{
 *   eventName: string,
 *   eventSourceUrl: string,
 *   eventId?: string,
 *   userData?: object,
 *   customData?: object,
 * }>} events
 */
export async function sendCapiEvents(events) {
  // Read env vars lazily (at call time, not module load time)
  const PIXEL_ID     = process.env.FACEBOOK_PIXEL_ID;
  const ACCESS_TOKEN = process.env.FACEBOOK_CAPI_ACCESS_TOKEN;

  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn('[CAPI] Missing FACEBOOK_PIXEL_ID or FACEBOOK_CAPI_ACCESS_TOKEN env vars.');
    return null;
  }

  const CAPI_ENDPOINT = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`;

  const data = await Promise.all(
    events.map(async ({ eventName, eventSourceUrl, eventId, userData = {}, customData = {} }) => {
      // Hash PII fields
      const ud = {
        client_ip_address: userData.client_ip_address || undefined,
        client_user_agent: userData.client_user_agent || undefined,
        fbp: userData.fbp || undefined,
        fbc: userData.fbc || undefined,
        em:  userData.email ? [await sha256(userData.email)] : undefined,
        ph:  userData.phone ? [await sha256(userData.phone)] : undefined,
        fn:  userData.firstName ? [await sha256(userData.firstName)] : undefined,
        ln:  userData.lastName  ? [await sha256(userData.lastName)]  : undefined,
        ct:  userData.city      ? [await sha256(userData.city)]      : undefined,
        zp:  userData.postalCode ? [await sha256(userData.postalCode)] : undefined,
        country: userData.country ? [await sha256(userData.country)] : undefined,
        ge:  userData.gender    ? [await sha256(userData.gender)]    : undefined,
        db:  userData.dob       ? [await sha256(userData.dob)]       : undefined,
        external_id: userData.externalId ? [await sha256(userData.externalId)] : undefined,
      };

      // Remove undefined keys
      Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]);

      const event = {
        event_name:       eventName,
        event_time:       Math.floor(Date.now() / 1000),
        action_source:    'website',
        event_source_url: eventSourceUrl,
        event_id:         eventId || `${eventName}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        user_data:        ud,
      };

      if (Object.keys(customData).length > 0) {
        event.custom_data = customData;
      }

      return event;
    })
  );

  try {
    const res = await fetch(`${CAPI_ENDPOINT}?access_token=${ACCESS_TOKEN}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ data }),
    });
    const json = await res.json();
    if (!res.ok) console.error('[CAPI] API error:', json);
    return json;
  } catch (err) {
    console.error('[CAPI] fetch error:', err);
    return null;
  }
}

/** Convenience wrapper for a single event */
export async function sendCapiEvent(event) {
  return sendCapiEvents([event]);
}
