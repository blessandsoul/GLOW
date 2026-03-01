'use client';

import * as React from 'react';
import { motion } from 'motion/react';

import { Character } from './Character';
import type { CharacterState } from '../types';
import { LanguageContext } from '@/i18n/LanguageProvider';

interface ChatButtonProps {
    onClick: () => void;
    characterState: CharacterState;
    onWakeUp?: () => void;
    unreadCount?: number;
}

export function ChatButton({
    onClick,
    characterState,
    onWakeUp,
    unreadCount = 0,
}: ChatButtonProps): React.ReactElement {
    const langContext = React.useContext(LanguageContext);
    if (!langContext) {
        throw new Error('ChatButton must be used within LanguageProvider');
    }
    const { t } = langContext;

    const [isHovered, setIsHovered] = React.useState(false);
    const isSleeping = characterState === 'sleeping';

    const handleMouseEnter = (): void => {
        setIsHovered(true);
        if (isSleeping && onWakeUp) onWakeUp();
    };

    const displayState: CharacterState = isSleeping
        ? 'sleeping'
        : isHovered
          ? 'listening'
          : characterState;

    return (
        <motion.button
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-primary/20 bg-gradient-to-br from-primary/90 to-primary shadow-lg shadow-primary/20 transition-shadow hover:shadow-xl hover:shadow-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 md:h-16 md:w-16"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            aria-label={t('chat.title')}
        >
            {/* Outer glow ring */}
            <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                    background:
                        'radial-gradient(circle, oklch(0.58 0.15 340 / 0.25) 0%, transparent 70%)',
                }}
                animate={
                    isSleeping
                        ? {
                              scale: [1, 1.05, 1],
                              opacity: [0.3, 0.5, 0.3],
                          }
                        : {
                              scale: [1, 1.25, 1],
                              opacity: [0.4, 0, 0.4],
                          }
                }
                transition={{
                    duration: isSleeping ? 3 : 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            {/* Character */}
            <div className="relative z-10">
                <Character state={displayState} size={38} />
            </div>

            {/* Online indicator dot */}
            <motion.div
                className="absolute -right-0.5 -top-0.5 z-20 h-3.5 w-3.5 rounded-full border-2 border-background"
                style={{
                    background: isSleeping
                        ? 'oklch(0.75 0.18 75)'
                        : 'oklch(0.527 0.185 155.024)',
                }}
                animate={
                    isSleeping
                        ? { opacity: [1, 0.4, 1] }
                        : { scale: [1, 1.15, 1] }
                }
                transition={{
                    duration: isSleeping ? 2.5 : 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            {/* Unread badge */}
            {unreadCount > 0 && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className="absolute -left-1 -top-1 z-30 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-md"
                >
                    {unreadCount > 9 ? '9+' : unreadCount}
                </motion.div>
            )}

            {/* Tooltip */}
            <motion.div
                className="pointer-events-none absolute -top-11 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground/95 px-3 py-1.5 text-xs font-medium text-background shadow-lg backdrop-blur-sm"
                initial={{ opacity: 0, y: 4 }}
                animate={{
                    opacity: isHovered ? 1 : 0,
                    y: isHovered ? 0 : 4,
                }}
                transition={{ duration: 0.15 }}
            >
                {isSleeping
                    ? t('chat.sleeping_tooltip')
                    : t('chat.active_tooltip')}
                <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-foreground/95" />
            </motion.div>
        </motion.button>
    );
}
