import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// --- SAVE FILE ---
export async function saveFileToPublic(file) {
  if (!file || file.size === 0) return null;

  // Validate Type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    console.error(`[STORAGE] Invalid file type: ${file.type}`);
    return null;
  }

  // Create Unique Name
  const buffer = Buffer.from(await file.arrayBuffer());
  const uuid = crypto.randomUUID();
  const ext = file.name.split('.').pop();
  const secureName = `${uuid}.${ext}`;
  
  // Create Path: public/uploads
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  
  try {
    // Ensure directory exists
    await fs.access(uploadDir).catch(() => fs.mkdir(uploadDir, { recursive: true }));
    
    // Write File
    const fullPath = path.join(uploadDir, secureName);
    await fs.writeFile(fullPath, buffer);
    
    console.log(`[STORAGE] Saved file to: ${fullPath}`);
    
    // Return the URL path (always forward slashes for Web)
    return `/uploads/${secureName}`;
  } catch (error) {
    console.error("[STORAGE] Save Error:", error);
    return null;
  }
}

// --- DELETE FILE (FIXED) ---
export async function deleteFileFromPublic(fileUrl) {
  if (!fileUrl || typeof fileUrl !== 'string') return;

  try {
    // 1. Convert URL (/uploads/image.jpg) to System Path (public\uploads\image.jpg)
    // Remove leading slash if present to join correctly
    const relativePath = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;
    
    // Construct full system path
    const fullPath = path.join(process.cwd(), 'public', relativePath);

    console.log(`[STORAGE] Attempting to delete: ${fullPath}`);

    // 2. Check if file exists before trying to delete
    await fs.access(fullPath);
    
    // 3. Delete
    await fs.unlink(fullPath);
    console.log(`[STORAGE] Successfully deleted file.`);
    
  } catch (error) {
    // ENOENT means file doesn't exist (already deleted?), ignore it.
    if (error.code === 'ENOENT') {
      console.log(`[STORAGE] File not found (already deleted?): ${fileUrl}`);
    } else {
      console.error(`[STORAGE] Delete Error:`, error);
    }
  }
}