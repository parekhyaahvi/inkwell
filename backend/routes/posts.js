import { Router } from 'express';
import { getPosts, getPostBySlug, createPost, updatePost, deletePost, toggleLike } from '../controllers/postController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { generalRateLimiter } from '../middleware/rateLimiter.js';
import { multerUpload } from '../middleware/upload.js';

const router = Router();

router.use(generalRateLimiter);

router.get('/', optionalAuthMiddleware, getPosts);
router.get('/:slug', getPostBySlug);
router.post('/', authMiddleware, multerUpload, createPost);
router.patch('/:id', authMiddleware, multerUpload, updatePost);
router.delete('/:id', authMiddleware, deletePost);
router.post('/:id/like', authMiddleware, toggleLike);

export default router;
