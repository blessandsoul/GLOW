import { useLanguage } from '@/i18n/hooks/useLanguage';

export type Niche = 'lashes' | 'nails' | 'brows' | 'makeup';
export type PhotoStyle = 'natural' | 'glamour' | 'minimal' | 'dramatic';
export type Background = 'white' | 'neutral' | 'studio' | 'bokeh';
export type Angle = 'closeup' | 'portrait' | 'threequarter';
export type Lighting = 'normal' | 'bright' | 'dark';
export type Sharpness = 'soft' | 'sharp' | 'hdr';

export interface PhotoSettings {
    niche: Niche;
    style: PhotoStyle;
    background: Background;
    angle: Angle;
    lighting: Lighting;
    sharpness: Sharpness;
}

export const DEFAULT_SETTINGS: PhotoSettings = {
    niche: 'lashes',
    style: 'natural',
    background: 'white',
    angle: 'closeup',
    lighting: 'normal',
    sharpness: 'sharp',
};

export type ProcessingType = 'ENHANCE' | 'RETOUCH' | 'BACKGROUND' | 'PRO_EDIT';

export const PROCESSING_COSTS: Record<ProcessingType, number> = {
    ENHANCE: 1,
    RETOUCH: 2,
    BACKGROUND: 2,
    PRO_EDIT: 3,
};

export function useUploadLabels() {
    const { t } = useLanguage();

    const NICHE_LABELS: Record<Niche, { label: string; description: string }> = {
        lashes: { label: t('upload.niche_lashes'), description: t('upload.niche_lashes_desc') },
        nails: { label: t('upload.niche_nails'), description: t('upload.niche_nails_desc') },
        brows: { label: t('upload.niche_brows'), description: t('upload.niche_brows_desc') },
        makeup: { label: t('upload.niche_makeup'), description: t('upload.niche_makeup_desc') },
    };

    const STYLE_LABELS: Record<PhotoStyle, { label: string; description: string }> = {
        natural: { label: t('upload.style_natural'), description: t('upload.style_natural_desc') },
        glamour: { label: t('upload.style_glamour'), description: t('upload.style_glamour_desc') },
        minimal: { label: t('upload.style_minimal'), description: t('upload.style_minimal_desc') },
        dramatic: { label: t('upload.style_dramatic'), description: t('upload.style_dramatic_desc') },
    };

    const BACKGROUND_LABELS: Record<Background, { label: string; description: string }> = {
        white: { label: t('upload.bg_white'), description: t('upload.bg_white_desc') },
        neutral: { label: t('upload.bg_neutral'), description: t('upload.bg_neutral_desc') },
        studio: { label: t('upload.bg_studio'), description: t('upload.bg_studio_desc') },
        bokeh: { label: t('upload.bg_bokeh'), description: t('upload.bg_bokeh_desc') },
    };

    const ANGLE_LABELS: Record<Angle, { label: string; description: string }> = {
        closeup: { label: t('upload.angle_closeup'), description: t('upload.angle_closeup_desc') },
        portrait: { label: t('upload.angle_portrait'), description: t('upload.angle_portrait_desc') },
        threequarter: { label: t('upload.angle_threequarter'), description: t('upload.angle_threequarter_desc') },
    };

    const LIGHTING_LABELS: Record<Lighting, { label: string; description: string }> = {
        normal: { label: t('upload.light_normal'), description: t('upload.light_normal_desc') },
        bright: { label: t('upload.light_bright'), description: t('upload.light_bright_desc') },
        dark: { label: t('upload.light_dark'), description: t('upload.light_dark_desc') },
    };

    const SHARPNESS_LABELS: Record<Sharpness, { label: string; description: string }> = {
        soft: { label: t('upload.sharp_soft'), description: t('upload.sharp_soft_desc') },
        sharp: { label: t('upload.sharp_sharp'), description: t('upload.sharp_sharp_desc') },
        hdr: { label: t('upload.sharp_hdr'), description: t('upload.sharp_hdr_desc') },
    };

    const PROCESSING_TYPE_LABELS: Record<ProcessingType, string> = {
        ENHANCE: t('upload.proc_enhance'),
        RETOUCH: t('upload.proc_retouch'),
        BACKGROUND: t('upload.proc_background'),
        PRO_EDIT: t('upload.proc_pro'),
    };

    const PROCESSING_TYPE_DESCRIPTIONS: Record<ProcessingType, string> = {
        ENHANCE: t('upload.proc_enhance_desc'),
        RETOUCH: t('upload.proc_retouch_desc'),
        BACKGROUND: t('upload.proc_background_desc'),
        PRO_EDIT: t('upload.proc_pro_desc'),
    };

    return {
        NICHE_LABELS,
        STYLE_LABELS,
        BACKGROUND_LABELS,
        ANGLE_LABELS,
        LIGHTING_LABELS,
        SHARPNESS_LABELS,
        PROCESSING_TYPE_LABELS,
        PROCESSING_TYPE_DESCRIPTIONS,
    };
}
