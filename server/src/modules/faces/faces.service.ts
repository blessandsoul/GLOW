import { logger } from '@/libs/logger.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors/errors.js';
import { sendSms } from '@/libs/otp.js';
import { deleteFile } from '@/libs/storage.js';
import { assertContactRevealAllowed } from '@/shared/rate-limit/reveal-throttle.js';
import { facesRepo } from './faces.repo.js';
import type { CatalogQueryInput, UpdateModelProfileInput } from './faces.schemas.js';

const MAX_PHOTOS = 10;

const SMS = {
  APPROVED: 'Glow.GE: თქვენი მოდელის პროფილი დამტკიცდა და გამოჩნდება კატალოგში.',
  REJECTED: (reason: string): string => `Glow.GE: თქვენი მოდელის პროფილი არ დამტკიცდა. მიზეზი: ${reason}`,
} as const;

function calcAge(birthDate: Date | null): number | null {
  if (!birthDate) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const m = now.getUTCMonth() - birthDate.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < birthDate.getUTCDate())) age--;
  return age;
}

interface CardRow {
  id: string;
  displayName: string | null;
  city: string | null;
  birthDate: Date | null;
  heightCm: number | null;
  blurredAt: Date | null;
  district: { name: string; slug: string } | null;
  photos: { id: string; imageUrl: string; isPrimary: boolean }[];
  _count: { interestedBy: number };
}

function mapCard(m: CardRow) {
  return {
    id: m.id,
    displayName: m.displayName,
    city: m.city,
    age: calcAge(m.birthDate),
    heightCm: m.heightCm,
    blurred: m.blurredAt != null,
    district: m.district,
    photos: m.photos,
    interestedCount: m._count.interestedBy,
  };
}

async function notifyModelBySms(userId: string, message: string): Promise<void> {
  const user = await facesRepo.findUserPhoneByModelUserId(userId);
  if (user?.phone && user.phoneVerified) {
    sendSms(user.phone, message).catch(() => {});
  }
}

