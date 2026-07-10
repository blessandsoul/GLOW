export type CancellationActor = 'CLIENT' | 'MASTER' | 'ADMIN' | 'NO_SHOW';

export type CancellationPolicyCode =
  | 'CLIENT_ON_TIME'
  | 'CLIENT_LATE'
  | 'MASTER_CANCELLED'
  | 'ADMIN_CANCELLED'
  | 'NO_SHOW';

export interface CancellationQuoteInput {
  actor: CancellationActor;
  now: Date;
  appointmentStart: Date;
  paidAmountMinor: number;
  cancellationFeeAmountMinor: number;
}

export interface CancellationQuote {
  policyCode: CancellationPolicyCode;
  refundAmountMinor: number;
  retainedAmountMinor: number;
}

const FULL_REFUND_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Pure policy seam shared by client, master, no-show and admin cancellation flows. */
export function quoteBookingCancellation(input: CancellationQuoteInput): CancellationQuote {
  const paidAmountMinor = Math.max(0, Math.trunc(input.paidAmountMinor));
  const retainedAmountMinor = Math.min(
    paidAmountMinor,
    Math.max(0, Math.trunc(input.cancellationFeeAmountMinor)),
  );

  if (input.actor === 'MASTER' || input.actor === 'ADMIN') {
    return {
      policyCode: input.actor === 'MASTER' ? 'MASTER_CANCELLED' : 'ADMIN_CANCELLED',
      refundAmountMinor: paidAmountMinor,
      retainedAmountMinor: 0,
    };
  }

  if (input.actor === 'NO_SHOW') {
    return {
      policyCode: 'NO_SHOW',
      refundAmountMinor: paidAmountMinor - retainedAmountMinor,
      retainedAmountMinor,
    };
  }

  const isOnTime = input.appointmentStart.getTime() - input.now.getTime() >= FULL_REFUND_WINDOW_MS;
  if (isOnTime) {
    return {
      policyCode: 'CLIENT_ON_TIME',
      refundAmountMinor: paidAmountMinor,
      retainedAmountMinor: 0,
    };
  }

  return {
    policyCode: 'CLIENT_LATE',
    refundAmountMinor: paidAmountMinor - retainedAmountMinor,
    retainedAmountMinor,
  };
}
