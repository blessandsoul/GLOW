'use client';

import * as React from 'react';
import { motion } from 'motion/react';

import { Character } from './Character';
import type { CharacterState } from '../types';

interface ChatButtonProps {
    onClick: () => void;
    characterState: CharacterState;
    onWakeUp?: () => void;
}

export function ChatButton({
    onClick,
    characterState,
    onWakeUp,
}: ChatButtonProps): React.ReactElement {
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
            className="relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-2 border-primary/20 bg-gradient-to-br from-primary/80 to-primary shadow-lg transition-shadow hover:shadow-xl"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
            {/* Pulse ring */}
            <motion.div
                className="absolute inset-0 rounded-full bg-primary/40"
                animate={
                    isSleeping
                        ? {
                              scale: [1, 1.05, 1],
                              opacity: [0.15, 0.25, 0.15],
                          }
                        : {
                              scale: [1, 1.2, 1],
                              opacity: [0.4, 0, 0.4],
                          }
                }
                transition={{
                    duration: isSleeping ? 3 : 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            <Character state={displayState} size={52} />

            {/* Tooltip */}
            <motion.div
                className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-3 py-1.5 text-xs text-background shadow-lg"
                initial={{ opacity: 0, y: 5 }}
                animate={{
                    opacity: isHovered ? 1 : 0,
                    y: isHovered ? 0 : 5,
                }}
                transition={{ duration: 0.2 }}
            >
                {isSleeping ? 'Разбуди меня! 😴' : 'Привет! Нужна помощь? ✨'}
                <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-foreground" />
            </motion.div>
        </motion.button>
    );
}
