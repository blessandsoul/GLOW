import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';

vi.mock('../../libs/logger.js', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));
vi.mock('../../libs/otp.js', () => ({
  sendOtp: vi.fn(),
  verifyOtp: vi.fn(),
  sendSms: vi.fn(),
}));
vi.mock('../../libs/flitt.js', () => ({
  createFlittCheckout: vi.fn(),
  isFlittConfigured: vi.fn(),
  verifyFlittCallback: vi.fn(),
  isFlittApproved: vi.fn(),
  isFlittTerminalFailure: vi.fn(),
}));
vi.mock('../../shared/rate-limit/otp-throttle.js', () => ({
  assertOtpPhoneAllowed: vi.fn(),
}));
vi.mock('./booking.repo.js', () => ({
  bookingRepo: {
    findMasterByUsername: vi.fn(),
    findMasterProfileByUserId: vi.fn(),
    findActiveBookingsForDay: vi.fn(),
    findByTriple: vi.fn(),
    createBooking: vi.fn(),
    listByMaster: vi.fn(),
    aggregateByDate: vi.fn(),
    findById: vi.fn(),
    updateStatus: vi.fn(),
    setDepositReceived: vi.fn(),
    createPayment: vi.fn(),
    createOfflinePayment: vi.fn(),
    findPaymentWithBooking: vi.fn(),
    markPaymentPaid: vi.fn(),
    markPaymentFailed: vi.fn(),
  },
}));

import { computeSlots, bookingService } from './booking.service.js';
import { bookingRepo } from './booking.repo.js';
import { verifyOtp, sendSms } from '../../libs/otp.js';
import {
  createFlittCheckout,
  isFlittConfigured,
  verifyFlittCallback,
  isFlittApproved,
  isFlittTerminalFailure,
} from '../../libs/flitt.js';
import { assertOtpPhoneAllowed } from '../../shared/rate-limit/otp-throttle.js';

const repo = vi.mocked(bookingRepo);
const mockAssertOtpPhone = vi.mocked(assertOtpPhoneAllowed);
const mockVerifyOtp = vi.mocked(verifyOtp);
const mockSendSms = vi.mocked(sendSms);
const mockCreateCheckout = vi.mocked(createFlittCheckout);
const mockIsConfigured = vi.mocked(isFlittConfigured);
const mockVerifyCallback = vi.mocked(verifyFlittCallback);
const mockIsApproved = vi.mocked(isFlittApproved);
const mockIsTerminalFailure = vi.mocked(isFlittTerminalFailure);

// ─── Pure slot engine (deterministic) ─────────────────────────────
describe('computeSlots', () => {
  const iv = (open: string, close: string) => ({ open, close });

  it('slices an interval by service duration', () => {
    expect(computeSlots({ intervals: [iv('10:00', '13:00')], durationMinutes: 60, busy: [], isToday: false, nowMinutes: 0 }))
      .toEqual(['10:00', '11:00', '12:00']);
  });

  it('drops candidates that overflow the interval', () => {
    expect(computeSlots({ intervals: [iv('10:00', '13:00')], durationMinutes: 90, busy: [], isToday: false, nowMinutes: 0 }))
      .toEqual(['10:00', '11:30']);
  });

  it('excludes slots overlapping a busy range', () => {
    expect(computeSlots({
      intervals: [iv('10:00', '13:00')], durationMinutes: 60,
      busy: [{ startTime: '11:00', endTime: '12:00' }], isToday: false, nowMinutes: 0,
    })).toEqual(['10:00', '12:00']);
  });

  it('excludes past slots when the day is today', () => {
    expect(computeSlots({
      intervals: [iv('10:00', '13:00')], durationMinutes: 60, busy: [],
      isToday: true, nowMinutes: 10 * 60 + 30,
    })).toEqual(['11:00', '12:00']);
  });

  it('returns nothing on a closed day', () => {
    expect(computeSlots({ intervals: [], durationMinutes: 60, busy: [], isToday: false, nowMinutes: 0 }))
      .toEqual([]);
  });
});

// ─── Booking flow (mocked) ────────────────────────────────────────
const USERNAME = 'lashqueen';
const PHONE = '+995555123456';
const FUTURE = new Date('2099-07-14T00:00:00.000Z');

function allDays(open = '10:00', close = '19:00') {
  return { monday: [{ open, close }], tuesday: [{ open, close }], wednesday: [{ open, close }], thursday: [{ open, close }], friday: [{ open, close }], saturday: [{ open, close }], sunday: [{ open, close }] };
}

function masterFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1', firstName: 'Nino', username: USERNAME, phone: '+995599000000',
    masterProfile: {
      id: 'mp-1', phone: '+995599111111',
      services: [{ name: 'Classic Lashes', category: 'lashes', price: 80, duration: 60 }],
      workingHours: allDays(),
      bookingEnabled: true,
      bookingPaymentMode: 'NONE',
      bookingPrepaymentAmount: 20,
      bookingPaymentInfo: null,
      ...overrides,
    },
  };
}

const validBook = {
  clientName: 'Mariam', clientPhone: PHONE, date: FUTURE, startTime: '10:00',
  serviceName: 'Classic Lashes', consent: true as const, otpRequestId: 'hash-1', code: '123456',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSendSms.mockResolvedValue(undefined);
  mockAssertOtpPhone.mockResolvedValue(undefined);
  repo.createOfflinePayment.mockResolvedValue({ id: 'offpay-1' } as never);
  // Default: gateway OFF, so the base prepay tests take the off-platform path.
  mockIsConfigured.mockReturnValue(false);
  mockIsApproved.mockReturnValue(false);
  mockIsTerminalFailure.mockReturnValue(false);
});

describe('bookingService.getSlots', () => {
  it('rejects when booking is disabled', async () => {
    repo.findMasterByUsername.mockResolvedValue(masterFixture({ bookingEnabled: false }));
    await expect(bookingService.getSlots(USERNAME, FUTURE, 'Classic Lashes')).rejects.toMatchObject({ code: 'BOOKING_DISABLED' });
  });

  it('returns free slots minus the busy ones', async () => {
    repo.findMasterByUsername.mockResolvedValue(masterFixture());
    repo.findActiveBookingsForDay.mockResolvedValue([{ startTime: '11:00', endTime: '12:00' }]);
    const res = await bookingService.getSlots(USERNAME, FUTURE, 'Classic Lashes');
    expect(res.dayClosed).toBe(false);
    expect(res.slots).not.toContain('11:00');
    expect(res.slots).toContain('10:00');
    expect(res.slots).toContain('12:00');
  });
});

