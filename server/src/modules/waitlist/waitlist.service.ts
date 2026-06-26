import { Prisma } from '@prisma/client';
import { logger } from '@/libs/logger.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors/errors.js';
import { sendOtp, verifyOtp, sendSms } from '@/libs/otp.js';
import { waitlistRepo } from './waitlist.repo.js';
import type { JoinInput, MasterListQueryInput, RequestOtpInput } from './waitlist.schemas.js';

interface ServiceOption {
  name: string;
  category?: string;
  price?: number;
}

function mapServices(services: unknown): ServiceOption[] {
  if (!Array.isArray(services)) return [];
  return services.flatMap((s): ServiceOption[] => {
    if (!s || typeof s !== 'object') return [];
    const obj = s as Record<string, unknown>;
    const name = typeof obj.name === 'string' ? obj.name : null;
    if (!name) return [];
    return [
      {
        name,
        ...(typeof obj.category === 'string' ? { category: obj.category } : {}),
        ...(typeof obj.price === 'number' ? { price: obj.price } : {}),
      },
    ];
  });
}

// Normalize an incoming date to a UTC date-only value so it matches the @db.Date column
// and the (masterProfileId, clientPhone, requestedDate) unique triple.
function toDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function endOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

function formatDateGe(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getUTCFullYear()}`;
}

const SMS_MESSAGES = {
  NEW_WAITER: (date: string, service: string | null): string =>
    `Glow.GE: ახალი ჩანაწერი მოლოდინის სიაში. თარიღი ${date}${service ? `, სერვისი ${service}` : ''}.`,
  SLOT_FREED: (date: string): string =>
    `Glow.GE: გათავისუფლდა ადგილი ${date}-ისთვის. დაგვიკავშირდით ჩასაწერად.`,
} as const;

function sanitizeEntry(entry: {
  id: string;
  status: string;
  requestedDate: Date;
  serviceName: string | null;
  preferredTime: string | null;
}) {
  return {
    id: entry.id,
    status: entry.status,
    requestedDate: entry.requestedDate,
    serviceName: entry.serviceName,
    preferredTime: entry.preferredTime,
  };
}

export function createWaitlistService() {
  async function resolveMaster(username: string) {
    const master = await waitlistRepo.findMasterByUsername(username);
    if (!master?.masterProfile) {
      throw new NotFoundError('Master not found', 'MASTER_NOT_FOUND');
    }
    return master;
  }

  function assertServiceValid(services: unknown, serviceName?: string): void {
    if (!serviceName) return;
    const names = mapServices(services).map((s) => s.name);
    if (!names.includes(serviceName)) {
      throw new BadRequestError('Selected service is not offered by this master', 'INVALID_SERVICE');
    }
  }

  return {
    async getPublicMasterServices(username: string) {
      const master = await resolveMaster(username);
      return {
        masterName: master.firstName,
        username: master.username,
        services: mapServices(master.masterProfile?.services),
      };
    },

    // Step 1, send the OTP. No row is written, so a failed verify leaves nothing orphaned.
    async requestJoinOtp(username: string, input: RequestOtpInput) {
      const master = await resolveMaster(username);
      assertServiceValid(master.masterProfile?.services, input.serviceName);

      const { requestId } = await sendOtp(input.clientPhone);
      logger.info({ username }, 'Waitlist OTP requested');
      return { requestId };
    },

    // Step 2, verify the OTP and create/reactivate the entry.
    async verifyAndJoin(username: string, input: JoinInput) {
      await verifyOtp(input.clientPhone, input.otpRequestId, input.code);

      const master = await resolveMaster(username);
      assertServiceValid(master.masterProfile?.services, input.serviceName);

      const masterProfileId = master.masterProfile!.id;
      const requestedDate = toDateOnly(input.requestedDate);

      const existing = await waitlistRepo.findEntryByTriple(
        masterProfileId,
        input.clientPhone,
        requestedDate,
      );
      if (existing && (existing.status === 'WAITING' || existing.status === 'NOTIFIED')) {
        throw new ConflictError('You are already on the waitlist for this date', 'ALREADY_ON_WAITLIST');
      }

      const payload = {
        masterProfileId,
        clientName: input.clientName,
        clientPhone: input.clientPhone,
        requestedDate,
        serviceName: input.serviceName,
        preferredTime: input.preferredTime,
        note: input.note,
        otpRequestId: input.otpRequestId,
        expiresAt: endOfDay(requestedDate),
      };

      let entry;
      try {
        entry = existing
          ? await waitlistRepo.reactivateEntry(existing.id, payload)
          : await waitlistRepo.createEntry(payload);
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          throw new ConflictError('You are already on the waitlist for this date', 'ALREADY_ON_WAITLIST');
        }
        throw err;
      }

      // Notify the master (fire-and-forget), prefer the master profile phone, fall back to the account phone.
      const masterPhone = master.masterProfile?.phone ?? master.phone;
      if (masterPhone) {
        sendSms(
          masterPhone,
          SMS_MESSAGES.NEW_WAITER(formatDateGe(requestedDate), input.serviceName ?? null),
        ).catch(() => {});
      }

      logger.info({ username, entryId: entry.id }, 'Waitlist entry created');
      return sanitizeEntry(entry);
    },

    async listForMaster(userId: string, query: MasterListQueryInput) {
      const profile = await waitlistRepo.findMasterProfileByUserId(userId);
      if (!profile) {
        throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      }
      return waitlistRepo.listByMaster(profile.id, {
        page: query.page,
        limit: query.limit,
        status: query.status,
        date: query.date ? toDateOnly(query.date) : undefined,
      });
    },

    async summaryForMaster(userId: string) {
      const profile = await waitlistRepo.findMasterProfileByUserId(userId);
      if (!profile) {
        throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      }
      const today = toDateOnly(new Date());
      const grouped = await waitlistRepo.aggregateByDate(profile.id, today);

      const byDate = new Map<string, { date: Date; waiting: number; notified: number }>();
      for (const row of grouped) {
        const key = row.requestedDate.toISOString();
        const bucket = byDate.get(key) ?? { date: row.requestedDate, waiting: 0, notified: 0 };
        if (row.status === 'WAITING') bucket.waiting += row._count._all;
        if (row.status === 'NOTIFIED') bucket.notified += row._count._all;
        byDate.set(key, bucket);
      }
      return Array.from(byDate.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    },

    async updateEntryStatus(userId: string, entryId: string, status: string) {
      const profile = await waitlistRepo.findMasterProfileByUserId(userId);
      if (!profile) {
        throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      }

      const entry = await waitlistRepo.findEntryById(entryId);
      if (!entry) {
        throw new NotFoundError('Waitlist entry not found', 'ENTRY_NOT_FOUND');
      }
      if (entry.masterProfileId !== profile.id) {
        throw new ForbiddenError('You do not own this waitlist entry', 'NOT_OWNER');
      }

      const updated = await waitlistRepo.updateStatus(
        entryId,
        status,
        status === 'NOTIFIED' ? { notifiedAt: new Date() } : undefined,
      );

      // When a master marks a waiter NOTIFIED, tell the client a slot opened.
      if (status === 'NOTIFIED') {
        sendSms(
          entry.clientPhone,
          SMS_MESSAGES.SLOT_FREED(formatDateGe(entry.requestedDate)),
        ).catch(() => {});
      }

      return updated;
    },

    // Called by the BullMQ expiry sweep.
    async expireStale(now: Date = new Date()): Promise<number> {
      const ids = await waitlistRepo.findExpiredIds(now);
      const count = await waitlistRepo.bulkExpire(ids);
      if (count > 0) logger.info({ count }, 'Waitlist entries expired');
      return count;
    },
  };
}

export type WaitlistService = ReturnType<typeof createWaitlistService>;
export const waitlistService = createWaitlistService();
