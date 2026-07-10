import { describe, expect, it } from 'vitest';
import { quoteBookingCancellation } from './payment-policy.js';

const appointmentStart = new Date('2026-07-20T10:00:00.000Z');

describe('quoteBookingCancellation', () => {
  it('refunds a client in full at exactly the 24-hour boundary', () => {
    expect(quoteBookingCancellation({
      actor: 'CLIENT',
      now: new Date('2026-07-19T10:00:00.000Z'),
      appointmentStart,
      paidAmountMinor: 8_000,
      cancellationFeeAmountMinor: 2_000,
    })).toEqual({
      policyCode: 'CLIENT_ON_TIME',
      refundAmountMinor: 8_000,
      retainedAmountMinor: 0,
    });
  });

  it('retains only the deposit amount for a late client cancellation', () => {
    expect(quoteBookingCancellation({
      actor: 'CLIENT',
      now: new Date('2026-07-19T10:00:00.001Z'),
      appointmentStart,
      paidAmountMinor: 8_000,
      cancellationFeeAmountMinor: 2_000,
    })).toEqual({
      policyCode: 'CLIENT_LATE',
      refundAmountMinor: 6_000,
      retainedAmountMinor: 2_000,
    });
  });

  it('refunds nothing when a late cancellation only paid the deposit', () => {
    expect(quoteBookingCancellation({
      actor: 'CLIENT',
      now: new Date('2026-07-19T12:00:00.000Z'),
      appointmentStart,
      paidAmountMinor: 2_000,
      cancellationFeeAmountMinor: 2_000,
    })).toEqual({
      policyCode: 'CLIENT_LATE',
      refundAmountMinor: 0,
      retainedAmountMinor: 2_000,
    });
  });

  it('always refunds a master cancellation in full', () => {
    expect(quoteBookingCancellation({
      actor: 'MASTER',
      now: new Date('2026-07-20T09:59:00.000Z'),
      appointmentStart,
      paidAmountMinor: 8_000,
      cancellationFeeAmountMinor: 2_000,
    })).toEqual({
      policyCode: 'MASTER_CANCELLED',
      refundAmountMinor: 8_000,
      retainedAmountMinor: 0,
    });
  });

  it('always refunds an administrative cancellation in full', () => {
    expect(quoteBookingCancellation({
      actor: 'ADMIN',
      now: new Date('2026-07-20T09:59:00.000Z'),
      appointmentStart,
      paidAmountMinor: 8_000,
      cancellationFeeAmountMinor: 2_000,
    })).toEqual({ policyCode: 'ADMIN_CANCELLED', refundAmountMinor: 8_000, retainedAmountMinor: 0 });
  });

  it('uses the late-cancellation result for a no-show', () => {
    expect(quoteBookingCancellation({
      actor: 'NO_SHOW',
      now: new Date('2026-07-20T11:00:00.000Z'),
      appointmentStart,
      paidAmountMinor: 8_000,
      cancellationFeeAmountMinor: 2_000,
    })).toEqual({
      policyCode: 'NO_SHOW',
      refundAmountMinor: 6_000,
      retainedAmountMinor: 2_000,
    });
  });

  it('never retains or refunds more than the captured amount', () => {
    expect(quoteBookingCancellation({
      actor: 'CLIENT',
      now: new Date('2026-07-20T09:00:00.000Z'),
      appointmentStart,
      paidAmountMinor: 1_000,
      cancellationFeeAmountMinor: 2_000,
    })).toEqual({
      policyCode: 'CLIENT_LATE',
      refundAmountMinor: 0,
      retainedAmountMinor: 1_000,
    });
  });
});
