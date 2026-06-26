import type { Metadata } from 'next';
import { MasterGate } from '@/features/faces/components/MasterGate';
import { FaceDetail } from '@/features/faces/components/FaceDetail';

export const metadata: Metadata = {
    title: 'მოდელი',
    robots: { index: false, follow: false },
};

export default async function FaceDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
    const { id } = await params;
    return (
        <MasterGate>
            <FaceDetail id={id} />
        </MasterGate>
    );
}
