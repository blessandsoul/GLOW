'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import type { TargetAndTransition } from 'motion/react';

import type { CharacterState } from '../types';

interface CharacterProps {
    state: CharacterState;
    size?: number;
    className?: string;
}

const BODY_ANIMATIONS: Record<CharacterState, TargetAndTransition> = {
    idle: { y: [0, -4, 0], rotate: [0, 1, 0, -1, 0] },
    listening: { y: [0, -3, 0], scale: [1, 1.05, 1] },
    thinking: { y: [0, -2, 0], rotate: [0, -3, 0, 3, 0] },
    talking: { y: [0, -3, 0], scale: [1, 1.03, 1, 1.05, 1] },
    happy: { y: [0, -8, 0], scale: [1, 1.1, 1] },
    sleeping: { y: [0, 3, 0], scale: [1, 0.97, 1] },
};

const BODY_DURATIONS: Record<CharacterState, number> = {
    idle: 3,
    listening: 1.8,
    thinking: 2.5,
    talking: 0.6,
    happy: 0.8,
    sleeping: 4,
};

export function Character({
    state,
    size = 48,
    className,
}: CharacterProps): React.ReactElement {
    const uid = React.useId().replace(/:/g, '');
    const duration = BODY_DURATIONS[state];

    return (
        <motion.svg
            viewBox="0 0 200 200"
            width={size}
            height={size}
            className={className}
            style={{ overflow: 'visible' }}
            animate={BODY_ANIMATIONS[state]}
            transition={{
                repeat: Infinity,
                duration,
                ease: 'easeInOut',
            }}
        >
            <defs>
                {/* Body gradient — rose-pink to soft peach */}
                <linearGradient
                    id={`body-grad-${uid}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                >
                    <stop offset="0%" stopColor="#f9a8d4" />
                    <stop offset="50%" stopColor="#f472b6" />
                    <stop offset="100%" stopColor="#e879a8" />
                </linearGradient>

                {/* Cheek blush */}
                <radialGradient
                    id={`blush-${uid}`}
                    cx="50%"
                    cy="50%"
                    r="50%"
                >
                    <stop offset="0%" stopColor="#fb7185" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
                </radialGradient>

                {/* Body highlight */}
                <radialGradient
                    id={`highlight-${uid}`}
                    cx="35%"
                    cy="30%"
                    r="40%"
                >
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* Shadow */}
            <motion.ellipse
                cx="100"
                cy="185"
                rx="45"
                ry="8"
                fill="#000"
                opacity={0.08}
                animate={
                    state === 'happy'
                        ? { rx: [45, 35, 45], opacity: [0.08, 0.04, 0.08] }
                        : state === 'sleeping'
                          ? {
                                rx: [45, 48, 45],
                                opacity: [0.08, 0.1, 0.08],
                            }
                          : { rx: [45, 42, 45], opacity: [0.08, 0.06, 0.08] }
                }
                transition={{ repeat: Infinity, duration, ease: 'easeInOut' }}
            />

            {/* Blob body — rounded organic shape */}
            <motion.path
                d="M100 28 C145 28, 172 55, 172 100 C172 145, 145 172, 100 172 C55 172, 28 145, 28 100 C28 55, 55 28, 100 28Z"
                fill={`url(#body-grad-${uid})`}
                stroke="#f9a8d4"
                strokeWidth="1"
                strokeOpacity="0.3"
            />

            {/* Body highlight */}
            <circle
                cx="80"
                cy="70"
                r="35"
                fill={`url(#highlight-${uid})`}
            />

            {/* Left cheek blush */}
            <motion.ellipse
                cx="62"
                cy="120"
                rx="14"
                ry="10"
                fill={`url(#blush-${uid})`}
                animate={
                    state === 'happy'
                        ? { opacity: [0.7, 1, 0.7], rx: [14, 16, 14] }
                        : { opacity: 0.5 }
                }
                transition={{
                    repeat: Infinity,
                    duration: 1.2,
                    ease: 'easeInOut',
                }}
            />

            {/* Right cheek blush */}
            <motion.ellipse
                cx="138"
                cy="120"
                rx="14"
                ry="10"
                fill={`url(#blush-${uid})`}
                animate={
                    state === 'happy'
                        ? { opacity: [0.7, 1, 0.7], rx: [14, 16, 14] }
                        : { opacity: 0.5 }
                }
                transition={{
                    repeat: Infinity,
                    duration: 1.2,
                    ease: 'easeInOut',
                    delay: 0.1,
                }}
            />

            {/* Eyes */}
            <Eyes state={state} uid={uid} />

            {/* Mouth */}
            <Mouth state={state} />

            {/* Sleeping Z particles */}
            {state === 'sleeping' && <SleepingZs />}

            {/* Sparkle for happy state */}
            {state === 'happy' && <Sparkles uid={uid} />}
        </motion.svg>
    );
}

/* ── Eyes ─────────────────────────────────────────────────────────── */
/* Eye center Y = 105 (slightly below body center 100) */

function Eyes({
    state,
    uid,
}: {
    state: CharacterState;
    uid: string;
}): React.ReactElement {
    if (state === 'sleeping') {
        return (
            <g>
                <motion.path
                    d="M72 105 Q80 112, 88 105"
                    fill="none"
                    stroke="#831843"
                    strokeWidth="3"
                    strokeLinecap="round"
                    animate={{ opacity: [0.8, 0.5, 0.8] }}
                    transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: 'easeInOut',
                    }}
                />
                <motion.path
                    d="M112 105 Q120 112, 128 105"
                    fill="none"
                    stroke="#831843"
                    strokeWidth="3"
                    strokeLinecap="round"
                    animate={{ opacity: [0.8, 0.5, 0.8] }}
                    transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: 'easeInOut',
                    }}
                />
            </g>
        );
    }

    if (state === 'happy') {
        return (
            <g>
                <path
                    d="M72 108 Q80 100, 88 108"
                    fill="none"
                    stroke="#831843"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
                <path
                    d="M112 108 Q120 100, 128 108"
                    fill="none"
                    stroke="#831843"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
            </g>
        );
    }

    // Normal round eyes with pupils — centered at y=105
    // Framer Motion SVG attrs use ABSOLUTE values, not relative offsets
    const leftPupilAnimate =
        state === 'thinking'
            ? { cx: [80, 77, 80, 83, 80], cy: [105, 103, 105] }
            : state === 'listening'
              ? { cy: [105, 104, 105] }
              : undefined;

    const rightPupilAnimate =
        state === 'thinking'
            ? { cx: [120, 117, 120, 123, 120], cy: [105, 103, 105] }
            : state === 'listening'
              ? { cy: [105, 104, 105] }
              : undefined;

    return (
        <g>
            {/* Left eye white */}
            <ellipse cx="80" cy="105" rx="11" ry="12" fill="white" />
            {/* Left pupil */}
            <motion.circle
                cx="80"
                cy="105"
                r="6"
                fill="#831843"
                animate={leftPupilAnimate}
                transition={{
                    repeat: Infinity,
                    duration: state === 'thinking' ? 2 : 3,
                    ease: 'easeInOut',
                }}
            />
            {/* Left eye shine */}
            <circle cx="76" cy="101" r="2.5" fill="white" opacity="0.9" />

            {/* Right eye white */}
            <ellipse cx="120" cy="105" rx="11" ry="12" fill="white" />
            {/* Right pupil */}
            <motion.circle
                cx="120"
                cy="105"
                r="6"
                fill="#831843"
                animate={rightPupilAnimate}
                transition={{
                    repeat: Infinity,
                    duration: state === 'thinking' ? 2 : 3,
                    ease: 'easeInOut',
                }}
            />
            {/* Right eye shine */}
            <circle cx="116" cy="101" r="2.5" fill="white" opacity="0.9" />

            {/* Blink animation */}
            <Blink uid={uid} />
        </g>
    );
}

