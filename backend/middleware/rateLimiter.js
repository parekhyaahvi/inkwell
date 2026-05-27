import { cache } from '../services/cache.js';

/**
 * Custom High-Scale MongoDB-Backed Rate Limiting Middleware
 * @param {object} config Configuration parameters { windowMs: 60000, max: 60 }
 */
const mongoRateLimiter = (config) => {
  const windowSeconds = Math.ceil(config.windowMs / 1000);
  const maxRequests = config.max;
  const message = config.message || {
    success: false,
    error: 'TooManyRequests',
    message: 'Too many requests. Please try again later.'
  };

  return async (req, res, next) => {
    // Generate unique identification key combining IP and routing path
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const pathKey = req.baseUrl + req.path;
    const cacheKey = `ratelimit:${ip}:${pathKey}`;

    try {
      const currentRequests = await cache.incr(cacheKey, windowSeconds);

      if (currentRequests > maxRequests) {
        res.setHeader('Retry-After', windowSeconds);
        return res.status(429).json(message);
      }

      next();
    } catch (err) {
      console.error('[RateLimiter Error]:', err.message);
      // Fail open in case of DB issues to maintain system uptime
      next();
    }
  };
};

export const generalRateLimiter = mongoRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: {
    success: false,
    error: 'TooManyRequests',
    message: 'Too many requests. Please try again after 1 minute.'
  }
});

export const authRateLimiter = mongoRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    error: 'TooManyRequests',
    message: 'Too many login or registration attempts. Please try again after 15 minutes.'
  }
});

export const uploadRateLimiter = mongoRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    success: false,
    error: 'TooManyRequests',
    message: 'Upload rate limit exceeded. You can upload up to 20 files per hour.'
  }
});
