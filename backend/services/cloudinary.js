import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

/**
 * Handle image uploads to Cloudinary when configured, with a local fallback for development.
 * @param {Buffer} fileBuffer File binary buffer
 * @param {string} fileName Original file name
 * @returns {Promise<string>} Uploaded file URL
 */
export const uploadImage = async (fileBuffer, fileName) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  const folder = process.env.CLOUDINARY_FOLDER?.trim() || 'inkwell';

  if (cloudName && apiKey && apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signatureBase = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(signatureBase).digest('hex');
    const fileExt = path.extname(fileName).toLowerCase();
    const mimeType = fileExt === '.png'
      ? 'image/png'
      : fileExt === '.webp'
        ? 'image/webp'
        : 'image/jpeg';
    const dataUri = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    const formData = new FormData();

    formData.append('file', dataUri);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('folder', folder);
    formData.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (!response.ok || !result?.secure_url) {
      throw new Error(result?.error?.message || 'Cloudinary upload failed.');
    }

    return result.secure_url;
  }

  // Local filesystem fallback for development
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
