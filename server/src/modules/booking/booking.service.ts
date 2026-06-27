import { Prisma } from '@prisma/client';
import { logger } from '@/libs/logger.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors/errors.js';
import { sendOtp, verifyOtp, sendSms } from '@/libs/otp.js';
import { bookingRepo } from './booking.repo.js';
import type { BookInput, MasterListQueryInput, RequestOtpInput } from './booking.schemas.js';

// Georgia is UTC+4 (no DST). "HH:MM" working hours are local Tbilisi time.
const TZ_OFFSET_MIN = 240;
const DEFAULT_DURATION = 60;

type WeekdayKey =
  | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
const WEEKDAYS: WeekdayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

interface ServiceOption {
  name: string;
  durationMinutes: number;
  price?: number;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

function dateKey(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function toDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// Current Tbilisi wall-clock as a date key + minutes-since-midnight.
function tbilisiNow(): { dayKey: string; minutes: number } {
  const g = new Date(Date.now() + TZ_OFFSET_MIN * 60_000);
  return { dayKey: dateKey(g), minutes: g.getUTCHours() * 60 + g.getUTCMinutes() };
}

function mapServices(services: unknown): ServiceOption[] {
  if (!Array.isArray(services)) return [];
  return services.flatMap((s): ServiceOption[] => {
    if (!s || typeof s !== 'object') return [];
    const obj = s as Record<string, unknown>;
    const name = typeof obj.name === 'string' ? obj.name : null;
    if (!name) return [];
    const duration = typeof obj.duration === 'number' && obj.duration >= 5 ? obj.duration : DEFAULT_DURATION;
    return [{ name, durationMinutes: duration, ...(typeof obj.price === 'number' ? { price: obj.price } : {}) }];
  });
}

type DayInterval = { open: string; close: string };

function dayIntervals(workingHours: unknown, key: WeekdayKey): DayInterval[] {
  if (!workingHours || typeof workingHours !== 'object') return [];
  const day = (workingHours as Record<string, unknown>)[key];
  if (!Array.isArray(day)) return [];
  return day.flatMap((iv): DayInterval[] => {
    if (!iv || typeof iv !== 'object') return [];
    const o = iv as Record<string, unknown>;
    return typeof o.open === 'string' && typeof o.close === 'string'
      ? [{ open: o.open, close: o.close }]
      : [];
  });
}

/**
 * Pure slot generator (unit-tested). Steps each working interval by the service
 * duration, drops candidates that overflow the interval, overlap a busy range,
 * or are already past (when the day is today in Tbilisi).
 */
export function computeSlots(opts: {
  intervals: DayInterval[];
  durationMinutes: number;
  busy: { startTime: string; endTime: string }[];
  isToday: boolean;
  nowMinutes: number;
}): string[] {
  const { intervals, durationMinutes, busy, isToday, nowMinutes } = opts;
  const busyRanges = busy.map((b) => [toMinutes(b.startTime), toMinutes(b.endTime)] as const);
  const slots: string[] = [];

  for (const iv of intervals) {
    const open = toMinutes(iv.open);
    const close = toMinutes(iv.close);
    for (let start = open; start + durationMinutes <= close; start += durationMinutes) {
      const end = start + durationMinutes;
      if (isToday && start <= nowMinutes) continue;
      const overlaps = busyRanges.some(([bs, be]) => start < be && end > bs);
      if (overlaps) continue;
      slots.push(toHHMM(start));
    }
  }
  return slots;
}

export function createBookingService() {
  async function resolveMaster(username: string) {
    const master = await bookingRepo.findMasterByUsername(username);
    if (!master?.masterProfile) {
      throw new NotFoundError('Master not found', 'MASTER_NOT_FOUND');
    }
    if (!master.masterProfile.bookingEnabled) {
      throw new BadRequestError('This master does not accept online bookings', 'BOOKING_DISABLED');
    }
    return master;
  }

  function findService(services: unknown, serviceName: string): ServiceOption {
    const svc = mapServices(services).find((s) => s.name === serviceName);
    if (!svc) {
      throw new BadRequestError('Selected service is not offered by this master', 'INVALID_SERVICE');
    }
    return svc;
  }

  // Validates the slot is bookable, returns the computed end time + duration.
  async function assertSlotBookable(
    masterProfileId: string,
    workingHours: unknown,
    services: unknown,
    serviceName: string,
    date: Date,
    startTime: string,
  ): Promise<{ durationMinutes: number; endTime: string }> {
    const svc = findService(services, serviceName);
    const dateOnly = toDateOnly(date);
    const key = WEEKDAYS[dateOnly.getUTCDay()];
    const intervals = dayIntervals(workingHours, key);
    const busy = await bookingRepo.findActiveBookingsForDay(masterProfileId, dateOnly);
    const now = tbilisiNow();
    const free = computeSlots({
      intervals,
      durationMinutes: svc.durationMinutes,
      busy,
      isToday: dateKey(dateOnly) === now.dayKey,
      nowMinutes: now.minutes,
    });
    if (!free.includes(startTime)) {
      throw new ConflictError('That slot is no longer available', 'SLOT_UNAVAILABLE');
    }
    return { durationMinutes: svc.durationMinutes, endTime: toHHMM(toMinutes(startTime) + svc.durationMinutes) };
  }

  return {
    async getServices(username: string) {
      const master = await resolveMaster(username);
      return {
        masterName: master.firstName,
        username: master.username,
        prepaymentEnabled: master.masterProfile!.bookingPrepaymentEnabled,
        prepaymentAmount: master.masterProfile!.bookingPrepaymentAmount,
        paymentInfo: master.masterProfile!.bookingPaymentInfo,
        services: mapServices(master.masterProfile!.services),
      };
    },

    async getSlots(username: string, date: Date, serviceName: string) {
      const master = await resolveMaster(username);
      const svc = findService(master.masterProfile!.services, serviceName);
      const dateOnly = toDateOnly(date);
      const key = WEEKDAYS[dateOnly.getUTCDay()];
      const intervals = dayIntervals(master.masterProfile!.workingHours, key);
      const busy = await bookingRepo.findActiveBookingsForDay(master.masterProfile!.id, dateOnly);
      const now = tbilisiNow();
      const slots = computeSlots({
        intervals,
        durationMinutes: svc.durationMinutes,
        busy,
        isToday: dateKey(dateOnly) === now.dayKey,
        nowMinutes: now.minutes,
      });
      return { slots, dayClosed: intervals.length === 0, durationMinutes: svc.durationMinutes };
    },

    async requestBookOtp(username: string, input: RequestOtpInput) {
      const master = await resolveMaster(username);
      await assertSlotBookable(
        master.masterProfile!.id,
        master.masterProfile!.workingHours,
        master.masterProfile!.services,
        input.serviceName,
        input.date,
        input.startTime,
      );
      const { requestId } = await sendOtp(input.clientPhone);
      logger.info({ username }, 'Booking OTP requested');
      return { requestId };
    },

    async verifyAndBook(username: string, input: BookInput) {
      const master = await resolveMaster(username);
      const mp = master.masterProfile!;
      const { durationMinutes, endTime } = await assertSlotBookable(
        mp.id,
        mp.workingHours,
        mp.services,
        input.serviceName,
        input.date,
        input.startTime,
      );

      await verifyOtp(input.clientPhone, input.otpRequestId, input.code);

      const prepay = mp.bookingPrepaymentEnabled;
      const date = toDateOnly(input.date);

      let booking;
      try {
        booking = await bookingRepo.createBooking({
          masterProfileId: mp.id,
          clientName: input.clientName,
          clientPhone: input.clientPhone,
          serviceName: input.serviceName,
          durationMinutes,
          date,
          startTime: input.startTime,
          endTime,
          prepaymentRequired: prepay,
          prepaymentAmount: prepay ? mp.bookingPrepaymentAmount : null,
          depositStatus: prepay ? 'AWAITING' : 'NONE',
          status: prepay ? 'PENDING' : 'CONFIRMED',
          otpRequestId: input.otpRequestId,
          note: input.note,
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          throw new ConflictError('That slot was just taken', 'SLOT_TAKEN');
        }
        throw err;
      }

      const masterPhone = mp.phone ?? master.phone;
      if (masterPhone) {
        sendSms(
          masterPhone,
          `Glow.GE: ახალი ჯავშანი ${dateKey(date)} ${input.startTime}, ${input.serviceName}.`,
        ).catch(() => {});
      }

      logger.info({ username, bookingId: booking.id }, 'Booking created');
      return {
        id: booking.id,
        status: booking.status,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        serviceName: booking.serviceName,
        prepaymentRequired: booking.prepaymentRequired,
        prepaymentAmount: booking.prepaymentAmount,
        depositStatus: booking.depositStatus,
        paymentInfo: prepay ? mp.bookingPaymentInfo : null,
      };
    },

    async listForMaster(userId: string, query: MasterListQueryInput) {
      const profile = await bookingRepo.findMasterProfileByUserId(userId);
      if (!profile) throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      return bookingRepo.listByMaster(profile.id, {
        page: query.page,
        limit: query.limit,
        status: query.status,
        date: query.date ? toDateOnly(query.date) : undefined,
      });
    },

    async summaryForMaster(userId: string) {
      const profile = await bookingRepo.findMasterProfileByUserId(userId);
      if (!profile) throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      const grouped = await bookingRepo.aggregateByDate(profile.id, toDateOnly(new Date()));
      const byDate = new Map<string, { date: Date; pending: number; confirmed: number }>();
      for (const row of grouped) {
        const k = row.date.toISOString();
        const b = byDate.get(k) ?? { date: row.date, pending: 0, confirmed: 0 };
        if (row.status === 'PENDING') b.pending += row._count._all;
        if (row.status === 'CONFIRMED') b.confirmed += row._count._all;
        byDate.set(k, b);
      }
      return Array.from(byDate.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    },

    async updateStatus(userId: string, bookingId: string, status: string) {
      const profile = await bookingRepo.findMasterProfileByUserId(userId);
      if (!profile) throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      const booking = await bookingRepo.findById(bookingId);
      if (!booking) throw new NotFoundError('Booking not found', 'BOOKING_NOT_FOUND');
      if (booking.masterProfileId !== profile.id) {
        throw new ForbiddenError('You do not own this booking', 'NOT_OWNER');
      }
      const updated = await bookingRepo.updateStatus(bookingId, status);
      if (status === 'CONFIRMED' || status === 'CANCELLED') {
        const msg =
          status === 'CONFIRMED'
            ? `Glow.GE: თქვენი ჯავშანი დადასტურდა ${dateKey(booking.date)} ${booking.startTime}.`
            : `Glow.GE: თქვენი ჯავშანი გაუქმდა ${dateKey(booking.date)} ${booking.startTime}.`;
        sendSms(booking.clientPhone, msg).catch(() => {});
      }
      return updated;
    },

    async markDepositReceived(userId: string, bookingId: string) {
      const profile = await bookingRepo.findMasterProfileByUserId(userId);
      if (!profile) throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      const booking = await bookingRepo.findById(bookingId);
      if (!booking) throw new NotFoundError('Booking not found', 'BOOKING_NOT_FOUND');
      if (booking.masterProfileId !== profile.id) {
        throw new ForbiddenError('You do not own this booking', 'NOT_OWNER');
      }
      const updated = await bookingRepo.setDepositReceived(bookingId);
      sendSms(
        booking.clientPhone,
        `Glow.GE: დეპოზიტი მიღებულია, ჯავშანი დადასტურდა ${dateKey(booking.date)} ${booking.startTime}.`,
      ).catch(() => {});
      return updated;
    },
  };
}

export type BookingService = ReturnType<typeof createBookingService>;
export const bookingService = createBookingService();
