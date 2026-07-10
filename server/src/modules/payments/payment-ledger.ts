export interface EligibleLedgerRow {
  masterProfileId: string;
  amountMinor: number;
  masterProfile: {
    user: { firstName: string; lastName: string; email: string; phone: string | null };
  };
}

export interface PayoutCandidate {
  masterProfileId: string;
  master: EligibleLedgerRow['masterProfile']['user'];
  amountMinor: number;
  entryCount: number;
}

/** Nets earnings, refund debits and adjustments; non-positive masters cannot enter a payout. */
export function groupPayoutCandidates(rows: EligibleLedgerRow[]): PayoutCandidate[] {
  const grouped = new Map<string, PayoutCandidate>();
  for (const row of rows) {
    const current = grouped.get(row.masterProfileId) ?? {
      masterProfileId: row.masterProfileId,
      master: row.masterProfile.user,
      amountMinor: 0,
      entryCount: 0,
    };
    current.amountMinor += row.amountMinor;
    current.entryCount += 1;
    grouped.set(row.masterProfileId, current);
  }
  return [...grouped.values()].filter((row) => row.amountMinor > 0);
}
