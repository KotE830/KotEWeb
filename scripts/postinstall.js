// Conditional Prisma Client generation
// Only generate if database environment variables are present (backend build)
// Skip for frontend-only builds (Vercel)

const hasDatabaseConfig = 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_USER;

if (hasDatabaseConfig) {
  console.log('Generating Prisma Client...');
  const { execSync } = require('child_process');
  execSync('prisma generate', { stdio: 'inherit' });
} else {
  console.log('Skipping Prisma Client generation: No database config found (frontend build)');
}

