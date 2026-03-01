'use client';

import * as React from 'react';
import { motion } from 'motion/react';

import { Character } from './Character';

export function TypingIndicator(): React.ReactElement {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex items-end gap-2"
        >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/8">
                <Character state="thinking" size={22} />
            </div>

            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-muted/80 px-4 py-3">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-primary/40"
                        animate={{
                            y: [0, -4, 0],
                            scale: [1, 1.2, 1],
                            opacity: [0.4, 0.9, 0.4],
                        }}
                        transition={{
                            duration: 0.7,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: 'easeInOut',
                        }}
                    />
                ))}
            </div>
        </motion.div>
    );
}
