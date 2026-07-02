import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

async function run() {
  const master = await prisma.user.findFirst({ where: { username: 'nino-lashes' } });
  if (!master) throw new Error('Master profile not found');
  const profile = await prisma.masterProfile.findUnique({ where: { userId: master.id } });
  if (!profile) throw new Error('Profile not found');
  
  // Calculate tomorrow's date + 2 days
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 3);
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
    throw new Error('No slots available. Please clear bookings or select another day.');
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
      note: 'Automated webhook integration test',
      consent: true,
    }),
  });
  
  if (!bookRes.ok) {
    throw new Error(`Failed to submit booking: ${await bookRes.text()}`);
  }
  
  const bookData = await bookRes.json();
  const bookingId = bookData.data.id;
  const redirectUrl = bookData.data.redirectUrl;
  console.log(`\nBooking created successfully! ID: ${bookingId}`);
  console.log(`Checkout Redirect URL: ${redirectUrl}`);

  // Fetch the created payment record
  console.log('\nFetching payment details from local database...');
  const payment = await prisma.payment.findFirst({
    where: { bookingId },
  });
  if (!payment) {
    throw new Error('No payment record found for this booking.');
  }
  console.log(`Found Payment record. ID (order_id): ${payment.id}, Amount: ${payment.amount} GEL, Status: ${payment.status}`);

  // Construct Mock Flitt Callback Payload
  console.log('\nConstructing mock Flitt webhook callback payload...');
  const secretKey = '0EMA659KxVey0Iy0qQZHrpeBDJpW0FsQ';
  const callbackPayload = {
    merchant_id: 4056024,
    amount: 6000, // 60 GEL in coins
    currency: 'GEL',
    order_id: payment.id,
    order_status: 'approved',
    payment_id: 'flitt-test-transaction-12345',
  };

  // Generate signature
  const keys = Object.keys(callbackPayload).sort();
  const values = keys.map(k => callbackPayload[k]);
  const sigBase = [secretKey, ...values].join('|');
  const signature = crypto.createHash('sha1').update(sigBase, 'utf8').digest('hex');
  
  const payloadWithSignature = {
    response: {
      ...callbackPayload,
      signature,
    }
  };
  
  console.log('Sending webhook POST callback request to local server...');
  const callbackRes = await fetch('http://localhost:8000/api/v1/booking/payment/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadWithSignature),
  });

  if (!callbackRes.ok) {
    throw new Error(`Webhook callback request failed: ${await callbackRes.text()}`);
  }
  
  const callbackResult = await callbackRes.json();
  console.log('Server Webhook Response:', JSON.stringify(callbackResult, null, 2));

  // Verify DB state updates
  console.log('\nVerifying database updates...');
  const updatedBooking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });
  const updatedPayment = await prisma.payment.findUnique({
    where: { id: payment.id },
  });

  console.log(`\nUpdated Booking Status: ${updatedBooking.status} (Expected: CONFIRMED)`);
  console.log(`Updated Booking Deposit Status: ${updatedBooking.depositStatus} (Expected: RECEIVED)`);
  console.log(`Updated Payment Status: ${updatedPayment.status} (Expected: PAID)`);

  if (updatedBooking.status === 'CONFIRMED' && updatedPayment.status === 'PAID') {
    console.log('\n🏆 SUCCESS! Webhook signature and payment processing verified end-to-end!');
  } else {
    console.error('\n❌ FAILURE: Database status did not update as expected.');
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
