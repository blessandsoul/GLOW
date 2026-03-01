import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted so mocks are available when vi.mock factories run (hoisted above imports)
const { mockRedis, mockPrismaUser } = vi.hoisted(() => ({
  mockRedis: {
    get: vi.fn(),
    ttl: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
  },
  mockPrismaUser: {
    findUnique: vi.fn(),
  },
}));

vi.mock('@/libs/redis.js', () => ({ redis: mockRedis }));
vi.mock('@/libs/prisma.js', () => ({ prisma: { user: mockPrismaUser } }));

import { getDailyUsage, checkDailyLimit, incrementDailyUsage, isLaunchMode } from './launch-mode.js';
import { ForbiddenError } from '@/shared/errors/errors.js';

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── isLaunchMode ───────────────────────────────────────────────
describe('isLaunchMode', () => {
  it('should return true when LAUNCH_MODE env is true', () => {
    // Setup file sets LAUNCH_MODE=true
    expect(isLaunchMode()).toBe(true);
  });
});

// ─── getDailyUsage ──────────────────────────────────────────────
describe('getDailyUsage', () => {
  const userId = 'user-123';

  it('should return base limit when no referral bonus', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockRedis.ttl.mockResolvedValue(-2);

    const result = await getDailyUsage(userId, 0);

    expect(result.used).toBe(0);
    expect(result.limit).toBe(5); // base LAUNCH_DAILY_LIMIT
    expect(result.resetsAt).toBeDefined();
  });

  it('should return personalized limit with referral bonus', async () => {
    mockRedis.get.mockResolvedValue('2');
    mockRedis.ttl.mockResolvedValue(3600);

    const result = await getDailyUsage(userId, 6);

    expect(result.used).toBe(2);
    expect(result.limit).toBe(11); // 5 base + 6 bonus
  });

  it('should fetch referral bonus from DB when not provided', async () => {
    mockRedis.get.mockResolvedValue('1');
    mockRedis.ttl.mockResolvedValue(7200);
    mockPrismaUser.findUnique.mockResolvedValue({ referralBonus: 9 });

    const result = await getDailyUsage(userId);

    expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
      where: { id: userId },
      select: { referralBonus: true },
    });
    expect(result.limit).toBe(14); // 5 + 9
  });

  it('should default to 0 bonus when user not found in DB', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockRedis.ttl.mockResolvedValue(-2);
    mockPrismaUser.findUnique.mockResolvedValue(null);

    const result = await getDailyUsage(userId);

    expect(result.limit).toBe(5); // 5 + 0
  });

  it('should heal orphaned keys (TTL = -1)', async () => {
    mockRedis.get.mockResolvedValue('3');
    mockRedis.ttl.mockResolvedValue(-1); // key exists but no TTL

    await getDailyUsage(userId, 0);

    expect(mockRedis.expire).toHaveBeenCalledWith('launch_daily:user-123', 86400);
  });
});

// ─── checkDailyLimit ────────────────────────────────────────────
describe('checkDailyLimit', () => {
  const userId = 'user-123';

  it('should not throw when usage is under base limit (no bonus)', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ referralBonus: 0 });
    mockRedis.get.mockResolvedValue('3'); // 3 used out of 5
    mockRedis.ttl.mockResolvedValue(3600);

    await expect(checkDailyLimit(userId)).resolves.toBeUndefined();
  });

  it('should throw ForbiddenError when usage equals base limit', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ referralBonus: 0 });
    mockRedis.get.mockResolvedValue('5'); // 5 used, limit is 5
    mockRedis.ttl.mockResolvedValue(3600);

    await expect(checkDailyLimit(userId)).rejects.toThrow(ForbiddenError);
  });

  it('should throw ForbiddenError when usage exceeds limit', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ referralBonus: 0 });
    mockRedis.get.mockResolvedValue('7');
    mockRedis.ttl.mockResolvedValue(3600);

    await expect(checkDailyLimit(userId)).rejects.toThrow(ForbiddenError);
  });

  it('should allow more usage when user has referral bonus', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ referralBonus: 3 });
    mockRedis.get.mockResolvedValue('7'); // 7 used, limit is 5 + 3 = 8
    mockRedis.ttl.mockResolvedValue(3600);

    await expect(checkDailyLimit(userId)).resolves.toBeUndefined();
  });

  it('should throw when usage reaches bonused limit', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ referralBonus: 3 });
    mockRedis.get.mockResolvedValue('8'); // 8 used, limit is 5 + 3 = 8
    mockRedis.ttl.mockResolvedValue(3600);

    await expect(checkDailyLimit(userId)).rejects.toThrow(ForbiddenError);
  });

  it('should include actual limit in error message', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ referralBonus: 6 });
    mockRedis.get.mockResolvedValue('11'); // 11 used, limit is 5 + 6 = 11
    mockRedis.ttl.mockResolvedValue(3600);

    try {
      await checkDailyLimit(userId);
      expect.fail('Should have thrown');
    } catch (err) {
      expect((err as ForbiddenError).message).toContain('(11)');
    }
  });
});

// ─── incrementDailyUsage ────────────────────────────────────────
describe('incrementDailyUsage', () => {
  const userId = 'user-123';

  it('should increment counter and return personalized limit', async () => {
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.ttl.mockResolvedValue(-1); // new key, no TTL yet

    const result = await incrementDailyUsage(userId, 3);

    expect(mockRedis.incr).toHaveBeenCalledWith('launch_daily:user-123');
    expect(result.used).toBe(1);
    expect(result.limit).toBe(8); // 5 + 3
  });

  it('should set TTL when key has no expiry', async () => {
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.ttl.mockResolvedValue(-1);

    await incrementDailyUsage(userId, 0);

    expect(mockRedis.expire).toHaveBeenCalledWith('launch_daily:user-123', 86400);
  });

  it('should not reset TTL when key already has one', async () => {
    mockRedis.incr.mockResolvedValue(4);
    mockRedis.ttl.mockResolvedValue(50000);

    await incrementDailyUsage(userId, 0);

    expect(mockRedis.expire).not.toHaveBeenCalled();
  });

  it('should fetch bonus from DB when not provided', async () => {
    mockRedis.incr.mockResolvedValue(2);
    mockRedis.ttl.mockResolvedValue(3600);
    mockPrismaUser.findUnique.mockResolvedValue({ referralBonus: 12 });

    const result = await incrementDailyUsage(userId);

    expect(result.limit).toBe(17); // 5 + 12
  });
});
