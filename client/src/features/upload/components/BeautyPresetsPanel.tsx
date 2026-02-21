'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { BEAUTY_CATEGORIES, usePresets } from '../types/presets.types';
import type { BeautyPreset } from '../types/presets.types';
import type { PhotoSettings } from '../types/upload.types';
import { useLanguage } from "@/i18n/hooks/useLanguage";

interface BeautyPresetsPanelProps {
    onSelect: (settings: PhotoSettings) => void;
    selected: PhotoSettings | null;
}

const ALL = 'all';

export function BeautyPresetsPanel({ onSelect, selected }: BeautyPresetsPanelProps): React.ReactElement {
    const { t } = useLanguage();
    const { BEAUTY_PRESETS, BEAUTY_CATEGORY_LABELS } = usePresets();
    const [activeCategory, setActiveCategory] = useState<string>(ALL);

    const categories = [ALL, ...BEAUTY_CATEGORIES];
    const filtered = activeCategory === ALL
        ? BEAUTY_PRESETS
        : BEAUTY_PRESETS.filter((p: BeautyPreset) => p.category === activeCategory);

    const isActive = (preset: BeautyPreset) =>
        selected !== null && JSON.stringify(selected) === JSON.stringify(preset.settings);

    return (
        <div className="flex flex-col gap-2">
            {/* Category filter */}
            <div className="flex flex-wrap gap-1">
                {categories.map((cat) => (
                    <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
                        className={cn(
                            'rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all duration-150',
                            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50',
                            activeCategory === cat
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border/50 bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground',
                        )}>
                        {cat === ALL ? t('ui.text_m7ja') : BEAUTY_CATEGORY_LABELS[cat]}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
                {filtered.map((preset) => {
                    const active = isActive(preset);
                    return (
                        <button key={preset.id} type="button" onClick={() => onSelect(preset.settings)}
                            className={cn(
                                'group relative overflow-hidden rounded-lg border transition-all duration-150',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                active ? 'border-primary shadow-sm' : 'border-border/40 hover:border-primary/50',
                            )}>
                            <div className="relative aspect-[3/4] w-full">
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
