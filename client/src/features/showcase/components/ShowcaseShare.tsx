'use client';

import { useCallback } from 'react';
import { LinkSimple, ChatCircle, PaperPlaneTilt } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useLanguage } from "@/i18n/hooks/useLanguage";

interface ShowcaseShareProps {
    jobId: string;
}

export function ShowcaseShare({ jobId }: ShowcaseShareProps): React.ReactElement {
    const { t } = useLanguage();
    const showcaseUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/showcase/${jobId}`
        : `/showcase/${jobId}`;

    const handleCopyLink = useCallback(async (): Promise<void> => {
        try {
            await navigator.clipboard.writeText(showcaseUrl);
            toast.success(t('ui.text_fj1r2r'));
        } catch {
            toast.error(t('ui.text_h1ne34'));
        }
    }, [showcaseUrl]);

    const handleWhatsApp = useCallback((): void => {
        const text = encodeURIComponent(
            `Посмотрите мои результаты: ${showcaseUrl}`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    }, [showcaseUrl]);

    const handleTelegram = useCallback((): void => {
        const url = encodeURIComponent(showcaseUrl);
        const text = encodeURIComponent(t('ui.text_gggcye'));
        window.open(
            `https://t.me/share/url?url=${url}&text=${text}`,
            '_blank',
            'noopener,noreferrer'
        );
    }, [showcaseUrl]);

    return (
        <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">{t('ui.text_nq6g7p')}</p>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleWhatsApp}
                    className="flex-1 gap-1.5"
                >
                    <ChatCircle size={16} />
                    WhatsApp
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTelegram}
                    className="flex-1 gap-1.5"
                >
                    <PaperPlaneTilt size={16} />
                    Telegram
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="flex-1 gap-1.5"
                >
                    <LinkSimple size={16} />
                    {t('ui.text_kfqvgm')}</Button>
            </div>
        </div>
    );
}
