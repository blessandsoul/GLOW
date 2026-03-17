'use client';

import React, { useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const MapContent = dynamic(
  () => import('./LocationPickerMap').then((m) => m.LocationPickerMap),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-muted" /> },
);

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number | null, lng: number | null) => void;
  onAddressResolved?: (address: string) => void;
  className?: string;
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=en`,
      { headers: { 'User-Agent': 'GlowGE/1.0' } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address;
    if (!addr) return data.display_name ?? null;

    // Build a concise address: road + house_number, neighbourhood, city
    const parts: string[] = [];
    const road = addr.road ?? addr.pedestrian ?? addr.street ?? '';
    if (road) {
      parts.push(addr.house_number ? `${road} ${addr.house_number}` : road);
    }
    if (addr.neighbourhood && !road.includes(addr.neighbourhood)) {
      parts.push(addr.neighbourhood);
    }
    return parts.length > 0 ? parts.join(', ') : (data.display_name ?? null);
  } catch {
    return null;
  }
}

export function LocationPicker({ latitude, longitude, onChange, onAddressResolved, className }: LocationPickerProps): React.ReactElement {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleChange = useCallback((lat: number | null, lng: number | null) => {
    onChange(lat, lng);

    if (lat != null && lng != null && onAddressResolved) {
      // Debounce to avoid spamming Nominatim on rapid clicks
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const address = await reverseGeocode(lat, lng);
        if (address) onAddressResolved(address);
      }, 300);
    }
  }, [onChange, onAddressResolved]);

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-foreground">Location on map</label>
      <div className="relative h-[300px] overflow-hidden rounded-xl border border-border/60">
        <MapContent latitude={latitude} longitude={longitude} onChange={handleChange} />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {latitude != null && longitude != null
            ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
            : 'Click on the map to set your location'}
        </p>
        {latitude != null && longitude != null && (
          <button
            type="button"
            onClick={() => onChange(null, null)}
            className="flex items-center gap-1 text-xs text-destructive transition-colors hover:text-destructive/80"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
