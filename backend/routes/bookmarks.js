import { Router } from 'express';
import { toggleBookmark, getBookmarks } from '../controllers/bookmarkController.js';
import { authMiddleware } from '../middleware/auth.js';
import { generalRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(generalRateLimiter);
router.use(authMiddleware); // All bookmarks routes are authenticated

router.get('/', getBookmarks);
router.post('/:postId', toggleBookmark);

export default router;
