const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';

let _serverOrigin: string | null = null;

function getServerOrigin(): string {
  if (!_serverOrigin) {
    try {
      _serverOrigin = new URL(API_BASE_URL).origin;
    } catch {
      _serverOrigin = 'http://localhost:4000';
    }
  }
  return _serverOrigin;
}

/**
 * Convert a relative server path (e.g., "/uploads/results/abc.png") to a full URL.
 * If the path is already absolute (starts with http/https), returns it as-is.
 */
export function getServerImageUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${getServerOrigin()}${path}`;
}

/**
 * Build a thumbnail URL via the server-side resize endpoint.
 * Falls back to the original image URL if the path is already absolute.
 */
/**
 * Convert a base64 data URL to a File object.
 */
export function base64ToFile(base64: string, filename: string): File {
  const [header, data] = base64.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const byteString = atob(data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new File([ab], filename, { type: mime });
}

export function getThumbUrl(path: string, width: number = 128): string {
  if (!path) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${getServerOrigin()}/api/v1/images/thumb?url=${encodeURIComponent(path)}&w=${width}`;
}
