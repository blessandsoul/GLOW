'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useServiceCategories } from '@/features/profile/hooks/useCatalog';
import { useNicheCounts } from '@/features/masters/hooks/useNicheCounts';
import { ROUTES } from '@/lib/constants/routes';

const NICHE_IMAGES: Record<string, string> = {
    'lashes-brows':     '/categories/lash.jpg',
    nails:              '/categories/nail.jpg',
    'permanent-makeup': '/categories/permanent.jpg',
    makeup:             '/categories/makeup.jpg',
    hair:               '/categories/hair.jpg',
    skincare:           '/categories/skinandbody.jpg',
    waxing:             '/categories/skinandbody.jpg',
    body:               '/categories/skinandbody.jpg',
    retouch:            '/categories/retouch.jpg',
    other:              '/categories/tattoo.jpg',
};

const NICHE_GRADIENTS: Record<string, string> = {
    'lashes-brows':     'from-violet-900/70 to-violet-700/40',
    nails:              'from-pink-900/70 to-pink-700/40',
    'permanent-makeup': 'from-rose-900/70 to-rose-700/40',
    makeup:             'from-rose-900/70 to-rose-700/40',
    hair:               'from-sky-900/70 to-sky-700/40',
    skincare:           'from-emerald-900/70 to-emerald-700/40',
    waxing:             'from-amber-900/70 to-amber-700/40',
    body:               'from-teal-900/70 to-teal-700/40',
    retouch:            'from-fuchsia-900/70 to-fuchsia-700/40',
    other:              'from-purple-900/70 to-purple-700/40',
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
                        <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted/60" />
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
                    const imgSrc = NICHE_IMAGES[spec.slug];
                    const gradient = NICHE_GRADIENTS[spec.slug] ?? 'from-gray-900/70 to-gray-700/40';

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
                                className="group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-border/40 transition-all duration-300 hover:border-border hover:shadow-lg hover:-translate-y-0.5 h-40"
                            >
                                {imgSrc ? (
                                    <Image
                                        src={imgSrc}
                                        alt={spec.label}
                                        fill
                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-muted" />
                                )}
                                {/* gradient overlay */}
                                <div className={`absolute inset-0 bg-gradient-to-t ${gradient}`} />
                                {/* text */}
                                <div className="relative z-10 p-3 flex flex-col gap-1">
                                    <span className="text-sm font-semibold text-white leading-tight drop-shadow-sm">
                                        {spec.label}
                                    </span>
                                    {counts[spec.slug] != null && (
                                        <span className="text-[11px] text-white/70 tabular-nums">
                                            {counts[spec.slug]} {t('landing.categories_masters_count')}
                                        </span>
                                    )}
                                </div>
                                {/* hover arrow */}
                                <ArrowRight
                                    size={14}
                                    className="absolute top-3 right-3 z-10 text-white/0 transition-all duration-200 group-hover:text-white group-hover:translate-x-0.5"
                                />
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}
