'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Users, MagnifyingGlass, Star, ChatCircleDots } from '@phosphor-icons/react';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/ThemeToggle';

import dynamic from 'next/dynamic';

const Silk = dynamic(() => import('@/components/Silk'), { ssr: false });
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { HeroStats } from '@/features/landing/components/HeroStats';
import { HeroSearch } from '@/features/landing/components/HeroSearch';
import { ServiceCategories } from '@/features/landing/components/ServiceCategories';
import { FeaturedMasters } from '@/features/masters/components/FeaturedMasters';
import { HomeBlogSection } from '@/features/blog/components/HomeBlogSection';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ROUTES } from '@/lib/constants/routes';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function HomePage(): React.ReactElement {
    const [scrolled, setScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { t, tArray } = useLanguage();
    const { isAuthenticated, isInitializing } = useAuth();
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

            {/* ── Navbar ── */}
            <header className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled
                ? 'border-b border-zinc-200/50 bg-background/80 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-background/80'
                : 'border-transparent bg-transparent'
                }`}>
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">

                    {/* Logo */}
                    <div className="flex items-center gap-2.5">
                        <Logo size="sm" />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <Link
                            href={ROUTES.MASTERS}
                            className="hidden sm:flex items-center text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors duration-200"
                        >
                            {t('header.masters_link')}
                        </Link>

                        <Link
                            href={ROUTES.BLOG}
                            className="hidden sm:flex items-center text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors duration-200"
                        >
                            {t('nav.blog')}
                        </Link>

                        <ThemeToggle />

                        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-2 hidden sm:block" />

                        {!mounted || isInitializing ? (
                            <div className="h-8 w-20 animate-pulse rounded-xl bg-muted" />
                        ) : isAuthenticated ? (
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="hidden h-10 gap-2 rounded-xl px-4 text-sm font-medium sm:inline-flex" asChild>
                                    <Link href={ROUTES.DASHBOARD}>
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

                {/* ── Hero Section ── */}
                <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-8 lg:pt-16 pb-8 lg:pb-12 relative overflow-visible">

                    {/* Silk background — desktop only */}
                    {isDesktop && (
                        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[120vw] h-[1200px] -z-10 opacity-15 dark:opacity-25 mix-blend-multiply dark:mix-blend-screen pointer-events-none" style={{ WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 0%, transparent 70%)', maskImage: 'radial-gradient(ellipse at 50% 40%, black 0%, transparent 70%)' }}>
                            <Silk
                                color="#ff29b0"
                                speed={5.2}
                                noiseIntensity={0.9}
                                rotation={2.67}
                            />
                        </div>
                    )}

                    <div className="flex flex-col items-center text-center relative z-10">
                        {/* Eyebrow */}
                        <motion.p
                            className="mb-3 text-sm sm:text-base font-medium tracking-wide text-muted-foreground uppercase"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            {t('hero.title_1')}
                        </motion.p>

                        {/* Main H1 — rotating word */}
                        <motion.h1
                            className="mb-4 w-full overflow-visible"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={rotatingWords[wordIndex]}
                                    className="block text-4xl sm:text-5xl lg:text-[4.5rem] font-black tracking-[-0.03em] leading-[1.05] text-transparent bg-clip-text pb-[0.1em]"
                                    style={{ backgroundImage: 'linear-gradient(135deg, oklch(0.55 0.18 340) 0%, oklch(0.65 0.22 355) 50%, oklch(0.58 0.16 320) 100%)' }}
                                    initial={{ opacity: 0, y: '0.3em', filter: 'blur(4px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: '-0.25em', filter: 'blur(2px)' }}
                                    transition={{ duration: 0.35, ease: [0.25, 0, 0.35, 1] }}
                                >
                                    {rotatingWords[wordIndex]}
                                </motion.span>
                            </AnimatePresence>
                            <span className="block text-xl sm:text-2xl lg:text-[2rem] font-medium tracking-[-0.01em] leading-tight text-zinc-700 dark:text-zinc-300 mt-1">
                                {t('hero.title_2')}
                            </span>
                        </motion.h1>

                        <motion.p
                            className="mb-8 max-w-lg text-base sm:text-[1.0625rem] text-muted-foreground leading-relaxed font-light"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        >
                            {t('hero.description')}
                        </motion.p>

                        {/* Search bar */}
                        <HeroSearch />

                        {/* Stats — hidden for now, uncomment when needed */}
                        {/* <div className="mt-8 flex justify-center">
                            <HeroStats />
                        </div> */}
                    </div>
                </section>

                {/* ── Service Categories ── */}
                <ServiceCategories />

                {/* ── Featured Masters ── */}
                <FeaturedMasters />

                {/* ── How It Works ── */}
                <section className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 mt-4 mb-8 relative z-20">
                    <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground mb-10 lg:mb-12">
                        {t('cta.how_it_works')}
                    </h2>

                    <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-0">
                        {/* Step 1 */}
                        <div className="flex-1 flex items-start gap-4 rounded-2xl bg-muted/40 p-5 lg:flex-col lg:items-center lg:text-center lg:bg-transparent lg:p-6">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary lg:h-14 lg:w-14 lg:rounded-2xl">
                                <MagnifyingGlass size={20} weight="fill" className="lg:hidden" />
                                <MagnifyingGlass size={26} weight="fill" className="hidden lg:block" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 lg:justify-center lg:mb-1">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground lg:h-6 lg:w-6 lg:text-xs">1</span>
                                    <span className="text-sm font-semibold text-foreground lg:text-base">{t('cta.step1_title')}</span>
                                </div>
                                <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed lg:mt-2 lg:text-sm">{t('cta.step1_desc')}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-center lg:pt-10">
                            <div className="h-1.5 w-1.5 rounded-full bg-border" />
                        </div>

                        {/* Step 2 */}
                        <div className="flex-1 flex items-start gap-4 rounded-2xl bg-muted/40 p-5 lg:flex-col lg:items-center lg:text-center lg:bg-transparent lg:p-6">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary lg:h-14 lg:w-14 lg:rounded-2xl">
                                <Star size={20} weight="fill" className="lg:hidden" />
                                <Star size={26} weight="fill" className="hidden lg:block" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 lg:justify-center lg:mb-1">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground lg:h-6 lg:w-6 lg:text-xs">2</span>
                                    <span className="text-sm font-semibold text-foreground lg:text-base">{t('cta.step2_title')}</span>
                                </div>
                                <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed lg:mt-2 lg:text-sm">{t('cta.step2_desc')}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-center lg:pt-10">
                            <div className="h-1.5 w-1.5 rounded-full bg-border" />
                        </div>

                        {/* Step 3 */}
                        <div className="flex-1 flex items-start gap-4 rounded-2xl bg-muted/40 p-5 lg:flex-col lg:items-center lg:text-center lg:bg-transparent lg:p-6">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary lg:h-14 lg:w-14 lg:rounded-2xl">
                                <ChatCircleDots size={20} weight="fill" className="lg:hidden" />
                                <ChatCircleDots size={26} weight="fill" className="hidden lg:block" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 lg:justify-center lg:mb-1">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground lg:h-6 lg:w-6 lg:text-xs">3</span>
                                    <span className="text-sm font-semibold text-foreground lg:text-base">{t('cta.step3_title')}</span>
                                </div>
                                <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed lg:mt-2 lg:text-sm">{t('cta.step3_desc')}</p>
                            </div>
                        </div>
                    </div>

                    {/* CTA for masters */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="mt-16 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center"
                    >
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                            <Users size={24} weight="duotone" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">
                            {t('landing.for_masters_title')}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                            {t('landing.for_masters_desc')}
                        </p>
                        <Link
                            href="/register"
                            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:-translate-y-px active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
                        >
                            {t('landing.for_masters_btn')}
                            <ArrowRight size={14} weight="bold" />
                        </Link>
                    </motion.div>
                </section>

                {/* ── Blog ── */}
                <HomeBlogSection />

            </main>

            <Footer />
            <MobileBottomNav />
        </div>
    );
}
