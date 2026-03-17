'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default marker icons for webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const TBILISI_CENTER: [number, number] = [41.7151, 44.8271];

interface LocationPickerMapProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number | null, lng: number | null) => void;
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }): null {
  useMapEvents({
    click: (e) => onClick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

export function LocationPickerMap({ latitude, longitude, onChange }: LocationPickerMapProps): React.ReactElement {
  const center: [number, number] = latitude != null && longitude != null ? [latitude, longitude] : TBILISI_CENTER;

  return (
    <MapContainer center={center} zoom={14} className="h-full w-full" zoomControl={false}>
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onClick={(lat, lng) => onChange(lat, lng)} />
      {latitude != null && longitude != null && (
        <Marker position={[latitude, longitude]} />
      )}
    </MapContainer>
  );
}
