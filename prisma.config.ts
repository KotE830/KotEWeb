/**
 * Prisma 7.3.0 Configuration
 * 
 * This file configures the database connection for Prisma.
 * Since schema.prisma no longer has the url field, this file manages the database connection.
 */

import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Get DATABASE_URL from environment variables
 * Supports both direct DATABASE_URL and individual POSTGRES_* variables
 */
export function getDatabaseUrl(): string {
  // If DATABASE_URL is directly provided, use it
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  const host = process.env.POSTGRES_HOST || 'localhost';
  const port = process.env.POSTGRES_PORT || '5432';
  const database = process.env.POSTGRES_DB;
  const schema = process.env.POSTGRES_SCHEMA || 'public';

  if (!user) {
    throw new Error('POSTGRES_USER is required when DATABASE_URL is not provided');
  }
  if (!password) {
    throw new Error('POSTGRES_PASSWORD is required when DATABASE_URL is not provided');
  }
  if (!database) {
    throw new Error('POSTGRES_DB is required when DATABASE_URL is not provided');
  }

  return `postgresql://${user}:${password}@${host}:${port}/${database}?schema=${schema}`;
}

export default defineConfig({
  datasource: {
    url: getDatabaseUrl(),
  },
});

