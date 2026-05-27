import { Router } from 'express';
import { getComments, createComment, deleteComment } from '../controllers/commentController.js';
import { authMiddleware } from '../middleware/auth.js';
import { generalRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(generalRateLimiter);

router.get('/:postId', getComments);
router.post('/', authMiddleware, createComment);
router.delete('/:id', authMiddleware, deleteComment);

export default router;
