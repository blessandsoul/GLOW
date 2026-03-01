import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the module under test
vi.mock('../../libs/prisma.js', () => ({ prisma: {} }));
vi.mock('../../libs/logger.js', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

// Mock the repo — we test the service logic, not Prisma queries
vi.mock('./referrals.repo.js', () => ({
  REFERRAL_REWARDS: { REFERRER_CREDITS: 3, REFERRED_CREDITS: 1 } as const,
  referralsRepo: {
    findByCode: vi.fn(),
    createReferral: vi.fn(),
    findReferralByPhone: vi.fn(),
    findPendingReferralByReferredId: vi.fn(),
    grantRewardsAndMarkRewarded: vi.fn(),
    getStats: vi.fn(),
    findUserCode: vi.fn(),
  },
}));

import { referralsService } from './referrals.service.js';
import { referralsRepo } from './referrals.repo.js';
import { logger } from '../../libs/logger.js';

const mockRepo = vi.mocked(referralsRepo);
const mockLogger = vi.mocked(logger);

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── generateCode ───────────────────────────────────────────────
describe('referralsService.generateCode', () => {
  it('should return an 8-character alphanumeric string', () => {
    const code = referralsService.generateCode();
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[A-Z0-9]{8}$/);
  });

  it('should generate unique codes on consecutive calls', () => {
    const codes = new Set(Array.from({ length: 50 }, () => referralsService.generateCode()));
    // With 36^8 combinations, 50 codes should all be unique
    expect(codes.size).toBe(50);
  });
});

// ─── applyReferralOnRegister ────────────────────────────────────
describe('referralsService.applyReferralOnRegister', () => {
  const referrerId = 'referrer-id-123';
  const newUserId = 'new-user-id-456';
  const phone = '+995555123456';
  const referralCode = 'ABC12345';

  it('should skip when referralCode is undefined', async () => {
    await referralsService.applyReferralOnRegister(newUserId, undefined, phone);
    expect(mockRepo.findByCode).not.toHaveBeenCalled();
  });

  it('should skip when referralCode is empty string', async () => {
    await referralsService.applyReferralOnRegister(newUserId, '', phone);
    expect(mockRepo.findByCode).not.toHaveBeenCalled();
  });

  it('should skip when phone is empty string', async () => {
    await referralsService.applyReferralOnRegister(newUserId, referralCode, '');
    expect(mockRepo.findByCode).not.toHaveBeenCalled();
  });

  it('should skip when referrer is not found', async () => {
    mockRepo.findByCode.mockResolvedValue(null);

    await referralsService.applyReferralOnRegister(newUserId, referralCode, phone);

    expect(mockRepo.findByCode).toHaveBeenCalledWith(referralCode);
    expect(mockRepo.createReferral).not.toHaveBeenCalled();
  });

  it('should skip self-referral (referrer === newUser)', async () => {
    mockRepo.findByCode.mockResolvedValue({ id: newUserId, referralCode });

    await referralsService.applyReferralOnRegister(newUserId, referralCode, phone);

    expect(mockRepo.createReferral).not.toHaveBeenCalled();
  });

  it('should skip when phone was already used in a referral (anti-abuse)', async () => {
    mockRepo.findByCode.mockResolvedValue({ id: referrerId, referralCode });
    mockRepo.findReferralByPhone.mockResolvedValue({ id: 'existing-referral-id' });

    await referralsService.applyReferralOnRegister(newUserId, referralCode, phone);

    expect(mockRepo.findReferralByPhone).toHaveBeenCalledWith(phone);
    expect(mockRepo.createReferral).not.toHaveBeenCalled();
  });

  it('should create a referral record with rewardGiven:false on valid referral', async () => {
    mockRepo.findByCode.mockResolvedValue({ id: referrerId, referralCode });
    mockRepo.findReferralByPhone.mockResolvedValue(null);
    mockRepo.createReferral.mockResolvedValue({
      id: 'ref-1', referrerId, referredId: newUserId, referredPhone: phone, rewardGiven: false, createdAt: new Date(),
    });

    await referralsService.applyReferralOnRegister(newUserId, referralCode, phone);

    expect(mockRepo.createReferral).toHaveBeenCalledWith(referrerId, newUserId, phone);
  });

  it('should NOT call grantRewardsAndMarkRewarded (rewards deferred to phone verification)', async () => {
    mockRepo.findByCode.mockResolvedValue({ id: referrerId, referralCode });
    mockRepo.findReferralByPhone.mockResolvedValue(null);
    mockRepo.createReferral.mockResolvedValue({
      id: 'ref-1', referrerId, referredId: newUserId, referredPhone: phone, rewardGiven: false, createdAt: new Date(),
    });

    await referralsService.applyReferralOnRegister(newUserId, referralCode, phone);

    expect(mockRepo.grantRewardsAndMarkRewarded).not.toHaveBeenCalled();
  });

  it('should not throw when repo throws (non-fatal)', async () => {
    mockRepo.findByCode.mockRejectedValue(new Error('DB connection lost'));

    await expect(
      referralsService.applyReferralOnRegister(newUserId, referralCode, phone),
    ).resolves.toBeUndefined();

    expect(mockLogger.warn).toHaveBeenCalled();
  });
});

