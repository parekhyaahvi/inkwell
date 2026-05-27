import { PrismaClient } from '@prisma/client';

// Shared Prisma Database Client instance with aggressive timeouts for resilience
export const prisma = new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'pretty',
});

export default prisma;
