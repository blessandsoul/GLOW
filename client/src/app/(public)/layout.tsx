export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}): React.ReactElement {
    return (
        <div className="relative min-h-dvh flex flex-col">
            <header className="border-b border-[#e3beba]/30 bg-[#f9f9f9]/80 backdrop-blur-xl">
                <div className="container mx-auto flex h-14 items-center px-4 md:px-6 lg:px-8">
                    <a
                        href="/"
                        className="text-xl uppercase tracking-[0.2em] text-[#1a1c1c] transition-colors hover:text-[#680005]"
                        style={{ fontFamily: 'var(--font-noto-serif-georgian), var(--font-noto-serif), serif' }}
                    >
                        GLOW.GE
                    </a>
                </div>
            </header>
            <main className="flex-1">{children}</main>
        </div>
    );
}
