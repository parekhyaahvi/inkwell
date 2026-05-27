import { Router } from 'express';
import { getTrendingTags } from '../controllers/tagController.js';
import { generalRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(generalRateLimiter);

router.get('/trending', getTrendingTags);

export default router;
