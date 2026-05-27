import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

/**
 * Handle image uploads to local filesystem
 * @param {Buffer} fileBuffer File binary buffer
 * @param {string} fileName Original file name
 * @returns {Promise<string>} Uploaded file URL
 */
export const uploadImage = async (fileBuffer, fileName) => {
  // Local filesystem storage
  const uploadsDir = path.join(rootDir, 'frontend/assets/uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileExt = path.extname(fileName) || '.webp';
  const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${fileExt}`;
  const filePath = path.join(uploadsDir, uniqueFileName);

  await fs.promises.writeFile(filePath, fileBuffer);
  return `/assets/uploads/${uniqueFileName}`;
};
