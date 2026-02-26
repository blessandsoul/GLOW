'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowsClockwise } from '@phosphor-icons/react';
import { useLanguage } from '@/i18n/hooks/useLanguage';

interface BeforeAfterSliderProps {
    beforeSrc: string;
    afterSrc: string;
    alt: string;
    defaultPosition?: number;
    showHint?: boolean;
}

export function BeforeAfterSlider({
    beforeSrc,
    afterSrc,
    alt,
    showHint = false,
}: BeforeAfterSliderProps): React.ReactElement {
    const { t } = useLanguage();
    const [showAfter, setShowAfter] = useState(false);
    const [hintVisible, setHintVisible] = useState(showHint);

    return (
        <div
            className="relative aspect-[3/4] overflow-hidden rounded-xl select-none cursor-pointer"
            onClick={(): void => { setShowAfter((prev) => !prev); setHintVisible(false); }}
            role="button"
            aria-label={showAfter ? (t('visual.show_before') ?? 'Show before') : (t('visual.show_after') ?? 'Show after')}
            tabIndex={0}
            onKeyDown={(e): void => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowAfter((prev) => !prev);
                    setHintVisible(false);
                }
            }}
        >
            {/* Before image (always mounted) */}
            <Image
                src={beforeSrc}
                alt={`${t('ui.text_pt6') ?? 'Before'}: ${alt}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 72vw, (max-width: 1024px) 55vw, 25vw"
            />

            {/* After image (crossfade overlay) */}
            <motion.div
                className="absolute inset-0"
                animate={{ opacity: showAfter ? 1 : 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
                <Image
                    src={afterSrc}
                    alt={`${t('ui.text_gnzjzw') ?? 'After'}: ${alt}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 72vw, (max-width: 1024px) 55vw, 25vw"
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

            {/* Top-left corner label */}
            <div className="absolute top-3 left-3 z-20 pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.span
                        key={showAfter ? 'after-label' : 'before-label'}
                        className="inline-flex text-xs font-medium text-white bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.2 }}
                    >
                        {showAfter ? (t('ui.text_gnzjzw') ?? 'After') : (t('ui.text_pt6') ?? 'Before')}
                    </motion.span>
                </AnimatePresence>
            </div>

            {/* Bottom-center tap hint — only on first card, fades after first tap */}
            <AnimatePresence>
                {hintVisible && (
                    <motion.div
                        className="absolute bottom-3 inset-x-0 z-20 flex justify-center pointer-events-none"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1.5">
                            <ArrowsClockwise size={12} weight="bold" className="text-white/90" />
                            <span className="text-[10px] font-semibold text-white/90">
                                {t('visual.tap_to_compare') ?? 'Tap to compare'}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
