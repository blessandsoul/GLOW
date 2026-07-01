import { prisma } from '@/libs/prisma.js';
import type { Prisma } from '@prisma/client';

const BOOKING_SELECT = {
  id: true,
  masterProfileId: true,
  clientName: true,
  clientPhone: true,
  phoneVerified: true,
  serviceName: true,
  durationMinutes: true,
  date: true,
  startTime: true,
  endTime: true,
  status: true,
  paymentMode: true,
  prepaymentRequired: true,
  prepaymentAmount: true,
  depositStatus: true,
  note: true,
  createdAt: true,
} as const;

interface CreateBookingData {
  masterProfileId: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  durationMinutes: number;
  date: Date;
  startTime: string;
  endTime: string;
  paymentMode: string;
  prepaymentRequired: boolean;
  prepaymentAmount: number | null;
  depositStatus: string;
  status: string;
  otpRequestId?: string;
  note?: string;
}

export const bookingRepo = {
  async findMasterByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        firstName: true,
        username: true,
        phone: true,
        masterProfile: {
          select: {
            id: true,
            phone: true,
            services: true,
            workingHours: true,
            bookingEnabled: true,
            bookingPaymentMode: true,
            bookingPrepaymentAmount: true,
            bookingPaymentInfo: true,
          },
        },
      },
    });
  },

  async findMasterProfileByUserId(userId: string) {
    return prisma.masterProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
  },

  // Active bookings on a given day (occupy the slot grid).
  async findActiveBookingsForDay(masterProfileId: string, date: Date) {
    return prisma.booking.findMany({
      where: {
        masterProfileId,
        date,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: { startTime: true, endTime: true },
    });
  },

  async findByTriple(masterProfileId: string, date: Date, startTime: string) {
    return prisma.booking.findUnique({
      where: { masterProfileId_date_startTime: { masterProfileId, date, startTime } },
      select: { id: true, status: true },
    });
  },

  async createBooking(data: CreateBookingData) {
    return prisma.booking.create({
      data: {
        masterProfileId: data.masterProfileId,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        phoneVerified: true,
        serviceName: data.serviceName,
        durationMinutes: data.durationMinutes,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        status: data.status,
        paymentMode: data.paymentMode,
        prepaymentRequired: data.prepaymentRequired,
        prepaymentAmount: data.prepaymentAmount,
        depositStatus: data.depositStatus,
        otpRequestId: data.otpRequestId,
        note: data.note,
      },
      select: BOOKING_SELECT,
    });
  },

  async listByMaster(
    masterProfileId: string,
    opts: { page: number; limit: number; status?: string; date?: Date },
  ) {
    const skip = (opts.page - 1) * opts.limit;
    const where: Prisma.BookingWhereInput = { masterProfileId };
    if (opts.status) where.status = opts.status;
    if (opts.date) where.date = opts.date;

    const [items, totalItems] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: opts.limit,
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        select: BOOKING_SELECT,
      }),
      prisma.booking.count({ where }),
    ]);

    return { items, totalItems };
  },

  async aggregateByDate(masterProfileId: string, from: Date) {
    return prisma.booking.groupBy({
      by: ['date', 'status'],
      where: {
        masterProfileId,
        date: { gte: from },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      _count: { _all: true },
      orderBy: { date: 'asc' },
    });
  },

  async findById(id: string) {
    return prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        masterProfileId: true,
        clientName: true,
        clientPhone: true,
        status: true,
        paymentMode: true,
        depositStatus: true,
        date: true,
        startTime: true,
        serviceName: true,
      },
    });
  },

  async updateStatus(id: string, status: string) {
    return prisma.booking.update({
      where: { id },
      data: { status },
      select: BOOKING_SELECT,
    });
  },

  async setDepositReceived(id: string) {
    return prisma.booking.update({
      where: { id },
      data: { depositStatus: 'RECEIVED', status: 'CONFIRMED' },
      select: BOOKING_SELECT,
    });
  },

  // ── Flitt payment ────────────────────────────────────────────────
  async createPayment(data: { bookingId: string; amount: number; currency: string }) {
    return prisma.payment.create({
      data: { bookingId: data.bookingId, amount: data.amount, currency: data.currency },
      select: { id: true },
    });
  },

  // Off-platform hold: a PENDING Payment with provider 'offline' anchors a prepay booking
  // that never reached the gateway (unconfigured or checkout failed) so the stale-PENDING
  // sweep has a timestamped row to age out. Booking-Payment is 1:1 (Payment.bookingId is
  // @unique); if a Flitt payment already exists this is a no-op-safe upsert.
  async createOfflinePayment(data: { bookingId: string; amount: number; currency: string }) {
    return prisma.payment.upsert({
      where: { bookingId: data.bookingId },
      create: {
        bookingId: data.bookingId,
        amount: data.amount,
        currency: data.currency,
        provider: 'offline',
        status: 'PENDING',
      },
      update: {},
      select: { id: true },
    });
  },

  async findPaymentWithBooking(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      select: {
        id: true,
        bookingId: true,
        amount: true,
        currency: true,
        status: true,
        booking: {
          select: {
            id: true,
            clientPhone: true,
            date: true,
            startTime: true,
            serviceName: true,
            masterProfile: { select: { phone: true, user: { select: { phone: true } } } },
          },
        },
      },
    });
  },

  // The Payment update is scoped to a still-PENDING row (updateMany + WHERE status), so a
  // duplicate/out-of-order 'approved' callback that raced past the service's read-check
  // flips exactly zero rows and skips the booking write — closing the read-then-write
  // idempotency race. The booking is confirmed only when the payment actually transitioned
  // AND the booking is still PENDING (so a late 'approved' can't resurrect a CANCELLED one).
  async markPaymentPaid(paymentId: string, bookingId: string, flittPaymentId: string | null) {
    await prisma.$transaction(async (tx) => {
      const res = await tx.payment.updateMany({
        where: { id: paymentId, status: 'PENDING' },
        data: { status: 'PAID', flittPaymentId },
      });
      if (res.count === 0) return; // already terminal — nothing to confirm
      await tx.booking.updateMany({
        where: { id: bookingId, status: 'PENDING' },
        data: { status: 'CONFIRMED', depositStatus: 'RECEIVED' },
      });
    });
  },

  async markPaymentFailed(paymentId: string, bookingId: string, cancelBooking: boolean) {
    await prisma.$transaction(async (tx) => {
      const res = await tx.payment.updateMany({
        where: { id: paymentId, status: 'PENDING' },
        data: { status: 'FAILED' },
      });
      if (res.count === 0) return; // already terminal — do not touch the booking
      if (cancelBooking) {
        // Only cancel a still-PENDING booking: never flip a CONFIRMED/COMPLETED one.
        await tx.booking.updateMany({
          where: { id: bookingId, status: 'PENDING' },
          data: { status: 'CANCELLED' },
        });
      }
    });
  },
};