describe('bookingService.verifyAndBook', () => {
  it('books a free slot and notifies the master', async () => {
    repo.findMasterByUsername.mockResolvedValue(masterFixture());
    repo.findActiveBookingsForDay.mockResolvedValue([]);
    repo.createBooking.mockResolvedValue({
      id: 'b-1', status: 'CONFIRMED', date: FUTURE, startTime: '10:00', endTime: '11:00',
      serviceName: 'Classic Lashes', paymentMode: 'NONE', prepaymentRequired: false, prepaymentAmount: null, depositStatus: 'NONE',
    } as never);
    mockVerifyOtp.mockResolvedValue(true);

    const res = await bookingService.verifyAndBook(USERNAME, validBook);

    expect(mockVerifyOtp).toHaveBeenCalledWith(PHONE, 'hash-1', '123456');
    expect(repo.createBooking).toHaveBeenCalledWith(expect.objectContaining({
      masterProfileId: 'mp-1', startTime: '10:00', endTime: '11:00', durationMinutes: 60, status: 'CONFIRMED', paymentMode: 'NONE',
    }));
    expect(mockSendSms).toHaveBeenCalledTimes(1);
    expect(res).toMatchObject({ id: 'b-1', status: 'CONFIRMED' });
    expect(res).not.toHaveProperty('clientPhone');
  });

  it('sets PENDING + AWAITING deposit when prepayment is enabled', async () => {
    repo.findMasterByUsername.mockResolvedValue(masterFixture({ bookingPaymentMode: 'DEPOSIT', bookingPrepaymentAmount: 20, bookingPaymentInfo: 'BoG 1234' }));
    repo.findActiveBookingsForDay.mockResolvedValue([]);
    repo.createBooking.mockResolvedValue({
      id: 'b-2', status: 'PENDING', date: FUTURE, startTime: '10:00', endTime: '11:00',
      serviceName: 'Classic Lashes', paymentMode: 'DEPOSIT', prepaymentRequired: true, prepaymentAmount: 20, depositStatus: 'AWAITING',
    } as never);
    mockVerifyOtp.mockResolvedValue(true);

    const res = await bookingService.verifyAndBook(USERNAME, validBook);

    expect(repo.createBooking).toHaveBeenCalledWith(expect.objectContaining({
      status: 'PENDING', depositStatus: 'AWAITING', prepaymentRequired: true, prepaymentAmount: 20, paymentMode: 'DEPOSIT',
    }));
    expect(res.paymentInfo).toBe('BoG 1234');
  });

  it('charges the full service price when payment mode is FULL', async () => {
    repo.findMasterByUsername.mockResolvedValue(masterFixture({ bookingPaymentMode: 'FULL', bookingPaymentInfo: 'BoG 5555' }));
    repo.findActiveBookingsForDay.mockResolvedValue([]);
    repo.createBooking.mockResolvedValue({
      id: 'b-3', status: 'PENDING', date: FUTURE, startTime: '10:00', endTime: '11:00',
      serviceName: 'Classic Lashes', paymentMode: 'FULL', prepaymentRequired: true, prepaymentAmount: 80, depositStatus: 'AWAITING',
    } as never);
    mockVerifyOtp.mockResolvedValue(true);

    const res = await bookingService.verifyAndBook(USERNAME, validBook);

    expect(repo.createBooking).toHaveBeenCalledWith(expect.objectContaining({
      status: 'PENDING', depositStatus: 'AWAITING', prepaymentRequired: true, prepaymentAmount: 80, paymentMode: 'FULL',
    }));
    expect(res.paymentInfo).toBe('BoG 5555');
  });

  it('rejects an unavailable slot', async () => {
    repo.findMasterByUsername.mockResolvedValue(masterFixture());
    repo.findActiveBookingsForDay.mockResolvedValue([{ startTime: '10:00', endTime: '11:00' }]);
    mockVerifyOtp.mockResolvedValue(true);
    await expect(bookingService.verifyAndBook(USERNAME, validBook)).rejects.toMatchObject({ code: 'SLOT_UNAVAILABLE' });
    expect(repo.createBooking).not.toHaveBeenCalled();
  });

  it('maps a unique-race to SLOT_TAKEN', async () => {
    repo.findMasterByUsername.mockResolvedValue(masterFixture());
    repo.findActiveBookingsForDay.mockResolvedValue([]);
    repo.createBooking.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 't' }));
    mockVerifyOtp.mockResolvedValue(true);
    await expect(bookingService.verifyAndBook(USERNAME, validBook)).rejects.toMatchObject({ code: 'SLOT_TAKEN' });
  });

  it('does not consume the OTP on an invalid service', async () => {
    repo.findMasterByUsername.mockResolvedValue(masterFixture());
    repo.findActiveBookingsForDay.mockResolvedValue([]);
    await expect(bookingService.verifyAndBook(USERNAME, { ...validBook, serviceName: 'Nope' })).rejects.toMatchObject({ code: 'INVALID_SERVICE' });
    expect(mockVerifyOtp).not.toHaveBeenCalled();
  });
});

