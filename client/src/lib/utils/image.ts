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
