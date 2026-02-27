import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}): React.ReactElement {
    return (
        <div className="flex h-dvh flex-col overflow-hidden md:h-auto md:min-h-dvh md:overflow-visible">
            <Header />
            <main className="flex-1 overflow-y-auto md:overflow-visible">{children}</main>
            <Footer />
            <MobileBottomNav />
        </div>
    );
}
