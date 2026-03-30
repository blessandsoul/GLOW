'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import {
    House, MagnifyingGlass, Heart, CalendarBlank, Images,
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
            className="flex flex-1 flex-col items-center justify-center gap-0 py-1 transition-all duration-200 active:scale-[0.92]"
        >
            <div className={cn(
                'flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 transition-all duration-200',
                active
                    ? 'bg-primary/10'
                    : 'bg-transparent',
            )}>
                <Icon
                    size={20}
                    weight={active ? 'fill' : 'regular'}
                    className={cn(
                        'transition-colors duration-200',
                        active ? 'text-primary' : 'text-muted-foreground/70',
                    )}
                />
                <span className={cn(
                    'text-[10px] font-medium leading-none tracking-tight transition-colors duration-200',
                    active ? 'text-primary' : 'text-muted-foreground/60',
                )}>
                    {t(item.label)}
                </span>
            </div>
        </Link>
    );
}

export function MobileBottomNav(): React.ReactElement | null {
    const { user, isAuthenticated, isInitializing } = useAuth();
    const pathname = usePathname();
    const { t } = useLanguage();

    if (isInitializing || !isAuthenticated) return null;

    const role = user?.role;
    const middleItems = (role === 'MASTER' || role === 'SALON' || role === 'ADMIN') ? MASTER_ITEMS : USER_ITEMS;
    const allItems = [...SHARED_START, ...middleItems];

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            <div className="px-4 pb-3">
                <nav className="flex items-center justify-around rounded-2xl border border-border/50 bg-background/90 px-1 py-1 shadow-lg shadow-black/6 backdrop-blur-xl backdrop-saturate-150 dark:shadow-black/20">
                    {allItems.map((item) => (
                        <NavTab key={item.href} item={item} pathname={pathname} t={t} />
                    ))}
                </nav>
            </div>
        </div>
    );
}
