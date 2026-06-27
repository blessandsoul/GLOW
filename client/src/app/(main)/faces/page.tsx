import type { Metadata } from 'next';
import { MasterGate } from '@/features/faces/components/MasterGate';
import { FacesCatalog } from '@/features/faces/components/FacesCatalog';

export const metadata: Metadata = {
    title: 'მოდელები',
    robots: { index: false, follow: false },
};

export default function FacesPage(): React.ReactElement {
    return (
        <MasterGate>
            <FacesCatalog />
        </MasterGate>
    );
}
