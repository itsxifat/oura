'use server'

import { cookies, headers } from 'next/headers';
import { signAdminToken } from '@/lib/auth';
import { rateLimit } from '@/lib/security';

// --- ADMIN LOGIN ---
export async function loginAction(formData) {
  // Rate-limit by IP: max 10 attempts per 15 minutes
  try {
    const headerStore = await headers();
    const ip = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    rateLimit(`admin-login:${ip}`, 10, 15 * 60 * 1000);
  } catch (e) {
    return { success: false, error: e.message };
  }

  const password = formData.get('password');
  if (!password || typeof password !== 'string') {
    return { success: false, error: 'Invalid credentials' };
  }

  if (!process.env.ADMIN_PASSWORD) {
    console.error('ADMIN_PASSWORD env var is not set');
    return { success: false, error: 'Server configuration error' };
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return { success: false, error: 'Invalid credentials' };
  }

  const token = await signAdminToken();
  const cookieStore = await cookies();
  cookieStore.set('admin_session', token, {
    httpOnly: true,
    secure: true, // always secure — dev should use https or accept http-only restriction
    maxAge: 60 * 60 * 8, // 8 hours (not 24)
    sameSite: 'strict',
    path: '/admin',
  });
  return { success: true };
}
