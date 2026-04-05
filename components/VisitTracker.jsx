'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

const DEVICE_ID_KEY  = 'oura_device_id';
const LAST_TRACK_KEY = 'oura_last_track';
const LAST_USER_KEY  = 'oura_last_user';   // tracks which user was last recorded
const TRACK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Invisible component — drop it anywhere in the layout (once).
 * Fires POST /api/track to record the user's IP and device fingerprint when:
 *  1. The logged-in user changes (login, account switch) — always fires immediately
 *  2. 24 hours have elapsed since the last successful track
 *  3. The user has no stored IP yet — covered by case 1 on first visit after login
 */
export default function VisitTracker() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id || '';

  useEffect(() => {
    // Wait until session is resolved — avoid double-firing during hydration
    if (status === 'loading') return;

    try {
      const last     = parseInt(localStorage.getItem(LAST_TRACK_KEY) || '0', 10);
      const lastUser = localStorage.getItem(LAST_USER_KEY) || '';

      // Fire immediately when: new login (userId changed) OR 24h elapsed
      const userChanged    = !!userId && userId !== lastUser;
      const intervalElapsed = Date.now() - last >= TRACK_INTERVAL;

      if (!userChanged && !intervalElapsed) return;

      // Anonymous users: still track interval but no userId to compare
      const deviceId = localStorage.getItem(DEVICE_ID_KEY) || '';

      fetch('/api/track', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ deviceId }),
      }).then(() => {
        localStorage.setItem(LAST_TRACK_KEY, String(Date.now()));
        if (userId) localStorage.setItem(LAST_USER_KEY, userId);
      }).catch(() => {});
    } catch {
      // localStorage not available (SSR guard) — ignore
    }
  }, [userId, status]); // re-run when user logs in/out or session resolves

  return null;
}
