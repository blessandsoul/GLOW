'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import {
    House, MagnifyingGlass, Heart, CalendarBlank, Images, UserCircle,
} from '@phosphor-icons/react';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';

type BottomNavItem = {
    href: string;
    label: string;
    icon: React.ElementType;
    exact?: boolean;
};

const SHARED_START: BottomNavItem[] = [
    { href: ROUTES.HOME, label: 'nav.home', icon: House, exact: true },
    { href: ROUTES.SEARCH, label: 'nav.search', icon: MagnifyingGlass },
];

const SHARED_END: BottomNavItem[] = [
    { href: ROUTES.DASHBOARD_PROFILE, label: 'nav.profile', icon: UserCircle },
];

const USER_ITEMS: BottomNavItem[] = [
    { href: ROUTES.FAVORITES, label: 'nav.favorites', icon: Heart },
    { href: ROUTES.APPOINTMENTS, label: 'nav.appointments', icon: CalendarBlank },
];

const MASTER_ITEMS: BottomNavItem[] = [
    { href: ROUTES.APPOINTMENTS, label: 'nav.appointments', icon: CalendarBlank },
    { href: ROUTES.DASHBOARD_PORTFOLIO, label: 'nav.portfolio', icon: Images },
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
    const { user, isAuthenticated, isInitializing } = useAuth();
    const pathname = usePathname();
    const { t } = useLanguage();

    if (isInitializing || !isAuthenticated) return null;

    const role = user?.role;

    if (role === 'ADMIN') return null;

    // SALON falls through to USER_ITEMS intentionally (same nav for now)
    const items = [...SHARED_START, ...(role === 'MASTER' ? MASTER_ITEMS : USER_ITEMS), ...SHARED_END];

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/80 backdrop-blur-xl backdrop-saturate-150 md:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            <div className="flex items-center">
                {items.map((item) => (
                    <NavTab key={item.href} item={item} pathname={pathname} t={t} />
                ))}
            </div>
        </nav>
    );
}
