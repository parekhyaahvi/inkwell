import { Router } from 'express';
import { register, login, logout, resetPassword } from '../controllers/authController.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Secure auth rates applied to active endpoints
router.use(authRateLimiter);

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.post('/reset-password', resetPassword);

export default router;
