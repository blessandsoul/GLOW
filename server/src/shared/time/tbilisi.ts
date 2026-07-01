// Tbilisi wall-clock helpers. Georgia is UTC+4 year-round (no DST), so the local
// calendar day is derived from UTC by shifting +4h. Centralized so the booking/waitlist
// schema "today-or-future" refine and the slot generator agree on the exact day boundary
// (previously the schema used a UTC "today" while computeSlots used a Tbilisi "now", so
// during Tbilisi 00:00–04:00 a fully-elapsed local day was still bookable).

// Georgia is UTC+4, expressed in minutes.
export const TBILISI_OFFSET_MIN = 240;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** The Tbilisi wall-clock "now" as a shifted Date whose UTC fields read as local time. */
function tbilisiClock(at: Date = new Date()): Date {
  return new Date(at.getTime() + TBILISI_OFFSET_MIN * 60_000);
}

/** Tbilisi calendar day as an "YYYY-MM-DD" key (matches computeSlots' dayKey). */
export function tbilisiDayKey(at: Date = new Date()): string {
  const g = tbilisiClock(at);
  return `${g.getUTCFullYear()}-${pad(g.getUTCMonth() + 1)}-${pad(g.getUTCDate())}`;
}

/** Current Tbilisi wall-clock: the day key plus minutes-since-local-midnight. */
export function tbilisiNow(at: Date = new Date()): { dayKey: string; minutes: number } {
  const g = tbilisiClock(at);
  return { dayKey: tbilisiDayKey(at), minutes: g.getUTCHours() * 60 + g.getUTCMinutes() };
}

/**
 * True when the given date's calendar day (compared in Tbilisi wall-clock) is today or later.
 * The incoming booking/waitlist date is a date-only value normalized via Date.UTC, so its
 * UTC Y/M/D are the intended calendar day; we compare it against Tbilisi's current day.
 */
export function isTbilisiTodayOrFuture(d: Date, at: Date = new Date()): boolean {
  const dayUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const g = tbilisiClock(at);
  const todayTbilisiUtc = Date.UTC(g.getUTCFullYear(), g.getUTCMonth(), g.getUTCDate());
  return dayUtc >= todayTbilisiUtc;
}
