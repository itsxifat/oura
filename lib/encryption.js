import crypto from 'crypto';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is not set');
}

// Derive a proper 32-byte key using scrypt (PBKDF-class KDF, no truncation, no hardcoded fallback)
const SECRET_KEY = crypto.scryptSync(
  process.env.NEXTAUTH_SECRET,
  'oura-encryption-salt-v1', // fixed salt — change to a separate env var for extra security
  32
);

const ALGORITHM = 'aes-256-cbc';

export function encryptBuffer(buffer) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return { iv, content: encrypted };
}

export function decryptBuffer(encryptedBuffer, ivBuffer) {
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, ivBuffer);
    return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  } catch {
    return null;
  }
}
