import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';

// Mock external libs + the repo, we test service logic, not Prisma queries or gosms.ge.
vi.mock('../../libs/logger.js', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

vi.mock('../../libs/otp.js', () => ({
  sendOtp: vi.fn(),
  verifyOtp: vi.fn(),
  sendSms: vi.fn(),
}));

vi.mock('../../shared/rate-limit/otp-throttle.js', () => ({
  assertOtpPhoneAllowed: vi.fn(),
}));

vi.mock('./waitlist.repo.js', () => ({
  waitlistRepo: {
    findMasterByUsername: vi.fn(),
    findMasterProfileByUserId: vi.fn(),
    findEntryByTriple: vi.fn(),
    createEntry: vi.fn(),
    reactivateEntry: vi.fn(),
    listByMaster: vi.fn(),
    aggregateByDate: vi.fn(),
    findEntryById: vi.fn(),
    updateStatus: vi.fn(),
    findExpiredIds: vi.fn(),
    bulkExpire: vi.fn(),
  },
}));

import { waitlistService } from './waitlist.service.js';
import { waitlistRepo } from './waitlist.repo.js';
import { sendOtp, verifyOtp, sendSms } from '../../libs/otp.js';
import { assertOtpPhoneAllowed } from '../../shared/rate-limit/otp-throttle.js';

const repo = vi.mocked(waitlistRepo);
const mockSendOtp = vi.mocked(sendOtp);
const mockVerifyOtp = vi.mocked(verifyOtp);
const mockSendSms = vi.mocked(sendSms);
const mockAssertOtpPhone = vi.mocked(assertOtpPhoneAllowed);

const USERNAME = 'lashqueen';
const PHONE = '+995555123456';
const FUTURE = new Date('2099-07-14T00:00:00.000Z');

function masterFixture() {
  return {
    id: 'user-1',
    firstName: 'Nino',
    lastName: 'B',
    username: USERNAME,
    phone: '+995599000000',
    masterProfile: {
      id: 'mp-1',
      services: [{ name: 'Classic Lashes', category: 'lashes', price: 80 }],
      phone: '+995599111111',
    },
  };
}

function entryFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'entry-1',
    masterProfileId: 'mp-1',
    clientName: 'Mariam',
    clientPhone: PHONE,
    phoneVerified: true,
    requestedDate: FUTURE,
    serviceName: 'Classic Lashes',
    preferredTime: '14:00',
    note: null,
    status: 'WAITING',
    notifiedAt: null,
    createdAt: FUTURE,
    ...overrides,
  };
}

const validJoin = {
  clientName: 'Mariam',
  clientPhone: PHONE,
  requestedDate: FUTURE,
  serviceName: 'Classic Lashes',
  preferredTime: '14:00',
  consent: true as const,
  otpRequestId: 'hash-1',
  code: '123456',
};

beforeEach(() => {
  vi.clearAllMocks();
  // sendSms is fire-and-forget, the service calls `.catch()` on its promise.
  mockSendSms.mockResolvedValue(undefined);
  mockAssertOtpPhone.mockResolvedValue(undefined);
});

