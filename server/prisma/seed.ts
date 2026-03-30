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

  // ─── Specialities (niches) ──────────────────────────────────────────────────
  // Remove old specialities that were merged/replaced
  await prisma.speciality.deleteMany({
    where: { slug: { in: ['skincare', 'waxing', 'massage', 'lifestyle'] } },
  });

  const specialities = [
    { slug: 'lashes-brows',     label: 'წამწამები და წარბები',              sortOrder: 0 },
    { slug: 'nails',            label: 'ფრჩხილის მოვლა',                    sortOrder: 1 },
    { slug: 'permanent-makeup', label: 'პერმანენტული მაკიაჟი',              sortOrder: 2 },
    { slug: 'makeup',           label: 'მაკიაჟი',                           sortOrder: 3 },
    { slug: 'hair',             label: 'თმის მოვლა',                        sortOrder: 4 },
    { slug: 'cosmetology',      label: 'კოსმეტოლოგია და სხეულის მოვლა',    sortOrder: 5 },
    { slug: 'tattoo-piercing',  label: 'ტატუ და პირსინგი',                  sortOrder: 6 },
  ];

  for (const spec of specialities) {
    await prisma.speciality.upsert({
      where: { slug: spec.slug },
      update: { label: spec.label, sortOrder: spec.sortOrder },
      create: spec,
    });
  }

  // ─── Service Categories & Suggestions ─────────────────────────────────────
  // Remove old categories that were merged/replaced
  await prisma.serviceCategory.deleteMany({
    where: { slug: { in: ['skincare', 'waxing', 'body', 'other', 'lifestyle'] } },
  });

  const serviceCategories = [
    {
      slug: 'lashes-brows',
      label: 'წამწამები და წარბები',
      icon: '✦',
      sortOrder: 0,
      suggestions: [
        // წამწამების დაგრძელება
        'კლასიკური დაგრძელება (1D)',
        'მოცულობითი დაგრძელება (2D, 3D)',
        'მეგა მოცულობა',
        'L-მრუდის ეფექტი',
        'სველი ეფექტი (Wet Look)',
        'Fox Eye ეფექტი',
        // წამწამების ლამინირება
        'წამწამების ლამინირება / Lash Lift',
        'წამწამების დატენიანება / ბოტოქსი',
        'წამწამების შეღებვა',
        // წარბის მოვლა
        'წარბის არქიტექტურა (პინცეტით)',
        'წარბის არქიტექტურა (ძაფით)',
        'წარბის არქიტექტურა (ცვილით)',
        'წარბის შეღებვა ხნით',
        'წარბის შეღებვა საღებავით',
        'წარბის ლამინირება',
      ],
    },
    {
      slug: 'nails',
      label: 'ფრჩხილის მოვლა',
      icon: '✦',
      sortOrder: 1,
      suggestions: [
        // მანიკიური
        'აპარატული მანიკიური',
        'კომბინირებული მანიკიური',
        'კლასიკური მანიკიური',
        // პედიკიური
        'ესთეტიკური პედიკიური',
        'სამედიცინო პედიკიური (პოდოლოგია)',
        // დაფარვა / დიზაინი
        'გელ-ლაქით გადაფარვა',
        'ფრჩხილის გამაგრება (გელით / ბაზით)',
        'ნეილ-არტი / ფრჩხილის დიზაინი',
        'ფრენჩი',
        // დაგრძელება
        'ფრჩხილის დაგრძელება გელით',
        'ფრჩხილის დაგრძელება პოლიგელით',
        'ფრჩხილის დაგრძელება აკრილით',
      ],
    },
    {
      slug: 'permanent-makeup',
      label: 'პერმანენტული მაკიაჟი',
      icon: '✦',
      sortOrder: 2,
      suggestions: [
        // წარბის პერმანენტი
        'დაჩრდილვის ტექნიკა (Powder Brows)',
        'ღეროვანი ტექნიკა (Microblading)',
        // ტუჩის პერმანენტი
        'ტუჩის პერმანენტი — აკვარელური ტექნიკა',
        'ტუჩის კონტური + დაჩრდილვა',
        'ტუჩსაცხის ეფექტი',
        // თვალის პერმანენტი
        'წამწამშორისი კონტური',
        'კლასიკური ლაინერი',
        'დაჩრდილული ლაინერი',
      ],
    },
    {
      slug: 'makeup',
      label: 'მაკიაჟი',
      icon: '✦',
      sortOrder: 3,
      suggestions: [
        'სადღესასწაულო / საღამოს მაკიაჟი',
        'საქორწილო მაკიაჟი',
        'დღის / ბუნებრივი (Nude) მაკიაჟი',
        'შემოქმედებითი / Art მაკიაჟი',
      ],
    },
    {
      slug: 'hair',
      label: 'თმის მოვლა',
      icon: '✦',
      sortOrder: 4,
      suggestions: [
        // შეჭრა
        'ქალის თმის შეჭრა',
        'მამაკაცის შეჭრა / ბარბერინგი',
        'ბავშვის თმის შეჭრა',
        // შეღებვა
        'ერთტონიანი შეღებვა',
        'ბალაიაჟი',
        'ომბრე',
        'შატუში',
        'აირთაჩი (Airtuch)',
        'მელირება',
        // ვარცხნილობა
        'სადღესასწაულო ვარცხნილობა',
        'ყოველდღიური დავარცხნა / ბრაშინგი',
        // აღმდგენი
        'კერატინით გასწორება',
        'თმის ბოტოქსი',
        'სპა-მოვლა',
      ],
    },
    {
      slug: 'cosmetology',
      label: 'კოსმეტოლოგია და სხეულის მოვლა',
      icon: '✦',
      sortOrder: 5,
      suggestions: [
        // ესთეტიკური კოსმეტოლოგია
        'სახის ღრმა წმენდა',
        'სახის პილინგი',
        'დამატენიანებელი ნიღბები',
        // ინექციური კოსმეტოლოგია
        'ბიორევიტალიზაცია',
        'ფილერი',
        'ბოტოქსი',
        'მეზოთერაპია',
        // მასაჟი
        'სარელაქსაციო მასაჟი',
        'ანტიცელულიტური მასაჟი',
        'სამკურნალო მასაჟი',
        // ეპილაცია / დეპილაცია
        'ლაზერული ეპილაცია',
        'ელექტროეპილაცია',
        'შუგარინგი',
        'ცვილით დეპილაცია',
      ],
    },
    {
      slug: 'tattoo-piercing',
      label: 'ტატუ და პირსინგი',
      icon: '✦',
      sortOrder: 6,
      suggestions: [
        // ტატუ
        'შავ-თეთრი ტატუ',
        'ფერადი ტატუ',
        'მინიმალისტური ტატუ',
        'Cover-up ტატუ (გადაკეთება)',
        // პირსინგი
        'ყურის პირსინგი',
        'ცხვირის პირსინგი',
        'ჭიპის პირსინგი',
        'სხეულის პირსინგი',
        // მოცილება
        'ტატუს ლაზერული მოცილება',
        'პირსინგის მოცილება',
      ],
    },
  ];

  for (const cat of serviceCategories) {
    const created = await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: { label: cat.label, icon: cat.icon, sortOrder: cat.sortOrder },
      create: { slug: cat.slug, label: cat.label, icon: cat.icon, sortOrder: cat.sortOrder },
    });

    // Re-seed suggestions (safe — not FK-referenced elsewhere)
    await prisma.serviceSuggestion.deleteMany({ where: { categoryId: created.id } });
    if (cat.suggestions.length > 0) {
      await prisma.serviceSuggestion.createMany({
        data: cat.suggestions.map((name, i) => ({
          categoryId: created.id,
          name,
          sortOrder: i,
        })),
      });
    }
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

