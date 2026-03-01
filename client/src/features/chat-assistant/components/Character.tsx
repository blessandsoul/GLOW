'use client';

import * as React from 'react';
import { motion } from 'motion/react';

import type { CharacterState } from '../types';

interface CharacterProps {
    state: CharacterState;
    size?: number;
    className?: string;
}

export function Character({
    state,
    size = 48,
    className,
}: CharacterProps): React.ReactElement {
    const isSleeping = state === 'sleeping';
    const isHappy = state === 'happy';
    const isThinking = state === 'thinking';
    const isTalking = state === 'talking';
    const isListening = state === 'listening';

    // Base pulse logic based on state
    const getPulseScale = () => {
        if (isListening) return [1, 1.15, 1];
        if (isThinking) return [1, 0.95, 1];
        if (isTalking) return [1, 1.05, 1];
        if (isSleeping) return [1, 0.95, 1];
        return [1, 1.02, 1]; // idle
    };

    const getPulseDuration = () => {
        if (isListening) return 1.5;
        if (isThinking) return 2;
        if (isTalking) return 0.5;
        if (isSleeping) return 3;
        return 2.5; // idle
    };

    const ringRadii = [
        80, 97, 114, 131, 148, 165, 182, 199,
        216, 233, 250, 267, 284, 301, 318, 335, 352, 369
    ];

    const ringStrokeWidths = [
        12.0, 11.4, 10.9, 10.3, 9.8, 9.2, 8.6, 8.1,
        7.5, 7.0, 6.4, 5.8, 5.3, 4.7, 4.2, 3.6, 3.0, 2.5
    ];

    const ringOpacities = [
        0.90, 0.85, 0.80, 0.75, 0.70, 0.65, 0.60, 0.55,
        0.50, 0.45, 0.40, 0.35, 0.30, 0.25, 0.20, 0.15, 0.10, 0.05
    ];

    return (
        <motion.svg
            viewBox="0 0 1024 1024"
            width={size}
            height={size}
            className={className}
            style={{ overflow: 'visible' }}
            animate={
                state === 'idle' ? { y: [0, -6, 0] }
                    : state === 'sleeping' ? { y: [0, 6, 0] }
                        : state === 'happy' ? { y: -12, scale: 1.15 }
                            : state === 'talking' ? { y: [0, -4, 0] }
                                : state === 'thinking' ? { y: [-2, 2, -2] }
                                    : undefined
            }
            transition={{
                repeat: Infinity,
                duration: state === 'thinking' ? 2.5 : state === 'talking' ? 0.4 : 3.5,
                ease: 'easeInOut'
            }}
        >
            <defs>
                <radialGradient id="bokeh-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#B490F5" stopOpacity="0.20" />
                    <stop offset="50%" stopColor="#CAA2DD" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="#F0C060" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="ring-grad" x1="10%" y1="10%" x2="90%" y2="90%">
                    <stop offset="0%" stopColor="#B490F5" />
                    <stop offset="40%" stopColor="#D7A4CC" />
                    <stop offset="100%" stopColor="#F0C060" />
                </linearGradient>
            </defs>

            <g transform="translate(512, 512)">
                {/* Transparent Concentric rings */}
                {ringRadii.map((radius, i) => (
                    <motion.circle
                        key={i}
                        cx="0" cy="0"
                        r={radius}
                        fill="none"
                        stroke="url(#ring-grad)"
                        strokeWidth={ringStrokeWidths[i]}
                        opacity={ringOpacities[i]}
                        animate={{
                            scale: getPulseScale(),
                            // Optional: subtle rotational or undulating effect based on state 
                            rotate: isListening ? [0, 360] : 0
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: isListening ? 20 + i : getPulseDuration(),
                            ease: isListening ? "linear" : "easeInOut",
                            delay: i * 0.02 // Creates a wave effect!
                        }}
                    />
                ))}

                {/* Center dot */}
                <motion.circle
                    cx="0" cy="0" r="40"
                    fill="#B490F5"
                    animate={{
                        scale: isTalking ? [1, 1.4, 1] : getPulseScale(),
                        opacity: isTalking ? [0.8, 1, 0.8] : 1
                    }}
                    transition={{ repeat: Infinity, duration: isTalking ? 0.3 : getPulseDuration(), ease: "easeInOut" }}
                />

            </g>
        </motion.svg>
    );
}
