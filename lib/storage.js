import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { assertSafePath, assertFileSize } from '@/lib/security';

const VALID_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// ─── Save File ───────────────────────────────────────────────────────────────
export async function saveFileToPublic(file) {
  if (!file || file.size === 0) return null;

  // 1. Validate MIME type
  if (!VALID_TYPES.has(file.type)) {
    console.error(`[STORAGE] Rejected file type: ${file.type}`);
    return null;
  }

  // 2. Validate file size (max 5 MB)
  try {
    assertFileSize(file);
  } catch (e) {
    console.error(`[STORAGE] ${e.message}`);
    return null;
  }

  // 3. Generate a random, safe filename — never trust the original name
  const ext = (['jpeg','png','webp','gif','svg+xml'].includes(file.type.split('/')[1])
    ? file.type.split('/')[1].replace('+xml', '')
    : 'bin');
  const secureName = `${crypto.randomUUID()}.${ext}`;

  try {
    await fs.access(UPLOAD_DIR).catch(() => fs.mkdir(UPLOAD_DIR, { recursive: true }));

    const fullPath = path.join(UPLOAD_DIR, secureName);

    // 4. Guard against path traversal (should never trigger with UUID names, but defence-in-depth)
    assertSafePath(fullPath, UPLOAD_DIR);

    await fs.writeFile(fullPath, Buffer.from(await file.arrayBuffer()));
    return `/uploads/${secureName}`;
  } catch (error) {
    console.error('[STORAGE] Save Error:', error.message);
    return null;
  }
}

// ─── Delete File ─────────────────────────────────────────────────────────────
export async function deleteFileFromPublic(fileUrl) {
  if (!fileUrl || typeof fileUrl !== 'string') return;

  try {
    // Only allow paths that start with /uploads/ — nothing else
    if (!fileUrl.startsWith('/uploads/')) {
      console.warn('[STORAGE] Blocked attempt to delete outside /uploads/:', fileUrl);
      return;
    }

    // Strip the leading slash and join under public/
    const relativePath = fileUrl.slice(1); // e.g. "uploads/filename.jpg"
    const fullPath = path.join(process.cwd(), 'public', relativePath);

    // Path traversal guard
    const allowedBase = path.join(process.cwd(), 'public', 'uploads');
    assertSafePath(fullPath, allowedBase);

    await fs.unlink(fullPath);
  } catch (error) {
    if (error.code === 'ENOENT') return; // already gone
    if (error.message === 'Path traversal detected') {
      console.error('[STORAGE] Path traversal attempt blocked:', fileUrl);
      return;
    }
    console.error('[STORAGE] Delete Error:', error.message);
  }
}
