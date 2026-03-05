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
    update: vi.fn(),
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

  it('should return base limit and zero bonus when no referral bonus', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockRedis.ttl.mockResolvedValue(-2);
    mockPrismaUser.findUnique.mockResolvedValue({ referralBonus: 0 });

    const result = await getDailyUsage(userId);

    expect(result.used).toBe(0);
    expect(result.limit).toBe(5); // base LAUNCH_DAILY_LIMIT
    expect(result.bonusRemaining).toBe(0);
    expect(result.resetsAt).toBeDefined();
  });

  it('should return base limit with bonusRemaining from DB', async () => {
    mockRedis.get.mockResolvedValue('2');
    mockRedis.ttl.mockResolvedValue(3600);
    mockPrismaUser.findUnique.mockResolvedValue({ referralBonus: 6 });

    const result = await getDailyUsage(userId);

    expect(result.used).toBe(2);
    expect(result.limit).toBe(5); // base only, no bonus added
    expect(result.bonusRemaining).toBe(6);
  });

  it('should fetch referral bonus from DB', async () => {
    mockRedis.get.mockResolvedValue('1');
    mockRedis.ttl.mockResolvedValue(7200);
    mockPrismaUser.findUnique.mockResolvedValue({ referralBonus: 9 });

    const result = await getDailyUsage(userId);

    expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
      where: { id: userId },
      select: { referralBonus: true },
    });
    expect(result.limit).toBe(5); // base only
    expect(result.bonusRemaining).toBe(9);
  });

  it('should default to 0 bonus when user not found in DB', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockRedis.ttl.mockResolvedValue(-2);
    mockPrismaUser.findUnique.mockResolvedValue(null);

    const result = await getDailyUsage(userId);

    expect(result.limit).toBe(5);
    expect(result.bonusRemaining).toBe(0);
  });

  it('should heal orphaned keys (TTL = -1)', async () => {
    mockRedis.get.mockResolvedValue('3');
    mockRedis.ttl.mockResolvedValue(-1); // key exists but no TTL
    mockPrismaUser.findUnique.mockResolvedValue({ referralBonus: 0 });

    await getDailyUsage(userId);

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

  it('should throw ForbiddenError when usage equals base limit and no bonus', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ referralBonus: 0 });
    mockRedis.get.mockResolvedValue('5'); // 5 used, limit is 5, no bonus
    mockRedis.ttl.mockResolvedValue(3600);

    await expect(checkDailyLimit(userId)).rejects.toThrow(ForbiddenError);
  });

  it('should throw ForbiddenError when usage exceeds limit and no bonus', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ referralBonus: 0 });
    mockRedis.get.mockResolvedValue('7');
    mockRedis.ttl.mockResolvedValue(3600);

    await expect(checkDailyLimit(userId)).rejects.toThrow(ForbiddenError);
  });

  it('should allow when over daily limit but has bonus remaining', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ referralBonus: 3 });
    mockRedis.get.mockResolvedValue('5'); // at daily limit but has 3 bonus
    mockRedis.ttl.mockResolvedValue(3600);

    await expect(checkDailyLimit(userId)).resolves.toBeUndefined();
  });

  it('should throw when over daily limit and no bonus remaining', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ referralBonus: 0 });
    mockRedis.get.mockResolvedValue('5'); // at daily limit, 0 bonus
    mockRedis.ttl.mockResolvedValue(3600);

    await expect(checkDailyLimit(userId)).rejects.toThrow(ForbiddenError);
  });

  it('should include base limit in error message', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ referralBonus: 0 });
    mockRedis.get.mockResolvedValue('5');
    mockRedis.ttl.mockResolvedValue(3600);

    try {
      await checkDailyLimit(userId);
      expect.fail('Should have thrown');
    } catch (err) {
      expect((err as ForbiddenError).message).toContain('(5)');
    }
  });
});

// ─── incrementDailyUsage ────────────────────────────────────────
describe('incrementDailyUsage', () => {
  const userId = 'user-123';

  it('should increment Redis counter when under daily limit', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ referralBonus: 3 });
    mockRedis.get.mockResolvedValue('2'); // under limit of 5
    mockRedis.incr.mockResolvedValue(3);
    mockRedis.ttl.mockResolvedValue(3600);

    const result = await incrementDailyUsage(userId);

    expect(mockRedis.incr).toHaveBeenCalledWith('launch_daily:user-123');
    expect(result.used).toBe(3);
    expect(result.limit).toBe(5); // base only
    expect(result.bonusRemaining).toBe(3); // bonus untouched
  });

  it('should consume bonus when at daily limit with bonus remaining', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ referralBonus: 3 });
    mockPrismaUser.update.mockResolvedValue({});
    mockRedis.get.mockResolvedValue('5'); // at limit of 5
    mockRedis.ttl.mockResolvedValue(3600);

    const result = await incrementDailyUsage(userId);

    expect(mockRedis.incr).not.toHaveBeenCalled(); // should NOT increment Redis
    expect(mockPrismaUser.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { referralBonus: { decrement: 1 } },
    });
    expect(result.used).toBe(5); // stays at 5
    expect(result.bonusRemaining).toBe(2); // 3 - 1
  });

  it('should set TTL when key has no expiry', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ referralBonus: 0 });
    mockRedis.get.mockResolvedValue(null); // no key yet
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.ttl.mockResolvedValue(-1);

    await incrementDailyUsage(userId);

    expect(mockRedis.expire).toHaveBeenCalledWith('launch_daily:user-123', 86400);
  });

  it('should not reset TTL when key already has one', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ referralBonus: 0 });
    mockRedis.get.mockResolvedValue('3');
    mockRedis.incr.mockResolvedValue(4);
    mockRedis.ttl.mockResolvedValue(50000);

    await incrementDailyUsage(userId);

    expect(mockRedis.expire).not.toHaveBeenCalled();
  });
});
