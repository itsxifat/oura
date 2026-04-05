/**
 * POST /api/track
 * Called client-side on every page load (deduplicated to once per 24h per device).
 * Records the visitor's IP and device fingerprint against their user account.
 * Anonymous visits (not logged in) are silently ignored.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { trackUserActivity } from '@/lib/trackUserActivity';

function getIp(req) {
  const fwd = req.headers.get('x-forwarded-for');
  return (fwd?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    'unknown').toLowerCase();
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ ok: true }); // anonymous — skip

    const body      = await request.json().catch(() => ({}));
    const deviceId  = typeof body.deviceId === 'string' ? body.deviceId.slice(0, 64) : '';
    const ip        = getIp(request);
    const userAgent = request.headers.get('user-agent') || '';

    await connectDB();
    await trackUserActivity(session.user.id, { ip, deviceId, userAgent });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // always 200 — never surface errors to client
  }
}
