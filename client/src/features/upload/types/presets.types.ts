import { useLanguage } from '@/i18n/hooks/useLanguage';

export type AppMode = 'beauty' | 'product' | 'before-after' | 'batch';

export interface ProductPreset {
    id: string;
    label: string;
    style: 'lifestyle' | 'studio';
    styleLabel: string;
    previewSrc: string;
    description: string;
}

export function usePresets(): { PRODUCT_PRESETS: ProductPreset[] } {
    const { t } = useLanguage();

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

    return { PRODUCT_PRESETS };
}
