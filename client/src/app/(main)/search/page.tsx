import type React from 'react';
import { Suspense } from 'react';
import { MastersCatalog } from '@/features/masters/components/MastersCatalog';

export default function SearchPage(): React.ReactElement {
    return (
        <Suspense>
            <MastersCatalog />
        </Suspense>
    );
}
