'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/* ─────────────────────────────────────────────
   Sparkle Particle (tiny 4-pointed star)
───────────────────────────────────────────── */
type Spark = { id: number; x: number; y: number; size: number; delay: number };

function SparkLayer({ active }: { active: boolean }): React.ReactElement | null {
    const [sparks, setSparks] = useState<Spark[]>([]);

    const gen = useCallback((): Spark => ({
        id: Math.random(),
        x: Math.random() * 110 - 10,
        y: Math.random() * 32 - 8,
        size: Math.random() * 6 + 4,
        delay: Math.random() * 0.8,
    }), []);

    useEffect(() => {
        if (!active) { setSparks([]); return; }
        setSparks(Array.from({ length: 5 }, gen));
        const t = setInterval(() => {
            setSparks((p) => p.map((s, i) => Math.random() > 0.5 ? { ...gen(), id: s.id + i * 0.001 } : s));
        }, 900);
        return () => clearInterval(t);
    }, [active, gen]);

    if (!active) return null;

    return (
        <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
            <AnimatePresence>
                {sparks.map((s) => (
                    <motion.svg
                        key={s.id}
                        width={s.size}
                        height={s.size}
                        viewBox="0 0 160 160"
                        fill="none"
                        style={{ position: 'absolute', left: s.x, top: s.y }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.1, delay: s.delay, ease: 'easeInOut' }}
                    >
                        <path
                            d="M80 0C80 0 84 70 160 80C84 90 80 160 80 160C80 160 76 90 0 80C76 70 80 0 80 0Z"
                            fill="oklch(0.58 0.15 340)"
                        />
                    </motion.svg>
                ))}
            </AnimatePresence>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Shine Border (conic-gradient rotating ring)
───────────────────────────────────────────── */
function ShineBorder(): React.ReactElement {
    const [angle, setAngle] = useState(0);
    useEffect(() => {
        let raf: number;
        let start: number | null = null;
        const DUR = 2800;
        const tick = (ts: number): void => {
            if (!start) start = ts;
            setAngle(((ts - start) % DUR) / DUR * 360);
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div
            className="pointer-events-none absolute -inset-[1.5px] rounded-xl"
            style={{
                background: `conic-gradient(from ${angle}deg, transparent 50%, oklch(0.58 0.15 340 / 0.9) 62%, oklch(0.85 0.08 340) 67%, oklch(0.58 0.15 340 / 0.9) 72%, transparent 84%)`,
                WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                padding: '1.5px',
            }}
            aria-hidden="true"
        />
    );
}

/* ─────────────────────────────────────────────
   Logo Component
───────────────────────────────────────────── */
interface LogoProps {
    href?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeMap = {
    sm: 'text-xl tracking-[0.12em]',
    md: 'text-2xl tracking-[0.14em]',
    lg: 'text-4xl tracking-[0.16em]',
};

export function Logo({ href = '/', size = 'md', className = '' }: LogoProps): React.ReactElement {
    const textClass = sizeMap[size];
    const [hovered, setHovered] = useState(false);

    return (
        <>
            {/* Keyframes for shimmer sweep */}
            <style>{`
                @keyframes logo-shimmer {
                    0%   { transform: translateX(-140%) skewX(-16deg); }
                    100% { transform: translateX(240%) skewX(-16deg); }
                }
                @keyframes logo-shimmer-loop {
                    0%, 60% { transform: translateX(-140%) skewX(-16deg); }
                    100%    { transform: translateX(240%) skewX(-16deg); }
                }
            `}</style>

            <Link
                href={href}
                className={`group relative inline-flex items-baseline gap-0 rounded-xl p-1 transition-all duration-300 ${className}`}
                aria-label="Glow.GE"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {/* ── Shine Border (always on, subtle) ── */}
                <ShineBorder />

                {/* ── Glow Bloom behind text ── */}
                <motion.span
                    className="pointer-events-none absolute inset-0 rounded-xl"
                    style={{
                        background: 'radial-gradient(ellipse 80% 120% at 30% 50%, oklch(0.58 0.15 340 / 0.18) 0%, transparent 70%)',
                        filter: 'blur(8px)',
                    }}
                    animate={{ opacity: hovered ? 1 : 0.45, scale: hovered ? 1.08 : 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    aria-hidden="true"
                />

                {/* ── Shimmer Sweep ── */}
                <span
                    className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
                    aria-hidden="true"
                >
                    <span
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 40%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0.25) 60%, transparent 100%)',
                            animation: 'logo-shimmer-loop 3.5s ease-in-out infinite',
                            animationDelay: '0.8s',
                        }}
                    />
                </span>

                {/* ── Sparkles (on hover) ── */}
                <SparkLayer active={hovered} />

                {/* ── Wordmark ── */}
                <span
                    className={`relative font-display font-normal italic ${textClass} text-foreground`}
                >
                    Glow
                </span>
                <span
                    className={`relative font-display font-normal ${textClass} text-primary`}
                    style={{ letterSpacing: '0.05em' }}
                >
                    .GE
                </span>
            </Link>
        </>
    );
}
