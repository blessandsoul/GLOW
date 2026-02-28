'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Diamond, Sparkle, Star, TrendUp } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '@/i18n/hooks/useLanguage';

interface HeroEditorialProps {
    wordIndex: number;
    rotatingWords: string[];
}

export function HeroEditorial({ wordIndex, rotatingWords }: HeroEditorialProps): React.ReactElement {
    const { t } = useLanguage();
    const [showAfter, setShowAfter] = useState(false);
    const [hintVisible, setHintVisible] = useState(true);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const resetTimer = useCallback((): void => {
        if (timerRef.current) clearTimeout(timerRef.current);
    }, []);

    // Auto-toggle every 3s
    useEffect(() => {
        const tick = (): void => {
            timerRef.current = setTimeout(() => {
                setShowAfter((prev) => !prev);
                tick();
            }, 3000);
        };
        tick();
        return (): void => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);

    const handleToggle = useCallback((): void => {
        setShowAfter((prev) => !prev);
        setHintVisible(false);
        // Reset auto-timer so it waits another 3s after manual tap
        resetTimer();
        timerRef.current = setTimeout(function tick() {
            setShowAfter((prev) => !prev);
            timerRef.current = setTimeout(tick, 3000);
        }, 3000);
    }, [resetTimer]);

    return (
        <div className="flex flex-col items-center w-full pt-6 pb-4 px-5">

            {/* Badge */}
            <motion.div
                className="relative mb-8 inline-flex items-center gap-2 overflow-hidden rounded-full border border-primary/25 bg-white px-4 py-2 text-primary dark:bg-zinc-900 dark:border-primary/20"
                initial={{ opacity: 0, y: -8, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.15, type: 'spring', stiffness: 120, damping: 14 }}
            >
                {/* shimmer sweep */}
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
                    <Diamond size={13} weight="fill" />
                </motion.span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('header.free_photos')}</span>
            </motion.div>

            {/* Title line 1 — thin, same style as title_2 */}
            <motion.div
                className="mb-2 text-center text-xl font-light tracking-normal text-zinc-600 dark:text-zinc-400"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
            >
                {t('hero.title_1')}
            </motion.div>

            {/* HUGE rotating word — the hero focus */}
            <motion.h1
                className="mb-3 w-full text-center text-[3rem] font-black tracking-[-0.03em] leading-[1.05] overflow-visible"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
            >
                <AnimatePresence mode="wait">
                    <motion.span
                        key={rotatingWords[wordIndex]}
                        className="inline-block text-transparent bg-clip-text font-black italic pb-[0.15em] pr-[0.15em]"
                        style={{ backgroundImage: 'linear-gradient(135deg, oklch(0.55 0.18 340) 0%, oklch(0.65 0.22 355) 50%, oklch(0.58 0.16 320) 100%)' }}
                        initial={{ opacity: 0, y: '0.3em' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '-0.3em' }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        {rotatingWords[wordIndex]}
                    </motion.span>
                </AnimatePresence>
                <span className="block text-zinc-600 dark:text-zinc-400 font-light text-xl tracking-normal mt-1">
                    {t('hero.title_2')}
                </span>
            </motion.h1>

            {/* Minimal description */}
            <motion.p
                className="mb-8 text-center text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[280px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
            >
                {t('hero.description')}
            </motion.p>

            {/* Before / After tap-to-toggle card */}
            <motion.div
                className="relative w-full max-w-sm h-[275px] md:h-auto md:aspect-square rounded-2xl overflow-hidden mb-8 shadow-lg border border-zinc-100 dark:border-zinc-800 cursor-pointer select-none"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.6, type: 'spring', stiffness: 70, damping: 20 }}
                onClick={handleToggle}
                role="button"
                aria-label={showAfter ? (t('visual.show_before') ?? 'Show before') : (t('visual.show_after') ?? 'Show after')}
                tabIndex={0}
                onKeyDown={(e): void => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggle();
                    }
                }}
            >
                {/* Before image (always mounted) */}
                <Image
                    src="/before.jpg"
                    alt={t('visual.before') ?? 'Before'}
                    fill
                    sizes="(max-width: 640px) 100vw, 384px"
                    className="object-cover"
                    priority
                />

                {/* After image (crossfade overlay) */}
                <motion.div
                    className="absolute inset-0"
                    animate={{ opacity: showAfter ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                    <Image
                        src="/after.jpg"
                        alt={t('visual.after') ?? 'After'}
                        fill
                        sizes="(max-width: 640px) 100vw, 384px"
                        className="object-cover"
                    />
                </motion.div>

                {/* Subtle zoom pulse on toggle */}
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    key={showAfter ? 'after' : 'before'}
                    initial={{ scale: 1.03 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                />

                {/* Top-left state label */}
                <div className="absolute top-3 left-3 z-30 pointer-events-none">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={showAfter ? 'after-label' : 'before-label'}
                            className="flex items-center gap-1.5 rounded-lg bg-white/80 backdrop-blur-sm px-2.5 py-1 shadow-sm dark:bg-zinc-900/80"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Sparkle size={11} weight="fill" className="text-primary" />
                            <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                                {showAfter ? (t('visual.after') ?? 'After') : (t('visual.before') ?? 'Before')}
                            </span>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Bottom-left tap hint — fades after first tap */}
                <AnimatePresence>
                    {hintVisible && (
                        <motion.div
                            className="absolute bottom-3 left-3 z-30 pointer-events-none"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="rounded-lg bg-black/50 backdrop-blur-sm px-2.5 py-1 shadow-sm">
                                <span className="text-[10px] font-semibold text-white/90">
                                    {t('visual.tap') ?? 'Touch'}
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Full-width CTA */}
            <motion.div
                className="flex flex-col gap-3 w-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
            >
                {/* ── Primary CTA ── solid brand + shimmer */}
                <Link
                    href="/register"
                    className="group relative inline-flex w-full h-14 cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-[0_4px_24px_-4px_color-mix(in_oklch,var(--primary)_55%,transparent)] transition-all duration-300 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
                >
                    {/* gloss top line */}
                    <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/50 to-transparent" />
                    {/* shimmer sweep */}
                    <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-18deg] bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-active:translate-x-[200%]" />
                    <span className="relative z-10">{t('hero.btn_start')}</span>
                    <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/20 ring-1 ring-primary-foreground/30">
                        <ArrowRight size={12} weight="bold" />
                    </span>
                </Link>

            </motion.div>

            {/* Stats row — mobile */}
            <motion.div
                className="mt-8 w-full"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
            >
                {/* Row 1: avatars + title + online dot */}
                <div className="flex items-center gap-3">
                    {/* Avatar stack with real photos */}
                    <div className="flex -space-x-2">
                        {[
                            'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=56&h=56&fit=crop&crop=face',
                            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=56&h=56&fit=crop&crop=face',
                            'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=56&h=56&fit=crop&crop=face',
                        ].map((src, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.35, delay: 0.92 + i * 0.07, type: 'spring', stiffness: 260, damping: 20 }}
                                className="relative h-8 w-8 rounded-full border-2 border-background shadow-sm overflow-hidden"
                            >
                                <Image
                                    src={src}
                                    alt="master"
                                    fill
                                    sizes="32px"
                                    className="object-cover"
                                />
                            </motion.div>
                        ))}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.35, delay: 1.13, type: 'spring', stiffness: 260, damping: 20 }}
                            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-[9px] font-black text-primary shadow-sm ring-1 ring-primary/20"
                        >
                            +2k
                        </motion.div>
                    </div>

                    {/* Text + pulse */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            </span>
                            <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                                {t('hero.stats_title')}
                            </span>
                        </div>
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 leading-none mt-0.5">
                            {t('hero.stats_desc')}
                        </span>
                    </div>
                </div>

                {/* Row 2: three mini metrics */}
                <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <Star size={10} weight="fill" className="text-amber-400" />
                        <span className="text-[12px] font-black text-zinc-900 dark:text-white tabular-nums">4.9</span>
                        <span className="text-[9px] font-medium uppercase tracking-wider text-zinc-400 ml-0.5">{t('hero.stats_label_rating') ?? 'rating'}</span>
                    </div>
                    <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-700" />
                    <div className="flex items-center gap-1">
                        <TrendUp size={10} weight="fill" className="text-emerald-500" />
                        <span className="text-[12px] font-black text-zinc-900 dark:text-white">#1</span>
                        <span className="text-[9px] font-medium uppercase tracking-wider text-zinc-400 ml-0.5">{t('hero.stats_label_rank_geo') ?? 'საქართველოში'}</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
