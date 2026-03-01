'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import {
    SquaresFour, Palette, Plus, UserCircle, User,
} from '@phosphor-icons/react';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';

type BottomNavItem = {
    href: string;
    label: string;
    icon: React.ElementType;
    exact?: boolean;
};

const LEFT_ITEMS: BottomNavItem[] = [
    { href: ROUTES.DASHBOARD, label: 'nav.dashboard', icon: SquaresFour, exact: true },
    { href: ROUTES.DASHBOARD_BRANDING, label: 'nav.branding', icon: Palette },
];

const RIGHT_ITEMS: BottomNavItem[] = [
    { href: ROUTES.DASHBOARD_PORTFOLIO, label: 'nav.portfolio', icon: User },
    { href: ROUTES.DASHBOARD_PROFILE, label: 'nav.profile', icon: UserCircle },
];

const isActive = (item: BottomNavItem, pathname: string): boolean =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/');

function NavTab({ item, pathname, t }: {
    item: BottomNavItem;
    pathname: string;
    t: (key: string) => string;
}): React.ReactElement {
    const active = isActive(item, pathname);
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors duration-150',
                active ? 'text-primary' : 'text-muted-foreground'
            )}
        >
            <Icon size={22} weight={active ? 'fill' : 'regular'} />
            <span className="text-[10px] font-medium leading-none">{t(item.label)}</span>
        </Link>
    );
}

export function MobileBottomNav(): React.ReactElement | null {
    const { isAuthenticated, isInitializing } = useAuth();
    const pathname = usePathname();
    const { t } = useLanguage();

    if (isInitializing || !isAuthenticated) return null;

    const createActive = pathname === ROUTES.CREATE || pathname.startsWith(ROUTES.CREATE + '/');

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/80 backdrop-blur-xl backdrop-saturate-150 md:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            <div className="flex items-center">
                {LEFT_ITEMS.map((item) => (
                    <NavTab key={item.href} item={item} pathname={pathname} t={t} />
                ))}

                {/* Create — raised circle with shimmer */}
                <Link
                    href={ROUTES.CREATE}
                    className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
                >
                    <span className="relative -translate-y-3">
                        {/* Rotating shine border ring */}
                        <span
                            className="pointer-events-none absolute -inset-0.5 rounded-full overflow-hidden"
                            style={{
                                WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                                WebkitMaskComposite: 'xor',
                                maskComposite: 'exclude',
                                padding: '2px',
                            }}
                            aria-hidden="true"
                        >
                            <span
                                className="absolute inset-[-50%] animate-create-shine-rotate"
                                style={{
                                    background: 'conic-gradient(from 0deg, transparent 40%, oklch(0.85 0.08 340) 50%, oklch(1 0.02 340) 55%, oklch(0.85 0.08 340) 60%, transparent 70%)',
                                }}
                            />
                        </span>

                        <span
                            className={cn(
                                'flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200 active:scale-95 animate-create-shimmer',
                                createActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-primary/90 text-primary-foreground'
                            )}
                        >
                            <Plus size={24} weight="bold" />
                        </span>
                    </span>
                </Link>

                {RIGHT_ITEMS.map((item) => (
                    <NavTab key={item.href} item={item} pathname={pathname} t={t} />
                ))}
            </div>
        </nav>
    );
}
