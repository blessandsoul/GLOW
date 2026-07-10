import { createFlittReversal, getFlittOrderStatus } from '@/libs/flitt.js';
import { sendSms } from '@/libs/otp.js';
import { paymentsRepo } from './payments.repo.js';
import { createPaymentsService } from './payments.service.js';

export const paymentsService = createPaymentsService({
  repo: paymentsRepo,
  gateway: {
    reverse: createFlittReversal,
    status: getFlittOrderStatus,
  },
  notify: async (phone, message) => {
    await sendSms(phone, message);
  },
});