// ─── grantPendingRewards ────────────────────────────────────────
describe('referralsService.grantPendingRewards', () => {
  const referredUserId = 'referred-user-123';
  const referrerId = 'referrer-id-456';
  const referralId = 'referral-id-789';

  it('should do nothing when no pending referral exists', async () => {
    mockRepo.findPendingReferralByReferredId.mockResolvedValue(null);

    await referralsService.grantPendingRewards(referredUserId);

    expect(mockRepo.grantRewardsAndMarkRewarded).not.toHaveBeenCalled();
  });

  it('should grant rewards and mark referral as rewarded when pending referral found', async () => {
    mockRepo.findPendingReferralByReferredId.mockResolvedValue({
      id: referralId, referrerId, referredId: referredUserId,
    });
    mockRepo.grantRewardsAndMarkRewarded.mockResolvedValue(undefined);

    await referralsService.grantPendingRewards(referredUserId);

    expect(mockRepo.grantRewardsAndMarkRewarded).toHaveBeenCalledWith(
      referralId, referrerId, referredUserId,
    );
  });

  it('should not throw when grantRewardsAndMarkRewarded fails (non-fatal)', async () => {
    mockRepo.findPendingReferralByReferredId.mockResolvedValue({
      id: referralId, referrerId, referredId: referredUserId,
    });
    mockRepo.grantRewardsAndMarkRewarded.mockRejectedValue(new Error('Transaction failed'));

    await expect(
      referralsService.grantPendingRewards(referredUserId),
    ).resolves.toBeUndefined();

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ referredUserId }),
      'Failed to grant pending referral rewards',
    );
  });
});

