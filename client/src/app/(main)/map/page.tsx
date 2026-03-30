import { Suspense } from 'react';
import { MapPage } from '@/features/masters/components/MapPage';

export default function MapRoute(): React.ReactElement {
  return (
    <Suspense>
      <MapPage />
    </Suspense>
  );
}
