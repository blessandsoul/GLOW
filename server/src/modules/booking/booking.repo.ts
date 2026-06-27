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
            bookingPrepaymentEnabled: true,
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
};
