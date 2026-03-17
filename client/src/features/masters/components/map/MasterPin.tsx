'use client';

import { useMemo } from 'react';
import { divIcon } from 'leaflet';
import { Marker } from 'react-leaflet';
import type { LocationType } from '../../types/masters.types';

interface MasterPinProps {
  position: [number, number];
  locationType: LocationType | null;
  isHighlighted: boolean;
  onClick: () => void;
}

function createPinIcon(locationType: LocationType | null, isHighlighted: boolean): ReturnType<typeof divIcon> {
  const isMobile = locationType === 'mobile' || locationType === 'client_visit';
  const size = isHighlighted ? 38 : 30;
  const dotSize = Math.round(size * 0.3);
  const svgSize = Math.round(size * 0.4);
  const bgColor = isMobile ? '#3b82f6' : '#7c3aed';
  const borderColor = isHighlighted ? '#ffffff' : 'rgba(255,255,255,0.3)';
  const shadow = isHighlighted
    ? '0 4px 14px rgba(0,0,0,0.4), 0 0 0 4px rgba(124,58,237,0.3)'
    : '0 3px 10px rgba(0,0,0,0.35)';

  return divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${bgColor};
      border: 3px solid ${borderColor};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: ${shadow};
      display: flex; align-items: center; justify-content: center;
      transition: all 200ms ease-out;
    ">
      ${isMobile
        ? `<svg style="transform:rotate(45deg);width:${svgSize}px;height:${svgSize}px" viewBox="0 0 24 24" fill="white"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`
        : `<div style="transform:rotate(45deg);width:${dotSize}px;height:${dotSize}px;background:white;border-radius:50%"></div>`}
    </div>`,
  });
}

export function MasterPin({ position, locationType, isHighlighted, onClick }: MasterPinProps): React.ReactElement {
  const icon = useMemo(() => createPinIcon(locationType, isHighlighted), [locationType, isHighlighted]);

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{ click: onClick }}
    />
  );
}
