import { describe, expect, it } from 'vitest';
import { groupPayoutCandidates, type EligibleLedgerRow } from './payment-ledger.js';

const master = { user: { firstName: 'Nino', lastName: 'P', email: 'nino@example.com', phone: null } };
const row = (masterProfileId: string, amountMinor: number): EligibleLedgerRow => ({ masterProfileId, amountMinor, masterProfile: master });

describe('groupPayoutCandidates', () => {
  it('nets a refund debit against eligible earnings', () => {
    expect(groupPayoutCandidates([row('m1', 8_000), row('m1', -2_000)]))
      .toMatchObject([{ masterProfileId: 'm1', amountMinor: 6_000, entryCount: 2 }]);
  });

  it('keeps an audited positive adjustment in the payable balance', () => {
    expect(groupPayoutCandidates([row('m1', 5_000), row('m1', 500)])[0]?.amountMinor).toBe(5_500);
  });

  it('does not create a payout candidate for a zero or negative balance', () => {
    expect(groupPayoutCandidates([row('m1', 1_000), row('m1', -1_500)])).toEqual([]);
  });
});