// ── District Coordinates ──────────────────────────────────────
async function seedDistrictCoordinates(): Promise<void> {
  const DISTRICT_COORDS: Record<string, { latitude: number; longitude: number }> = {
    vake: { latitude: 41.7087, longitude: 44.7465 },
    saburtalo: { latitude: 41.7275, longitude: 44.7460 },
    vera: { latitude: 41.7100, longitude: 44.7835 },
    mtatsminda: { latitude: 41.6940, longitude: 44.7920 },
    'old-tbilisi': { latitude: 41.6900, longitude: 44.8075 },
    gldani: { latitude: 41.7690, longitude: 44.8140 },
    nadzaladevi: { latitude: 41.7480, longitude: 44.8020 },
    didube: { latitude: 41.7370, longitude: 44.7800 },
    chugureti: { latitude: 41.7080, longitude: 44.8060 },
    isani: { latitude: 41.6950, longitude: 44.8270 },
    samgori: { latitude: 41.7060, longitude: 44.8520 },
    dighomi: { latitude: 41.7550, longitude: 44.7530 },
    avlabari: { latitude: 41.6930, longitude: 44.8130 },
    ortachala: { latitude: 41.6830, longitude: 44.8170 },
    varketili: { latitude: 41.6870, longitude: 44.8850 },
  };

  for (const [slug, coords] of Object.entries(DISTRICT_COORDS)) {
    await prisma.district.updateMany({
      where: { slug },
      data: coords,
    });
  }

  // eslint-disable-next-line no-console
  console.log(`✅ Updated coordinates for ${Object.keys(DISTRICT_COORDS).length} districts`);
}

main()
  .then(() => seedDistrictCoordinates())
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
