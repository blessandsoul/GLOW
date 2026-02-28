import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function truncateAll(): Promise<void> {
  const tables = [
    'referrals',
    'captions',
    'reviews',
    'portfolio_items',
    'scheduled_posts',
    'credit_transactions',
    'credit_purchases',
    'credit_packages',
    'branding_profiles',
    'master_profiles',
    'subscriptions',
    'trend_templates',
    'jobs',
    'refresh_tokens',
    'users',
  ];

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\`;`);
    console.log(`  Truncated: ${table}`);
  }

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');

  console.log('\nAll tables truncated successfully.');
}

truncateAll()
  .catch((e) => {
    console.error('Truncate failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
