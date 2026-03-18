/**
 * One-time script to geocode existing masters who have workAddress but no coordinates.
 * Usage: npx tsx scripts/geocode-masters.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function forwardGeocode(address: string, city?: string | null): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const query = city ? `${address}, ${city}, Georgia` : `${address}, Georgia`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=ge`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'GlowGE/1.0 (geocode-script)' },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;
    const data = await res.json() as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;

    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);
    if (isNaN(lat) || isNaN(lon)) return null;

    return { latitude: lat, longitude: lon };
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const masters = await prisma.masterProfile.findMany({
    where: {
      workAddress: { not: null },
      latitude: null,
    },
    select: {
      id: true,
      userId: true,
      workAddress: true,
      city: true,
      user: { select: { firstName: true, lastName: true } },
    },
  });

  console.log(`Found ${masters.length} masters without coordinates`);

  let updated = 0;
  let failed = 0;

  for (const master of masters) {
    // Nominatim rate limit: max 1 req/sec
    await new Promise((r) => setTimeout(r, 1100));

    const coords = await forwardGeocode(master.workAddress!, master.city);
    if (coords) {
      await prisma.masterProfile.update({
        where: { id: master.id },
        data: { latitude: coords.latitude, longitude: coords.longitude },
      });
      updated++;
      console.log(`✓ ${master.user.firstName} ${master.user.lastName}: ${master.workAddress} → ${coords.latitude}, ${coords.longitude}`);
    } else {
      failed++;
      console.log(`✗ ${master.user.firstName} ${master.user.lastName}: ${master.workAddress} — not found`);
    }
  }

  console.log(`\nDone: ${updated} updated, ${failed} failed`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