/* ── Blink overlay ────────────────────────────────────────────────── */

function Blink({ uid }: { uid: string }): React.ReactElement {
    return (
        <g>
            <motion.ellipse
                cx="80"
                cy="105"
                rx="12"
                ry="0"
                fill="#f472b6"
                animate={{
                    ry: [0, 0, 0, 13, 0, 0, 0, 0, 0, 0, 0, 0],
                }}
                transition={{
                    repeat: Infinity,
                    duration: 4,
                    ease: 'easeInOut',
                    times: [0, 0.4, 0.42, 0.44, 0.46, 0.48, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
                }}
            />
            <motion.ellipse
                cx="120"
                cy="105"
                rx="12"
                ry="0"
                fill="#f472b6"
                animate={{
                    ry: [0, 0, 0, 13, 0, 0, 0, 0, 0, 0, 0, 0],
                }}
                transition={{
                    repeat: Infinity,
                    duration: 4,
                    ease: 'easeInOut',
                    times: [0, 0.4, 0.42, 0.44, 0.46, 0.48, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
                }}
            />
        </g>
    );
}

/* ── Mouth ────────────────────────────────────────────────────────── */
/* Mouth Y = ~132 (below eyes at 105, with cheek space) */

function Mouth({ state }: { state: CharacterState }): React.ReactElement {
    if (state === 'sleeping') {
        return (
            <motion.ellipse
                cx="100"
                cy="132"
                rx="4"
                ry="5"
                fill="#be185d"
                opacity="0.6"
                animate={{ ry: [5, 6, 5], rx: [4, 3, 4] }}
                transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: 'easeInOut',
                }}
            />
        );
    }

    if (state === 'happy') {
        return (
            <path
                d="M85 128 Q100 148, 115 128"
                fill="#be185d"
                opacity="0.7"
            />
        );
    }

    if (state === 'talking') {
        return (
            <motion.ellipse
                cx="100"
                cy="132"
                rx="8"
                ry="6"
                fill="#be185d"
                opacity="0.65"
                animate={{
                    ry: [4, 8, 3, 7, 4],
                    rx: [8, 6, 9, 7, 8],
                }}
                transition={{
                    repeat: Infinity,
                    duration: 0.5,
                    ease: 'easeInOut',
                }}
            />
        );
    }

    if (state === 'thinking') {
        return (
            <motion.ellipse
                cx="105"
                cy="132"
                rx="5"
                ry="6"
                fill="#be185d"
                opacity="0.5"
                animate={{ cx: [105, 103, 105] }}
                transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: 'easeInOut',
                }}
            />
        );
    }

    // Idle / listening — gentle smile curve
    return (
        <path
            d="M88 130 Q100 140, 112 130"
            fill="none"
            stroke="#be185d"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.7"
        />
    );
}

