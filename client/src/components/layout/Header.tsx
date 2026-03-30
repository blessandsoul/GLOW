'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
    Moon, Sun,
    Palette, User, UserCircle, SquaresFour,
    UsersThree, Coins,
    CaretDown, Plus, ShieldCheck, ArrowsClockwise,
    Article, List, X,
    Eye, HandSoap, Scissors, Sparkle, FlowerLotus, MagicWand,
    CalendarBlank, Heart, Globe,
} from '@phosphor-icons/react';
import { useTheme } from 'next-themes';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ROUTES } from '@/lib/constants/routes';
import { Logo } from './Logo';
import { LanguageSwitcher, LANGUAGES } from './LanguageSwitcher';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { IS_LAUNCH_MODE } from '@/lib/launch-mode';
import { useDailyUsage } from '@/features/jobs/hooks/useDailyUsage';
import { useFlushDailyLimits } from '@/features/admin/hooks/useAdmin';
import { useServiceCategories } from '@/features/profile/hooks/useCatalog';
import type { IconProps } from '@phosphor-icons/react';

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

const NICHE_ICONS: Record<string, React.ComponentType<IconProps>> = {
    'lashes-brows':     Eye,
    nails:              HandSoap,
    'permanent-makeup': Sparkle,
    makeup:             Sparkle,
    hair:               Scissors,
    cosmetology:        FlowerLotus,
    'tattoo-piercing':  MagicWand,
};

