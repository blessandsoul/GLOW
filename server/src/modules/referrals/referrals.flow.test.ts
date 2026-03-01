/**
 * End-to-end referral flow tests — verifies the full lifecycle:
 * register → create pending referral → verify phone → grant rewards
 *
 * Uses mocked repo layer to test service-level logic without a DB.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../libs/prisma.js', () => ({ prisma: {} }));
vi.mock('../../libs/logger.js', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

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

const mockRepo = vi.mocked(referralsRepo);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Full referral lifecycle', () => {
  const referrerId = 'referrer-001';
  const referredId = 'referred-002';
  const referrerCode = 'REFER123';
  const referredPhone = '+995555111222';

  it('should create pending referral on register, then grant rewards on phone verify', async () => {
    // ── Phase 1: Registration with referral code ──
    mockRepo.findByCode.mockResolvedValue({ id: referrerId, referralCode: referrerCode });
    mockRepo.findReferralByPhone.mockResolvedValue(null); // phone not used before
    mockRepo.createReferral.mockResolvedValue({
      id: 'ref-001', referrerId, referredId, referredPhone, rewardGiven: false, createdAt: new Date(),
    });

    await referralsService.applyReferralOnRegister(referredId, referrerCode, referredPhone);

    // Referral created with rewardGiven: false
    expect(mockRepo.createReferral).toHaveBeenCalledWith(referrerId, referredId, referredPhone);
    // Rewards NOT granted yet
    expect(mockRepo.grantRewardsAndMarkRewarded).not.toHaveBeenCalled();

    // ── Phase 2: Phone verification triggers reward ──
    mockRepo.findPendingReferralByReferredId.mockResolvedValue({
      id: 'ref-001', referrerId, referredId,
    });
    mockRepo.grantRewardsAndMarkRewarded.mockResolvedValue(undefined);

    await referralsService.grantPendingRewards(referredId);

    // Rewards granted atomically
    expect(mockRepo.grantRewardsAndMarkRewarded).toHaveBeenCalledWith('ref-001', referrerId, referredId);
  });

  it('should block re-registration abuse (same phone, same code)', async () => {
    // First registration: success
    mockRepo.findByCode.mockResolvedValue({ id: referrerId, referralCode: referrerCode });
    mockRepo.findReferralByPhone.mockResolvedValue(null);
    mockRepo.createReferral.mockResolvedValue({
      id: 'ref-001', referrerId, referredId, referredPhone, rewardGiven: false, createdAt: new Date(),
    });

    await referralsService.applyReferralOnRegister(referredId, referrerCode, referredPhone);
    expect(mockRepo.createReferral).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();

    // Second registration: same phone, should be blocked
    const newUserId2 = 'referred-003'; // new account
    mockRepo.findByCode.mockResolvedValue({ id: referrerId, referralCode: referrerCode });
    mockRepo.findReferralByPhone.mockResolvedValue({ id: 'ref-001' }); // phone already used

    await referralsService.applyReferralOnRegister(newUserId2, referrerCode, referredPhone);

    // Blocked — no referral created
    expect(mockRepo.createReferral).not.toHaveBeenCalled();
  });

  it('should handle case where referred user verifies phone but no pending referral exists', async () => {
    // User registered without a referral code, then verifies phone
    mockRepo.findPendingReferralByReferredId.mockResolvedValue(null);

    await referralsService.grantPendingRewards(referredId);

    // No rewards granted, no error
    expect(mockRepo.grantRewardsAndMarkRewarded).not.toHaveBeenCalled();
  });

  it('should prevent self-referral even with valid code', async () => {
    mockRepo.findByCode.mockResolvedValue({ id: referrerId, referralCode: referrerCode });

    // User tries to use their own referral code
    await referralsService.applyReferralOnRegister(referrerId, referrerCode, '+995555333444');

    expect(mockRepo.createReferral).not.toHaveBeenCalled();
  });
});

describe('Stats after referral rewards', () => {
  const userId = 'user-with-referrals';
  const appUrl = 'https://glow.ge';

  it('should reflect bonusDailyGenerations from referralBonus field', async () => {
    const now = new Date();
    // User has referred 3 people who all verified
    mockRepo.findUserCode.mockResolvedValue({ referralCode: 'MYCODE', referralBonus: 9 });
    mockRepo.getStats.mockResolvedValue([
      { id: 'r1', referrerId: userId, referredId: 'u1', referredPhone: '+1', rewardGiven: true, createdAt: now, referred: { firstName: 'A', createdAt: now, phoneVerified: true } },
      { id: 'r2', referrerId: userId, referredId: 'u2', referredPhone: '+2', rewardGiven: true, createdAt: now, referred: { firstName: 'B', createdAt: now, phoneVerified: true } },
      { id: 'r3', referrerId: userId, referredId: 'u3', referredPhone: '+3', rewardGiven: true, createdAt: now, referred: { firstName: 'C', createdAt: now, phoneVerified: true } },
    ]);

    const stats = await referralsService.getMyStats(userId, appUrl);

    expect(stats.bonusDailyGenerations).toBe(9); // 3 referrals * 3 credits each
    expect(stats.currentDailyLimit).toBe(14); // 5 base + 9 bonus
    expect(stats.totalCreditsEarned).toBe(9);
    expect(stats.totalReferrals).toBe(3);
  });

  it('should show pending referrals as not rewarded', async () => {
    const now = new Date();
    mockRepo.findUserCode.mockResolvedValue({ referralCode: 'CODE', referralBonus: 3 });
    mockRepo.getStats.mockResolvedValue([
      { id: 'r1', referrerId: userId, referredId: 'u1', referredPhone: '+1', rewardGiven: true, createdAt: now, referred: { firstName: 'Verified', createdAt: now, phoneVerified: true } },
      { id: 'r2', referrerId: userId, referredId: 'u2', referredPhone: '+2', rewardGiven: false, createdAt: now, referred: { firstName: 'Pending', createdAt: now, phoneVerified: false } },
    ]);

    const stats = await referralsService.getMyStats(userId, appUrl);

    expect(stats.recentReferrals[0].rewarded).toBe(true);
    expect(stats.recentReferrals[1].rewarded).toBe(false);
    expect(stats.totalCreditsEarned).toBe(3); // only 1 rewarded
  });
});
