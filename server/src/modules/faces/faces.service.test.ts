import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../libs/logger.js', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));
vi.mock('../../libs/otp.js', () => ({ sendSms: vi.fn() }));
vi.mock('../../libs/storage.js', () => ({ deleteFile: vi.fn() }));
vi.mock('./faces.repo.js', () => ({
  facesRepo: {
    findCatalogModels: vi.fn(),
    findDetailById: vi.fn(),
    findInterest: vi.fn(),
    findVerificationStatus: vi.fn(),
    addInterest: vi.fn(),
    removeInterest: vi.fn(),
    checkInterestStatus: vi.fn(),
    findIdByUserId: vi.fn(),
    findOwnProfile: vi.fn(),
    findStatusByUserId: vi.fn(),
    countPhotos: vi.fn(),
    getPhotoMaxSort: vi.fn(),
    addPhoto: vi.fn(),
    findPhotoById: vi.fn(),
    deletePhoto: vi.fn(),
    setStatus: vi.fn(),
    listPhotosForWithdraw: vi.fn(),
    approveByUserId: vi.fn(),
    rejectByUserId: vi.fn(),
    findUserPhoneByModelUserId: vi.fn(),
    updatePhotoModeration: vi.fn(),
  },
}));

import { facesService } from './faces.service.js';
import { facesRepo } from './faces.repo.js';
import { sendSms } from '../../libs/otp.js';
import { deleteFile } from '../../libs/storage.js';

const repo = vi.mocked(facesRepo);
const mockSendSms = vi.mocked(sendSms);
const mockDeleteFile = vi.mocked(deleteFile);

function detailRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mp-1',
    displayName: 'Ana',
    city: 'tbilisi',
    birthDate: new Date('1998-01-01T00:00:00.000Z'),
    heightCm: 170,
    blurredAt: null,
    district: null,
    photos: [{ id: 'ph-1', imageUrl: '/uploads/faces/a.jpg', isPrimary: true }],
    _count: { interestedBy: 3 },
    bio: 'hi',
    measurements: null,
    hairColor: 'dark',
    eyeColor: 'brown',
    niches: ['makeup'],
    phone: '+995599000000',
    whatsapp: null,
    telegram: null,
    instagram: '@ana',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSendSms.mockResolvedValue(undefined);
  mockDeleteFile.mockResolvedValue(undefined);
});

describe('facesService.getModelDetail', () => {
  it('throws when the model is missing', async () => {
    repo.findDetailById.mockResolvedValue(null);
    await expect(facesService.getModelDetail('u-1', 'MASTER', 'mp-1')).rejects.toMatchObject({
      code: 'MODEL_NOT_FOUND',
    });
  });

  it('hides contact when the master has NOT liked the model', async () => {
    repo.findDetailById.mockResolvedValue(detailRow());
    repo.findInterest.mockResolvedValue(null);

    const result = await facesService.getModelDetail('u-1', 'MASTER', 'mp-1');

    expect(result.contactRevealed).toBe(false);
    expect(result.contact).toBeNull();
    expect(result.age).toBeGreaterThanOrEqual(18);
  });

  it('reveals contact after a like', async () => {
    repo.findDetailById.mockResolvedValue(detailRow());
    repo.findInterest.mockResolvedValue({ id: 'fav-1' });

    const result = await facesService.getModelDetail('u-1', 'MASTER', 'mp-1');

    expect(result.contactRevealed).toBe(true);
    expect(result.contact).toMatchObject({ instagram: '@ana' });
  });

  it('reveals contact to ADMIN without a like', async () => {
    repo.findDetailById.mockResolvedValue(detailRow());
    repo.findInterest.mockResolvedValue(null);

    const result = await facesService.getModelDetail('admin-1', 'ADMIN', 'mp-1');

    expect(result.contactRevealed).toBe(true);
    expect(repo.findInterest).not.toHaveBeenCalled();
  });
});

