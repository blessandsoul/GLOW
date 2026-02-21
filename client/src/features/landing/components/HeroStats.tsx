'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Star, Camera, TrendUp } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useLanguage } from '@/i18n/hooks/useLanguage';

// ── Animated counter hook ──────────────────────────────────
function useCountUp(target: number, duration: number = 1400, start: boolean = false): number {
    const [value, setValue] = useState(0);

    useEffect(() => {
        if (!start) return;
        let startTime: number | null = null;
        const step = (timestamp: number): void => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [start, target, duration]);

    return value;
}

// ── Real master photos ─────────────────────────────────────
const MASTER_PHOTOS = [
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=72&h=72&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=72&h=72&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=72&h=72&fit=crop&crop=face',
];

function AvatarStack({ visible }: { visible: boolean }): React.ReactElement {
    const { t } = useLanguage();

    return (
        <div className="flex items-center gap-3">
            <div className="flex -space-x-2.5">
                {MASTER_PHOTOS.map((src, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.5, x: -8 }}
                        animate={visible ? { opacity: 1, scale: 1, x: 0 } : {}}
                        transition={{ duration: 0.4, delay: i * 0.08, type: 'spring', stiffness: 260, damping: 20 }}
                        className="relative h-9 w-9 rounded-full border-2 border-background shadow-sm overflow-hidden"
                    >
                        <Image src={src} alt="master" fill sizes="36px" className="object-cover" />
                    </motion.div>
                ))}

                {/* +2k badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5, x: -8 }}
                    animate={visible ? { opacity: 1, scale: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.26, type: 'spring', stiffness: 260, damping: 20 }}
                    className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-[10px] font-black tracking-tight text-primary shadow-sm ring-1 ring-primary/20"
                >
                    +2k
                </motion.div>
            </div>

            {/* Text + online dot */}
            <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={visible ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.38 }}
                className="flex flex-col"
            >
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-200">
                        {t('hero.stats_title')}
                    </span>
                </div>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-none mt-0.5">
                    {t('hero.stats_desc')}
                </span>
            </motion.div>
        </div>
    );
}

// ── Single metric ──────────────────────────────────────────
interface MetricProps {
    icon: React.ElementType;
    value: string;
    label: string;
    iconClass: string;
    visible: boolean;
    delay: number;
}

function Metric({ icon: Icon, value, label, iconClass, visible, delay }: MetricProps): React.ReactElement {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={visible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay }}
            className="flex flex-col items-start"
        >
            <div className="flex items-center gap-1">
                <Icon size={11} weight="fill" className={iconClass} />
                <span className="text-[16px] font-black tracking-tight text-zinc-900 dark:text-white tabular-nums leading-none">
                    {value}
                </span>
            </div>
            <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                {label}
            </span>
        </motion.div>
    );
}

// ── Main export ────────────────────────────────────────────
export function HeroStats(): React.ReactElement {
    const { t } = useLanguage();
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    const photos = useCountUp(50, 1600, visible);
    const rating = useCountUp(49, 1200, visible);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
            { threshold: 0.3 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 10 }}
            animate={visible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="mt-7 flex items-center gap-5 flex-wrap"
        >
            <AvatarStack visible={visible} />

            <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                animate={visible ? { opacity: 1, scaleY: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.45 }}
                className="hidden sm:block h-9 w-px origin-center bg-zinc-200 dark:bg-zinc-700/60"
            />

            <div className="flex items-center gap-5">
                <Metric
                    icon={Camera}
                    value={`${photos}K+`}
                    label={t('hero.stats_label_photos') ?? 'ფოტო'}
                    iconClass="text-primary/70"
                    visible={visible}
                    delay={0.5}
                />
                <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700/60" />
                <Metric
                    icon={Star}
                    value={`${(rating / 10).toFixed(1)}★`}
                    label={t('hero.stats_label_rating') ?? 'rating'}
                    iconClass="text-amber-400"
                    visible={visible}
                    delay={0.58}
                />
                <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700/60" />
                <Metric
                    icon={TrendUp}
                    value="#1"
                    label={t('hero.stats_label_rank_geo') ?? 'საქართველოში'}
                    iconClass="text-emerald-500 dark:text-emerald-400"
                    visible={visible}
                    delay={0.66}
                />
            </div>
        </motion.div>
    );
}
