'use client';

import './leaflet-setup';
import { useCallback, useMemo, useState } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { MasterPin } from './MasterPin';
import { MasterPopupCard } from './MasterPopupCard';
import { cn } from '@/lib/utils';
import type { FeaturedMaster, MapBounds } from '../../types/masters.types';

const TBILISI_CENTER: [number, number] = [41.7151, 44.8271];
const DEFAULT_ZOOM = 12;

interface MasterMapViewProps {
  masters: FeaturedMaster[];
  highlightedUsername: string | null;
  onMasterHover: (username: string | null) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  className?: string;
}

function MapEvents({ onBoundsChange }: { onBoundsChange?: (bounds: MapBounds) => void }): null {
  useMapEvents({
    moveend: (e) => {
      if (!onBoundsChange) return;
      const map = e.target as LeafletMap;
      const b = map.getBounds();
      onBoundsChange({
        swLat: b.getSouthWest().lat,
        swLng: b.getSouthWest().lng,
        neLat: b.getNorthEast().lat,
        neLng: b.getNorthEast().lng,
      });
    },
  });
  return null;
}

export function MasterMapView({
  masters,
  highlightedUsername,
  onMasterHover,
  onBoundsChange,
  className,
}: MasterMapViewProps): React.ReactElement {
  const [selectedMaster, setSelectedMaster] = useState<FeaturedMaster | null>(null);

  const mastersWithCoords = useMemo(
    () => masters.filter((m) => m.latitude != null && m.longitude != null),
    [masters],
  );

  const handlePinClick = useCallback(
    (master: FeaturedMaster): void => {
      setSelectedMaster(master);
      onMasterHover(master.username);
    },
    [onMasterHover],
  );

  return (
    <div className={cn('relative h-full w-full', className)}>
      <MapContainer
        center={TBILISI_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full rounded-xl"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <MapEvents onBoundsChange={onBoundsChange} />
        {mastersWithCoords.map((master) => (
          <MasterPin
            key={master.username}
            position={[master.latitude!, master.longitude!]}
            locationType={master.locationType ?? null}
            isHighlighted={master.username === highlightedUsername}
            onClick={() => handlePinClick(master)}
          />
        ))}
      </MapContainer>

      <MasterPopupCard
        master={selectedMaster}
        onClose={() => {
          setSelectedMaster(null);
          onMasterHover(null);
        }}
      />
    </div>
  );
}
