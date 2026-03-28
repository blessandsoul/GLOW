import { EditorialTopBar } from '@/features/landing/components/editorial/EditorialTopBar';
import { EditorialBottomNav } from '@/features/landing/components/editorial/EditorialBottomNav';

export default function SpecialistLayout({
    children,
}: {
    children: React.ReactNode;
}): React.ReactElement {
    return (
        <div className="relative min-h-dvh pt-14">
            <EditorialTopBar />
            <main className="pb-24 md:pb-0">{children}</main>
            <EditorialBottomNav />
        </div>
    );
}
