import { useLanguage } from '@/i18n/hooks/useLanguage';
import type { WatermarkStyle } from '../types/branding.types';

export function useBrandingStyles() {
    const { t } = useLanguage();

    const WATERMARK_STYLES: { value: WatermarkStyle; label: string; description: string }[] = [
        { value: 'MINIMAL', label: t('branding.style_minimal'), description: t('branding.style_minimal_desc') },
        { value: 'FRAMED', label: t('branding.style_framed'), description: t('branding.style_framed_desc') },
        { value: 'STORIES_TEMPLATE', label: t('branding.style_stories'), description: t('branding.style_stories_desc') },
        { value: 'DIAGONAL', label: t('branding.style_diagonal'), description: t('branding.style_diagonal_desc') },
        { value: 'BADGE', label: t('branding.style_badge'), description: t('branding.style_badge_desc') },
        { value: 'SPLIT', label: t('branding.style_split'), description: t('branding.style_split_desc') },
    ];

    return { WATERMARK_STYLES };
}
