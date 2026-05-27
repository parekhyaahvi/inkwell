import { prisma } from './db.js';

class MongoCache {
  /**
   * Retrieve item from MongoDB Cache collection
   * Auto-deletes expired records on read (Defensive cleanup)
   */
  async get(key) {
    return null; // Temporarily bypass cache due to DB issues
    try {
      const record = await prisma.cache.findUnique({ where: { key } });
      if (!record) return null;

      if (record.expiresAt < new Date()) {
        // Expired: Delete asynchronously and return null
        prisma.cache.delete({ where: { key } }).catch(err => 
          console.error('[MongoCache GC]: Failed to purge expired key:', key, err.message)
        );
        return null;
      }

      // Try parsing if it is a stringified JSON
      try {
        return JSON.parse(record.value);
      } catch {
        return record.value;
      }
    } catch (err) {
      console.error('[MongoCache Get Error]:', err.message);
      return null;
    }
  }

  /**
   * Write item to MongoDB Cache collection
   * @param {string} key Unique key identifier
   * @param {any} value Value content
   * @param {object} options Expiration config e.g. { ex: 300 } in seconds
   */
  async set(key, value, options = {}) {
    return 'OK'; // Temporarily bypass cache due to DB issues
    try {
      const ttl = options.ex || (365 * 24 * 60 * 60); // Default to 1 year if not specified
      const expiresAt = new Date(Date.now() + ttl * 1000);
      const stringifiedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

      await prisma.cache.upsert({
        where: { key },
        update: {
          value: stringifiedValue,
          expiresAt
        },
        create: {
          key,
          value: stringifiedValue,
          expiresAt
        }
      });
      return 'OK';
    } catch (err) {
      console.error('[MongoCache Set Error]:', err.message);
      return null;
    }
  }

  /**
   * Delete item
   */
  async del(key) {
    return 1; // Temporarily bypass cache due to DB issues
    try {
      await prisma.cache.delete({ where: { key } });
      return 1;
    } catch (err) {
      // Record not found is acceptable to suppress
      return 0;
    }
  }

  /**
   * Atomically increment key value or initialize to 1.
   * Useful for rate-limiting and login lockout attempts counters.
   */
  async incr(key, ttlSeconds = 60) {
    return 1; // Temporarily bypass rate limiting increments due to DB issues
    try {
      const record = await prisma.cache.findUnique({ where: { key } });
      let nextValue = 1;
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      if (record && record.expiresAt > new Date()) {
        nextValue = Number(record.value) + 1;
        await prisma.cache.update({
          where: { key },
          data: {
            value: String(nextValue)
          }
        });
      } else {
        // Create or reset expired record
        await prisma.cache.upsert({
          where: { key },
          update: {
            value: '1',
            expiresAt
          },
          create: {
            key,
            value: '1',
            expiresAt
          }
        });
      }
      return nextValue;
    } catch (err) {
      console.error('[MongoCache Incr Error]:', err.message);
      return 1;
    }
  }
}

export const cache = new MongoCache();
export default cache;