const NICHE_COLORS: Record<string, string> = {
    'lashes-brows':     'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    nails:              'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    'permanent-makeup': 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    makeup:             'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    hair:               'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    cosmetology:        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    'tattoo-piercing':  'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};

const BURGER_STATIC_CATEGORIES = [
    { slug: 'lashes-brows',     label: 'წამწამები და წარბები' },
    { slug: 'nails',            label: 'ფრჩხილის მოვლა' },
    { slug: 'permanent-makeup', label: 'პერმანენტული მაკიაჟი' },
    { slug: 'makeup',           label: 'მაკიაჟი' },
    { slug: 'hair',             label: 'თმის მოვლა' },
    { slug: 'cosmetology',      label: 'კოსმეტოლოგია და სხეულის მოვლა' },
    { slug: 'tattoo-piercing',  label: 'ტატუ და პირსინგი' },
];

function BurgerMenu({ t }: { t: (key: string) => string }): React.ReactElement {
    const [open, setOpen] = useState(false);
    const { categories: apiCategories, isLoading } = useServiceCategories();
    const specialities = apiCategories.length > 0 ? apiCategories : (!isLoading ? BURGER_STATIC_CATEGORIES : []);
    const { isAuthenticated, isInitializing, user, logout } = useAuth();
    const isMasterRole = user?.role === 'MASTER' || user?.role === 'SALON' || user?.role === 'ADMIN';
    const pathname = usePathname();

    // Close on route change
    useEffect(() => { setOpen(false); }, [pathname]);

    // Lock body scroll when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent): void => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open]);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label="Menu"
                aria-expanded={open}
                className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md transition-all duration-150',
                    'hover:bg-muted/40 active:scale-[0.98]',
                    open && 'bg-muted/50',
                )}
            >
                {open ? <X size={18} weight="bold" /> : <List size={18} weight="bold" />}
            </button>

            {/* Backdrop */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
                    onClick={() => setOpen(false)}
                    aria-hidden
                />
            )}

            {/* Drawer */}
            <div
                className={cn(
                    'fixed right-0 top-14 z-50 h-[calc(100dvh-3.5rem)] w-full max-w-xs overflow-y-auto border-l border-border/50 bg-background shadow-2xl transition-transform duration-300 ease-out',
                    open ? 'translate-x-0' : 'translate-x-full',
                )}
                aria-hidden={!open}
            >
                <div className="flex flex-col gap-6 p-5">
                    {/* Categories */}
                    <div>
                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                            {t('landing.categories_title')}
                        </p>
                        {isLoading ? (
                            <div className="grid grid-cols-2 gap-2">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/60" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {specialities.map((spec) => {
                                    const Icon = NICHE_ICONS[spec.slug] ?? Sparkle;
                                    const colorClass = NICHE_COLORS[spec.slug] ?? 'bg-primary/10 text-primary';
                                    return (
                                        <Link
                                            key={spec.slug}
                                            href={`${ROUTES.MASTERS}?niche=${spec.slug}`}
                                            onClick={() => setOpen(false)}
                                            className="flex items-center gap-2.5 rounded-xl border border-border/40 bg-card/60 px-3 py-2.5 transition-all duration-200 hover:border-border hover:shadow-sm active:scale-[0.98]"
                                        >
                                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                                                <Icon size={16} weight="duotone" />
                                            </div>
                                            <span className="text-xs font-semibold leading-tight text-foreground">
                                                {spec.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* Role-based quick nav */}
                    <div className="flex flex-col gap-1">
                        {/* Masters — always */}
                        <Link
                            href={ROUTES.MASTERS}
                            onClick={() => setOpen(false)}
                            className={cn(
                                'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                                pathname === ROUTES.MASTERS ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/60'
                            )}
                        >
                            <UsersThree size={16} weight={pathname === ROUTES.MASTERS ? 'fill' : 'regular'} />
                            {t('header.masters_link')}
                        </Link>

                        {/* USER: Appointments + Favorites */}
                        {isAuthenticated && !isMasterRole && (
                            <>
                                <Link
                                    href={ROUTES.APPOINTMENTS}
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                                        pathname === ROUTES.APPOINTMENTS ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/60'
                                    )}
                                >
                                    <CalendarBlank size={16} weight={pathname === ROUTES.APPOINTMENTS ? 'fill' : 'regular'} />
                                    {t('nav.appointments')}
                                </Link>
                                <Link
                                    href={ROUTES.FAVORITES}
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                                        pathname === ROUTES.FAVORITES ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/60'
                                    )}
                                >
                                    <Heart size={16} weight={pathname === ROUTES.FAVORITES ? 'fill' : 'regular'} />
                                    {t('nav.favorites')}
                                </Link>
                            </>
                        )}

                        {/* MASTER/SALON/ADMIN: Create + Admin */}
                        {isAuthenticated && isMasterRole && (
                            <>
                                <Link
                                    href={ROUTES.CREATE}
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200',
                                        pathname === ROUTES.CREATE
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-primary/10 text-primary hover:bg-primary/15'
                                    )}
                                >
                                    <Plus size={16} weight="bold" />
                                    {t('nav.create')}
                                </Link>
                                {user?.role === 'ADMIN' && (
                                    <Link
                                        href={ROUTES.ADMIN}
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                                            pathname.startsWith(ROUTES.ADMIN) ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/60'
                                        )}
                                    >
                                        <ShieldCheck size={16} weight={pathname.startsWith(ROUTES.ADMIN) ? 'fill' : 'regular'} />
                                        Admin
                                    </Link>
                                )}
                            </>
                        )}
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* Blog link */}
                    <Link
                        href={ROUTES.BLOG}
                        onClick={() => setOpen(false)}
                        className={cn(
                            'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                            pathname.startsWith(ROUTES.BLOG)
                                ? 'bg-primary/10 text-primary'
                                : 'text-foreground hover:bg-muted/60'
                        )}
                    >
                        <Article size={16} weight={pathname.startsWith(ROUTES.BLOG) ? 'fill' : 'regular'} />
                        {t('nav.blog')}
                    </Link>

                    {/* Auth section */}
                    {isInitializing ? (
                        <div className="h-10 w-full animate-pulse rounded-xl bg-muted/60" />
                    ) : !isAuthenticated ? (
                        <div className="flex flex-col gap-2">
                            <Button asChild variant="outline" className="w-full" onClick={() => setOpen(false)}>
                                <Link href="/login">{t('auth.login')}</Link>
                            </Button>
                            <Button asChild className="w-full" onClick={() => setOpen(false)}>
                                <Link href="/register">{t('header.start_master')}</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                                <span className="text-sm font-medium text-foreground">{user?.firstName}</span>
                                {IS_LAUNCH_MODE && (
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        Free
                                    </span>
                                )}
                                {!IS_LAUNCH_MODE && isMasterRole && (
                                    <Link
                                        href={ROUTES.DASHBOARD_CREDITS}
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums transition-opacity hover:opacity-75',
                                            (user?.credits ?? 0) >= 50
                                                ? 'bg-warning/15 text-warning'
                                                : (user?.credits ?? 0) >= 10
                                                    ? 'bg-success/15 text-success'
                                                    : 'bg-destructive/15 text-destructive',
                                        )}
                                    >
                                        <Coins size={11} weight="fill" />
                                        {user?.credits ?? 0}
                                    </Link>
                                )}
                            </div>
                            {isMasterRole && user?.username && (
                                <Link
                                    href={ROUTES.PORTFOLIO_PUBLIC(user.username)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-2 rounded-xl border border-border/40 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/60"
                                >
                                    <Globe size={13} />
                                    {t('nav.my_page')}
                                </Link>
                            )}
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-sm text-muted-foreground"
                                onClick={() => { logout(); setOpen(false); }}
                            >
                                {t('auth.logout')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

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

function MobileLanguageSwitcher(): React.ReactElement {
    const { language, setLanguage } = useLanguage();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent): void => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const currentFlag = LANGUAGES.find((l) => l.code === language);
    const CurrentFlag = currentFlag?.Flag ?? LANGUAGES[0].Flag;

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-label="Change language"
                className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md transition-all duration-150',
                    'hover:bg-muted/40 active:scale-[0.98]',
                    open && 'bg-muted/50',
                )}
            >
                <CurrentFlag className="h-3.5 w-5 shrink-0" />
            </button>

            {open && (
                <div className="absolute right-0 top-full z-50 mt-1.5 rounded-xl border border-border/50 bg-background/95 p-1 shadow-lg backdrop-blur-sm">
                    {LANGUAGES.filter((l) => l.code !== language).map(({ code, Flag }) => (
                        <button
                            key={code}
                            type="button"
                            onClick={() => { setLanguage(code); setOpen(false); }}
                            aria-label={code}
                            className="flex w-full items-center justify-center rounded-md p-1.5 hover:bg-muted/60 transition-colors duration-150"
                        >
                            <Flag className="h-3.5 w-5 shrink-0" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export function Header(): React.ReactElement {
    const { isAuthenticated, isInitializing, user, logout } = useAuth();
    const isMasterRole = user?.role === 'MASTER' || user?.role === 'SALON' || user?.role === 'ADMIN';
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
                    {/* Masters — always visible */}
                    <Link
                        href={ROUTES.MASTERS}
                        className={cn(
                            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors duration-150',
                            pathname === ROUTES.MASTERS
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                        )}
                    >
                        {t('header.masters_link')}
                    </Link>

                    {!mounted || isInitializing ? (
                        <div className="flex items-center gap-2 transition-opacity duration-300">
                            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                        </div>
                    ) : isAuthenticated ? (
                        isMasterRole ? (
                            /* MASTER / SALON / ADMIN nav */
                            <div className="flex items-center gap-0.5 animate-in fade-in slide-in-from-right-2 duration-300 ease-out">
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
                                                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums transition-opacity hover:opacity-75',
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
                                {user?.username && (
                                    <Link
                                        href={ROUTES.PORTFOLIO_PUBLIC(user.username)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors duration-150 hover:bg-muted/40 hover:text-foreground"
                                    >
                                        <Globe size={13} />
                                        {t('nav.my_page')}
                                    </Link>
                                )}
                                <Button variant="ghost" size="sm" className="text-xs" onClick={logout}>
                                    {t('auth.logout')}
                                </Button>
                            </div>
                        ) : (
                            /* USER nav */
                            <div className="flex items-center gap-0.5 animate-in fade-in slide-in-from-right-2 duration-300 ease-out">
                                <Link
                                    href={ROUTES.APPOINTMENTS}
                                    className={cn(
                                        'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors duration-150',
                                        pathname === ROUTES.APPOINTMENTS
                                            ? 'bg-primary/10 text-primary font-medium'
                                            : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                                    )}
                                >
                                    <CalendarBlank size={15} weight={pathname === ROUTES.APPOINTMENTS ? 'fill' : 'regular'} />
                                    {t('nav.appointments')}
                                </Link>
                                <Link
                                    href={ROUTES.FAVORITES}
                                    className={cn(
                                        'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors duration-150',
                                        pathname === ROUTES.FAVORITES
                                            ? 'bg-primary/10 text-primary font-medium'
                                            : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                                    )}
                                >
                                    <Heart size={15} weight={pathname === ROUTES.FAVORITES ? 'fill' : 'regular'} />
                                    {t('nav.favorites')}
                                </Link>
                                <div className="mx-2 h-5 w-px bg-border/50" />
                                <span className="text-sm text-muted-foreground">
                                    {user?.firstName}
                                </span>
                                <Button variant="ghost" size="sm" className="text-xs" onClick={logout}>
                                    {t('auth.logout')}
                                </Button>
                            </div>
                        )
                    ) : (
                        /* Guest nav */
                        <div className="flex items-center gap-0.5 animate-in fade-in slide-in-from-left-2 duration-300 ease-out">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/login">{t('auth.login')}</Link>
                            </Button>
                            <Button size="sm" asChild>
                                <Link href="/register">{t('header.start_master')}</Link>
                            </Button>
                        </div>
                    )}
                    <Link
                        href={ROUTES.BLOG}
                        className={cn(
                            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors duration-150',
                            pathname.startsWith(ROUTES.BLOG)
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                        )}
                    >
                        <Article size={15} weight={pathname.startsWith(ROUTES.BLOG) ? 'fill' : 'regular'} />
                        {t('nav.blog')}
                    </Link>
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
                <div className="flex items-center gap-1 md:hidden">
                    {isAuthenticated && isMasterRole && (
                        <Link
                            href={ROUTES.CREATE}
                            className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 active:scale-[0.95]',
                                pathname === ROUTES.CREATE || pathname.startsWith(ROUTES.CREATE + '/')
                                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                                    : 'bg-primary/10 text-primary hover:bg-primary/20',
                            )}
                            aria-label={t('nav.create')}
                        >
                            <Plus size={18} weight="bold" />
                        </Link>
                    )}
                    {IS_LAUNCH_MODE && isAuthenticated && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Free
                        </span>
                    )}
                    {isAuthenticated && user?.role === 'ADMIN' && (
                        <>
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
                            <Link
                                href={ROUTES.ADMIN}
                                className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-150',
                                    pathname.startsWith(ROUTES.ADMIN)
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                                )}
                                aria-label="Admin"
                            >
                                <ShieldCheck size={16} weight={pathname.startsWith(ROUTES.ADMIN) ? 'fill' : 'regular'} />
                            </Link>
                        </>
                    )}
                    <MobileLanguageSwitcher />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        aria-label={t('ui.text_10vvk3')}
                        className="h-8 w-8 transition-colors duration-200 active:scale-[0.98]"
                    >
                        {mounted && (resolvedTheme === 'dark' ? <Moon size={16} weight="fill" /> : <Sun size={16} weight="fill" />)}
                    </Button>
                    <BurgerMenu t={t} />
                </div>
            </div>

        </header>
    );
}
