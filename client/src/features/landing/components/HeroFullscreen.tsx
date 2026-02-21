'use client';

import Link from 'next/link';
import { ArrowRight, Sparkle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { ImageCompare } from '@/components/ui/ImageCompare';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '@/i18n/hooks/useLanguage';

interface HeroFullscreenProps {
    wordIndex: number;
    rotatingWords: string[];
}

export function HeroFullscreen({ wordIndex, rotatingWords }: HeroFullscreenProps): React.ReactElement {
    const { t } = useLanguage();

    return (
        <div className="relative w-full min-h-[85dvh] flex flex-col">
            {/* Full-viewport ImageCompare background */}
            <div className="absolute inset-0 z-0">
                <ImageCompare
                    beforeSrc="/before.jpg"
                    afterSrc="/after.jpg"
                    beforeAlt={t('visual.before')}
                    afterAlt={t('visual.after')}
                    initialPosition={40}
                    className="h-full w-full"
                />
                {/* Dark gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 pointer-events-none z-10" />
            </div>

            {/* Content overlay - pinned to bottom */}
            <div className="relative z-20 mt-auto px-5 pb-8 pt-16 flex flex-col items-start">
                {/* Badge */}
                <motion.div
                    className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-3.5 py-1.5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Sparkle size={13} weight="fill" className="text-white" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">{t('hero.badge')}</span>
                </motion.div>

                {/* Title */}
                <motion.h1
                    className="mb-4 text-[2rem] font-extrabold tracking-tight text-white leading-[1.08] max-w-[320px]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                >
                    <span>{t('hero.title_1')}</span>
                    <br />
                    <span className="inline-block relative h-[1.15em] align-bottom">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={rotatingWords[wordIndex]}
                                className="inline-block text-primary italic pr-[0.1em]"
                                initial={{ opacity: 0, y: '0.3em' }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: '-0.3em' }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                            >
                                {rotatingWords[wordIndex]}
                            </motion.span>
                        </AnimatePresence>
                    </span>
                    {' '}
                    <span>{t('hero.title_2')}</span>
                </motion.h1>

                {/* Description */}
                <motion.p
                    className="mb-6 text-sm text-white/70 leading-relaxed max-w-[300px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                >
                    {t('hero.description')}
                </motion.p>

                {/* Single bold CTA */}
                <motion.div
                    className="w-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                >
                    <Button
                        size="lg"
                        className="w-full h-14 rounded-2xl bg-white text-zinc-900 hover:bg-white/90 px-8 text-base font-semibold shadow-2xl shadow-black/20 transition-all active:scale-[0.98] group"
                        asChild
                    >
                        <Link href="/register">
                            {t('hero.btn_start')}
                            <ArrowRight size={16} weight="bold" className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                </motion.div>

                {/* Subtle swipe hint */}
                <motion.div
                    className="mt-4 flex items-center justify-center w-full gap-2 text-white/40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1 }}
                >
                    <span className="text-[11px] font-medium tracking-wide">{t('visual.before')}</span>
                    <div className="w-8 h-px bg-white/30" />
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-white/50">
                        <path d="M4.5 3L1.5 7L4.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9.5 3L12.5 7L9.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="w-8 h-px bg-white/30" />
                    <span className="text-[11px] font-medium tracking-wide">{t('visual.after')}</span>
                </motion.div>
            </div>
        </div>
    );
}
