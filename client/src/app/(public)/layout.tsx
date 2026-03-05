import { Logo } from '@/components/layout/Logo';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}): React.ReactElement {
    return (
        <div className="relative min-h-dvh flex flex-col">
            <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
                <div className="container mx-auto flex h-14 items-center px-4 md:px-6 lg:px-8">
                    <Logo size="sm" />
                </div>
            </header>
            <main className="flex-1">{children}</main>
        </div>
    );
}
