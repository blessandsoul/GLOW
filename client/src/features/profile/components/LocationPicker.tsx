'use client';

import React from 'react';
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
  className?: string;
}

export function LocationPicker({ latitude, longitude, onChange, className }: LocationPickerProps): React.ReactElement {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-foreground">Location on map</label>
      <div className="relative h-[300px] overflow-hidden rounded-xl border border-border/60">
        <MapContent latitude={latitude} longitude={longitude} onChange={onChange} />
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