describe('bookingService.updateStatus', () => {
  function ownedBooking(over: Record<string, unknown> = {}) {
    return {
      id: 'b-1', masterProfileId: 'mp-1', clientName: 'X', clientPhone: PHONE,
      status: 'PENDING', paymentMode: 'NONE', depositStatus: 'NONE',
      date: FUTURE, startTime: '10:00', serviceName: 'Classic Lashes', ...over,
    };
  }
  function ownProfile() {
    repo.findMasterProfileByUserId.mockResolvedValue({ id: 'mp-1' });
  }

  it('forbids updating a booking the master does not own', async () => {
    ownProfile();
    repo.findById.mockResolvedValue(ownedBooking({ masterProfileId: 'OTHER' }));
    await expect(bookingService.updateStatus('user-1', 'b-1', 'CONFIRMED')).rejects.toMatchObject({ code: 'NOT_OWNER' });
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it('confirms a NONE-mode PENDING booking (legal edge, no prepay gate)', async () => {
    ownProfile();
    repo.findById.mockResolvedValue(ownedBooking({ status: 'PENDING', paymentMode: 'NONE' }));
    repo.updateStatus.mockResolvedValue({} as never);
    await bookingService.updateStatus('user-1', 'b-1', 'CONFIRMED');
    expect(repo.updateStatus).toHaveBeenCalledWith('b-1', 'CONFIRMED');
  });

  it('BLOCKS confirming an unpaid prepay (DEPOSIT, deposit AWAITING) → PREPAYMENT_NOT_RECEIVED', async () => {
    ownProfile();
    repo.findById.mockResolvedValue(ownedBooking({ status: 'PENDING', paymentMode: 'DEPOSIT', depositStatus: 'AWAITING' }));
    await expect(bookingService.updateStatus('user-1', 'b-1', 'CONFIRMED')).rejects.toMatchObject({ code: 'PREPAYMENT_NOT_RECEIVED' });
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it('allows confirming a prepay booking once the deposit is RECEIVED', async () => {
    ownProfile();
    repo.findById.mockResolvedValue(ownedBooking({ status: 'PENDING', paymentMode: 'DEPOSIT', depositStatus: 'RECEIVED' }));
    repo.updateStatus.mockResolvedValue({} as never);
    await bookingService.updateStatus('user-1', 'b-1', 'CONFIRMED');
    expect(repo.updateStatus).toHaveBeenCalledWith('b-1', 'CONFIRMED');
  });

  it('FORBIDS reviving a terminal CANCELLED booking → ILLEGAL_STATUS_TRANSITION', async () => {
    ownProfile();
    repo.findById.mockResolvedValue(ownedBooking({ status: 'CANCELLED' }));
    await expect(bookingService.updateStatus('user-1', 'b-1', 'CONFIRMED')).rejects.toMatchObject({ code: 'ILLEGAL_STATUS_TRANSITION' });
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it('FORBIDS moving a COMPLETED booking anywhere', async () => {
    ownProfile();
    repo.findById.mockResolvedValue(ownedBooking({ status: 'COMPLETED' }));
    await expect(bookingService.updateStatus('user-1', 'b-1', 'CANCELLED')).rejects.toMatchObject({ code: 'ILLEGAL_STATUS_TRANSITION' });
  });

  it('rejects a no-op transition (same status) → STATUS_UNCHANGED', async () => {
    ownProfile();
    repo.findById.mockResolvedValue(ownedBooking({ status: 'CONFIRMED', paymentMode: 'NONE' }));
    await expect(bookingService.updateStatus('user-1', 'b-1', 'CONFIRMED')).rejects.toMatchObject({ code: 'STATUS_UNCHANGED' });
  });

  it('allows CONFIRMED → COMPLETED (legal terminal move)', async () => {
    ownProfile();
    repo.findById.mockResolvedValue(ownedBooking({ status: 'CONFIRMED', paymentMode: 'NONE' }));
    repo.updateStatus.mockResolvedValue({} as never);
    await bookingService.updateStatus('user-1', 'b-1', 'COMPLETED');
    expect(repo.updateStatus).toHaveBeenCalledWith('b-1', 'COMPLETED');
  });
});

describe('bookingService.verifyAndBook — off-platform prepay hold (#7) + null-amount guard (#14)', () => {
  it('creates an offline PENDING payment when a prepay booking falls off-platform (gateway OFF)', async () => {
    repo.findMasterByUsername.mockResolvedValue(masterFixture({ bookingPaymentMode: 'DEPOSIT', bookingPrepaymentAmount: 20 }));
    repo.findActiveBookingsForDay.mockResolvedValue([]);
    repo.createBooking.mockResolvedValue({
      id: 'b-off', status: 'PENDING', date: FUTURE, startTime: '10:00', endTime: '11:00',
      serviceName: 'Classic Lashes', paymentMode: 'DEPOSIT', prepaymentRequired: true, prepaymentAmount: 20, depositStatus: 'AWAITING',
    } as never);
    mockVerifyOtp.mockResolvedValue(true);
    mockIsConfigured.mockReturnValue(false);

    const res = await bookingService.verifyAndBook(USERNAME, validBook);

    expect(res.redirectUrl).toBeNull();
    expect(repo.createOfflinePayment).toHaveBeenCalledWith(expect.objectContaining({ bookingId: 'b-off', amount: 20, currency: 'GEL' }));
  });

  it('does NOT create an offline payment for a NONE-mode (already CONFIRMED) booking', async () => {
    repo.findMasterByUsername.mockResolvedValue(masterFixture()); // NONE mode
    repo.findActiveBookingsForDay.mockResolvedValue([]);
    repo.createBooking.mockResolvedValue({
      id: 'b-free', status: 'CONFIRMED', date: FUTURE, startTime: '10:00', endTime: '11:00',
      serviceName: 'Classic Lashes', paymentMode: 'NONE', prepaymentRequired: false, prepaymentAmount: null, depositStatus: 'NONE',
    } as never);
    mockVerifyOtp.mockResolvedValue(true);

    await bookingService.verifyAndBook(USERNAME, validBook);
    expect(repo.createOfflinePayment).not.toHaveBeenCalled();
  });

  it('rejects a DEPOSIT booking with no configured amount → PAYMENT_AMOUNT_UNCONFIGURED (no booking created)', async () => {
    repo.findMasterByUsername.mockResolvedValue(masterFixture({ bookingPaymentMode: 'DEPOSIT', bookingPrepaymentAmount: null }));
    repo.findActiveBookingsForDay.mockResolvedValue([]);
    mockVerifyOtp.mockResolvedValue(true);

    await expect(bookingService.verifyAndBook(USERNAME, validBook)).rejects.toMatchObject({ code: 'PAYMENT_AMOUNT_UNCONFIGURED' });
    expect(repo.createBooking).not.toHaveBeenCalled();
  });

  it('rejects a FULL booking when the service has no price → PAYMENT_AMOUNT_UNCONFIGURED', async () => {
    repo.findMasterByUsername.mockResolvedValue(masterFixture({
      bookingPaymentMode: 'FULL',
      services: [{ name: 'Classic Lashes', category: 'lashes', duration: 60 }], // no price
    }));
    repo.findActiveBookingsForDay.mockResolvedValue([]);
    mockVerifyOtp.mockResolvedValue(true);

    await expect(bookingService.verifyAndBook(USERNAME, validBook)).rejects.toMatchObject({ code: 'PAYMENT_AMOUNT_UNCONFIGURED' });
    expect(repo.createBooking).not.toHaveBeenCalled();
  });
});

describe('bookingService.verifyAndBook (Flitt online payment)', () => {
  it('creates a payment and returns the Flitt redirect URL, deferring the master SMS', async () => {
    repo.findMasterByUsername.mockResolvedValue(masterFixture({ bookingPaymentMode: 'FULL', bookingPaymentInfo: null }));
    repo.findActiveBookingsForDay.mockResolvedValue([]);
    repo.createBooking.mockResolvedValue({
      id: 'b-9', status: 'PENDING', date: FUTURE, startTime: '10:00', endTime: '11:00',
      serviceName: 'Classic Lashes', paymentMode: 'FULL', prepaymentRequired: true, prepaymentAmount: 80, depositStatus: 'AWAITING',
    } as never);
    mockVerifyOtp.mockResolvedValue(true);
    mockIsConfigured.mockReturnValue(true);
    repo.createPayment.mockResolvedValue({ id: 'pay-1' } as never);
    mockCreateCheckout.mockResolvedValue('https://pay.flitt.com/checkout/abc');

    const res = await bookingService.verifyAndBook(USERNAME, validBook);

    expect(repo.createPayment).toHaveBeenCalledWith(expect.objectContaining({ bookingId: 'b-9', amount: 80, currency: 'GEL' }));
    expect(mockCreateCheckout).toHaveBeenCalledWith(expect.objectContaining({ orderId: 'pay-1', amountGel: 80 }));
    expect(res.redirectUrl).toBe('https://pay.flitt.com/checkout/abc');
    expect(mockSendSms).not.toHaveBeenCalled(); // master is notified only after the payment is confirmed
  });

  it('falls back to off-platform (no redirect) when the gateway is not configured', async () => {
    repo.findMasterByUsername.mockResolvedValue(masterFixture({ bookingPaymentMode: 'DEPOSIT', bookingPrepaymentAmount: 20 }));
    repo.findActiveBookingsForDay.mockResolvedValue([]);
    repo.createBooking.mockResolvedValue({
      id: 'b-10', status: 'PENDING', date: FUTURE, startTime: '10:00', endTime: '11:00',
      serviceName: 'Classic Lashes', paymentMode: 'DEPOSIT', prepaymentRequired: true, prepaymentAmount: 20, depositStatus: 'AWAITING',
    } as never);
    mockVerifyOtp.mockResolvedValue(true);
    mockIsConfigured.mockReturnValue(false);

    const res = await bookingService.verifyAndBook(USERNAME, validBook);

    expect(res.redirectUrl).toBeNull();
    expect(repo.createPayment).not.toHaveBeenCalled();
    expect(mockSendSms).toHaveBeenCalledTimes(1); // off-platform: master notified now
  });
});

describe('bookingService.handlePaymentCallback', () => {
  const approvedBody = { order_id: 'pay-1', order_status: 'approved', amount: '8000', payment_id: 'flitt-77', signature: 'sig' };
  function paymentFixture(overrides: Record<string, unknown> = {}) {
    return {
      id: 'pay-1', bookingId: 'b-9', amount: 80, currency: 'GEL', status: 'PENDING',
      booking: {
        id: 'b-9', clientPhone: PHONE, date: FUTURE, startTime: '10:00', serviceName: 'Classic Lashes',
        masterProfile: { phone: '+995599111111', user: { phone: '+995599000000' } },
      },
      ...overrides,
    };
  }

  it('rejects a callback with a bad signature', async () => {
    mockVerifyCallback.mockReturnValue(false);
    await expect(bookingService.handlePaymentCallback(approvedBody)).rejects.toMatchObject({ code: 'INVALID_SIGNATURE' });
    expect(repo.findPaymentWithBooking).not.toHaveBeenCalled();
  });

  it('confirms the booking and notifies both parties on an approved payment with matching amount', async () => {
    mockVerifyCallback.mockReturnValue(true);
    mockIsApproved.mockReturnValue(true);
    repo.findPaymentWithBooking.mockResolvedValue(paymentFixture() as never);

    await bookingService.handlePaymentCallback(approvedBody);

    expect(repo.markPaymentPaid).toHaveBeenCalledWith('pay-1', 'b-9', 'flitt-77');
    expect(mockSendSms).toHaveBeenCalledTimes(2); // master + client
  });

  it('is idempotent: ignores a callback for an already-paid payment', async () => {
    mockVerifyCallback.mockReturnValue(true);
    mockIsApproved.mockReturnValue(true);
    repo.findPaymentWithBooking.mockResolvedValue(paymentFixture({ status: 'PAID' }) as never);

    await bookingService.handlePaymentCallback(approvedBody);

    expect(repo.markPaymentPaid).not.toHaveBeenCalled();
  });

  it('treats FAILED as terminal: a late "approved" after a decline does NOT re-confirm', async () => {
    mockVerifyCallback.mockReturnValue(true);
    mockIsApproved.mockReturnValue(true);
    repo.findPaymentWithBooking.mockResolvedValue(paymentFixture({ status: 'FAILED' }) as never);

    await bookingService.handlePaymentCallback(approvedBody);

    expect(repo.markPaymentPaid).not.toHaveBeenCalled();
    expect(repo.markPaymentFailed).not.toHaveBeenCalled();
  });

  it('a reversal/refund on an already-PAID payment is not silently dropped and does not cancel', async () => {
    mockVerifyCallback.mockReturnValue(true);
    mockIsTerminalFailure.mockReturnValue(true); // reversed
    repo.findPaymentWithBooking.mockResolvedValue(paymentFixture({ status: 'PAID' }) as never);

    await bookingService.handlePaymentCallback({ ...approvedBody, order_status: 'reversed' });

    // No auto-cancel of a confirmed+paid booking (refund path is a deliberate TODO).
    expect(repo.markPaymentFailed).not.toHaveBeenCalled();
  });

  it('ignores an approved callback whose currency does not match the payment currency', async () => {
    mockVerifyCallback.mockReturnValue(true);
    mockIsApproved.mockReturnValue(true);
    repo.findPaymentWithBooking.mockResolvedValue(paymentFixture({ currency: 'GEL' }) as never);

    await bookingService.handlePaymentCallback({ ...approvedBody, currency: 'USD' });

    expect(repo.markPaymentPaid).not.toHaveBeenCalled();
    expect(repo.markPaymentFailed).not.toHaveBeenCalled();
  });

  it('cancels the booking on a terminal failure', async () => {
    mockVerifyCallback.mockReturnValue(true);
    mockIsTerminalFailure.mockReturnValue(true);
    repo.findPaymentWithBooking.mockResolvedValue(paymentFixture() as never);

    await bookingService.handlePaymentCallback({ ...approvedBody, order_status: 'declined' });

    expect(repo.markPaymentFailed).toHaveBeenCalledWith('pay-1', 'b-9', true);
    expect(repo.markPaymentPaid).not.toHaveBeenCalled();
  });

  it('does not confirm when the paid amount does not match', async () => {
    mockVerifyCallback.mockReturnValue(true);
    mockIsApproved.mockReturnValue(true);
    repo.findPaymentWithBooking.mockResolvedValue(paymentFixture() as never);

    await bookingService.handlePaymentCallback({ ...approvedBody, amount: '5000' }); // expected 8000

    expect(repo.markPaymentPaid).not.toHaveBeenCalled();
    expect(repo.markPaymentFailed).toHaveBeenCalledWith('pay-1', 'b-9', true);
  });
});
