import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const master = await prisma.user.findFirst({ where: { username: 'nino-lashes' } });
  if (!master) throw new Error('Master profile not found');
  const profile = await prisma.masterProfile.findUnique({ where: { userId: master.id } });
  if (!profile) throw new Error('Profile not found');
  
  // Calculate tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const dateStr = tomorrow.toISOString().split('T')[0];
  const serviceName = 'წარბების ლამინაცია'; // 60 GEL
  
  console.log(`Querying slots for Nino Lashes on ${dateStr} for "${serviceName}"...`);
  
  // Fetch slots
  const slotsRes = await fetch(`http://localhost:8000/api/v1/booking/public/nino-lashes/slots?date=${dateStr}&serviceName=${encodeURIComponent(serviceName)}`);
  if (!slotsRes.ok) {
    throw new Error(`Failed to fetch slots: ${await slotsRes.text()}`);
  }
  const slotsData = await slotsRes.json();
  const slots = slotsData.data?.slots || [];
  if (slots.length === 0) {
    throw new Error('No slots available tomorrow. Please check Nino working hours.');
  }
  const selectedSlot = slots[0];
  console.log(`Found slots: ${slots.join(', ')}. Selected slot: ${selectedSlot}`);
  
  // Request OTP
  console.log('Requesting OTP...');
  const otpRes = await fetch(`http://localhost:8000/api/v1/booking/public/nino-lashes/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientName: 'Browser QA',
      clientPhone: '+995599246810',
      date: dateStr,
      startTime: selectedSlot,
      serviceName,
      consent: true,
    }),
  });
  if (!otpRes.ok) {
    throw new Error(`Failed to request OTP: ${await otpRes.text()}`);
  }
  const otpData = await otpRes.json();
  const otpRequestId = otpData.data?.requestId || otpData.data?.hash || otpData.requestId || otpData.hash;
  console.log(`OTP request successful. RequestId: ${otpRequestId}`);
  
  // Create Booking & Get Checkout URL
  console.log('Submitting booking...');
  const bookRes = await fetch(`http://localhost:8000/api/v1/booking/public/nino-lashes/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientName: 'Browser QA',
      clientPhone: '+995599246810',
      date: dateStr,
      startTime: selectedSlot,
      serviceName,
      code: '123456', // development bypass code
      otpRequestId,
      note: 'Automated payment test',
      consent: true,
    }),
  });
  
  if (!bookRes.ok) {
    throw new Error(`Failed to submit booking: ${await bookRes.text()}`);
  }
  
  const bookData = await bookRes.json();
  console.log('\n--- BOOKING CREATED SUCCESSFULLY ---');
  console.log('Full response payload:', JSON.stringify(bookData, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
