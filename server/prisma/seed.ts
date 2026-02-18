import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('🌱 Seeding database...');

  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const testPassword = await bcrypt.hash('Test1234!', 12);

  await prisma.user.upsert({
    where: { email: 'admin@lashme.app' },
    update: {},
    create: {
      email: 'admin@lashme.app',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      emailVerified: true,
      credits: 100,
    },
  });

  await prisma.user.upsert({
    where: { email: 'test@lashme.app' },
    update: {},
    create: {
      email: 'test@lashme.app',
      password: testPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      emailVerified: true,
      credits: 3,
    },
  });

  // eslint-disable-next-line no-console
  console.log('✅ Seeding complete');
  // eslint-disable-next-line no-console
  console.log('  Admin: admin@lashme.app / Admin123!');
  // eslint-disable-next-line no-console
  console.log('  User:  test@lashme.app / Test1234!');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
