import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl } from '../prisma.config';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Prisma 7.3.0: Set DATABASE_URL environment variable before creating PrismaClient
// The client will automatically read DATABASE_URL from environment
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = getDatabaseUrl();
}

/**
 * Prisma client instance
 * Uses singleton pattern in development to prevent multiple instances during hot reload
 * In production, creates a new instance each time
 * 
 * Prisma 7.3.0: DATABASE_URL is set from prisma.config.ts before client creation
 */
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

