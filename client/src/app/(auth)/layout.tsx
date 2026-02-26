'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from "@/i18n/hooks/useLanguage";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}): React.ReactElement {
    const { t } = useLanguage();
    const pathname = usePathname();

    return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-transparent p-4 relative z-10">
            <div key={pathname} className="w-full max-w-md relative auth-entrance">
                {children}
            </div>
            <div key={`${pathname}-link`} className="mt-6 text-center auth-entrance-link">
                <Link href="/"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground">
                    <svg width="12" height="12" viewBox="0 0 256 256" fill="none"><path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z" fill="currentColor" /></svg>
                    {t('ui.text_j1lett')}</Link>
            </div>
        </div>
    );
}
