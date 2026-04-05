'use client';

import { useEffect } from 'react';

const DEVICE_ID_KEY  = 'oura_device_id';
const LAST_TRACK_KEY = 'oura_last_track';
const TRACK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Invisible component — drop it anywhere in the layout (once).
 * Pings /api/track at most once every 24h per browser to record
 * the user's IP and device fingerprint in their account profile.
 */
export default function VisitTracker() {
  useEffect(() => {
    try {
      const last = parseInt(localStorage.getItem(LAST_TRACK_KEY) || '0', 10);
      if (Date.now() - last < TRACK_INTERVAL) return; // already tracked recently

      const deviceId = localStorage.getItem(DEVICE_ID_KEY) || '';

      fetch('/api/track', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ deviceId }),
      }).then(() => {
        localStorage.setItem(LAST_TRACK_KEY, String(Date.now()));
      }).catch(() => {});
    } catch {
      // localStorage not available (SSR guard) — ignore
    }
  }, []);

  return null;
}
