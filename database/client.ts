import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl } from '../prisma.config';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * Prisma client instance
 * Uses singleton pattern in development to prevent multiple instances during hot reload
 * In production, creates a new instance each time
 * 
 * Prisma 7.3.0: Uses datasourceUrl from prisma.config.ts instead of schema.prisma
 */
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: getDatabaseUrl(),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

