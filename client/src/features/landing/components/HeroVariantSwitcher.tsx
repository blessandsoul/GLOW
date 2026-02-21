'use client';

import { motion } from 'motion/react';
import { Image, TextAa, Layout } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export type HeroVariant = 'fullscreen' | 'centered' | 'editorial';

interface HeroVariantSwitcherProps {
    current: HeroVariant;
    onChange: (variant: HeroVariant) => void;
}

const VARIANTS: { key: HeroVariant; label: string; icon: typeof Image }[] = [
    { key: 'fullscreen', label: 'Full', icon: Image },
    { key: 'centered', label: 'Center', icon: Layout },
    { key: 'editorial', label: 'Editorial', icon: TextAa },
];

export function HeroVariantSwitcher({ current, onChange }: HeroVariantSwitcherProps): React.ReactElement {
    return (
        <motion.div
            className="fixed bottom-6 left-1/2 z-[60] lg:hidden"
            style={{ x: '-50%' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
        >
            <div className="flex items-center gap-1 rounded-2xl border border-zinc-200/60 bg-white/90 backdrop-blur-xl p-1.5 shadow-2xl shadow-black/10 dark:border-zinc-700/60 dark:bg-zinc-900/90">
                {VARIANTS.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onChange(key)}
                        className={cn(
                            'relative flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[11px] font-semibold tracking-wide transition-all duration-200 cursor-pointer',
                            current === key
                                ? 'text-white'
                                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 active:scale-[0.96]'
                        )}
                        aria-label={`Switch to ${label} hero layout`}
                        aria-pressed={current === key}
                    >
                        {current === key && (
                            <motion.div
                                layoutId="hero-switcher-pill"
                                className="absolute inset-0 rounded-xl bg-zinc-900 dark:bg-white shadow-sm"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                            <Icon
                                size={14}
                                weight={current === key ? 'fill' : 'regular'}
                                className={cn(
                                    current === key && 'dark:text-zinc-900'
                                )}
                            />
                            <span className={cn(
                                current === key && 'dark:text-zinc-900'
                            )}>
                                {label}
                            </span>
                        </span>
                    </button>
                ))}
            </div>
        </motion.div>
    );
}
