import { Router } from 'express';
import { getProfile, updateMe, toggleFollow } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';
import { generalRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(generalRateLimiter);

router.get('/:username', getProfile);
router.patch('/me', authMiddleware, updateMe);
router.post('/:id/follow', authMiddleware, toggleFollow);

export default router;