// ─── getMyStats ─────────────────────────────────────────────────
describe('referralsService.getMyStats', () => {
  const userId = 'user-123';
  const appUrl = 'https://glow.ge';

  it('should return correct stats with referrals', async () => {
    const now = new Date();
    mockRepo.findUserCode.mockResolvedValue({ referralCode: 'TESTCODE', referralBonus: 6 });
    mockRepo.getStats.mockResolvedValue([
      { id: 'r1', referrerId: userId, referredId: 'u1', referredPhone: '+995551', rewardGiven: true, createdAt: now, referred: { firstName: 'ნინო', createdAt: now, phoneVerified: true } },
      { id: 'r2', referrerId: userId, referredId: 'u2', referredPhone: '+995552', rewardGiven: false, createdAt: now, referred: { firstName: 'თამარ', createdAt: now, phoneVerified: false } },
    ]);

    const stats = await referralsService.getMyStats(userId, appUrl);

    expect(stats.referralCode).toBe('TESTCODE');
    expect(stats.referralLink).toBe('https://glow.ge/r/TESTCODE');
    expect(stats.totalReferrals).toBe(2);
    expect(stats.totalCreditsEarned).toBe(3); // 1 rewarded * 3
    expect(stats.bonusDailyGenerations).toBe(6);
    expect(stats.currentDailyLimit).toBe(11); // 5 base + 6 bonus
    expect(stats.recentReferrals).toHaveLength(2);
    expect(stats.recentReferrals[0]).toEqual({
      name: 'ნინო',
      joinedAt: now,
      rewarded: true,
    });
    expect(stats.recentReferrals[1]).toEqual({
      name: 'თამარ',
      joinedAt: now,
      rewarded: false,
    });
  });

  it('should handle null referral code', async () => {
    mockRepo.findUserCode.mockResolvedValue({ referralCode: null, referralBonus: 0 });
    mockRepo.getStats.mockResolvedValue([]);

    const stats = await referralsService.getMyStats(userId, appUrl);

    expect(stats.referralCode).toBeNull();
    expect(stats.referralLink).toBeNull();
    expect(stats.totalReferrals).toBe(0);
    expect(stats.totalCreditsEarned).toBe(0);
    expect(stats.bonusDailyGenerations).toBe(0);
    expect(stats.currentDailyLimit).toBe(5); // base only
    expect(stats.recentReferrals).toEqual([]);
  });

  it('should handle user not found (null)', async () => {
    mockRepo.findUserCode.mockResolvedValue(null);
    mockRepo.getStats.mockResolvedValue([]);

    const stats = await referralsService.getMyStats(userId, appUrl);

    expect(stats.referralCode).toBeNull();
    expect(stats.referralLink).toBeNull();
    expect(stats.bonusDailyGenerations).toBe(0);
    expect(stats.currentDailyLimit).toBe(5);
  });

  it('should calculate totalCreditsEarned from rewarded referrals only', async () => {
    const now = new Date();
    mockRepo.findUserCode.mockResolvedValue({ referralCode: 'CODE', referralBonus: 9 });
    mockRepo.getStats.mockResolvedValue([
      { id: 'r1', referrerId: userId, referredId: 'u1', referredPhone: '+1', rewardGiven: true, createdAt: now, referred: { firstName: 'A', createdAt: now, phoneVerified: true } },
      { id: 'r2', referrerId: userId, referredId: 'u2', referredPhone: '+2', rewardGiven: true, createdAt: now, referred: { firstName: 'B', createdAt: now, phoneVerified: true } },
      { id: 'r3', referrerId: userId, referredId: 'u3', referredPhone: '+3', rewardGiven: true, createdAt: now, referred: { firstName: 'C', createdAt: now, phoneVerified: true } },
      { id: 'r4', referrerId: userId, referredId: 'u4', referredPhone: '+4', rewardGiven: false, createdAt: now, referred: { firstName: 'D', createdAt: now, phoneVerified: false } },
    ]);

    const stats = await referralsService.getMyStats(userId, appUrl);

    expect(stats.totalCreditsEarned).toBe(9); // 3 rewarded * 3 credits each
    expect(stats.totalReferrals).toBe(4); // all referrals
  });

  it('should use rewardGiven (not phoneVerified) for rewarded status', async () => {
    const now = new Date();
    mockRepo.findUserCode.mockResolvedValue({ referralCode: 'CODE', referralBonus: 0 });
    mockRepo.getStats.mockResolvedValue([
      { id: 'r1', referrerId: userId, referredId: 'u1', referredPhone: '+1', rewardGiven: false, createdAt: now, referred: { firstName: 'A', createdAt: now, phoneVerified: true } },
    ]);

    const stats = await referralsService.getMyStats(userId, appUrl);

    // rewardGiven is the source of truth, not phoneVerified
    expect(stats.recentReferrals[0].rewarded).toBe(false);
  });
});
