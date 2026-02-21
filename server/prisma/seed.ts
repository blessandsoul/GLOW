import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('🌱 Seeding database...');

  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const testPassword = await bcrypt.hash('Test1234!', 12);

  await prisma.user.upsert({
    where: { email: 'admin@glow.ge' },
    update: {},
    create: {
      email: 'admin@glow.ge',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      emailVerified: true,
      credits: 100,
    },
  });

  await prisma.user.upsert({
    where: { email: 'test@glow.ge' },
    update: {},
    create: {
      email: 'test@glow.ge',
      password: testPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      emailVerified: true,
      credits: 3,
    },
  });

  // ─── Credit packages pricing model ───────────────────────────────────────
  // Model: gpt-image-1.5 via OpenAI API, 2 AI variants per credit
  // 1 credit = 1 photo upload → 2 generated variants
  // USD → GEL rate: ~2.7 | Markup: ~2.5×
  //
  // Cost per credit by quality:
  //   Low    = 2 × $0.009 × 2.7 = ₾0.049  → sell at ₾0.15/credit
  //   Medium = 2 × $0.040 × 2.7 = ₾0.216  → sell at ₾0.55/credit
  //   High   = 2 × $0.167 × 2.7 = ₾0.902  → sell at ₾2.20/credit
  //
  // 3 tiers × 3 sizes (S/M/L). Default/featured = PRO (high quality).
  // ─────────────────────────────────────────────────────────────────────────
  const creditPackages = [
    // ── LOW quality — ეკონომი ──────────────────────────────────────────────
    // cost/credit ≈ ₾0.049 → price/credit ≈ ₾0.15, margin ~68%
    {
      id: 'low-s',
      name: 'ეკონომი S',
      description: '10 ფოტო · 20 ვარიანტი',
      credits: 10,
      price: 150,   // ₾1.50 — cost ₾0.49 — margin ~67%
      currency: 'GEL',
      sortOrder: 0,
    },
    {
      id: 'low-m',
      name: 'ეკონომი M',
      description: '30 ფოტო · 60 ვარიანტი',
      credits: 30,
      price: 390,   // ₾3.90 — cost ₾1.47 — margin ~62%
      currency: 'GEL',
      sortOrder: 1,
    },
    {
      id: 'low-l',
      name: 'ეკონომი L',
      description: '70 ფოტო · 140 ვარიანტი',
      credits: 70,
      price: 790,   // ₾7.90 — cost ₾3.43 — margin ~57%
      currency: 'GEL',
      sortOrder: 2,
    },

    // ── MEDIUM quality — სტანდარტი ────────────────────────────────────────
    // cost/credit ≈ ₾0.216 → price/credit ≈ ₾0.55, margin ~61%
    {
      id: 'mid-s',
      name: 'სტანდარტი S',
      description: '10 ფოტო · 20 ვარიანტი',
      credits: 10,
      price: 550,   // ₾5.50 — cost ₾2.16 — margin ~61%
      currency: 'GEL',
      sortOrder: 3,
    },
    {
      id: 'mid-m',
      name: 'სტანდარტი M',
      description: '30 ფოტო · 60 ვარიანტი',
      credits: 30,
      price: 1490,  // ₾14.90 — cost ₾6.48 — margin ~57%
      currency: 'GEL',
      sortOrder: 4,
    },
    {
      id: 'mid-l',
      name: 'სტანდარტი L',
      description: '70 ფოტო · 140 ვარიანტი',
      credits: 70,
      price: 2990,  // ₾29.90 — cost ₾15.12 — margin ~49%
      currency: 'GEL',
      sortOrder: 5,
    },

    // ── HIGH quality — პრო (DEFAULT/FEATURED) ─────────────────────────────
    // cost/credit ≈ ₾0.902 → price/credit ≈ ₾2.20, margin ~59%
    {
      id: 'pro-s',
      name: 'პრო S',
      description: '10 ფოტო · 20 ვარიანტი',
      credits: 10,
      price: 2190,  // ₾21.90 — cost ₾9.02 — margin ~59%
      currency: 'GEL',
      sortOrder: 6,
    },
    {
      id: 'pro-m',
      name: 'პრო M',
      description: '30 ფოტო · 60 ვარიანტი',
      credits: 30,
      price: 5990,  // ₾59.90 — cost ₾27.06 — margin ~55%
      currency: 'GEL',
      sortOrder: 7,
    },
    {
      id: 'pro-l',
      name: 'პრო L',
      description: '70 ფოტო · 140 ვარიანტი',
      credits: 70,
      price: 12900, // ₾129.00 — cost ₾63.14 — margin ~51%
      currency: 'GEL',
      sortOrder: 8,
    },
  ];

  for (const pkg of creditPackages) {
    await prisma.creditPackage.upsert({
      where: { id: pkg.id },
      update: {
        name: pkg.name,
        description: pkg.description,
        credits: pkg.credits,
        price: pkg.price,
        currency: pkg.currency,
        sortOrder: pkg.sortOrder,
      },
      create: pkg,
    });
  }

  // eslint-disable-next-line no-console
  console.log('✅ Seeding complete');
  // eslint-disable-next-line no-console
  console.log('  Admin: admin@glow.ge / Admin123!');
  // eslint-disable-next-line no-console
  console.log('  User:  test@glow.ge / Test1234!');
  // eslint-disable-next-line no-console
  console.log('  Credit packages (9 total, 3 tiers × 3 sizes):');
  // eslint-disable-next-line no-console
  console.log('    LOW  (ეკონომი)  — S ₾1.50 | M ₾3.90  | L ₾7.90');
  // eslint-disable-next-line no-console
  console.log('    MID  (სტანდარტი) — S ₾5.50 | M ₾14.90 | L ₾29.90');
  // eslint-disable-next-line no-console
  console.log('    PRO  (პრო) ★    — S ₾21.90| M ₾59.90 | L ₾129.00');
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
