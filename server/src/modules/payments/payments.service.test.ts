import { describe, expect, it, vi } from 'vitest';
import { createPaymentsService, type PaymentsRepository } from './payments.service.js';

function booking(overrides: Record<string, unknown> = {}) {
  return {
    id: 'booking-1',
    status: 'CONFIRMED',
    date: new Date('2026-07-20T00:00:00.000Z'),
    startTime: '14:00',
    endTime: '15:00',
    clientPhone: '+995555000000',
    clientName: 'Client',
    serviceName: 'Service',
    masterProfileId: 'master-1',
    masterUserId: 'master-user-1',
    paymentChannel: 'FLITT',
    cancellationFeeAmountMinor: 2_000,
    manageTokenExpiresAt: new Date('2026-08-20T00:00:00.000Z'),
    payment: {
      id: 'payment-1',
      provider: 'flitt',
      amountMinor: 8_000,
      refundedAmountMinor: 0,
      currency: 'GEL',
      status: 'PAID',
    },
    existingRefund: null,
    ...overrides,
  };
}

function repository(found = booking()): PaymentsRepository {
  return {
    findBookingByIdForCancellation: vi.fn().mockResolvedValue(found),
    findBookingByManageTokenHash: vi.fn().mockResolvedValue(found),
    prepareCancellation: vi.fn().mockImplementation(async (input) => ({
      created: true,
      refund: input.refundAmountMinor > 0 ? {
        id: 'refund-1',
        reverseId: 'reverse-1',
        amountMinor: input.refundAmountMinor,
      } : null,
    })),
    finishRefund: vi.fn().mockResolvedValue(undefined),
    markRefundProcessing: vi.fn().mockResolvedValue(undefined),
    markRefundFailed: vi.fn().mockResolvedValue(undefined),
    createRefundDebit: vi.fn().mockResolvedValue(undefined),
  };
}

describe('paymentsService.cancelBooking', () => {
  it('master cancellation reverses the complete captured amount', async () => {
    const repo = repository();
    const reverse = vi.fn().mockResolvedValue({
      status: 'SUCCEEDED',
      providerRefundId: 'provider-refund-1',
      reversalAmountMinor: 8_000,
    });
    const service = createPaymentsService({
      repo,
      gateway: { reverse, status: vi.fn() },
      now: () => new Date('2026-07-20T09:00:00.000Z'),
      notify: vi.fn(),
    });

    await expect(service.cancelBooking({
      bookingId: 'booking-1',
      actor: 'MASTER',
      actorUserId: 'master-user-1',
      reason: 'Master unavailable',
    })).resolves.toMatchObject({
      bookingId: 'booking-1',
      refundAmountMinor: 8_000,
      retainedAmountMinor: 0,
      refundStatus: 'SUCCEEDED',
    });

    expect(reverse).toHaveBeenCalledWith(expect.objectContaining({
      orderId: 'payment-1',
      amountMinor: 8_000,
      currency: 'GEL',
      reverseId: 'reverse-1',
    }));
    expect(repo.finishRefund).toHaveBeenCalledWith(expect.objectContaining({
      refundId: 'refund-1',
      paymentId: 'payment-1',
      amountMinor: 8_000,
    }));
  });

  it('late client cancellation refunds only the amount above the deposit', async () => {
    const repo = repository();
    const reverse = vi.fn().mockResolvedValue({ status: 'SUCCEEDED', reversalAmountMinor: 6_000 });
    const service = createPaymentsService({
      repo,
      gateway: { reverse, status: vi.fn() },
      now: () => new Date('2026-07-20T09:00:00.000Z'),
      notify: vi.fn(),
    });

    await expect(service.cancelBooking({
      bookingId: 'booking-1', actor: 'CLIENT', reason: 'Cannot attend',
    })).resolves.toMatchObject({ refundAmountMinor: 6_000, retainedAmountMinor: 2_000 });
  });

  it('records a failed reversal for admin retry without making a duplicate request', async () => {
    const repo = repository();
    const service = createPaymentsService({
      repo,
      gateway: {
        reverse: vi.fn().mockResolvedValue({
          status: 'FAILED', failureCode: '1016', failureMessage: 'Merchant not found', reversalAmountMinor: 0,
        }),
        status: vi.fn(),
      },
      now: () => new Date('2026-07-19T00:00:00.000Z'),
      notify: vi.fn(),
    });

    await expect(service.cancelBooking({
      bookingId: 'booking-1', actor: 'CLIENT', reason: 'Cancel',
    })).resolves.toMatchObject({ refundStatus: 'FAILED' });
    expect(repo.markRefundFailed).toHaveBeenCalledWith('refund-1', '1016', 'Merchant not found');
  });

  it('does not allow another master to mark a booking as no-show', async () => {
    const service = createPaymentsService({
      repo: repository(),
      gateway: { reverse: vi.fn(), status: vi.fn() },
      now: () => new Date('2026-07-20T11:00:00.000Z'),
    });
    await expect(service.cancelBooking({
      bookingId: 'booking-1', actor: 'NO_SHOW', actorUserId: 'different-master', reason: 'No show',
    })).rejects.toMatchObject({ code: 'NOT_OWNER' });
  });

  it('does not allow a no-show before the scheduled appointment begins', async () => {
    const service = createPaymentsService({
      repo: repository(),
      gateway: { reverse: vi.fn(), status: vi.fn() },
      now: () => new Date('2026-07-20T09:59:59.999Z'),
    });
    await expect(service.cancelBooking({
      bookingId: 'booking-1', actor: 'NO_SHOW', actorUserId: 'master-user-1', reason: 'No show',
    })).rejects.toMatchObject({ code: 'NO_SHOW_BEFORE_APPOINTMENT' });
  });

  it('rejects an expired guest management token', async () => {
    const repo = repository(booking({ manageTokenExpiresAt: new Date('2026-07-01T00:00:00.000Z') }));
    const service = createPaymentsService({
      repo,
      gateway: { reverse: vi.fn(), status: vi.fn() },
      now: () => new Date('2026-07-02T00:00:00.000Z'),
      notify: vi.fn(),
    });
    await expect(service.getManagedBooking('token')).rejects.toMatchObject({ code: 'MANAGE_TOKEN_EXPIRED' });
  });
});
