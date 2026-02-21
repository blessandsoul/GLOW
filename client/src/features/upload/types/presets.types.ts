import type { PhotoSettings } from './upload.types';
import { useLanguage } from '@/i18n/hooks/useLanguage';

export type AppMode = 'beauty' | 'product' | 'before-after' | 'batch';

// ─── Beauty presets ───────────────────────────────────────────────────────────

export interface BeautyPreset {
    id: string;
    label: string;
    category: 'natural' | 'luxury' | 'aesthetic' | 'dramatic' | 'minimal' | 'studio';
    categoryLabel: string;
    previewSrc: string; // path in /public/presets/beauty/
    settings: PhotoSettings;
}

export const BEAUTY_CATEGORIES = ['natural', 'luxury', 'aesthetic', 'dramatic', 'minimal', 'studio'] as const;

export interface ProductPreset {
    id: string;
    label: string;
    style: 'lifestyle' | 'studio';
    styleLabel: string;
    previewSrc: string;
    description: string;
}

export function usePresets() {
    const { t } = useLanguage();

    const BEAUTY_CATEGORY_LABELS: Record<string, string> = {
        natural: t('upload.beauty_cat_natural'),
        luxury: t('upload.beauty_cat_luxury'),
        aesthetic: t('upload.beauty_cat_aesthetic'),
        dramatic: t('upload.beauty_cat_dramatic'),
        minimal: t('upload.beauty_cat_minimal'),
        studio: t('upload.beauty_cat_studio'),
    };

    const BEAUTY_PRESETS: BeautyPreset[] = [
        {
            id: 'luxury-glow',
            label: 'Luxury Glow',
            category: 'luxury',
            categoryLabel: BEAUTY_CATEGORY_LABELS.luxury,
            previewSrc: '/presets/beauty/1.png',
            settings: { niche: 'lashes', style: 'glamour', background: 'neutral', angle: 'closeup', lighting: 'bright', sharpness: 'sharp' },
        },
        {
            id: 'soft-natural',
            label: 'Soft Natural',
            category: 'natural',
            categoryLabel: BEAUTY_CATEGORY_LABELS.natural,
            previewSrc: '/presets/beauty/2.png',
            settings: { niche: 'brows', style: 'natural', background: 'white', angle: 'closeup', lighting: 'normal', sharpness: 'soft' },
        },
        {
            id: 'aesthetic-clean',
            label: 'Aesthetic Clean',
            category: 'aesthetic',
            categoryLabel: BEAUTY_CATEGORY_LABELS.aesthetic,
            previewSrc: '/presets/beauty/3.png',
            settings: { niche: 'makeup', style: 'minimal', background: 'white', angle: 'portrait', lighting: 'bright', sharpness: 'sharp' },
        },
        {
            id: 'anti-age-studio',
            label: 'Anti-Age Studio',
            category: 'studio',
            categoryLabel: BEAUTY_CATEGORY_LABELS.studio,
            previewSrc: '/presets/beauty/4.png',
            settings: { niche: 'lashes', style: 'natural', background: 'neutral', angle: 'threequarter', lighting: 'normal', sharpness: 'sharp' },
        },
        {
            id: 'fresh-skin',
            label: 'Fresh Skin',
            category: 'aesthetic',
            categoryLabel: BEAUTY_CATEGORY_LABELS.aesthetic,
            previewSrc: '/presets/beauty/5.png',
            settings: { niche: 'makeup', style: 'natural', background: 'white', angle: 'portrait', lighting: 'bright', sharpness: 'soft' },
        },
        {
            id: 'glow-treatment',
            label: 'Glow Treatment',
            category: 'luxury',
            categoryLabel: BEAUTY_CATEGORY_LABELS.luxury,
            previewSrc: '/presets/beauty/6.png',
            settings: { niche: 'makeup', style: 'glamour', background: 'neutral', angle: 'portrait', lighting: 'bright', sharpness: 'sharp' },
        },
        {
            id: 'dark-glam',
            label: 'Dark Glam',
            category: 'dramatic',
            categoryLabel: BEAUTY_CATEGORY_LABELS.dramatic,
            previewSrc: '/presets/beauty/7.png',
            settings: { niche: 'makeup', style: 'dramatic', background: 'studio', angle: 'portrait', lighting: 'dark', sharpness: 'hdr' },
        },
        {
            id: 'minimal-tone',
            label: 'Minimal Tone',
            category: 'minimal',
            categoryLabel: BEAUTY_CATEGORY_LABELS.minimal,
            previewSrc: '/presets/beauty/8.png',
            settings: { niche: 'brows', style: 'minimal', background: 'white', angle: 'closeup', lighting: 'normal', sharpness: 'soft' },
        },
        {
            id: 'warm-glow',
            label: 'Warm Glow',
            category: 'natural',
            categoryLabel: BEAUTY_CATEGORY_LABELS.natural,
            previewSrc: '/presets/beauty/9.png',
            settings: { niche: 'makeup', style: 'natural', background: 'neutral', angle: 'threequarter', lighting: 'bright', sharpness: 'sharp' },
        },
    ];

    const PRODUCT_PRESETS: ProductPreset[] = [
        { id: 'lifestyle-1', label: 'Lifestyle White', style: 'lifestyle', styleLabel: t('upload.prod_lifestyle'), previewSrc: '/presets/product/1769241325818p.png', description: t('upload.prod_lifestyle_1') },
        { id: 'lifestyle-2', label: 'Lifestyle Cozy', style: 'lifestyle', styleLabel: t('upload.prod_lifestyle'), previewSrc: '/presets/product/1769241344520c.png', description: t('upload.prod_lifestyle_2') },
        { id: 'lifestyle-3', label: 'Lifestyle Fresh', style: 'lifestyle', styleLabel: t('upload.prod_lifestyle'), previewSrc: '/presets/product/1769241361960w.png', description: t('upload.prod_lifestyle_3') },
        { id: 'lifestyle-4', label: 'Lifestyle Glam', style: 'lifestyle', styleLabel: t('upload.prod_lifestyle'), previewSrc: '/presets/product/1769241380653f.png', description: t('upload.prod_lifestyle_4') },
        { id: 'lifestyle-5', label: 'Lifestyle Soft', style: 'lifestyle', styleLabel: t('upload.prod_lifestyle'), previewSrc: '/presets/product/1769241399348r.png', description: t('upload.prod_lifestyle_5') },
        { id: 'lifestyle-6', label: 'Lifestyle Bold', style: 'lifestyle', styleLabel: t('upload.prod_lifestyle'), previewSrc: '/presets/product/1769241419453w.png', description: t('upload.prod_lifestyle_6') },
        { id: 'studio-1', label: 'Studio Clean', style: 'studio', styleLabel: t('upload.prod_studio'), previewSrc: '/presets/product/1716821417078g.png', description: t('upload.prod_studio_1') },
        { id: 'studio-2', label: 'Studio Color', style: 'studio', styleLabel: t('upload.prod_studio'), previewSrc: '/presets/product/1716821417182d.png', description: t('upload.prod_studio_2') },
        { id: 'studio-3', label: 'Studio Minimal', style: 'studio', styleLabel: t('upload.prod_studio'), previewSrc: '/presets/product/1716821417285i.png', description: t('upload.prod_studio_3') },
    ];

    return {
        BEAUTY_CATEGORY_LABELS,
        BEAUTY_PRESETS,
        PRODUCT_PRESETS,
    };
}
