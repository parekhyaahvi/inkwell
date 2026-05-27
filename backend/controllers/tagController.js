import { prisma } from '../services/db.js';
import { cache } from '../services/cache.js';

const TRENDING_TAGS_CACHE_KEY = 'tags:trending';
const CACHE_TTL = 300; // 5 minutes

/**
 * GET trending tags (cached)
 */
export const getTrendingTags = async (req, res, next) => {
  try {
    // 1. Try Cache fetch
    const cachedData = await cache.get(TRENDING_TAGS_CACHE_KEY);
    if (cachedData) {
      const parsedTags = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
      return res.status(200).json({
        success: true,
        data: parsedTags
      });
    }

    // 2. Fetch from Database if cache miss
    const trendingTags = await prisma.tag.findMany({
      orderBy: { postCount: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        postCount: true
      }
    });

    // 3. Set Cache key
    await cache.set(TRENDING_TAGS_CACHE_KEY, JSON.stringify(trendingTags), { ex: CACHE_TTL });

    return res.status(200).json({
      success: true,
      data: trendingTags
    });
  } catch (err) {
    next(err);
  }
};