describe('waitlistService.requestJoinOtp', () => {
  it('rejects a service the master does not offer', async () => {
    repo.findMasterByUsername.mockResolvedValue(masterFixture());

    await expect(
      waitlistService.requestJoinOtp(USERNAME, {
        clientName: 'Mariam',
        clientPhone: PHONE,
        requestedDate: FUTURE,
        serviceName: 'Nonexistent',
        consent: true,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_SERVICE' });

    expect(mockSendOtp).not.toHaveBeenCalled();
  });

  it('throws when the master is not found', async () => {
    repo.findMasterByUsername.mockResolvedValue(null);

    await expect(
      waitlistService.requestJoinOtp(USERNAME, {
        clientName: 'Mariam',
        clientPhone: PHONE,
        requestedDate: FUTURE,
        consent: true,
      }),
    ).rejects.toMatchObject({ code: 'MASTER_NOT_FOUND' });
  });

  it('sends the OTP and writes NO row', async () => {
    repo.findMasterByUsername.mockResolvedValue(masterFixture());
    mockSendOtp.mockResolvedValue({ requestId: 'hash-1' });

    const result = await waitlistService.requestJoinOtp(USERNAME, {
      clientName: 'Mariam',
      clientPhone: PHONE,
      requestedDate: FUTURE,
      serviceName: 'Classic Lashes',
      consent: true,
    });

    expect(result).toEqual({ requestId: 'hash-1' });
    expect(mockSendOtp).toHaveBeenCalledWith(PHONE);
    expect(repo.createEntry).not.toHaveBeenCalled();
  });
});

describe('waitlistService.verifyAndJoin', () => {
  it('verifies the OTP, creates a WAITING entry, and notifies the master', async () => {
    repo.findMasterByUsername.mockResolvedValue(masterFixture());
    repo.findEntryByTriple.mockResolvedValue(null);
    repo.createEntry.mockResolvedValue(entryFixture());
    mockVerifyOtp.mockResolvedValue(true);

    const result = await waitlistService.verifyAndJoin(USERNAME, validJoin);

    expect(mockVerifyOtp).toHaveBeenCalledWith(PHONE, 'hash-1', '123456');
    expect(repo.createEntry).toHaveBeenCalledWith(
      expect.objectContaining({ masterProfileId: 'mp-1', clientPhone: PHONE }),
    );
    expect(mockSendSms).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ id: 'entry-1', status: 'WAITING' });
    // sanitized, no phone leaked
    expect(result).not.toHaveProperty('clientPhone');
  });

  it('rejects a duplicate active entry', async () => {
    repo.findMasterByUsername.mockResolvedValue(masterFixture());
    repo.findEntryByTriple.mockResolvedValue({ id: 'entry-1', status: 'WAITING' });
    mockVerifyOtp.mockResolvedValue(true);

    await expect(waitlistService.verifyAndJoin(USERNAME, validJoin)).rejects.toMatchObject({
      code: 'ALREADY_ON_WAITLIST',
    });
    expect(repo.createEntry).not.toHaveBeenCalled();
  });

  it('reactivates a previously CANCELLED entry', async () => {
    repo.findMasterByUsername.mockResolvedValue(masterFixture());
    repo.findEntryByTriple.mockResolvedValue({ id: 'entry-9', status: 'CANCELLED' });
    repo.reactivateEntry.mockResolvedValue(entryFixture({ id: 'entry-9' }));
    mockVerifyOtp.mockResolvedValue(true);

    const result = await waitlistService.verifyAndJoin(USERNAME, validJoin);

    expect(repo.reactivateEntry).toHaveBeenCalledWith('entry-9', expect.any(Object));
    expect(repo.createEntry).not.toHaveBeenCalled();
    expect(result.id).toBe('entry-9');
  });

  it('does NOT reactivate a CONVERTED entry (would erase a real booking)', async () => {
    repo.findMasterByUsername.mockResolvedValue(masterFixture());
    repo.findEntryByTriple.mockResolvedValue({ id: 'entry-7', status: 'CONVERTED' });
    mockVerifyOtp.mockResolvedValue(true);

    await expect(waitlistService.verifyAndJoin(USERNAME, validJoin)).rejects.toMatchObject({
      code: 'ALREADY_ON_WAITLIST',
    });
    expect(repo.reactivateEntry).not.toHaveBeenCalled();
    expect(repo.createEntry).not.toHaveBeenCalled();
  });

  it('maps a Prisma unique-constraint race to ALREADY_ON_WAITLIST', async () => {
    repo.findMasterByUsername.mockResolvedValue(masterFixture());
    repo.findEntryByTriple.mockResolvedValue(null);
    repo.createEntry.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    mockVerifyOtp.mockResolvedValue(true);

    await expect(waitlistService.verifyAndJoin(USERNAME, validJoin)).rejects.toMatchObject({
      code: 'ALREADY_ON_WAITLIST',
    });
  });
});

describe('waitlistService.updateEntryStatus', () => {
  it('forbids updating an entry the master does not own', async () => {
    repo.findMasterProfileByUserId.mockResolvedValue({ id: 'mp-1' });
    repo.findEntryById.mockResolvedValue({
      id: 'entry-1',
      masterProfileId: 'OTHER-mp',
      clientName: 'X',
      clientPhone: PHONE,
      status: 'WAITING',
      requestedDate: FUTURE,
      serviceName: null,
    });

    await expect(
      waitlistService.updateEntryStatus('user-1', 'entry-1', 'NOTIFIED'),
    ).rejects.toMatchObject({ code: 'NOT_OWNER' });
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it('sets notifiedAt and SMSes the client on NOTIFIED', async () => {
    repo.findMasterProfileByUserId.mockResolvedValue({ id: 'mp-1' });
    repo.findEntryById.mockResolvedValue({
      id: 'entry-1',
      masterProfileId: 'mp-1',
      clientName: 'Mariam',
      clientPhone: PHONE,
      status: 'WAITING',
      requestedDate: FUTURE,
      serviceName: 'Classic Lashes',
    });
    repo.updateStatus.mockResolvedValue(entryFixture({ status: 'NOTIFIED' }));

    await waitlistService.updateEntryStatus('user-1', 'entry-1', 'NOTIFIED');

    expect(repo.updateStatus).toHaveBeenCalledWith(
      'entry-1',
      'NOTIFIED',
      expect.objectContaining({ notifiedAt: expect.any(Date) }),
    );
    expect(mockSendSms).toHaveBeenCalledWith(PHONE, expect.stringContaining('Glow.GE'));
  });

  function ownEntry(status: string) {
    repo.findMasterProfileByUserId.mockResolvedValue({ id: 'mp-1' });
    repo.findEntryById.mockResolvedValue({
      id: 'entry-1', masterProfileId: 'mp-1', clientName: 'Mariam',
      clientPhone: PHONE, status, requestedDate: FUTURE, serviceName: 'Classic Lashes',
    });
  }

  it('FORBIDS reviving a terminal CANCELLED entry → ILLEGAL_STATUS_TRANSITION', async () => {
    ownEntry('CANCELLED');
    await expect(waitlistService.updateEntryStatus('user-1', 'entry-1', 'CONVERTED')).rejects.toMatchObject({ code: 'ILLEGAL_STATUS_TRANSITION' });
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it('FORBIDS reverting a CONVERTED entry (would erase a real booking)', async () => {
    ownEntry('CONVERTED');
    await expect(waitlistService.updateEntryStatus('user-1', 'entry-1', 'CANCELLED')).rejects.toMatchObject({ code: 'ILLEGAL_STATUS_TRANSITION' });
  });

  it('FORBIDS reviving an EXPIRED entry via the status path', async () => {
    ownEntry('EXPIRED');
    await expect(waitlistService.updateEntryStatus('user-1', 'entry-1', 'NOTIFIED')).rejects.toMatchObject({ code: 'ILLEGAL_STATUS_TRANSITION' });
  });

  it('rejects a no-op transition (same status) → STATUS_UNCHANGED', async () => {
    ownEntry('WAITING');
    await expect(waitlistService.updateEntryStatus('user-1', 'entry-1', 'WAITING' as never)).rejects.toMatchObject({ code: 'STATUS_UNCHANGED' });
  });

  it('allows the legal WAITING → CONVERTED move', async () => {
    ownEntry('WAITING');
    repo.updateStatus.mockResolvedValue(entryFixture({ status: 'CONVERTED' }));
    await waitlistService.updateEntryStatus('user-1', 'entry-1', 'CONVERTED');
    expect(repo.updateStatus).toHaveBeenCalledWith('entry-1', 'CONVERTED', undefined);
  });

  it('allows NOTIFIED → CANCELLED but FORBIDS NOTIFIED → WAITING', async () => {
    ownEntry('NOTIFIED');
    repo.updateStatus.mockResolvedValue(entryFixture({ status: 'CANCELLED' }));
    await waitlistService.updateEntryStatus('user-1', 'entry-1', 'CANCELLED');
    expect(repo.updateStatus).toHaveBeenCalledWith('entry-1', 'CANCELLED', undefined);

    ownEntry('NOTIFIED');
    await expect(waitlistService.updateEntryStatus('user-1', 'entry-1', 'WAITING' as never)).rejects.toMatchObject({ code: 'ILLEGAL_STATUS_TRANSITION' });
  });
});

describe('waitlistService.expireStale', () => {
  it('expires the rows the repo flags', async () => {
    repo.findExpiredIds.mockResolvedValue(['a', 'b']);
    repo.bulkExpire.mockResolvedValue(2);

    const count = await waitlistService.expireStale(FUTURE);

    expect(repo.bulkExpire).toHaveBeenCalledWith(['a', 'b']);
    expect(count).toBe(2);
  });
});
