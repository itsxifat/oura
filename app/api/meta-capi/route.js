/**
 * POST /api/meta-capi
 * Proxies browser-triggered events to Meta Conversions API server-side.
 * Client sends: { eventName, eventId, eventSourceUrl, userData, customData }
 */

import { NextResponse } from 'next/server';
import { sendCapiEvent } from '@/lib/meta-capi';

export async function POST(request) {
  try {
    const body = await request.json();
    const { eventName, eventId, eventSourceUrl, userData = {}, customData = {} } = body;

    if (!eventName) {
      return NextResponse.json({ error: 'eventName is required' }, { status: 400 });
    }

    // Enrich userData with real IP and user-agent from the incoming request
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp  = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || '';
    const userAgent = request.headers.get('user-agent') || '';

    const enrichedUserData = {
      ...userData,
      client_ip_address: clientIp  || userData.client_ip_address,
      client_user_agent: userAgent || userData.client_user_agent,
    };

    await sendCapiEvent({ eventName, eventId, eventSourceUrl, userData: enrichedUserData, customData });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[CAPI route] error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
