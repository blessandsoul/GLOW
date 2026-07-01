import { describe, it, expect } from 'vitest';
import { tbilisiNow, tbilisiDayKey, isTbilisiTodayOrFuture, TBILISI_OFFSET_MIN } from './tbilisi.js';

// Georgia = UTC+4. These tests pin the wall-clock boundary that the booking/waitlist
// schema refine and computeSlots share, especially the 00:00–04:00 Tbilisi window where
// the local day has advanced past the UTC day.

describe('tbilisi wall-clock helpers', () => {
  it('exposes the +4h offset', () => {
    expect(TBILISI_OFFSET_MIN).toBe(240);
  });

  it('rolls the day forward across the UTC/Tbilisi boundary', () => {
    // 2026-07-01T22:00:00Z is 2026-07-02T02:00 in Tbilisi → local day is the 2nd.
    const at = new Date('2026-07-01T22:00:00.000Z');
    expect(tbilisiDayKey(at)).toBe('2026-07-02');
    expect(tbilisiNow(at)).toEqual({ dayKey: '2026-07-02', minutes: 2 * 60 });
  });

  it('keeps the same day mid-afternoon UTC', () => {
    const at = new Date('2026-07-01T12:00:00.000Z'); // 16:00 Tbilisi
    expect(tbilisiNow(at)).toEqual({ dayKey: '2026-07-01', minutes: 16 * 60 });
  });

  it('rejects a fully-elapsed Tbilisi day during the 00:00–04:00 UTC-lag window', () => {
    // "now" = 2026-07-02T01:00 Tbilisi (2026-07-01T21:00Z). The 1st has fully elapsed
    // locally, so a booking dated the 1st must be rejected even though UTC still reads the 1st.
    const now = new Date('2026-07-01T21:00:00.000Z');
    const july1 = new Date(Date.UTC(2026, 6, 1));
    const july2 = new Date(Date.UTC(2026, 6, 2));
    expect(isTbilisiTodayOrFuture(july1, now)).toBe(false);
    expect(isTbilisiTodayOrFuture(july2, now)).toBe(true);
  });

  it('accepts today and future, rejects a clearly past day', () => {
    const now = new Date('2026-07-01T12:00:00.000Z');
    expect(isTbilisiTodayOrFuture(new Date(Date.UTC(2026, 6, 1)), now)).toBe(true);
    expect(isTbilisiTodayOrFuture(new Date(Date.UTC(2026, 6, 2)), now)).toBe(true);
    expect(isTbilisiTodayOrFuture(new Date(Date.UTC(2026, 5, 30)), now)).toBe(false);
  });
});
