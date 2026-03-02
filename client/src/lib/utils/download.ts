/**
 * iOS-aware image download utility.
 *
 * Always fetches the image via `fetch()` first so we can detect server errors
 * (e.g. upscale failure) without navigating away from the current page.
 *
 * On iOS Safari, uses the Web Share API (`navigator.share({ files })`)
 * which presents the native share sheet with a "Save Image" option.
 *
 * On non-iOS devices, creates a blob URL for standard anchor-based download.
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
 * Downloads an image. Fetches the binary first so server errors are caught
 * gracefully instead of navigating to a raw JSON error page.
 *
 * @param downloadUrl  Full URL to download the image from (API endpoint)
 * @param filename     Desired filename (used for download and share sheet)
 * @returns            Promise that resolves when download/share is triggered
 * @throws             Error with a user-friendly message on failure
 */
export async function downloadImage(downloadUrl: string, filename: string): Promise<void> {
  const response = await fetch(downloadUrl, { credentials: 'include' });

  if (!response.ok) {
    // Try to extract a message from the API error JSON
    let message = 'Download failed';
    try {
      const json = await response.json() as { error?: { message?: string } };
      if (json?.error?.message) message = json.error.message;
    } catch {
      // Response wasn't JSON — use generic message
    }
    throw new Error(message);
  }

  const blob = await response.blob();

  // iOS: share sheet so user can save to Photos
  if (isIOS() && canShareFiles()) {
    const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file] });
      return;
    }
  }

  // Non-iOS: blob URL download
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}
