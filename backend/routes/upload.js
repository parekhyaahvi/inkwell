import { Router } from 'express';
import { uploadImage } from '../services/cloudinary.js';
import { multerUpload, validateMagicBytes } from '../middleware/upload.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Apply auth, rate limits, multer parsing, and magic byte checking
router.post('/cover', 
  authMiddleware, 
  uploadRateLimiter, 
  multerUpload, 
  validateMagicBytes, 
  async (req, res, next) => {
    try {
      const imageUrl = await uploadImage(req.file.buffer, req.file.originalname);
      return res.status(200).json({
        success: true,
        data: {
          url: imageUrl
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
