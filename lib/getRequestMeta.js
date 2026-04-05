import { headers } from 'next/headers';

/**
 * Extracts the real client IP and user-agent from Next.js server-side headers.
 * Works behind Nginx, Cloudflare, and other reverse proxies.
 *
 * NOTE: MAC addresses are a Layer-2 (Ethernet) concept and are NOT transmitted
 * in HTTP requests — they are stripped by the first router hop. We collect the
 * best available network identifier (IP) plus browser-level signals instead.
 */
export async function getRequestMeta() {
  const h = await headers();

  // Prefer the leftmost IP in X-Forwarded-For (the original client IP).
  // Cloudflare sets CF-Connecting-IP; X-Real-IP is set by Nginx.
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
}
