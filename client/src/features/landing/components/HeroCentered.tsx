'use client';

import Link from 'next/link';
import { ArrowRight, Sparkle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { ImageCompare } from '@/components/ui/ImageCompare';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '@/i18n/hooks/useLanguage';

interface HeroCenteredProps {
    wordIndex: number;
    rotatingWords: string[];
}

export function HeroCentered({ wordIndex, rotatingWords }: HeroCenteredProps): React.ReactElement {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col items-center w-full pt-8 pb-4 px-5">
            {/* Badge */}
            <motion.div
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-4 py-1.5 text-primary dark:bg-primary/10 dark:border-primary/25"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <Sparkle size={13} weight="fill" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('hero.badge')}</span>
            </motion.div>

            {/* Big centered title */}
            <motion.h1
                className="mb-5 text-center text-[2.5rem] font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.05]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
            >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 dark:from-white dark:via-zinc-300 dark:to-white">
                    {t('hero.title_1')}
                </span>
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
                className="mb-8 text-center text-base text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[340px]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
            >
                {t('hero.description')}
            </motion.p>

            {/* Two stacked buttons */}
            <motion.div
                className="flex flex-col gap-3 w-full max-w-[340px] mb-10"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
            >
                <Button
                    size="lg"
                    className="w-full h-14 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 px-8 text-base font-semibold shadow-xl shadow-zinc-900/10 transition-all active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 group"
                    asChild
                >
                    <Link href="/register">
                        {t('hero.btn_start')}
                        <ArrowRight size={16} weight="bold" className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </Button>
            </motion.div>

            {/* Floating before/after card */}
            <motion.div
                className="relative w-full max-w-[360px] aspect-[3/4] rounded-[2rem] bg-white p-2.5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.12)] border border-zinc-100/80 dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.6, type: 'spring', stiffness: 60, damping: 20 }}
            >
                <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative">
                    <ImageCompare
                        beforeSrc="/before.jpg"
                        afterSrc="/after.jpg"
                        beforeAlt={t('visual.before')}
                        afterAlt={t('visual.after')}
                        initialPosition={40}
                        className="h-full w-full"
                    />

                    {/* Floating result badge */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-xl bg-white/90 backdrop-blur-md p-3 shadow-lg dark:bg-zinc-900/90 border border-white/20 dark:border-zinc-700/50 z-30 pointer-events-none">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Sparkle size={18} weight="fill" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-bold text-zinc-900 dark:text-white truncate">{t('visual.lux')}</div>
                            <div className="text-xs font-medium text-zinc-500 truncate">{t('visual.completed')}</div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
