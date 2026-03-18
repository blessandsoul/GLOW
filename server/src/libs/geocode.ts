import { logger } from './logger.js';

interface GeocodingResult {
  latitude: number;
  longitude: number;
}

/**
 * Forward geocode an address string to coordinates using Nominatim.
 * Returns null if geocoding fails or no results found.
 */
export async function forwardGeocode(address: string, city?: string): Promise<GeocodingResult | null> {
  try {
    const query = city ? `${address}, ${city}, Georgia` : `${address}, Georgia`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=ge`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'GlowGE/1.0 (server)' },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      logger.warn({ status: res.status }, 'Nominatim geocoding request failed');
      return null;
    }

    const data = await res.json() as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;

    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);

    if (isNaN(lat) || isNaN(lon)) return null;

    return { latitude: lat, longitude: lon };
  } catch (err) {
    logger.warn({ err }, 'Forward geocoding failed');
    return null;
  }
}
