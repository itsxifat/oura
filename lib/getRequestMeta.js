import { headers } from 'next/headers';

/**
 * Extracts the real client IP and user-agent from Next.js server-side headers.
 * Works in Server Components, Route Handlers, Server Actions, and NextAuth callbacks.
 * Works behind Nginx, Cloudflare, and other reverse proxies.
 */
export async function getRequestMeta() {
  try {
    const h = await headers();

    const rawForwarded = h.get('x-forwarded-for') || '';
    const ip = (
      rawForwarded.split(',')[0]?.trim() ||
      h.get('cf-connecting-ip') ||
      h.get('x-real-ip') ||
      'unknown'
    ).toLowerCase();

    const userAgent = h.get('user-agent') || '';
    const language  = h.get('accept-language')?.split(',')[0]?.trim() || '';

    return { ip, userAgent, language };
  } catch {
    // headers() can throw if called outside a request context (e.g. build time)
    return { ip: 'unknown', userAgent: '', language: '' };
  }
}