/* ── Sleeping Zs ──────────────────────────────────────────────────── */

function SleepingZs(): React.ReactElement {
    return (
        <g>
            {[0, 1, 2].map((i) => (
                <motion.text
                    key={i}
                    x={145 + i * 12}
                    y={65 - i * 15}
                    fontSize={10 + i * 3}
                    fill="#be185d"
                    fontWeight="700"
                    opacity="0"
                    animate={{
                        opacity: [0, 0.6, 0],
                        y: [65 - i * 15, 45 - i * 15, 25 - i * 15],
                        x: [145 + i * 12, 150 + i * 12, 155 + i * 12],
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 2.5,
                        delay: i * 0.6,
                        ease: 'easeOut',
                    }}
                >
                    z
                </motion.text>
            ))}
        </g>
    );
}

/* ── Happy sparkles ───────────────────────────────────────────────── */

function Sparkles({ uid }: { uid: string }): React.ReactElement {
    const sparklePositions = [
        { x: 45, y: 45, delay: 0 },
        { x: 155, y: 40, delay: 0.3 },
        { x: 160, y: 130, delay: 0.15 },
        { x: 40, y: 135, delay: 0.45 },
    ];

    return (
        <g>
            {sparklePositions.map((s, i) => (
                <motion.g
                    key={i}
                    animate={{
                        scale: [0, 1, 0],
                        rotate: [0, 90, 180],
                        opacity: [0, 1, 0],
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 1.2,
                        delay: s.delay,
                        ease: 'easeInOut',
                    }}
                    style={{ originX: `${s.x}px`, originY: `${s.y}px` }}
                >
                    <path
                        d={`M${s.x} ${s.y - 6} L${s.x + 2} ${s.y - 2} L${s.x + 6} ${s.y} L${s.x + 2} ${s.y + 2} L${s.x} ${s.y + 6} L${s.x - 2} ${s.y + 2} L${s.x - 6} ${s.y} L${s.x - 2} ${s.y - 2}Z`}
                        fill="#fbbf24"
                        opacity="0.9"
                    />
                </motion.g>
            ))}
        </g>
    );
}
