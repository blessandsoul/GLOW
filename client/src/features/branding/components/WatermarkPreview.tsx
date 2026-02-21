'use client';

import Image from 'next/image';
import type { WatermarkStyle } from '../types/branding.types';

interface WatermarkPreviewProps {
    style: WatermarkStyle;
    color: string;
    name: string;
    handle: string;
}

export function WatermarkPreview({ style, color, name, handle }: WatermarkPreviewProps): React.ReactElement {
    const shortName = name.length > 10 ? name.slice(0, 10) + '…' : name;
    const shortHandle = handle.length > 12 ? handle.slice(0, 12) + '…' : handle;

    return (
        <div className="relative h-20 w-full overflow-hidden rounded-xl">
            {/* Real lash photo background */}
            <Image
                src="/demo-lash-v2.png"
                alt=""
                fill
                className="object-cover object-top"
                sizes="200px"
            />
            {/* Subtle dark scrim for contrast */}
            <div className="absolute inset-0 bg-black/25" />

            {/* ── MINIMAL: handle bottom-right ── */}
            {style === 'MINIMAL' && (
                <div className="absolute bottom-1.5 right-2 flex items-center gap-1">
                    <span
                        className="font-display text-[9px] font-semibold italic leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                        style={{ color }}
                    >
                        {shortHandle}
                    </span>
                </div>
            )}

            {/* ── FRAMED: border + color footer ── */}
            {style === 'FRAMED' && (
                <>
                    <div
                        className="absolute inset-1.5 rounded-lg"
                        style={{ border: `1.5px solid ${color}` }}
                    />
                    <div
                        className="absolute bottom-0 inset-x-0 flex flex-col items-center justify-center py-1 gap-0"
                        style={{ backgroundColor: color }}
                    >
                        <span className="font-georgian text-[8px] font-semibold text-white leading-tight">{shortName}</span>
                        <span className="font-display text-[6px] italic text-white/75 leading-tight">
                            Glow.GE/{shortHandle.replace('@', '')}
                        </span>
                    </div>
                </>
            )}

            {/* ── STORIES: color header bar ── */}
            {style === 'STORIES_TEMPLATE' && (
                <div
                    className="absolute top-0 inset-x-0 flex items-center justify-center gap-1 py-1.25"
                    style={{ backgroundColor: `${color}e6` }}
                >
                    <span className="font-georgian text-[8px] font-semibold text-white leading-none">{shortName}</span>
                    <span className="text-[6px] text-white/60">·</span>
                    <span className="font-display text-[7px] italic text-white/85 leading-none">{shortHandle}</span>
                </div>
            )}

            {/* ── DIAGONAL: rotated text across center ── */}
            {style === 'DIAGONAL' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                    <span
                        className="font-georgian text-[11px] font-bold tracking-widest uppercase opacity-60 select-none whitespace-nowrap"
                        style={{
                            color,
                            transform: 'rotate(-30deg)',
                            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                            letterSpacing: '0.15em',
                        }}
                    >
                        {shortHandle}
                    </span>
                </div>
            )}

            {/* ── BADGE: pill badge bottom-left ── */}
            {style === 'BADGE' && (
                <div
                    className="absolute bottom-1.5 left-2 flex items-center gap-1 rounded-full px-2 py-0.5"
                    style={{ backgroundColor: `${color}dd`, backdropFilter: 'blur(4px)' }}
                >
                    <span className="font-georgian text-[7px] font-bold text-white leading-none">{shortName}</span>
                    <span className="text-[5px] text-white/60">·</span>
                    <span className="font-display text-[6px] italic text-white/80 leading-none">{shortHandle}</span>
                </div>
            )}

            {/* ── SPLIT: half-color bottom strip with centered name ── */}
            {style === 'SPLIT' && (
                <div className="absolute bottom-0 inset-x-0 h-[38%] flex items-center justify-between px-2.5" style={{ background: `linear-gradient(to top, ${color}f0, ${color}99)` }}>
                    <div className="flex flex-col leading-tight">
                        <span className="font-georgian text-[8px] font-bold text-white">{shortName}</span>
                        <span className="font-display text-[6px] italic text-white/70">Glow.GE</span>
                    </div>
                    <div className="h-px flex-1 mx-1.5 bg-white/20" />
                    <span className="font-display text-[6px] italic text-white/80">{shortHandle}</span>
                </div>
            )}
        </div>
    );
}

interface WatermarkOverlayProps {
    style: WatermarkStyle;
    color: string;
    name: string;
    handle: string;
    logoUrl: string | null;
    opacity?: number;
}

