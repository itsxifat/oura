import { SignJWT, jwtVerify } from 'jose';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// --- SECURITY: JWT HANDLING ---
const SECRET_KEY = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'unsafe-secret-change-me');

export async function signAdminToken() {
  return await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);
}

export async function verifyAdminToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload.role === 'admin';
  } catch (err) {
    return false;
  }
}

// --- FILE STORAGE: SECURE PUBLIC UPLOAD ---
export async function saveFileToPublic(file) {
  if (!file || file.size === 0) return null;

  // 1. Validate File Type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}`);
  }

  // 2. Generate Unguessable Filename (UUID)
  const buffer = Buffer.from(await file.arrayBuffer());
  const uuid = crypto.randomUUID();
  const ext = file.name.split('.').pop(); // Get extension
  const secureName = `${uuid}.${ext}`;
  
  // 3. Define Path (public/uploads)
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  
  // Ensure directory exists
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, secureName);

  // 4. Write File
  await fs.writeFile(filePath, buffer);

  // 5. Return Public Path
  return `/uploads/${secureName}`;
}