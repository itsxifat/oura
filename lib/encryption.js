import crypto from 'crypto';

// Creates a consistent 32-byte key from your .env secret
const SECRET_KEY = crypto
  .createHash('sha256')
  .update(String(process.env.NEXTAUTH_SECRET || 'unsafe-default-secret'))
  .digest('base64')
  .substr(0, 32);

const ALGORITHM = 'aes-256-cbc';

export function encryptBuffer(buffer) {
  const iv = crypto.randomBytes(16); // Random Initialization Vector
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

  return {
    iv: iv,
    content: encrypted
  };
}

export function decryptBuffer(encryptedBuffer, ivBuffer) {
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, ivBuffer);
  
  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  return decrypted;
}