describe('facesService.addInterest', () => {
  it('rejects interest in a non-verified model', async () => {
    repo.findVerificationStatus.mockResolvedValue({ id: 'mp-1', verificationStatus: 'PENDING' });
    await expect(facesService.addInterest('u-1', 'mp-1')).rejects.toMatchObject({
      code: 'MODEL_NOT_FOUND',
    });
  });

  it('is idempotent-guarded (409 on double like)', async () => {
    repo.findVerificationStatus.mockResolvedValue({ id: 'mp-1', verificationStatus: 'VERIFIED' });
    repo.findInterest.mockResolvedValue({ id: 'fav-1' });
    await expect(facesService.addInterest('u-1', 'mp-1')).rejects.toMatchObject({
      code: 'ALREADY_INTERESTED',
    });
  });

  it('creates interest when verified and not yet liked', async () => {
    repo.findVerificationStatus.mockResolvedValue({ id: 'mp-1', verificationStatus: 'VERIFIED' });
    repo.findInterest.mockResolvedValue(null);
    repo.addInterest.mockResolvedValue({ id: 'fav-1' });

    await facesService.addInterest('u-1', 'mp-1');
    expect(repo.addInterest).toHaveBeenCalledWith('u-1', 'mp-1');
  });
});

describe('facesService.deletePhoto', () => {
  it('forbids deleting a photo the model does not own', async () => {
    repo.findIdByUserId.mockResolvedValue({ id: 'mp-1' });
    repo.findPhotoById.mockResolvedValue({ id: 'ph-9', modelProfileId: 'OTHER', imageUrl: '/uploads/faces/x.jpg' });

    await expect(facesService.deletePhoto('u-1', 'ph-9')).rejects.toMatchObject({ code: 'NOT_OWNER' });
    expect(repo.deletePhoto).not.toHaveBeenCalled();
  });
});

describe('facesService.requestReview', () => {
  it('blocks review without consent', async () => {
    repo.findOwnProfile.mockResolvedValue({
      birthDate: new Date('1998-01-01'),
      consentAt: null,
      displayName: 'Ana',
      city: 'tbilisi',
      photos: [{ id: 'ph-1' }],
    } as never);

    await expect(facesService.requestReview('u-1')).rejects.toMatchObject({ code: 'CONSENT_REQUIRED' });
  });

  it('blocks review without a photo', async () => {
    repo.findOwnProfile.mockResolvedValue({
      birthDate: new Date('1998-01-01'),
      consentAt: new Date(),
      displayName: 'Ana',
      city: 'tbilisi',
      photos: [],
    } as never);

    await expect(facesService.requestReview('u-1')).rejects.toMatchObject({ code: 'PHOTO_REQUIRED' });
  });

  it('submits when complete', async () => {
    repo.findOwnProfile.mockResolvedValue({
      birthDate: new Date('1998-01-01'),
      consentAt: new Date(),
      displayName: 'Ana',
      city: 'tbilisi',
      photos: [{ id: 'ph-1' }],
    } as never);
    repo.setStatus.mockResolvedValue({} as never);

    await facesService.requestReview('u-1');
    expect(repo.setStatus).toHaveBeenCalledWith('u-1', { verificationStatus: 'PENDING', rejectionReason: null });
  });
});

describe('facesService.adminReview', () => {
  it('approves a PENDING model and SMSes them', async () => {
    repo.findStatusByUserId.mockResolvedValue({ id: 'mp-1', verificationStatus: 'PENDING' });
    repo.approveByUserId.mockResolvedValue({ id: 'mp-1', verificationStatus: 'VERIFIED' });
    repo.findUserPhoneByModelUserId.mockResolvedValue({ phone: '+995599000000', phoneVerified: true });

    await facesService.adminReview('model-user', 'admin-1', 'approve');

    expect(repo.approveByUserId).toHaveBeenCalledWith('model-user', 'admin-1');
    // SMS is fire-and-forget, wait for the async notify to flush.
    await vi.waitFor(() => expect(mockSendSms).toHaveBeenCalledTimes(1));
  });

  it('refuses to re-approve an already-VERIFIED model (keeps post-verification photos moderated)', async () => {
    repo.findStatusByUserId.mockResolvedValue({ id: 'mp-1', verificationStatus: 'VERIFIED' });

    await expect(facesService.adminReview('model-user', 'admin-1', 'approve')).rejects.toMatchObject({
      code: 'ALREADY_REVIEWED',
    });
    expect(repo.approveByUserId).not.toHaveBeenCalled();
  });

  it('requires a reason to reject', async () => {
    await expect(facesService.adminReview('model-user', 'admin-1', 'reject')).rejects.toMatchObject({
      code: 'REASON_REQUIRED',
    });
  });
});
