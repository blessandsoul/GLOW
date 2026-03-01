'use client';

import * as React from 'react';
import { motion } from 'motion/react';

import { Character } from './Character';

export function TypingIndicator(): React.ReactElement {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2"
        >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Character state="thinking" size={28} />
            </div>

            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="h-2 w-2 rounded-full bg-muted-foreground/50"
                        animate={{
                            y: [0, -5, 0],
                            opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                        }}
                    />
                ))}
            </div>
        </motion.div>
    );
}
