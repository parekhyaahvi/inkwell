import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// Memory storage lets us route uploads to Cloudinary or local disk consistently.
const storage = multer.memoryStorage();

// Basic file filter for multer (pre-filtering by filename ext)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter
});

export const multerUpload = upload.single('cover');

/**
 * Middleware to validate magic bytes (true file type validation)
 */
export const validateMagicBytes = async (req, res, next) => {
  // If no file was uploaded, we just continue (cover can be optional or handled by schema)
  if (!req.file) {
    return next();
  }

  try {
    const detectedType = await fileTypeFromBuffer(req.file.buffer);
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!detectedType || !allowedMimeTypes.includes(detectedType.mime)) {
      return res.status(400).json({
        success: false,
        error: 'InvalidFileType',
        message: 'Only JPEG, PNG, and WebP images are allowed.'
      });
    }

    req.file.mimetype = detectedType.mime;
    req.file.ext = detectedType.ext;
    next();
  } catch (err) {
    next(err);
  }
};
