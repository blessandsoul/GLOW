'use client';

import { useState } from 'react';
import {
    Scan, Diamond, MagicWand, PaintBrush,
    Leaf, Fire, Minus, MaskHappy,
    Square, CircleDashed, Camera, Aperture,
    MagnifyingGlassPlus, Users, ArrowCounterClockwise,
    SunDim, Sun, MoonStars,
    Wind, Target, Stack,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { DEFAULT_SETTINGS, useUploadLabels } from '../types/upload.types';
import type { PhotoSettings, Niche, PhotoStyle, Background, Angle, Lighting, Sharpness } from '../types/upload.types';
import { useLanguage } from "@/i18n/hooks/useLanguage";

interface PhotoSettingsPanelProps {
    onConfirm: (settings: PhotoSettings) => void;
}

export function PhotoSettingsPanel({ onConfirm }: PhotoSettingsPanelProps): React.ReactElement {
    const { t } = useLanguage();
    const { NICHE_LABELS, STYLE_LABELS, BACKGROUND_LABELS, ANGLE_LABELS, LIGHTING_LABELS, SHARPNESS_LABELS } = useUploadLabels();

    const NICHE_OPTIONS: { value: Niche; label: string; icon: React.ReactNode; desc: string }[] = [
        { value: 'lashes', label: NICHE_LABELS.lashes.label, icon: <Scan size={16} />, desc: NICHE_LABELS.lashes.description },
        { value: 'nails', label: NICHE_LABELS.nails.label, icon: <Diamond size={16} />, desc: NICHE_LABELS.nails.description },
        { value: 'brows', label: NICHE_LABELS.brows.label, icon: <MagicWand size={16} />, desc: NICHE_LABELS.brows.description },
        { value: 'makeup', label: NICHE_LABELS.makeup.label, icon: <PaintBrush size={16} />, desc: NICHE_LABELS.makeup.description },
    ];

    const STYLE_OPTIONS: { value: PhotoStyle; label: string; icon: React.ReactNode }[] = [
        { value: 'natural', label: STYLE_LABELS.natural.label, icon: <Leaf size={12} /> },
        { value: 'glamour', label: STYLE_LABELS.glamour.label, icon: <Fire size={12} /> },
        { value: 'minimal', label: STYLE_LABELS.minimal.label, icon: <Minus size={12} /> },
        { value: 'dramatic', label: STYLE_LABELS.dramatic.label, icon: <MaskHappy size={12} /> },
    ];
    const BG_OPTIONS: { value: Background; label: string; icon: React.ReactNode }[] = [
        { value: 'white', label: BACKGROUND_LABELS.white.label, icon: <Square size={12} /> },
        { value: 'neutral', label: BACKGROUND_LABELS.neutral.label, icon: <CircleDashed size={12} /> },
        { value: 'studio', label: BACKGROUND_LABELS.studio.label, icon: <Camera size={12} /> },
        { value: 'bokeh', label: BACKGROUND_LABELS.bokeh.label, icon: <Aperture size={12} /> },
    ];
    const ANGLE_OPTIONS: { value: Angle; label: string; icon: React.ReactNode }[] = [
        { value: 'closeup', label: ANGLE_LABELS.closeup.label, icon: <MagnifyingGlassPlus size={12} /> },
        { value: 'portrait', label: ANGLE_LABELS.portrait.label, icon: <Users size={12} /> },
        { value: 'threequarter', label: ANGLE_LABELS.threequarter.label, icon: <ArrowCounterClockwise size={12} /> },
    ];
    const LIGHTING_OPTIONS: { value: Lighting; label: string; icon: React.ReactNode }[] = [
        { value: 'normal', label: LIGHTING_LABELS.normal.label, icon: <SunDim size={12} /> },
        { value: 'bright', label: LIGHTING_LABELS.bright.label, icon: <Sun size={12} /> },
        { value: 'dark', label: LIGHTING_LABELS.dark.label, icon: <MoonStars size={12} /> },
    ];
    const SHARPNESS_OPTIONS: { value: Sharpness; label: string; icon: React.ReactNode }[] = [
        { value: 'soft', label: SHARPNESS_LABELS.soft.label, icon: <Wind size={12} /> },
        { value: 'sharp', label: SHARPNESS_LABELS.sharp.label, icon: <Target size={12} /> },
        { value: 'hdr', label: SHARPNESS_LABELS.hdr.label, icon: <Stack size={12} /> },
    ];

    const [s, setS] = useState<PhotoSettings>(DEFAULT_SETTINGS);

    const set = <K extends keyof PhotoSettings>(k: K, v: PhotoSettings[K]) => {
        const next = { ...s, [k]: v };
        setS(next);
        onConfirm(next);
    };

    return (
        <div className="flex w-full flex-col gap-3">
            {/* Niche */}
            <div>
                <Label>{t('ui.text_jbd2b')}</Label>
                <div className="grid grid-cols-4 gap-1.5">
                    {NICHE_OPTIONS.map(({ value, label, icon, desc }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => set('niche', value)}
                            className={cn(
                                'flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 text-center transition-all duration-150',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                s.niche === value
                                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                    : 'border-border/50 bg-card text-foreground hover:border-primary/40',
                            )}
                        >
                            {icon}
                            <span className="text-[11px] font-semibold leading-tight">{label}</span>
                            <span className={cn('text-[9px]', s.niche === value ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                                {desc}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 2-column pill grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                <PillRow label={t('ui.text_gp5ih4')} options={STYLE_OPTIONS} active={s.style} onChange={(v) => set('style', v as PhotoStyle)} />
                <PillRow label={t('ui.text_mktf')} options={BG_OPTIONS} active={s.background} onChange={(v) => set('background', v as Background)} />
                <PillRow label={t('ui.text_jp22ai')} options={ANGLE_OPTIONS} active={s.angle} onChange={(v) => set('angle', v as Angle)} />
                <PillRow label={t('ui.text_jds4e')} options={LIGHTING_OPTIONS} active={s.lighting} onChange={(v) => set('lighting', v as Lighting)} />
                <PillRow label={t('ui.text_ygwef9')} options={SHARPNESS_OPTIONS} active={s.sharpness} onChange={(v) => set('sharpness', v as Sharpness)} />
            </div>
        </div>
    );
}

function Label({ children }: { children: React.ReactNode }) {
    return <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{children}</p>;
}

function PillRow<T extends string>({ label, options, active, onChange }: {
    label: string;
    options: { value: T; label: string; icon: React.ReactNode }[];
    active: T;
    onChange: (v: T) => void;
}): React.ReactElement {
    return (
        <div>
            <Label>{label}</Label>
            <div className="flex flex-wrap gap-1">
                {options.map(({ value, label: l, icon }) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => onChange(value)}
                        className={cn(
                            'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all duration-150',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                            active === value
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border/50 bg-card text-foreground hover:border-primary/40',
                        )}
                    >
                        {icon}
                        {l}
                    </button>
                ))}
            </div>
        </div>
    );
}
