'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

const DEVICE_ID_KEY  = 'oura_device_id';
const LAST_TRACK_KEY = 'oura_last_track';
const LAST_USER_KEY  = 'oura_last_user';
const TRACK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generates a stable browser fingerprint from public browser APIs.
 * Stored in localStorage so it persists across sessions.
 * Uses the same key (oura_device_id) as CheckoutClient so they share one ID.
 */
function buildDeviceFingerprint() {
  try {
    const parts = [
      navigator.userAgent,
      navigator.language,
      `${screen.width}x${screen.height}x${screen.colorDepth}`,
      new Intl.DateTimeFormat().resolvedOptions().timeZone,
      String(navigator.hardwareConcurrency || 0),
      navigator.platform || '',
      String(!!navigator.cookieEnabled),
      String(typeof window.indexedDB !== 'undefined'),
    ].join('||');
    let h = 5381;
    for (let i = 0; i < parts.length; i++) {
      h = Math.imul(h, 33) ^ parts.charCodeAt(i);
    }
    return `fp_${(h >>> 0).toString(36)}`;
  } catch {
    return `fp_${Math.random().toString(36).slice(2)}`;
  }
}

function getOrCreateDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = buildDeviceFingerprint();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return buildDeviceFingerprint();
  }
}

/**
 * Invisible component — rendered once in the root layout.
 * Fires POST /api/track to record the user's IP and device fingerprint when:
 *  1. User logs in or changes (userId differs from last stored) — fires immediately
 *  2. 24 hours have elapsed since the last successful track
 *
 * The device ID is always generated/retrieved here, so even users who have
 * never visited checkout will have their device recorded.
 */
export default function VisitTracker() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id || '';

  useEffect(() => {
    // Wait for session to resolve before acting to avoid double-fires
    if (status === 'loading') return;

    try {
      const last     = parseInt(localStorage.getItem(LAST_TRACK_KEY) || '0', 10);
      const lastUser = localStorage.getItem(LAST_USER_KEY) || '';

      const userChanged     = !!userId && userId !== lastUser;
      const intervalElapsed = Date.now() - last >= TRACK_INTERVAL;

      if (!userChanged && !intervalElapsed) return;

      // Always generate/retrieve device ID — creates it if missing
      const deviceId = getOrCreateDeviceId();

      fetch('/api/track', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ deviceId }),
      }).then(() => {
        localStorage.setItem(LAST_TRACK_KEY, String(Date.now()));
        if (userId) localStorage.setItem(LAST_USER_KEY, userId);
      }).catch(() => {});
    } catch {
      // localStorage not available — ignore
    }
  }, [userId, status]);

  return null;
}
