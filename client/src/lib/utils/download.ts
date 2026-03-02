/**
 * Cross-platform image download utility.
 *
 * `downloadImage` — fetches the image via `fetch()` first so server errors
 * are caught gracefully instead of navigating to a raw JSON error page.
 *
 * `prepareAndDownloadHD` — two-step flow for HD downloads that works on
 * mobile: first POSTs to the server to upscale the image (server saves the
 * file to disk), then triggers a native browser download with the real static
 * URL. This avoids the mobile issue where blob URLs fail after a long async.
 */

function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function canShareFiles(): boolean {
  return typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function';
}

/**
 * Trigger a native browser download from a blob.
 * On mobile, tries Web Share API first (works in secure contexts).
 * Falls back to anchor-click for desktop / non-secure contexts.
 */
function downloadBlob(blob: Blob, filename: string): void {
  const type = blob.type || 'image/jpeg';

  if (isMobile() && canShareFiles()) {
    const file = new File([blob], filename, { type });
    if (navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file] }).catch(() => {
        // User cancelled share sheet — ignore
      });
      return;
    }
  }

  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }, 1000);
}

/**
 * Trigger a native download from a real URL (not a blob).
 * On mobile, fetches then uses Web Share API.
 * On desktop, uses anchor-click with the real URL.
 */
async function downloadFromUrl(url: string, filename: string): Promise<void> {
  if (isMobile() && canShareFiles()) {
    // Mobile: fetch the file and use Web Share API
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const type = blob.type || 'image/jpeg';
    const file = new File([blob], filename, { type });
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file] });
      return;
    }
  }

  // Desktop or fallback: anchor click with real URL
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
  }, 1000);
}

/**
 * Downloads an image. Fetches the binary first so server errors are caught
 * gracefully instead of navigating to a raw JSON error page.
 */
export async function downloadImage(downloadUrl: string, filename: string): Promise<void> {
  const response = await fetch(downloadUrl, { credentials: 'include' });

  if (!response.ok) {
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
  downloadBlob(blob, filename);
}

/**
 * Two-step HD download: POST to prepare-hd endpoint (server upscales and
 * saves to disk), then download from the returned static file URL.
 * Works reliably on both mobile and desktop.
 */
export async function prepareAndDownloadHD(
  prepareUrl: string,
  filename: string,
): Promise<void> {
  // Step 1: Ask server to upscale and save the file
  const response = await fetch(prepareUrl, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    let message = 'HD download failed';
    try {
      const json = await response.json() as { error?: { message?: string } };
      if (json?.error?.message) message = json.error.message;
    } catch {
      // Response wasn't JSON — use generic message
    }
    throw new Error(message);
  }

  const result = await response.json() as { data?: { url?: string } };
  const hdPath = result?.data?.url;
  if (!hdPath) {
    throw new Error('HD download failed — no URL returned');
  }

  // Step 2: Build full URL and trigger native download
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';
  const serverOrigin = apiBase.replace(/\/api\/v\d+\/?$/, '');
  const fullUrl = `${serverOrigin}${hdPath}`;

  await downloadFromUrl(fullUrl, filename);
}
