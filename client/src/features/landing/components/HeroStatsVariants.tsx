'use client';

import { Star, Lightning, Camera, TrendUp, CheckCircle, Sparkle, Users, Image as ImageIcon } from '@phosphor-icons/react';
import { useLanguage } from '@/i18n/hooks/useLanguage';

// ─────────────────────────────────────────────
// VARIANT A — Rating stars (Product Hunt / App Store style)
// Звёзды + оценка + подпись
// ─────────────────────────────────────────────
export function StatsVariantA(): React.ReactElement {
    const { t } = useLanguage();
    return (
        <div className="mt-10 inline-flex items-center gap-3.5 rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-3 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-900/60">
            {/* Stars cluster */}
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            size={13}
                            weight="fill"
                            className="text-amber-400"
                        />
                    ))}
                </div>
                <span className="mt-0.5 text-[10px] font-black tracking-tight text-zinc-800 dark:text-zinc-200">4.9 / 5</span>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />

            {/* Text */}
            <div>
                <div className="text-[13px] font-semibold leading-tight text-zinc-800 dark:text-zinc-100">
                    {t('hero.stats_title')}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {t('hero.stats_desc')}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// VARIANT B — Three inline metrics (Stripe / Linear style)
// Три числа в строку с иконками
// ─────────────────────────────────────────────
export function StatsVariantB(): React.ReactElement {
    const { t } = useLanguage();

    const metrics = [
        { icon: ImageIcon, value: '50K+', label: t('hero.stats_desc_short') ?? 'ფოტო' },
        { icon: Users,     value: '2K+',  label: t('hero.stats_masters') ?? 'მასტერი' },
        { icon: Star,      value: '4.9',  label: t('hero.stats_rating')  ?? 'რეიტინგი' },
    ];

    return (
        <div className="mt-10 flex items-center gap-0">
            {metrics.map((m, i) => (
                <div key={i} className="flex items-center">
                    <div className="flex flex-col items-start px-4 first:pl-0">
                        <div className="flex items-center gap-1.5">
                            <m.icon size={12} weight="fill" className="text-primary/70" />
                            <span className="text-[17px] font-black tracking-tight text-zinc-900 dark:text-white tabular-nums">
                                {m.value}
                            </span>
                        </div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            {m.label}
                        </span>
                    </div>
                    {i < metrics.length - 1 && (
                        <div className="h-7 w-px bg-zinc-200 dark:bg-zinc-700/60" />
                    )}
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────
// VARIANT C — Trust badges row (icon + count)
// Instagram / Google / TrendUp иконки
// ─────────────────────────────────────────────
export function StatsVariantC(): React.ReactElement {
    const { t } = useLanguage();

    const badges = [
        {
            icon: Camera,
            label: '50K+',
            sub: t('hero.stats_desc_short') ?? 'ფოტო',
            color: 'text-primary',
            bg: 'bg-primary/8 dark:bg-primary/10',
            ring: 'ring-primary/15',
        },
        {
            icon: Star,
            label: '4.9★',
            sub: t('hero.stats_rating') ?? 'შეფასება',
            color: 'text-amber-500',
            bg: 'bg-amber-50 dark:bg-amber-900/15',
            ring: 'ring-amber-200/60 dark:ring-amber-700/30',
        },
        {
            icon: TrendUp,
            label: '#1',
            sub: t('hero.stats_rank') ?? 'Georgia',
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-900/15',
            ring: 'ring-emerald-200/60 dark:ring-emerald-700/30',
        },
    ];

    return (
        <div className="mt-10 flex items-center gap-2.5">
            {badges.map((b, i) => (
                <div
                    key={i}
                    className={`flex items-center gap-2 rounded-xl ${b.bg} px-3 py-2 ring-1 ${b.ring}`}
                >
                    <b.icon size={14} weight="fill" className={b.color} />
                    <div>
                        <div className={`text-[13px] font-black leading-none tracking-tight ${b.color}`}>
                            {b.label}
                        </div>
                        <div className="text-[9px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-0.5">
                            {b.sub}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────
// VARIANT D — Pill tags (Vercel / Next.js style)
// Маленькие chips с иконкой и фактом
// ─────────────────────────────────────────────
export function StatsVariantD(): React.ReactElement {
    const { t } = useLanguage();

    const pills = [
        { icon: CheckCircle, text: t('hero.pill_free')   ?? 'უფასო', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-800/40' },
        { icon: Lightning,   text: t('hero.pill_speed')  ?? '5 წამი', color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-800/40' },
        { icon: ImageIcon,   text: t('hero.pill_photos') ?? '50K+ ფოტო', color: 'text-primary',                     bg: 'bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/15' },
        { icon: Sparkle,     text: t('hero.pill_ai')     ?? 'AI რეტუში', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200/70 dark:border-violet-800/40' },
    ];

    return (
        <div className="mt-10 flex flex-wrap items-center gap-2">
            {pills.map((p, i) => (
                <div
                    key={i}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold ${p.bg} ${p.color}`}
                >
                    <p.icon size={12} weight="fill" />
                    {p.text}
                </div>
            ))}
        </div>
    );
}
