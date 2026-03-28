'use client';

import Link from 'next/link';
import { Eye, HandSoap, Scissors, Sparkle, FlowerLotus, ArrowRight, MagicWand } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useServiceCategories } from '@/features/profile/hooks/useCatalog';
import { useNicheCounts } from '@/features/masters/hooks/useNicheCounts';
import { ROUTES } from '@/lib/constants/routes';
import type { IconProps } from '@phosphor-icons/react';

const NICHE_ICONS: Record<string, React.ComponentType<IconProps>> = {
    'lashes-brows':     Eye,
    nails:              HandSoap,
    'permanent-makeup': Sparkle,
    makeup:             Sparkle,
    hair:               Scissors,
    skincare:           FlowerLotus,
    waxing:             Sparkle,
    body:               Sparkle,
    retouch:            MagicWand,
    other:              Sparkle,
};

const NICHE_COLORS: Record<string, string> = {
    'lashes-brows':     'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    nails:              'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    'permanent-makeup': 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    makeup:             'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    hair:               'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    skincare:           'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    waxing:             'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    body:               'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    retouch:            'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400',
    other:              'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};

export function ServiceCategories(): React.ReactElement | null {
    const { t } = useLanguage();
    const { categories: specialities, isLoading } = useServiceCategories();
    const { counts } = useNicheCounts();

    if (isLoading) {
        return (
            <section className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/60" />
                    ))}
                </div>
            </section>
        );
    }

    if (specialities.length === 0) return null;

    return (
        <section className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5 }}
                className="text-center mb-8"
            >
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    {t('landing.categories_title')}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    {t('landing.categories_subtitle')}
                </p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {specialities.map((spec, i) => {
                    const Icon = NICHE_ICONS[spec.slug] ?? Sparkle;
                    const colorClass = NICHE_COLORS[spec.slug] ?? 'bg-primary/10 text-primary';

                    return (
                        <motion.div
                            key={spec.slug}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: i * 0.06 }}
                        >
                            <Link
                                href={`${ROUTES.MASTERS}?niche=${spec.slug}`}
                                className="group flex flex-col items-center gap-3 rounded-2xl border border-border/40 bg-card/60 p-5 transition-all duration-300 hover:border-border hover:shadow-md hover:-translate-y-0.5"
                            >
                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClass} transition-transform duration-300 group-hover:scale-110`}>
                                    <Icon size={24} weight="duotone" />
                                </div>
                                <span className="text-sm font-semibold text-foreground text-center leading-tight">
                                    {spec.label}
                                </span>
                                {counts[spec.slug] != null && (
                                    <span className="text-xs text-muted-foreground tabular-nums">
                                        {counts[spec.slug]} {t('landing.categories_masters_count')}
                                    </span>
                                )}
                                <ArrowRight
                                    size={14}
                                    className="text-muted-foreground/0 transition-all duration-200 group-hover:text-primary group-hover:translate-x-0.5"
                                />
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}
