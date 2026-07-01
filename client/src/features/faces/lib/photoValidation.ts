// Client-side guard for model photo uploads. Mirrors the create-tigra file-upload rule
// (jpeg/png/webp, max 5MB) so an oversize/non-image is rejected before the round-trip.
// Returns an i18n key for the caller to resolve, or null when the file is acceptable.

export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB

export function validatePhotoFile(file: File): string | null {
    if (!ALLOWED_PHOTO_TYPES.includes(file.type as (typeof ALLOWED_PHOTO_TYPES)[number])) {
        return 'faces.err_photo_type';
    }
    if (file.size > MAX_PHOTO_BYTES) {
        return 'faces.err_photo_size';
    }
    return null;
}
