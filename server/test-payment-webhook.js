import crypto from 'node:crypto';

// Local callback fixture only. Real credentials must be injected by the caller.
const secretKey = process.env.FLITT_SECRET_KEY;
const merchantId = Number(process.env.FLITT_MERCHANT_ID);
const paymentId = process.env.TEST_PAYMENT_ID;
const amountMinor = Number(process.env.TEST_PAYMENT_AMOUNT_MINOR);
const baseUrl = process.env.API_BASE_URL || 'http://localhost:8000/api/v1';

if (!secretKey || !merchantId || !paymentId || !Number.isInteger(amountMinor) || amountMinor <= 0) {
  throw new Error('FLITT_SECRET_KEY, FLITT_MERCHANT_ID, TEST_PAYMENT_ID and TEST_PAYMENT_AMOUNT_MINOR are required');
}

const callbackPayload = {
  merchant_id: merchantId,
  amount: amountMinor,
  currency: 'GEL',
  order_id: paymentId,
  order_status: 'approved',
  payment_id: `fixture-${crypto.randomUUID()}`,
};

const signature = crypto
  .createHash('sha1')
  .update([secretKey, ...Object.keys(callbackPayload).sort().map((key) => callbackPayload[key])].join('|'), 'utf8')
  .digest('hex');

const response = await fetch(`${baseUrl}/booking/payment/callback`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ response: { ...callbackPayload, signature } }),
});

if (!response.ok) throw new Error(`Callback fixture failed (${response.status}): ${await response.text()}`);
console.log('Callback fixture accepted:', await response.json());
