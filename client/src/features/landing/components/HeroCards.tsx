'use client';

import { useState, useRef } from 'react';
import type { ReactElement } from 'react';
import { Sparkle } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { ImageCompare } from '@/components/ui/ImageCompare';
import { useLanguage } from '@/i18n/hooks/useLanguage';

const CARD_SPRING = { type: 'spring', stiffness: 80, damping: 20, mass: 1 } as const;

const DRAG_THRESHOLD = 6;

export function HeroCards(): ReactElement {
    const { t } = useLanguage();
    const [swapped, setSwapped] = useState(false);
    const [hintDismissed, setHintDismissed] = useState(false);

    const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

    // Card A = initially main (foreground right), Card B = initially secondary (background left)
    // When swapped=false: A is foreground, B is background (clickable)
    // When swapped=true: B is foreground, A is background (clickable)

    function handleSwap(): void {
        setSwapped((s) => !s);
        setHintDismissed(true);
    }

    function handlePointerDown(e: React.PointerEvent<HTMLDivElement>): void {
        pointerDownPos.current = { x: e.clientX, y: e.clientY };
    }

    function handleClick(e: React.MouseEvent<HTMLDivElement>): void {
        if (!pointerDownPos.current) return;
        const dx = e.clientX - pointerDownPos.current.x;
        const dy = e.clientY - pointerDownPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) return;
        handleSwap();
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSwap();
        }
    }

    return (
        <>
            {/* Card A — Initially Main/Foreground (right side) */}
            <motion.div
                animate={
                    swapped
                        ? { rotate: -6, scale: 0.88, opacity: 0.75, rotateY: 8 }
                        : { rotate: 3, scale: 1, opacity: 1, rotateY: 0 }
                }
                transition={CARD_SPRING}
                onPointerDown={swapped ? handlePointerDown : undefined}
                onClick={swapped ? handleClick : undefined}
                onKeyDown={swapped ? handleKeyDown : undefined}
                tabIndex={swapped ? 0 : undefined}
                whileHover={swapped ? { scale: 0.91 } : undefined}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-[380px] h-[520px] rounded-[2.5rem] bg-card p-3 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] border border-border/50"
                style={{ zIndex: swapped ? 10 : 20, cursor: swapped ? 'pointer' : 'default', transformPerspective: 1000 }}
                role={swapped ? 'button' : undefined}
                aria-label={swapped ? 'Switch card view' : undefined}
            >
                <div className="w-full h-full rounded-[2rem] bg-muted overflow-hidden relative">
                    <ImageCompare
                        beforeSrc="/before-skin.jpeg"
                        afterSrc="/after-skin.png"
                        beforeAlt={t('visual.before')}
                        afterAlt={t('visual.after')}
                        initialPosition={40}
                        className="h-full w-full"
                    />
                    <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl bg-card/90 backdrop-blur-md p-4 shadow-xl dark:bg-card/90 border border-border/20 dark:border-border/50 z-30 pointer-events-none">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Sparkle size={20} weight="fill" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-card-foreground">{t('visual.lux')}</div>
                                <div className="text-xs font-medium text-muted-foreground">{t('visual.completed')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Card B — Initially Secondary/Background (left side, clickable) */}
            <motion.div
                animate={
                    swapped
                        ? { rotate: 3, scale: 1, opacity: 1, rotateY: 0 }
                        : { rotate: -6, scale: 0.88, opacity: 0.75, rotateY: -8 }
                }
                transition={CARD_SPRING}
                onPointerDown={!swapped ? handlePointerDown : undefined}
                onClick={!swapped ? handleClick : undefined}
                onKeyDown={!swapped ? handleKeyDown : undefined}
                tabIndex={!swapped ? 0 : undefined}
                whileHover={!swapped ? { scale: 0.91 } : undefined}
                className="absolute left-4 top-16 w-75 h-100 rounded-[2.5rem] bg-card/80 backdrop-blur-xl p-3 shadow-2xl border border-border/50 dark:bg-card/80 dark:border-border/50"
                style={{ zIndex: swapped ? 20 : 10, cursor: !swapped ? 'pointer' : 'default', transformPerspective: 1000 }}
                role={!swapped ? 'button' : undefined}
                aria-label={!swapped ? 'Switch card view' : undefined}
            >
                <div className="w-full h-full rounded-[2rem] bg-muted overflow-hidden relative">
                    <ImageCompare
                        beforeSrc="/before-nails.jpeg"
                        afterSrc="/after-nails.png"
                        beforeAlt={t('visual.before')}
                        afterAlt={t('visual.after')}
                        initialPosition={60}
                        className="h-full w-full"
                    />

                    {/* Hint overlay — shown until first click */}
                    {!hintDismissed && (
                        <div className="absolute inset-0 flex items-end justify-center pb-6 pointer-events-none z-40">
                            {/* TODO: add i18n key for this string */}
                            <div className="flex items-center gap-1.5 rounded-full bg-foreground/60 backdrop-blur-sm px-3 py-1.5 text-background text-xs font-medium">
                                <span>↑</span>
                                <span>tap to switch</span>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </>
    );
}
