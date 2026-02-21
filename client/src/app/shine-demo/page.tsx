'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightning, Sparkle, Sun, Rainbow, Confetti, Eye } from '@phosphor-icons/react';

/* ─────────────────────────────────────────────
   Effect Config
───────────────────────────────────────────── */
type ShineEffect = {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
};

const EFFECTS: ShineEffect[] = [
    {
        id: 'shimmer-sweep',
        label: 'Shimmer Sweep',
        description: 'Белый луч скользит по лого',
        icon: <Lightning size={16} weight="fill" />,
        color: '#94a3b8',
    },
    {
        id: 'shine-border',
        label: 'Shine Border',
        description: 'Световая рамка вокруг блока',
        icon: <Sparkle size={16} weight="fill" />,
        color: '#f472b6',
    },
    {
        id: 'glow-bloom',
        label: 'Glow Bloom',
        description: 'Пульсирующее свечение',
        icon: <Sun size={16} weight="fill" />,
        color: '#fb923c',
    },
    {
        id: 'prismatic',
        label: 'Prismatic',
        description: 'Голографический радужный',
        icon: <Rainbow size={16} weight="fill" />,
        color: '#a78bfa',
    },
    {
        id: 'sparkles',
        label: 'Sparkles',
        description: 'Искры вокруг логотипа',
        icon: <Confetti size={16} weight="fill" />,
        color: '#34d399',
    },
];

/* ─────────────────────────────────────────────
   Custom Glow.GE SVG Logo
   Concept: stacked G+lash arc + dot spark
───────────────────────────────────────────── */
function GlowLogo({
    prismatic,
    glowBloom,
    size = 72,
}: {
    prismatic: boolean;
    glowBloom: boolean;
    size?: number;
}): React.ReactElement {
    // Gradient IDs
    const gradId = 'logo-grad';
    const prismId = 'logo-prism';
    const glowId = 'logo-glow-filter';

    const strokeColor = prismatic ? `url(#${prismId})` : `url(#${gradId})`;

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 72 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Glow.GE logo mark"
        >
            <defs>
                {/* Rose → amber brand gradient */}
                <linearGradient id={gradId} x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#f472b6" />
                    <stop offset="55%" stopColor="#fb923c" />
                    <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>

                {/* Prismatic holographic */}
                <linearGradient id={prismId} x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#f472b6" />
                    <stop offset="25%" stopColor="#a78bfa" />
                    <stop offset="50%" stopColor="#38bdf8" />
                    <stop offset="75%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>

                {/* Glow filter */}
                <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* ── G arc shape — thick C that has a small horizontal bar mid-right ── */}
            {/* Outer arc of G */}
            <path
                d="M54 22 A22 22 0 1 0 54 50"
                stroke={strokeColor}
                strokeWidth="5.5"
                strokeLinecap="round"
                fill="none"
                filter={glowBloom ? `url(#${glowId})` : undefined}
            />
            {/* Horizontal bar of G (inner notch) */}
            <path
                d="M36 36 H54"
                stroke={strokeColor}
                strokeWidth="5.5"
                strokeLinecap="round"
                fill="none"
                filter={glowBloom ? `url(#${glowId})` : undefined}
            />

            {/* ── Lash arc — a swooping curve under the G ── */}
            <path
                d="M14 56 Q36 66 58 54"
                stroke={strokeColor}
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                opacity="0.65"
                filter={glowBloom ? `url(#${glowId})` : undefined}
            />

            {/* ── Spark dot (AI eye / glow) ── */}
            <motion.circle
                cx="54"
                cy="36"
                r="4.5"
                fill={prismatic ? `url(#${prismId})` : `url(#${gradId})`}
                filter={glowBloom ? `url(#${glowId})` : undefined}
                animate={glowBloom
                    ? { r: [4.5, 6.5, 4.5], opacity: [1, 0.7, 1] }
                    : { r: 4.5, opacity: 1 }
                }
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
        </svg>
    );
}

