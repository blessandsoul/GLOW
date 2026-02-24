'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
    Moon, Sun, List, X,
    Palette, User, UserCircle, SquaresFour,
    UsersThree, Coins,
    CaretDown, Plus,
} from '@phosphor-icons/react';
import { useTheme } from 'next-themes';
import { useState, useEffect, useRef } from 'react';
import { ROUTES } from '@/lib/constants/routes';
import { Logo } from './Logo';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { cn } from '@/lib/utils';

type NavItem = {
    href: string;
    label: string;
    icon: React.ElementType;
    exact?: boolean;
};

type NavGroup = {
    category: string;
    items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
    {
        category: 'nav.cat_studio',
        items: [
            { href: ROUTES.DASHBOARD, label: 'nav.dashboard', icon: SquaresFour, exact: true },
            { href: ROUTES.DASHBOARD_BRANDING, label: 'nav.branding', icon: Palette },
        ],
    },
    {
        category: 'nav.cat_business',
        items: [
            { href: ROUTES.DASHBOARD_REFERRALS, label: 'nav.referrals', icon: UsersThree },
        ],
    },
    {
        category: 'nav.cat_account',
        items: [
            { href: ROUTES.DASHBOARD_PROFILE, label: 'nav.profile', icon: UserCircle },
            { href: ROUTES.DASHBOARD_PORTFOLIO, label: 'nav.portfolio', icon: User },
        ],
    },
];

const isItemActive = (item: NavItem, pathname: string): boolean =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/');

function DropdownGroup({ group, pathname, t, onClose }: {
    group: NavGroup;
    pathname: string;
    t: (key: string) => string;
    onClose?: () => void;
}): React.ReactElement {
    const isGroupActive = group.items.some((item) => isItemActive(item, pathname));

    return (
        <div className="flex flex-col gap-px">
            <span className="mb-0.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {t(group.category)}
            </span>
            {group.items.map((item) => {
                const { href, label, icon: Icon } = item;
                const isActive = isItemActive(item, pathname);
                return (
                    <Link
                        key={href}
                        href={href}
                        onClick={onClose}
                        className={cn(
                            'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors duration-150',
                            isActive
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                        )}
                    >
                        <Icon size={15} weight={isActive ? 'fill' : 'regular'} />
                        {t(label)}
                    </Link>
                );
            })}
        </div>
    );
}

function NavDropdown({ group, pathname, t }: {
    group: NavGroup;
    pathname: string;
    t: (key: string) => string;
}): React.ReactElement {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const isGroupActive = group.items.some((item) => isItemActive(item, pathname));

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent): void => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className={cn(
                    'flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm transition-colors duration-150',
                    isGroupActive || open
                        ? 'text-foreground bg-muted/50'
                        : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                )}
            >
                {t(group.category)}
                <CaretDown
                    size={12}
                    weight="bold"
                    className={cn('transition-transform duration-200', open && 'rotate-180')}
                />
                {isGroupActive && !open && (
                    <span className="ml-0.5 h-1 w-1 rounded-full bg-primary" aria-hidden />
                )}
            </button>

            {open && (
                <div className="absolute left-0 top-full z-50 mt-1.5 min-w-40 rounded-xl border border-border/50 bg-background/95 p-1.5 shadow-lg backdrop-blur-sm">
                    <DropdownGroup group={group} pathname={pathname} t={t} onClose={() => setOpen(false)} />
                </div>
            )}
        </div>
    );
}

