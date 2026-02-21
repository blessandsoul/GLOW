'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { usePresets } from '../types/presets.types';
import type { ProductPreset } from '../types/presets.types';
import { useLanguage } from "@/i18n/hooks/useLanguage";

export interface ProductAdSettings {
    presetId: string;
    style: 'lifestyle' | 'studio';
}

interface ProductAdPanelProps {
    onSelect: (settings: ProductAdSettings) => void;
    selected: ProductAdSettings | null;
}

export function ProductAdPanel({ onSelect, selected }: ProductAdPanelProps): React.ReactElement {
    const { t } = useLanguage();
    const { PRODUCT_PRESETS } = usePresets();
    const [activeStyle, setActiveStyle] = useState<'all' | 'lifestyle' | 'studio'>('all');

    const filtered = activeStyle === 'all'
        ? PRODUCT_PRESETS
        : PRODUCT_PRESETS.filter((p) => p.style === activeStyle);

    const isActive = (p: ProductPreset) => selected?.presetId === p.id;

    return (
        <div className="flex flex-col gap-2">
            {/* Filter */}
            <div className="flex gap-1">
                {(['all', 'lifestyle', 'studio'] as const).map((s) => (
                    <button key={s} type="button" onClick={() => setActiveStyle(s)}
                        className={cn(
                            'rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all duration-150',
                            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50',
                            activeStyle === s
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border/50 bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground',
                        )}>
                        {s === 'all' ? t('ui.text_m7ja') : s === 'lifestyle' ? t('ui.text_sgk9n3') : t('ui.text_kg5ey1')}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
                {filtered.map((preset) => {
                    const active = isActive(preset);
                    return (
                        <button key={preset.id} type="button"
                            onClick={() => onSelect({ presetId: preset.id, style: preset.style })}
                            className={cn(
                                'group relative overflow-hidden rounded-lg border transition-all duration-150',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                active ? 'border-primary shadow-sm' : 'border-border/40 hover:border-primary/50',
                            )}>
                            <div className="relative aspect-square w-full">
                                <Image src={preset.previewSrc} alt={preset.label} fill
                                    className="object-cover" sizes="90px" />
                                <div className={cn(
                                    'absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/60 to-transparent p-1 transition-opacity duration-150',
                                    active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                                )}>
                                    <p className="text-[9px] font-semibold text-white leading-tight truncate">{preset.label}</p>
                                </div>
                                {active && (
                                    <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                                        <Check size={10} className="text-primary-foreground" />
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