/* ─────────────────────────────────────────────
   Sparkle Particles
───────────────────────────────────────────── */
type SparkleItem = { id: number; x: number; y: number; size: number; delay: number; color: string };
const SPARKLE_COLORS = ['#fbbf24', '#f472b6', '#a78bfa', '#38bdf8', '#34d399', '#fff'];

function SparklesLayer(): React.ReactElement {
    const [sparkles, setSparkles] = useState<SparkleItem[]>([]);

    useEffect(() => {
        const gen = (): SparkleItem => ({
            id: Math.random(),
            x: Math.random() * 360 - 20,
            y: Math.random() * 160 - 20,
            size: Math.random() * 10 + 5,
            delay: Math.random() * 1.4,
            color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
        });
        setSparkles(Array.from({ length: 10 }, gen));
        const t = setInterval(() => {
            setSparkles((p) => p.map((s, i) => (Math.random() > 0.55 ? { ...gen(), id: s.id + i * 0.001 } : s)));
        }, 1100);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <AnimatePresence>
                {sparkles.map((s) => (
                    <motion.svg
                        key={s.id}
                        width={s.size}
                        height={s.size}
                        viewBox="0 0 160 160"
                        fill="none"
                        style={{ position: 'absolute', left: s.x, top: s.y }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                        transition={{ duration: 1.3, delay: s.delay, ease: 'easeInOut' }}
                    >
                        <path
                            d="M80 0C80 0 84 70 160 80C84 90 80 160 80 160C80 160 76 90 0 80C76 70 80 0 80 0Z"
                            fill={s.color}
                        />
                    </motion.svg>
                ))}
            </AnimatePresence>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Shine Border (rAF conic-gradient)
───────────────────────────────────────────── */
function ShineBorderLayer(): React.ReactElement {
    const [angle, setAngle] = useState(0);
    useEffect(() => {
        let raf: number;
        let start: number | null = null;
        const DUR = 3000;
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
            className="pointer-events-none absolute -inset-[2px] rounded-3xl"
            style={{
                background: `conic-gradient(from ${angle}deg, transparent 55%, #f472b6 65%, #fff 70%, #fb923c 76%, transparent 86%)`,
                WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                padding: '2px',
            }}
            aria-hidden="true"
        />
    );
}

/* ─────────────────────────────────────────────
   Logo Preview Card
───────────────────────────────────────────── */
function LogoPreview({ active }: { active: Set<string> }): React.ReactElement {
    const hasShimmer = active.has('shimmer-sweep');
    const hasBorder = active.has('shine-border');
    const hasGlow = active.has('glow-bloom');
    const hasPrismatic = active.has('prismatic');
    const hasSparkles = active.has('sparkles');

    return (
        <div className="relative flex items-center justify-center">
            {/* Ambient glow bloom */}
            {hasGlow && (
                <motion.div
                    className="pointer-events-none absolute"
                    style={{
                        width: 260,
                        height: 140,
                        background: 'radial-gradient(ellipse at 50% 50%, rgba(251,146,60,0.35) 0%, rgba(244,114,182,0.25) 40%, transparent 70%)',
                        filter: 'blur(28px)',
                    }}
                    animate={{ opacity: [0.55, 1, 0.55], scale: [0.9, 1.08, 0.9] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                    aria-hidden="true"
                />
            )}

            {/* Card */}
            <div
                className="relative flex items-center gap-5 overflow-hidden rounded-3xl border border-white/10 px-10 py-8"
                style={{
                    background: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(24px)',
                    boxShadow: hasGlow
                        ? '0 0 60px -10px rgba(251,146,60,0.45), 0 25px 50px -12px rgba(0,0,0,0.5)'
                        : '0 25px 50px -12px rgba(0,0,0,0.45)',
                    transition: 'box-shadow 0.5s ease',
                }}
            >
                {hasBorder && <ShineBorderLayer />}

                {/* Shimmer sweep */}
                {hasShimmer && (
                    <motion.span
                        className="pointer-events-none absolute inset-0 skew-x-[-16deg]"
                        style={{
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 35%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.12) 65%, transparent 100%)',
                        }}
                        initial={{ x: '-130%' }}
                        animate={{ x: '230%' }}
                        transition={{ duration: 2.0, repeat: Infinity, repeatDelay: 1.8, ease: 'easeInOut' }}
                        aria-hidden="true"
                    />
                )}

                {/* Sparkles */}
                {hasSparkles && <SparklesLayer />}

                {/* ── SVG Logomark ── */}
                <div
                    className="relative flex h-18 w-18 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                        background: hasPrismatic
                            ? 'linear-gradient(135deg, #1e0a2e, #0a1a2e)'
                            : 'linear-gradient(135deg, #1a0a12 0%, #0d0814 100%)',
                        boxShadow: hasGlow
                            ? '0 0 32px 8px rgba(244,114,182,0.5), 0 4px 20px rgba(0,0,0,0.4)'
                            : '0 4px 20px rgba(0,0,0,0.4)',
                        transition: 'box-shadow 0.5s ease',
                        width: 72,
                        height: 72,
                    }}
                >
                    {/* Prismatic animated bg in icon container */}
                    {hasPrismatic && (
                        <motion.div
                            className="absolute inset-0 rounded-2xl opacity-30"
                            style={{ background: 'linear-gradient(135deg, #f472b6, #a78bfa, #38bdf8, #34d399, #fbbf24, #f472b6)', backgroundSize: '400% 400%' }}
                            animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
                            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    )}
                    <GlowLogo prismatic={hasPrismatic} glowBloom={hasGlow} size={48} />
                </div>

                {/* Wordmark */}
                <div className="relative flex flex-col leading-none select-none">
                    {hasPrismatic ? (
                        <>
                            <motion.span
                                className="text-[3.2rem] font-black tracking-tight"
                                style={{
                                    background: 'linear-gradient(90deg, #f472b6, #a78bfa, #38bdf8, #34d399, #f472b6)',
                                    backgroundSize: '300% auto',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    animation: 'prism-move 4s linear infinite',
                                    lineHeight: 1.05,
                                }}
                            >
                                Glow
                            </motion.span>
                            <motion.span
                                className="text-[1.6rem] font-bold tracking-[0.18em] uppercase"
                                style={{
                                    background: 'linear-gradient(90deg, #34d399, #38bdf8, #a78bfa, #34d399)',
                                    backgroundSize: '300% auto',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    animation: 'prism-move 4s linear infinite reverse',
                                    marginTop: -4,
                                    letterSpacing: '0.22em',
                                }}
                            >
                                .GE
                            </motion.span>
                        </>
                    ) : (
                        <>
                            <span
                                className="text-[3.2rem] font-black tracking-tight text-white"
                                style={{ lineHeight: 1.05 }}
                            >
                                Glow
                            </span>
                            <span
                                className="text-[1.6rem] font-bold tracking-[0.22em] uppercase"
                                style={{
                                    background: 'linear-gradient(90deg, #f472b6, #fb923c)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    marginTop: -4,
                                }}
                            >
                                .GE
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Logo Concept Card (sidebar bottom)
───────────────────────────────────────────── */
function LogoConceptNote(): React.ReactElement {
    return (
        <div
            className="mt-2 rounded-2xl border p-4 text-xs"
            style={{
                borderColor: 'rgba(244,114,182,0.15)',
                background: 'rgba(244,114,182,0.04)',
            }}
        >
            <div className="mb-2 flex items-center gap-1.5 font-bold text-white/50">
                <Eye size={12} weight="fill" />
                Концепция лого
            </div>
            <ul className="space-y-1 text-white/30 leading-relaxed">
                <li><span className="text-white/50 font-semibold">G-дуга</span> — буква G как открытый взгляд</li>
                <li><span className="text-white/50 font-semibold">Ресница</span> — изогнутая дуга снизу</li>
                <li><span className="text-white/50 font-semibold">Точка</span> — блик / AI-искра / зрачок</li>
                <li><span className="text-white/50 font-semibold">Гамма</span> — роза → янтарь (тепло, красота)</li>
            </ul>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Effect Toggle Card
───────────────────────────────────────────── */
function EffectCard({
    effect,
    active,
    onToggle,
}: {
    effect: ShineEffect;
    active: boolean;
    onToggle: () => void;
}): React.ReactElement {
    return (
        <label
            className="group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border p-4 transition-all duration-200 select-none"
            style={{
                borderColor: active ? effect.color : 'rgba(255,255,255,0.07)',
                background: active
                    ? `linear-gradient(135deg, ${effect.color}15 0%, ${effect.color}07 100%)`
                    : 'rgba(255,255,255,0.02)',
                boxShadow: active ? `0 0 24px -6px ${effect.color}55` : 'none',
                transition: 'all 0.22s ease',
            }}
        >
            <input
                type="checkbox"
                className="sr-only"
                checked={active}
                onChange={onToggle}
                aria-label={`Включить эффект ${effect.label}`}
            />

            {/* Checkbox */}
            <div
                className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200"
                style={{
                    borderColor: active ? effect.color : 'rgba(255,255,255,0.18)',
                    background: active ? effect.color : 'transparent',
                }}
            >
                {active && (
                    <motion.svg
                        width="10"
                        height="8"
                        viewBox="0 0 10 8"
                        fill="none"
                        initial={{ opacity: 0, scale: 0.4 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.13, type: 'spring' }}
                    >
                        <path d="M1 4L3.5 6.5L9 1" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                )}
            </div>

            {/* Icon */}
            <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200"
                style={{
                    color: active ? effect.color : 'rgba(255,255,255,0.3)',
                    background: active ? `${effect.color}1c` : 'rgba(255,255,255,0.04)',
                }}
            >
                {effect.icon}
            </div>

            {/* Text */}
            <div className="flex flex-col min-w-0">
                <span
                    className="text-sm font-semibold leading-tight transition-colors duration-200"
                    style={{ color: active ? '#fff' : 'rgba(255,255,255,0.55)' }}
                >
                    {effect.label}
                </span>
                <span className="truncate text-xs text-white/28">{effect.description}</span>
            </div>

            {/* Dot */}
            {active && (
                <motion.div
                    className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: effect.color }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                />
            )}
        </label>
    );
}

/* ─────────────────────────────────────────────
   Active Badges
───────────────────────────────────────────── */
function ActiveBadges({ active }: { active: Set<string> }): React.ReactElement {
    return (
        <div className="flex min-h-[26px] flex-wrap items-center gap-1.5">
            {active.size === 0 ? (
                <span className="text-xs text-white/20">Выбери эффект →</span>
            ) : (
                <AnimatePresence mode="popLayout">
                    {EFFECTS.filter((e) => active.has(e.id)).map((e) => (
                        <motion.span
                            key={e.id}
                            initial={{ opacity: 0, scale: 0.8, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                            style={{
                                background: `${e.color}20`,
                                border: `1px solid ${e.color}50`,
                                color: e.color,
                            }}
                        >
                            {e.icon}
                            {e.label}
                        </motion.span>
                    ))}
                </AnimatePresence>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function ShineDemoPage(): React.ReactElement {
    const [active, setActive] = useState<Set<string>>(new Set(['glow-bloom']));

    const toggle = (id: string): void => {
        setActive((p) => {
            const n = new Set(p);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    };

    return (
        <>
            <style>{`
                @keyframes prism-move {
                    0%   { background-position: 0% center; }
                    100% { background-position: 300% center; }
                }
            `}</style>

            <div
                className="relative min-h-dvh overflow-hidden"
                style={{ background: 'linear-gradient(150deg, #080610 0%, #0c0812 45%, #080c14 100%)' }}
            >
                {/* Ambient */}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background: `
                            radial-gradient(ellipse 70% 45% at 25% 15%, rgba(244,114,182,0.07) 0%, transparent 65%),
                            radial-gradient(ellipse 55% 40% at 75% 85%, rgba(167,139,250,0.06) 0%, transparent 65%)
                        `,
                    }}
                    aria-hidden="true"
                />

                {/* Grid */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.025]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
                        backgroundSize: '64px 64px',
                    }}
                    aria-hidden="true"
                />

                <div className="relative z-10 mx-auto flex min-h-dvh max-w-5xl flex-col items-center px-4 py-14 sm:px-6">

                    {/* Header */}
                    <motion.div
                        className="mb-14 flex flex-col items-center gap-3 text-center"
                        initial={{ opacity: 0, y: -18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    >
                        <div
                            className="mb-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]"
                            style={{ borderColor: 'rgba(244,114,182,0.22)', background: 'rgba(244,114,182,0.07)', color: 'rgba(244,114,182,0.85)' }}
                        >
                            <Eye size={11} weight="fill" />
                            Logo Shine Lab
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                            Выбери эффект сияния
                        </h1>
                        <p className="max-w-xs text-sm text-white/32">
                            Включай чекбоксы — эффекты можно сочетать
                        </p>
                    </motion.div>

                    {/* Layout */}
                    <div className="flex w-full flex-col items-stretch gap-8 lg:flex-row lg:items-start">

                        {/* Preview */}
                        <motion.div
                            className="flex flex-1 flex-col items-center gap-5"
                            initial={{ opacity: 0, x: -24 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.65, delay: 0.12, ease: 'easeOut' }}
                        >
                            <div
                                className="flex w-full flex-col items-center justify-center rounded-3xl border py-20"
                                style={{
                                    borderColor: 'rgba(255,255,255,0.055)',
                                    background: 'rgba(255,255,255,0.015)',
                                    minHeight: 320,
                                }}
                            >
                                <LogoPreview active={active} />
                            </div>

                            <div className="w-full">
                                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/22">
                                    Активные эффекты
                                </div>
                                <ActiveBadges active={active} />
                            </div>
                        </motion.div>

                        {/* Controls */}
                        <motion.div
                            className="flex w-full flex-col gap-2.5 lg:w-72"
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.65, delay: 0.22, ease: 'easeOut' }}
                        >
                            {/* Quick toggles */}
                            <div className="mb-1 flex gap-2">
                                <button
                                    onClick={() => setActive(new Set(EFFECTS.map((e) => e.id)))}
                                    className="flex-1 cursor-pointer rounded-xl border border-white/08 py-2 text-xs font-semibold text-white/40 transition-all hover:border-white/18 hover:text-white/70 active:scale-[0.97]"
                                    aria-label="Включить все"
                                >
                                    Все
                                </button>
                                <button
                                    onClick={() => setActive(new Set())}
                                    className="flex-1 cursor-pointer rounded-xl border border-white/08 py-2 text-xs font-semibold text-white/40 transition-all hover:border-white/18 hover:text-white/70 active:scale-[0.97]"
                                    aria-label="Сбросить все"
                                >
                                    Сброс
                                </button>
                            </div>

                            {/* Effect list */}
                            {EFFECTS.map((effect, i) => (
                                <motion.div
                                    key={effect.id}
                                    initial={{ opacity: 0, x: 18 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.38, delay: 0.28 + i * 0.07 }}
                                >
                                    <EffectCard
                                        effect={effect}
                                        active={active.has(effect.id)}
                                        onToggle={() => toggle(effect.id)}
                                    />
                                </motion.div>
                            ))}

                            <LogoConceptNote />

                            <p className="mt-1 text-center text-[11px] text-white/18">
                                Можно включать несколько эффектов
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
}
