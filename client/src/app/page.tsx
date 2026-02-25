'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkle, ArrowRight, Diamond, Coins, SquaresFour, Plus } from '@phosphor-icons/react';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { BeforeAfterSection } from '@/features/landing/components/BeforeAfterSection';
import dynamic from 'next/dynamic';

const Silk = dynamic(() => import('@/components/Silk'), { ssr: false });
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { HeroEditorial } from '@/features/landing/components/HeroEditorial';
import { HeroStats } from '@/features/landing/components/HeroStats';
import { HeroCards } from '@/features/landing/components/HeroCards';
import { ROUTES } from '@/lib/constants/routes';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

export default function HomePage(): React.ReactElement {
    const [scrolled, setScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { t, tArray } = useLanguage();
    const { isAuthenticated, isInitializing, user } = useAuth();
    const rotatingWords = tArray('hero.rotating_words');
    const [wordIndex, setWordIndex] = useState(0);
    const isDesktop = useMediaQuery('(min-width: 1024px)');

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        const handleScroll = (): void => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (rotatingWords.length <= 1) return;
        const interval = setInterval(() => {
            setWordIndex((prev) => (prev + 1) % rotatingWords.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [rotatingWords.length]);

    return (
        <div className="min-h-dvh flex flex-col bg-background font-sans selection:bg-primary/20 selection:text-primary relative overflow-hidden">

            {/* ── Minimal Premium Navbar ── */}
            <header className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled
                ? 'border-b border-zinc-200/50 bg-background/80 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-background/80'
                : 'border-transparent bg-transparent'
                }`}>
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">

                    {/* Logo */}
                    <div className="flex items-center gap-2.5">
                        <Logo size="sm" />
                        <span className="ml-1 flex items-center gap-1.5 rounded-full border border-primary/20 bg-linear-to-r from-primary/10 to-primary/5 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-primary shadow-sm shadow-primary/10">
                            <Sparkle size={12} weight="fill" className="text-primary" />
                            {t('header.ai_studio')}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {(!mounted || !isAuthenticated) && (
                            <div className="hidden items-center gap-1.5 rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5 shadow-sm sm:flex">
                                <Diamond size={14} weight="fill" className="text-primary" />
                                <span className="text-xs font-semibold text-primary">{t('header.free_photos')}</span>
                            </div>
                        )}

                        <ThemeToggle />

                        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-2 hidden sm:block" />

                        {!mounted || isInitializing ? (
                            <div className="h-8 w-20 animate-pulse rounded-xl bg-muted" />
                        ) : isAuthenticated ? (
                            <div className="flex items-center gap-2">
                                {user !== null && user !== undefined && (
                                    <Link
                                        href={ROUTES.DASHBOARD_CREDITS}
                                        className={cn(
                                            'hidden items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums transition-opacity duration-150 hover:opacity-80 sm:inline-flex',
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
                                <Button size="sm" className="h-10 gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-6 text-sm font-semibold shadow-md shadow-primary/25 transition-all active:scale-[0.98]" asChild>
                                    <Link href={ROUTES.CREATE}>
                                        <Plus size={14} weight="bold" />
                                        {t('nav.create')}
                                    </Link>
                                </Button>
                                <Button variant="outline" size="sm" className="hidden h-10 gap-2 rounded-xl px-4 text-sm font-medium sm:inline-flex" asChild>
                                    <Link href={ROUTES.DASHBOARD}>
                                        <SquaresFour size={14} weight="fill" />
                                        {t('header.dashboard')}
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Button variant="ghost" size="sm" className="hidden h-10 px-4 text-sm font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white sm:flex rounded-xl" asChild>
                                    <Link href="/login">{t('header.login')}</Link>
                                </Button>
                                <Button size="sm" className="h-10 gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-6 text-sm font-semibold shadow-md shadow-primary/25 transition-all active:scale-[0.98]" asChild>
                                    <Link href="/register">
                                        {t('header.start')}
                                        <ArrowRight size={14} weight="bold" />
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* ── Main content ── */}
            <main className="flex flex-col pt-16 pb-12 xl:pt-20 flex-1 relative z-10">

                {/* ── Mobile Hero (< lg) ── */}
                <div className="lg:hidden relative px-4 sm:px-6">
                    <HeroEditorial wordIndex={wordIndex} rotatingWords={rotatingWords} />
                </div>

                {/* ── Desktop Hero (lg+) ── */}
                <div className="hidden lg:block mx-auto w-full max-w-7xl px-10 xl:px-16 pt-8 pb-10 lg:pt-14 lg:pb-16 relative overflow-visible">

                    {/* Elegant Silk Background Effect — only mount when viewport is desktop */}
                    {isDesktop && (
                        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[120vw] h-[1200px] -z-10 opacity-20 dark:opacity-30 mix-blend-multiply dark:mix-blend-screen pointer-events-none" style={{ WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 0%, transparent 70%)', maskImage: 'radial-gradient(ellipse at 50% 40%, black 0%, transparent 70%)' }}>
                            <Silk
                                color="#ff29b0"
                                speed={5.2}
                                noiseIntensity={0.9}
                                rotation={2.67}
                            />
                        </div>
                    )}

                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10 w-full overflow-visible">
                        {/* Text Content */}
                        <motion.div
                            className="flex flex-col items-start text-left"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            {/* Badge */}
                            <motion.div
                                className="relative mb-6 inline-flex items-center gap-2 overflow-hidden rounded-full border border-primary/25 bg-white px-4 py-2 text-primary dark:bg-zinc-900 dark:border-primary/20"
                                initial={{ opacity: 0, y: -8, scale: 0.92 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.15, type: 'spring', stiffness: 120, damping: 14 }}
                            >
                                <motion.span
                                    className="pointer-events-none absolute inset-0 bg-linear-to-r from-transparent via-primary/10 to-transparent"
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '200%' }}
                                    transition={{ duration: 2.2, delay: 1, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
                                />
                                <motion.span
                                    animate={{ rotate: [0, 15, -10, 0] }}
                                    transition={{ duration: 1.8, delay: 0.8, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
                                >
                                    <Diamond size={14} weight="fill" />
                                </motion.span>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('header.free_photos')}</span>
                            </motion.div>

                            {/* Eyebrow — thin subtitle */}
                            <motion.p
                                className="mb-3 text-base font-medium tracking-wide text-zinc-400 dark:text-zinc-500 uppercase"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.25 }}
                            >
                                {t('hero.title_1')}
                            </motion.p>

                            {/* Main H1 — rotating word */}
                            <motion.h1
                                className="mb-4 w-full overflow-visible"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.35 }}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={rotatingWords[wordIndex]}
                                        className="block text-[4.5rem] font-black tracking-[-0.03em] leading-[1.05] text-transparent bg-clip-text pb-[0.1em]"
                                        style={{ backgroundImage: 'linear-gradient(135deg, oklch(0.55 0.18 340) 0%, oklch(0.65 0.22 355) 50%, oklch(0.58 0.16 320) 100%)' }}
                                        initial={{ opacity: 0, y: '0.3em', filter: 'blur(4px)' }}
                                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                        exit={{ opacity: 0, y: '-0.25em', filter: 'blur(2px)' }}
                                        transition={{ duration: 0.35, ease: [0.25, 0, 0.35, 1] }}
                                    >
                                        {rotatingWords[wordIndex]}
                                    </motion.span>
                                </AnimatePresence>
                                <span className="block text-[2rem] font-medium tracking-[-0.01em] leading-tight text-zinc-700 dark:text-zinc-300 mt-1">
                                    {t('hero.title_2')}
                                </span>
                            </motion.h1>

                            <motion.p
                                className="mb-8 max-w-lg text-[1.0625rem] text-zinc-500 dark:text-zinc-400 leading-relaxed font-light"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.45 }}
                            >
                                {t('hero.description')}
                            </motion.p>

                            <motion.div
                                className="flex flex-row items-center gap-3 w-auto"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.55 }}
                            >
                                {/* ── Primary CTA ── */}
                                <Link
                                    href="/register"
                                    className="group relative inline-flex h-[50px] cursor-pointer items-center gap-3 overflow-hidden rounded-2xl bg-primary px-7 text-[15px] font-semibold text-primary-foreground shadow-[0_4px_24px_-4px_color-mix(in_oklch,var(--primary)_55%,transparent)] transition-all duration-300 ease-out hover:-translate-y-[2px] hover:bg-primary/90 hover:shadow-[0_8px_32px_-4px_color-mix(in_oklch,var(--primary)_70%,transparent)] active:scale-[0.97] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
                                >
                                    <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/50 to-transparent" />
                                    <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-18deg] bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[200%]" />
                                    <span className="relative z-10">{t('hero.btn_start')}</span>
                                    <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/20 ring-1 ring-primary-foreground/30 transition-all duration-200 group-hover:bg-primary-foreground/30">
                                        <ArrowRight size={12} weight="bold" className="transition-transform duration-200 group-hover:translate-x-px" />
                                    </span>
                                </Link>

                                {/* ── Secondary CTA ── */}
                                <Link
                                    href="/examples"
                                    className="group relative inline-flex h-[50px] cursor-pointer items-center gap-2.5 overflow-hidden rounded-2xl border border-zinc-200 bg-white px-6 text-[14px] font-medium text-zinc-600 shadow-sm transition-all duration-300 ease-out hover:-translate-y-[1px] hover:border-primary/30 hover:text-zinc-900 hover:shadow-md active:scale-[0.98] active:translate-y-0 dark:border-zinc-700/80 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-primary/40 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                                >
                                    <span className="relative z-10">{t('hero.btn_examples')}</span>
                                    <ArrowRight size={13} weight="bold" className="text-zinc-400 transition-all duration-200 group-hover:text-primary group-hover:translate-x-0.5" />
                                </Link>
                            </motion.div>

                            <HeroStats />
                        </motion.div>

                        {/* Visual Composition */}
                        <motion.div
                            className="relative w-full perspective-1000 h-140 overflow-visible"
                            initial={{ opacity: 0, scale: 0.92, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.4, type: "spring", stiffness: 60, damping: 22 }}
                        >
                            <HeroCards />
                        </motion.div>
                    </div>
                </div>

                {/* ── CTA Section ── */}
                <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 mt-8 mb-20 relative z-20">
                    <div className="flex flex-col items-center gap-6 rounded-2xl border border-border/50 bg-card p-10 text-center shadow-sm">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                            <Sparkle size={28} weight="fill" className="text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                                {t('cta.title')}
                            </h2>
                            <p className="mx-auto mt-2 max-w-md text-base text-muted-foreground">
                                {t('cta.description')}
                            </p>
                        </div>
                        {mounted && isAuthenticated ? (
                            <Link
                                href={ROUTES.CREATE}
                                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
                            >
                                <Plus size={16} weight="bold" />
                                {t('cta.open_studio')}
                            </Link>
                        ) : (
                            <Link
                                href="/register"
                                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
                            >
                                {t('hero.btn_start')}
                                <ArrowRight size={14} weight="bold" />
                            </Link>
                        )}
                    </div>
                </div>
            </main>

            <div className="bg-white dark:bg-zinc-950 pt-8">
                <BeforeAfterSection />
            </div>

        </div>
    );
}
