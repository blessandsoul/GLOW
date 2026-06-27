import { prisma } from '@/libs/prisma.js';
import type { Prisma } from '@prisma/client';

const ENTRY_SELECT = {
  id: true,
  masterProfileId: true,
  clientName: true,
  clientPhone: true,
  phoneVerified: true,
  requestedDate: true,
  serviceName: true,
  preferredTime: true,
  note: true,
  status: true,
  notifiedAt: true,
  createdAt: true,
} as const;

interface CreateEntryData {
  masterProfileId: string;
  clientName: string;
  clientPhone: string;
  requestedDate: Date;
  serviceName?: string;
  preferredTime?: string;
  note?: string;
  otpRequestId?: string;
  expiresAt: Date;
}

export const waitlistRepo = {
  // Resolve a public master by username (for the share-link flow).
  async findMasterByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        phone: true,
        masterProfile: {
          select: { id: true, services: true, phone: true },
        },
      },
    });
  },

  // Resolve the caller's own master profile (for /me endpoints).
  async findMasterProfileByUserId(userId: string) {
    return prisma.masterProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
  },

  async findEntryByTriple(masterProfileId: string, clientPhone: string, requestedDate: Date) {
    return prisma.waitlistEntry.findUnique({
      where: {
        masterProfileId_clientPhone_requestedDate: {
          masterProfileId,
          clientPhone,
          requestedDate,
        },
      },
      select: { id: true, status: true },
    });
  },

  async createEntry(data: CreateEntryData) {
    return prisma.waitlistEntry.create({
      data: {
        masterProfileId: data.masterProfileId,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        phoneVerified: true,
        requestedDate: data.requestedDate,
        serviceName: data.serviceName,
        preferredTime: data.preferredTime,
        note: data.note,
        otpRequestId: data.otpRequestId,
        expiresAt: data.expiresAt,
        status: 'WAITING',
      },
      select: ENTRY_SELECT,
    });
  },

  async reactivateEntry(id: string, data: CreateEntryData) {
    return prisma.waitlistEntry.update({
      where: { id },
      data: {
        clientName: data.clientName,
        phoneVerified: true,
        serviceName: data.serviceName ?? null,
        preferredTime: data.preferredTime ?? null,
        note: data.note ?? null,
        otpRequestId: data.otpRequestId,
        expiresAt: data.expiresAt,
        notifiedAt: null,
        status: 'WAITING',
      },
      select: ENTRY_SELECT,
    });
  },

  async listByMaster(
    masterProfileId: string,
    opts: { page: number; limit: number; status?: string; date?: Date },
  ) {
    const skip = (opts.page - 1) * opts.limit;
    const where: Prisma.WaitlistEntryWhereInput = { masterProfileId };
    if (opts.status) where.status = opts.status;
    if (opts.date) where.requestedDate = opts.date;

    const [items, totalItems] = await Promise.all([
      prisma.waitlistEntry.findMany({
        where,
        skip,
        take: opts.limit,
        orderBy: [{ requestedDate: 'asc' }, { createdAt: 'asc' }],
        select: ENTRY_SELECT,
      }),
      prisma.waitlistEntry.count({ where }),
    ]);

    return { items, totalItems };
  },

  // Active upcoming entries grouped by date + status (for the dashboard summary).
  async aggregateByDate(masterProfileId: string, from: Date) {
    return prisma.waitlistEntry.groupBy({
      by: ['requestedDate', 'status'],
      where: {
        masterProfileId,
        requestedDate: { gte: from },
        status: { in: ['WAITING', 'NOTIFIED'] },
      },
      _count: { _all: true },
      orderBy: { requestedDate: 'asc' },
    });
  },

  async findEntryById(id: string) {
    return prisma.waitlistEntry.findUnique({
      where: { id },
      select: {
        id: true,
        masterProfileId: true,
        clientName: true,
        clientPhone: true,
        status: true,
        requestedDate: true,
        serviceName: true,
      },
    });
  },

  async updateStatus(id: string, status: string, patch?: { notifiedAt?: Date }) {
    return prisma.waitlistEntry.update({
      where: { id },
      data: { status, ...(patch?.notifiedAt ? { notifiedAt: patch.notifiedAt } : {}) },
      select: ENTRY_SELECT,
    });
  },

  async findExpiredIds(now: Date): Promise<string[]> {
    const rows = await prisma.waitlistEntry.findMany({
      where: {
        status: { in: ['WAITING', 'NOTIFIED'] },
        expiresAt: { lt: now },
      },
      select: { id: true },
      take: 1000,
    });
    return rows.map((r) => r.id);
  },

  async bulkExpire(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const result = await prisma.waitlistEntry.updateMany({
      where: { id: { in: ids } },
      data: { status: 'EXPIRED' },
    });
    return result.count;
  },
};