export function WatermarkOverlay({ style, color, name, handle, logoUrl, opacity = 1 }: WatermarkOverlayProps): React.ReactElement {
    const overlayStyle = { opacity, transition: 'opacity 0.2s ease' };

    if (style === 'MINIMAL') {
        return (
            <div className="absolute bottom-4 right-4 flex items-center gap-2" style={overlayStyle}>
                {logoUrl && (
                    <div className="relative h-7 w-7 overflow-hidden rounded-full ring-2 ring-white/20 shadow-lg">
                        <Image src={logoUrl} alt="" fill className="object-cover" />
                    </div>
                )}
                <div className="flex flex-col items-end leading-tight">
                    <span
                        className="font-georgian text-sm font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                        style={{ color }}
                    >
                        {name}
                    </span>
                    <span
                        className="font-display text-[10px] italic drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
                        style={{ color }}
                    >
                        Glow.GE/{handle.replace('@', '')}
                    </span>
                </div>
            </div>
        );
    }

    if (style === 'FRAMED') {
        const slug = handle.replace('@', '');
        return (
            <div className="absolute inset-0 pointer-events-none" style={overlayStyle}>
                <div
                    className="absolute inset-3 rounded-xl"
                    style={{ border: `2px solid ${color}` }}
                />
                <div
                    className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-2 py-2 pointer-events-auto"
                    style={{ backgroundColor: color }}
                >
                    {logoUrl && (
                        <div className="relative h-6 w-6 overflow-hidden rounded-full ring-1 ring-white/30">
                            <Image src={logoUrl} alt="" fill className="object-cover" />
                        </div>
                    )}
                    <div className="flex flex-col items-center leading-tight">
                        <span className="font-georgian text-sm font-semibold text-white drop-shadow-sm">{name}</span>
                        {slug && (
                            <span className="font-display text-[10px] italic text-white/75">Glow.GE/{slug}</span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (style === 'DIAGONAL') {
        return (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden" style={overlayStyle}>
                <div className="flex flex-col items-center gap-1" style={{ transform: 'rotate(-30deg)' }}>
                    {logoUrl && (
                        <div className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-white/20 shadow-lg opacity-70">
                            <Image src={logoUrl} alt="" fill className="object-cover" />
                        </div>
                    )}
                    <span
                        className="font-georgian text-xl font-bold tracking-widest uppercase select-none whitespace-nowrap opacity-55"
                        style={{ color, textShadow: '0 1px 6px rgba(0,0,0,0.5)', letterSpacing: '0.2em' }}
                    >
                        {name}
                    </span>
                    <span
                        className="font-display text-sm italic opacity-45 whitespace-nowrap"
                        style={{ color }}
                    >
                        {handle}
                    </span>
                </div>
            </div>
        );
    }

    if (style === 'BADGE') {
        return (
            <div
                className="absolute bottom-5 left-4 flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{ backgroundColor: `${color}dd`, backdropFilter: 'blur(8px)', ...overlayStyle }}
            >
                {logoUrl && (
                    <div className="relative h-6 w-6 overflow-hidden rounded-full ring-1 ring-white/30 shrink-0">
                        <Image src={logoUrl} alt="" fill className="object-cover" />
                    </div>
                )}
                <div className="flex flex-col leading-tight">
                    <span className="font-georgian text-sm font-bold text-white">{name}</span>
                    <span className="font-display text-[10px] italic text-white/75">Glow.GE/{handle.replace('@', '')}</span>
                </div>
            </div>
        );
    }

    if (style === 'SPLIT') {
        return (
            <div
                className="absolute bottom-0 inset-x-0 flex items-center gap-3 px-4 py-3"
                style={{ background: `linear-gradient(to top, ${color}f5, ${color}88)`, ...overlayStyle }}
            >
                {logoUrl && (
                    <div className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-white/30 shrink-0">
                        <Image src={logoUrl} alt="" fill className="object-cover" />
                    </div>
                )}
                <div className="flex flex-col leading-tight min-w-0 flex-1">
                    <span className="font-georgian text-base font-bold text-white truncate">{name}</span>
                    <span className="font-display text-xs italic text-white/75 truncate">Glow.GE/{handle.replace('@', '')}</span>
                </div>
                <div className="h-8 w-px bg-white/20 shrink-0" />
                <span className="font-display text-xs italic text-white/60 shrink-0">{handle}</span>
            </div>
        );
    }

    // STORIES_TEMPLATE
    return (
        <div
            className="absolute top-0 inset-x-0 flex items-center justify-center gap-2.5 py-3"
            style={{ backgroundColor: color, ...overlayStyle }}
        >
            {logoUrl && (
                <div className="relative h-6 w-6 overflow-hidden rounded-full ring-1 ring-white/30">
                    <Image src={logoUrl} alt="" fill className="object-cover" />
                </div>
            )}
            <div className="flex items-baseline gap-1.5">
                <span className="font-georgian text-sm font-semibold text-white">{name}</span>
                <span className="font-display text-xs italic text-white/75">Glow.GE</span>
            </div>
        </div>
    );
}
