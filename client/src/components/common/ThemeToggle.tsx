'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/hooks/useLanguage';

export function ThemeToggle(): React.ReactElement {
    const { t } = useLanguage();
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = resolvedTheme === 'dark';

    const toggle = (): void => {
        setTheme(isDark ? 'light' : 'dark');
    };

    return (
        <button
            onClick={toggle}
            aria-label={t('ui.text_10vvk3')}
            className="relative h-9 w-9 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-200 cursor-pointer overflow-hidden"
        >
            <AnimatePresence mode="wait" initial={false}>
                {!mounted ? (
                    <span key="placeholder" className="absolute opacity-0 pointer-events-none">
                        <Sun size={16} />
                    </span>
                ) : isDark ? (
                    <motion.span
                        key="moon"
                        initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute"
                    >
                        <Moon size={16} weight="fill" />
                    </motion.span>
                ) : (
                    <motion.span
                        key="sun"
                        initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute"
                    >
                        <Sun size={16} weight="fill" />
                    </motion.span>
                )}
            </AnimatePresence>
        </button>
    );
}
