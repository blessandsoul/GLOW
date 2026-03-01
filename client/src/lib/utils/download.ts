/**
 * iOS-aware image download utility.
 *
 * On iOS Safari, `<a download>` saves to Files app, not Photos.
 * This utility detects iOS and uses the Web Share API (`navigator.share({ files })`)
 * which presents the native share sheet with a "Save Image" option,
 * allowing users to save directly to their Photos gallery.
 *
 * On non-iOS devices, falls back to the standard anchor-based download.
 */

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function canShareFiles(): boolean {
  return typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function';
}

/**
 * Downloads an image. On iOS, opens the native share sheet so the user
 * can tap "Save Image" to save to Photos gallery.
 *
 * @param downloadUrl  Full URL to download the image from (API endpoint)
 * @param filename     Desired filename (used for non-iOS download and share sheet)
 * @returns            Promise that resolves when download/share is triggered
 */
export async function downloadImage(downloadUrl: string, filename: string): Promise<void> {
  if (isIOS() && canShareFiles()) {
    const response = await fetch(downloadUrl, { credentials: 'include' });
    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

    if (navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file] });
      return;
    }
  }

  // Fallback: standard anchor-based download (non-iOS or share not supported)
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
