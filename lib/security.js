import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ─── Admin Guard ───────────────────────────────────────────────────────────────
// Throws if the caller is not a verified admin.
// Use at the top of every admin-only server action.
export async function assertAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token) throw new Error('Unauthorized');
  const payload = await verifyAdminToken(token);
  if (!payload || payload.role !== 'admin') throw new Error('Unauthorized');
  return payload;
}

// ─── User Session Guard ─────────────────────────────────────────────────────
// Returns session or throws if unauthenticated.
export async function assertSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error('Unauthorized');
  return session;
}

// ─── Safe error response ────────────────────────────────────────────────────
export function unauthorized() {
  return { error: 'Unauthorized' };
}

// ─── Regex Sanitizer (prevents ReDoS + injection) ───────────────────────────
// Escapes all special regex metacharacters so the string is treated as literal.
export function escapeRegex(str) {
  if (typeof str !== 'string') return '';
  // Strip any $-prefixed keys to prevent MongoDB operator injection
  if (str.startsWith('$') || str.startsWith('{')) return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── HTML Escaper (prevents XSS in email templates) ─────────────────────────
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ─── File Size Validator ─────────────────────────────────────────────────────
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
export function assertFileSize(file, maxBytes = MAX_FILE_BYTES) {
  if (file && file.size > maxBytes) {
    throw new Error(`File too large. Maximum size is ${Math.round(maxBytes / 1024 / 1024)} MB.`);
  }
}

// ─── Path Traversal Guard ───────────────────────────────────────────────────
// Validates that a resolved path stays within an allowed base directory.
import path from 'path';
export function assertSafePath(resolvedPath, baseDir) {
  const normalizedBase = path.resolve(baseDir);
  const normalizedPath = path.resolve(resolvedPath);
  if (!normalizedPath.startsWith(normalizedBase + path.sep) && normalizedPath !== normalizedBase) {
    throw new Error('Path traversal detected');
  }
}

// ─── In-memory rate limiter ─────────────────────────────────────────────────
// Suitable for single-process dev/small deployments. Replace with Redis for multi-instance.
const _store = new Map();

export function rateLimit(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const record = _store.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }

  record.count += 1;
  _store.set(key, record);

  if (record.count > maxAttempts) {
    const waitSec = Math.ceil((record.resetAt - now) / 1000);
    throw new Error(`Too many attempts. Try again in ${waitSec} seconds.`);
  }
}

// ─── Input string sanitizer ─────────────────────────────────────────────────
export function sanitizeString(value, maxLength = 500) {
  if (value === null || value === undefined) return '';
  return String(value).trim().slice(0, maxLength);
}

// ─── MongoDB ObjectId validator ─────────────────────────────────────────────
export function isValidObjectId(id) {
  return typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);
}