export const facesService = {
  // ── Catalog (master-facing) ──
  async getCatalog(filters: CatalogQueryInput) {
    const { items, totalItems } = await facesRepo.findCatalogModels(filters);
    return { items: items.map(mapCard), totalItems };
  },

  async getModelDetail(requesterUserId: string, role: string, id: string) {
    const m = await facesRepo.findDetailById(id);
    if (!m) {
      throw new NotFoundError('Model not found', 'MODEL_NOT_FOUND');
    }
    const revealed = role === 'ADMIN' || (await facesRepo.findInterest(requesterUserId, id)) != null;
    return {
      ...mapCard(m),
      bio: m.bio,
      measurements: m.measurements,
      hairColor: m.hairColor,
      eyeColor: m.eyeColor,
      niches: m.niches ?? [],
      contactRevealed: revealed,
      contact: revealed
        ? { phone: m.phone, whatsapp: m.whatsapp, telegram: m.telegram, instagram: m.instagram }
        : null,
    };
  },

  // ── Interest ──
  // Expressing interest ("liking") a model unlocks her private contact for this master.
  // It is the actual contact-reveal action, so it is throttled per-master and audited.
  async addInterest(userId: string, modelProfileId: string) {
    const model = await facesRepo.findVerificationStatus(modelProfileId);
    if (!model || model.verificationStatus !== 'VERIFIED') {
      throw new NotFoundError('Model not found', 'MODEL_NOT_FOUND');
    }
    const existing = await facesRepo.findInterest(userId, modelProfileId);
    if (existing) {
      throw new ConflictError('You already expressed interest', 'ALREADY_INTERESTED');
    }
    // Bound how many distinct models a single master can unlock per window (anti-harvest).
    await assertContactRevealAllowed(userId);
    const result = await facesRepo.addInterest(userId, modelProfileId);
    // Audit trail: the FavoriteModel row itself (userId + modelProfileId + createdAt) is the
    // durable record; this line makes each reveal visible in the app logs as well.
    logger.info({ userId, modelProfileId }, 'Contact revealed via interest');
    return result;
  },

  async removeInterest(userId: string, modelProfileId: string) {
    const existing = await facesRepo.findInterest(userId, modelProfileId);
    if (!existing) {
      throw new NotFoundError('Interest not found', 'INTEREST_NOT_FOUND');
    }
    await facesRepo.removeInterest(userId, modelProfileId);
  },

  async getInterestStatus(userId: string, modelIds: string[]) {
    if (modelIds.length === 0) return {};
    return facesRepo.checkInterestStatus(userId, modelIds);
  },

  // ── Owner (model self-service) ──
  async getMe(userId: string) {
    const profile = await facesRepo.findOwnProfile(userId);
    if (!profile) {
      throw new NotFoundError('Model profile not found', 'MODEL_PROFILE_NOT_FOUND');
    }
    const { _count, ...rest } = profile;
    return { ...rest, age: calcAge(profile.birthDate), interestedCount: _count.interestedBy };
  },

  async updateProfile(userId: string, input: UpdateModelProfileInput) {
    const own = await facesRepo.findIdByUserId(userId);
    if (!own) {
      throw new NotFoundError('Model profile not found', 'MODEL_PROFILE_NOT_FOUND');
    }
    return facesRepo.updateProfile(userId, input);
  },

  async uploadPhoto(userId: string, imageUrl: string) {
    const own = await facesRepo.findIdByUserId(userId);
    if (!own) {
      throw new NotFoundError('Model profile not found', 'MODEL_PROFILE_NOT_FOUND');
    }
    const count = await facesRepo.countPhotos(own.id);
    if (count >= MAX_PHOTOS) {
      throw new BadRequestError(`Maximum ${MAX_PHOTOS} photos`, 'MAX_PHOTOS_EXCEEDED');
    }
    const maxSort = await facesRepo.getPhotoMaxSort(own.id);
    return facesRepo.addPhoto(own.id, imageUrl, maxSort + 1, count === 0);
  },

  async deletePhoto(userId: string, photoId: string) {
    const own = await facesRepo.findIdByUserId(userId);
    if (!own) {
      throw new NotFoundError('Model profile not found', 'MODEL_PROFILE_NOT_FOUND');
    }
    const photo = await facesRepo.findPhotoById(photoId);
    if (!photo) {
      throw new NotFoundError('Photo not found', 'PHOTO_NOT_FOUND');
    }
    if (photo.modelProfileId !== own.id) {
      throw new ForbiddenError('You do not own this photo', 'NOT_OWNER');
    }
    // Delete + (if this was the primary) promote a replacement atomically, so the profile
    // never loses its primary photo. File removal happens after the DB txn commits.
    await facesRepo.deletePhoto(photoId, own.id, photo.isPrimary);
    await deleteFile(photo.imageUrl);
  },

  async setPrimaryPhoto(userId: string, photoId: string) {
    const own = await facesRepo.findIdByUserId(userId);
    if (!own) {
      throw new NotFoundError('Model profile not found', 'MODEL_PROFILE_NOT_FOUND');
    }
    const photo = await facesRepo.findPhotoById(photoId);
    if (!photo || photo.modelProfileId !== own.id) {
      throw new ForbiddenError('You do not own this photo', 'NOT_OWNER');
    }
    // Only an APPROVED photo may be made primary — the primary is the card/detail hero, and
    // a PENDING/REJECTED image must never be surfaced as the public face of the profile.
    if (photo.moderationStatus !== 'APPROVED') {
      throw new BadRequestError('Only an approved photo can be set as primary', 'PHOTO_NOT_APPROVED');
    }
    await facesRepo.setPrimaryPhoto(own.id, photoId);
  },

  async requestReview(userId: string) {
    const profile = await facesRepo.findOwnProfile(userId);
    if (!profile) {
      throw new NotFoundError('Model profile not found', 'MODEL_PROFILE_NOT_FOUND');
    }
    if (!profile.birthDate) {
      throw new BadRequestError('Date of birth is required', 'BIRTHDATE_REQUIRED');
    }
    if (calcAge(profile.birthDate)! < 18) {
      throw new BadRequestError('You must be at least 18 years old', 'AGE_REQUIREMENT');
    }
    if (!profile.consentAt) {
      throw new BadRequestError('Model-release consent is required', 'CONSENT_REQUIRED');
    }
    if (!profile.displayName || !profile.city) {
      throw new BadRequestError('Name and city are required', 'PROFILE_INCOMPLETE');
    }
    if (profile.photos.length < 1) {
      throw new BadRequestError('At least one photo is required', 'PHOTO_REQUIRED');
    }
    logger.info({ userId }, 'Model requesting review');
    return facesRepo.setStatus(userId, { verificationStatus: 'PENDING', rejectionReason: null });
  },

  async setBlur(userId: string, blurred: boolean) {
    const own = await facesRepo.findIdByUserId(userId);
    if (!own) {
      throw new NotFoundError('Model profile not found', 'MODEL_PROFILE_NOT_FOUND');
    }
    return facesRepo.setStatus(userId, { blurredAt: blurred ? new Date() : null });
  },

  async withdraw(userId: string) {
    const own = await facesRepo.findIdByUserId(userId);
    if (!own) {
      throw new NotFoundError('Model profile not found', 'MODEL_PROFILE_NOT_FOUND');
    }
    const photos = await facesRepo.listPhotosForWithdraw(own.id);
    await Promise.all(photos.map((p) => deleteFile(p.imageUrl)));
    return facesRepo.setStatus(userId, { withdrawnAt: new Date(), isActive: false });
  },

  // ── Admin moderation ──
  async adminGetPending(page: number, limit: number) {
    return facesRepo.findPendingProfiles(page, limit);
  },

  async adminReview(targetUserId: string, adminId: string, action: 'approve' | 'reject', reason?: string) {
    if (action === 'approve') {
      // Only approve a profile that is actually awaiting review. Re-approving an
      // already-VERIFIED model would bulk-approve any photos uploaded after
      // verification, pushing unmoderated images public.
      const profile = await facesRepo.findStatusByUserId(targetUserId);
      if (!profile) {
        throw new NotFoundError('Model profile not found', 'MODEL_PROFILE_NOT_FOUND');
      }
      if (profile.verificationStatus !== 'PENDING') {
        throw new BadRequestError('Model is not pending review', 'ALREADY_REVIEWED');
      }
      logger.info({ targetUserId, adminId }, 'Admin approving model profile');
      const result = await facesRepo.approveByUserId(targetUserId, adminId);
      notifyModelBySms(targetUserId, SMS.APPROVED);
      return result;
    }
    if (!reason) {
      throw new BadRequestError('A rejection reason is required', 'REASON_REQUIRED');
    }
    logger.info({ targetUserId, adminId, reason }, 'Admin rejecting model profile');
    const result = await facesRepo.rejectByUserId(targetUserId, reason);
    notifyModelBySms(targetUserId, SMS.REJECTED(reason));
    return result;
  },

  async adminPhotoReview(photoId: string, status: string) {
    const photo = await facesRepo.findPhotoById(photoId);
    if (!photo) {
      throw new NotFoundError('Photo not found', 'PHOTO_NOT_FOUND');
    }
    return facesRepo.updatePhotoModeration(photoId, status);
  },
};
