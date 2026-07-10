import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function main(): Promise<void> {
  const email = required('REVIEWER_EMAIL').toLowerCase();
  const phone = required('REVIEWER_PHONE');
  const password = required('REVIEWER_PASSWORD');
  const username = process.env.REVIEWER_USERNAME?.trim() || 'glow-review-master';
  const passwordHash = await bcrypt.hash(password, 12);
  const hours = {
    monday: [{ open: '09:00', close: '18:00' }],
    tuesday: [{ open: '09:00', close: '18:00' }],
    wednesday: [{ open: '09:00', close: '18:00' }],
    thursday: [{ open: '09:00', close: '18:00' }],
    friday: [{ open: '09:00', close: '18:00' }],
    saturday: [{ open: '10:00', close: '16:00' }],
    sunday: null,
  };

  const usernameOwner = await prisma.user.findUnique({ where: { username }, select: { email: true } });
  if (usernameOwner && usernameOwner.email !== email) {
    throw new Error(`Reviewer username ${username} belongs to another account`);
  }

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      phone,
      password: passwordHash,
      firstName: 'Glow',
      lastName: 'Reviewer',
      username,
      role: 'MASTER',
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      onboardingCompleted: true,
    },
    update: {
      phone,
      password: passwordHash,
      firstName: 'Glow',
      lastName: 'Reviewer',
      username,
      role: 'MASTER',
      isActive: true,
      deletedAt: null,
      emailVerified: true,
      phoneVerified: true,
      onboardingCompleted: true,
    },
    select: { id: true, email: true, username: true },
  });

  await prisma.masterProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      city: 'tbilisi',
      niche: 'review',
      bio: 'Payment reviewer test profile.',
      services: [{ name: 'Reviewer booking', price: 1, priceType: 'fixed', category: 'review', duration: 30 }],
      workingHours: hours,
      bookingEnabled: true,
      bookingPaymentMode: 'FULL',
      bookingPaymentChannel: 'FLITT',
      bookingPrepaymentAmount: 1,
      bookingPaymentInfo: null,
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
      isReviewProfile: true,
    },
    update: {
      city: 'tbilisi',
      niche: 'review',
      bio: 'Payment reviewer test profile.',
      services: [{ name: 'Reviewer booking', price: 1, priceType: 'fixed', category: 'review', duration: 30 }],
      workingHours: hours,
      bookingEnabled: true,
      bookingPaymentMode: 'FULL',
      bookingPaymentChannel: 'FLITT',
      bookingPrepaymentAmount: 1,
      bookingPaymentInfo: null,
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
      isReviewProfile: true,
    },
  });

  const baseUrl = (process.env.CLIENT_URL || 'https://glow.ge').replace(/\/$/, '');
  console.log(JSON.stringify({
    email: user.email,
    username: user.username,
    profileUrl: `${baseUrl}/specialist/${user.username}`,
    bookingUrl: `${baseUrl}/w/${user.username}`,
    dashboardUrl: `${baseUrl}/dashboard/bookings`,
  }, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
