import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 1. PostgreSQL 연결 풀(Pool) 생성
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// 2. Prisma 어댑터 생성
const adapter = new PrismaPg(pool);

// 3. PrismaClient에 어댑터 장착
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter, // 👈 여기서 어댑터를 사용합니다
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}