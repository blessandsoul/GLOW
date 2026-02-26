'use client';

import React from 'react';
import { Copy, ArrowSquareOut, ShareNetwork } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { toast } from 'sonner';
import { PhoneFramePreview } from './PhoneFramePreview';
import { useAppSelector } from '@/store/hooks';
import type { ProfileFormData } from '@/features/profile/types/profile.types';
import type { PortfolioItem } from '../types/portfolio.types';
import type { IUser } from '@/features/auth/types/auth.types';

interface PreviewSectionProps {
    form: ProfileFormData;
    items: PortfolioItem[];
    user: IUser | null;
}

export function PreviewSection({ form, items, user }: PreviewSectionProps): React.ReactElement {
    const { t } = useLanguage();
    const username = user?.username ?? '';
    const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/specialist/${username}`;
    const publishedItems = items.filter((i) => i.isPublished);

    const handleCopyLink = async (): Promise<void> => {
        try {
            await navigator.clipboard.writeText(publicUrl);
            toast.success(t('portfolio.copy_success'));
        } catch {
            toast.error(t('portfolio.copy_error'));
        }
    };

    const handleShare = async (): Promise<void> => {
        if (navigator.share) {
            try {
                await navigator.share({ title: `${user?.firstName ?? ''} - Portfolio`, url: publicUrl });
            } catch {
                // User cancelled share
            }
        } else {
            handleCopyLink();
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-foreground">{t('portfolio.preview_title')}</h2>
                <p className="text-sm text-muted-foreground">{t('portfolio.preview_desc')}</p>
            </div>

            {/* Share actions */}
            <div className="space-y-3 rounded-xl border border-border/50 bg-card p-4">
                <p className="truncate text-xs text-muted-foreground">
                    {publicUrl}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                    <Button type="button" variant="outline" size="sm" className="gap-1.5 min-h-[44px]" onClick={handleCopyLink}>
                        <Copy size={16} />
                        {t('portfolio.btn_copy')}
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="gap-1.5 min-h-[44px]" onClick={handleShare}>
                        <ShareNetwork size={16} />
                        {t('portfolio.btn_share')}
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        className="col-span-2 gap-1.5 min-h-[44px] sm:col-span-1"
                        onClick={() => window.open(publicUrl, '_blank')}
                    >
                        <ArrowSquareOut size={16} />
                        {t('portfolio.btn_open')}
                    </Button>
                </div>
            </div>

            {/* Phone frame preview */}
            <div className="flex justify-center py-4">
                <PhoneFramePreview
                    displayName={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Your Name'}
                    city={form.city}
                    niche={form.niche}
                    bio={form.bio}
                    services={form.services}
                    items={publishedItems}
                    avatar={user?.avatar ?? null}
                />
            </div>
        </div>
    );
}