export function Header(): React.ReactElement {
    const { isAuthenticated, isInitializing, user, logout } = useAuth();
    const { t } = useLanguage();
    const { resolvedTheme, setTheme } = useTheme();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = (): void => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };

    const closeMobile = (): void => setIsMobileMenuOpen(false);

    return (
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
            <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6 lg:px-8">
                {/* Logo */}
                <Logo size="sm" />

                {/* Desktop Navigation */}
                <nav className="hidden items-center gap-0.5 md:flex">
                    {!mounted || isInitializing ? (
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                        </div>
                    ) : isAuthenticated ? (
                        <>
                            {/* Create CTA — always first, always prominent */}
                            <Link
                                href={ROUTES.CREATE}
                                className={cn(
                                    'mr-1 flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98]',
                                    pathname === ROUTES.CREATE
                                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                                        : 'bg-primary/10 text-primary hover:bg-primary/15'
                                )}
                            >
                                <Plus size={14} weight="bold" />
                                {t('nav.create')}
                            </Link>
                            <div className="mx-1.5 h-5 w-px bg-border/50" />
                            {NAV_GROUPS.map((group) => (
                                <NavDropdown key={group.category} group={group} pathname={pathname} t={t} />
                            ))}
                            <div className="mx-2 h-5 w-px bg-border/50" />
                            <span className="text-sm text-muted-foreground">
                                {user?.firstName}
                            </span>
                            {user !== null && user !== undefined && (
                                <Link
                                    href={ROUTES.DASHBOARD_CREDITS}
                                    className={cn(
                                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums transition-opacity duration-150 hover:opacity-80',
                                        (user.credits ?? 0) >= 50
                                            ? 'bg-warning/15 text-warning'
                                            : (user.credits ?? 0) >= 10
                                                ? 'bg-success/15 text-success'
                                                : 'bg-destructive/15 text-destructive',
                                    )}
                                >
                                    <Coins size={11} weight="fill" />
                                    {user.credits ?? 0}
                                </Link>
                            )}
                            <Button variant="ghost" size="sm" className="text-xs" onClick={logout}>
                                {t('auth.logout')}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/login">{t('auth.login')}</Link>
                            </Button>
                            <Button size="sm" asChild>
                                <Link href="/register">{t('auth.register')}</Link>
                            </Button>
                        </>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        aria-label={t('ui.text_10vvk3')}
                        className="ml-1 h-8 w-8 transition-colors duration-200 active:scale-[0.98]"
                    >
                        {mounted && (resolvedTheme === 'dark' ? <Moon size={16} weight="fill" /> : <Sun size={16} weight="fill" />)}
                    </Button>
                </nav>

                {/* Mobile Menu Toggle */}
                <div className="flex items-center gap-1 md:hidden">
                    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t('ui.text_jehhj')} className="h-8 w-8 transition-colors duration-200">
                        {mounted && (resolvedTheme === 'dark' ? <Moon size={16} weight="fill" /> : <Sun size={16} weight="fill" />)}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label={t('ui.text_janm2')}
                        className="h-8 w-8"
                    >
                        <span className={`transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-90' : 'rotate-0'}`}>
                            {isMobileMenuOpen ? <X size={20} /> : <List size={20} />}
                        </span>
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            <div
                className={cn(
                    'grid md:hidden transition-[grid-template-rows,opacity] duration-300 ease-out',
                    isMobileMenuOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                )}
                aria-hidden={!isMobileMenuOpen}
            >
                <div className="overflow-hidden">
                    <div className="border-t border-border/50 bg-background px-4 py-3">
                        {!mounted || isInitializing ? (
                            <div className="flex flex-col gap-2 py-2">
                                <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                                <div className="h-5 w-24 animate-pulse rounded bg-muted" />
                            </div>
                        ) : isAuthenticated ? (
                            <nav className="flex flex-col gap-4">
                                {/* Create CTA — prominent at top */}
                                <Link
                                    href={ROUTES.CREATE}
                                    onClick={closeMobile}
                                    className={cn(
                                        'flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                                        pathname === ROUTES.CREATE
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'bg-primary/10 text-primary'
                                    )}
                                >
                                    <Plus size={16} weight="bold" />
                                    {t('nav.create')}
                                </Link>
                                <div className="h-px bg-border/50" />
                                {NAV_GROUPS.map((group) => (
                                    <div key={group.category}>
                                        <span className="mb-1 block px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                                            {t(group.category)}
                                        </span>
                                        <div className="flex flex-col gap-px">
                                            {group.items.map((item) => {
                                                const { href, label, icon: Icon } = item;
                                                const isActive = isItemActive(item, pathname);
                                                return (
                                                    <Link
                                                        key={href}
                                                        href={href}
                                                        onClick={closeMobile}
                                                        className={cn(
                                                            'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                                                            isActive
                                                                ? 'bg-primary/10 text-primary font-medium'
                                                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                                        )}
                                                    >
                                                        <Icon size={16} weight={isActive ? 'fill' : 'regular'} />
                                                        {t(label)}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                                <div className="h-px bg-border/50" />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { closeMobile(); logout(); }}
                                >
                                    {t('auth.logout')}
                                </Button>
                            </nav>
                        ) : (
                            <nav className="flex flex-col gap-1">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/login" onClick={closeMobile}>{t('auth.login')}</Link>
                                </Button>
                                <Button size="sm" asChild>
                                    <Link href="/register" onClick={closeMobile}>{t('auth.register')}</Link>
                                </Button>
                            </nav>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
