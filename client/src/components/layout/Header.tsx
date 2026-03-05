'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
    Moon, Sun,
    Palette, User, UserCircle, SquaresFour,
    UsersThree, Coins,
    CaretDown, Plus, ShieldCheck, SignOut, ArrowsClockwise, List,
} from '@phosphor-icons/react';
import { useTheme } from 'next-themes';
import { useState, useEffect, useRef } from 'react';
import { ROUTES } from '@/lib/constants/routes';
import { Logo } from './Logo';
import { LanguageSwitcher, LANGUAGES } from './LanguageSwitcher';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { IS_LAUNCH_MODE } from '@/lib/launch-mode';
import { useDailyUsage } from '@/features/jobs/hooks/useDailyUsage';
import { useFlushDailyLimits } from '@/features/admin/hooks/useAdmin';

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

const ACTIVE_NAV_GROUPS = NAV_GROUPS;

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

type MobileMenuProps = {
    isAuthenticated: boolean;
    userRole: string | undefined;
    pathname: string;
    logout: () => void;
    mounted: boolean;
    resolvedTheme: string | undefined;
    toggleTheme: () => void;
    t: (key: string) => string;
};

function MobileMenu({ isAuthenticated, userRole, pathname, logout, mounted, resolvedTheme, toggleTheme, t }: MobileMenuProps): React.ReactElement {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const { language, setLanguage } = useLanguage();

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent): void => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open]);

    const isReferralsActive = pathname === ROUTES.DASHBOARD_REFERRALS;

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-label="Menu"
                className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200',
                    'hover:bg-muted/40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                    open && 'bg-muted/50',
                )}
            >
                <List size={18} />
            </button>

            {open && (
                <div className="absolute right-0 top-full z-50 mt-1.5 min-w-52 rounded-xl border border-border/50 bg-background/95 p-1.5 shadow-lg backdrop-blur-sm">
                    {isAuthenticated && userRole === 'ADMIN' && (
                        <>
                            <Link
                                href={ROUTES.ADMIN}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors duration-150',
                                    pathname.startsWith(ROUTES.ADMIN)
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                                )}
                            >
                                <ShieldCheck size={15} weight={pathname.startsWith(ROUTES.ADMIN) ? 'fill' : 'regular'} />
                                Admin
                            </Link>
                            <div className="my-1 h-px bg-border/50" />
                        </>
                    )}
                    {isAuthenticated && (
                        <>
                            <Link
                                href={ROUTES.DASHBOARD_REFERRALS}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors duration-150',
                                    isReferralsActive
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                                )}
                            >
                                <UsersThree size={15} weight={isReferralsActive ? 'fill' : 'regular'} />
                                {t('nav.referrals')}
                            </Link>
                            <div className="my-1 h-px bg-border/50" />
                        </>
                    )}

                    <div className="flex items-center justify-between rounded-md px-2.5 py-1.5">
                        <span className="text-xs text-muted-foreground">Language</span>
                        <div className="flex gap-0.5">
                            {LANGUAGES.map(({ code, Flag }) => (
                                <button
                                    key={code}
                                    type="button"
                                    onClick={() => setLanguage(code)}
                                    aria-label={code}
                                    className={cn(
                                        'flex h-7 w-8 items-center justify-center rounded-md transition-all duration-150',
                                        language === code ? 'bg-primary/10' : 'hover:bg-muted/60',
                                    )}
                                >
                                    <Flag className="h-3.5 w-5 shrink-0" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted/60 hover:text-foreground"
                    >
                        <span>{t('ui.text_jehhj')}</span>
                        {mounted && (resolvedTheme === 'dark'
                            ? <Moon size={15} weight="fill" />
                            : <Sun size={15} weight="fill" />
                        )}
                    </button>

                    {isAuthenticated && (
                        <>
                            <div className="my-1 h-px bg-border/50" />
                            <button
                                type="button"
                                onClick={() => { logout(); setOpen(false); }}
                                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-destructive transition-colors duration-150 hover:bg-destructive/10"
                            >
                                <SignOut size={15} weight="bold" />
                                {t('auth.logout')}
                            </button>
                        </>
                    )}
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
    const [mounted, setMounted] = useState(false);
    const { remaining: dailyRemaining, data: dailyData } = useDailyUsage();
    const dailyLimit = dailyData?.limit ?? 5;
    const { flush: flushLimits, isPending: isFlushing } = useFlushDailyLimits();

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = (): void => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
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
                            {ACTIVE_NAV_GROUPS.map((group) => (
                                <NavDropdown key={group.category} group={group} pathname={pathname} t={t} />
                            ))}
                            {user?.role === 'ADMIN' && (
                                <>
                                    <Link
                                        href={ROUTES.ADMIN}
                                        className={cn(
                                            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors duration-150',
                                            pathname.startsWith(ROUTES.ADMIN)
                                                ? 'bg-primary/10 text-primary font-medium'
                                                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                                        )}
                                    >
                                        <ShieldCheck size={15} weight={pathname.startsWith(ROUTES.ADMIN) ? 'fill' : 'regular'} />
                                        Admin
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => flushLimits()}
                                        disabled={isFlushing}
                                        title="Reset all daily generation limits"
                                        className="h-7 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <ArrowsClockwise size={13} weight="bold" className={isFlushing ? 'animate-spin' : ''} />
                                        Flush
                                    </Button>
                                </>
                            )}
                            <div className="mx-2 h-5 w-px bg-border/50" />
                            <span className="text-sm text-muted-foreground">
                                {user?.firstName}
                            </span>
                            {IS_LAUNCH_MODE && (
                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Free
                                </span>
                            )}
                            {user !== null && user !== undefined && (
                                IS_LAUNCH_MODE ? (
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                                            dailyRemaining > 2
                                                ? 'bg-success/15 text-success'
                                                : dailyRemaining > 0
                                                    ? 'bg-warning/15 text-warning'
                                                    : 'bg-destructive/15 text-destructive',
                                        )}
                                    >
                                        {dailyRemaining}/{dailyLimit}
                                    </span>
                                ) : (
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
                                )
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
                    <LanguageSwitcher />
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

                {/* Mobile Header Actions */}
                <div className="flex items-center gap-1.5 md:hidden">
                    {IS_LAUNCH_MODE && isAuthenticated && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Free
                        </span>
                    )}
                    {isAuthenticated && user?.role === 'ADMIN' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => flushLimits()}
                            disabled={isFlushing}
                            title="Reset all daily generation limits"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                            <ArrowsClockwise size={16} weight="bold" className={isFlushing ? 'animate-spin' : ''} />
                        </Button>
                    )}
                    <MobileMenu
                        isAuthenticated={isAuthenticated}
                        userRole={user?.role}
                        pathname={pathname}
                        logout={logout}
                        mounted={mounted}
                        resolvedTheme={resolvedTheme}
                        toggleTheme={toggleTheme}
                        t={t}
                    />
                </div>
            </div>

        </header>
    );
}
