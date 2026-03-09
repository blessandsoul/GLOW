import { Suspense } from 'react';
import { MastersCatalog } from '@/features/masters/components/MastersCatalog';

export default function MastersPage(): React.ReactElement {
    return (
        <Suspense>
            <MastersCatalog />
        </Suspense>
    );
}
