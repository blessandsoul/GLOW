'use client';

import { useState, useCallback } from 'react';
import { CloudArrowUp, X } from '@phosphor-icons/react';
import { portfolioService } from '@/features/portfolio/services/portfolio.service';
import { getErrorMessage } from '@/lib/utils/error';
import { getServerImageUrl } from '@/lib/utils/image';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { WizardLayout } from '../../WizardLayout';
import type { StepProps } from '../../OnboardingWizard';

interface UploadedPhoto {
    id: string;
    url: string;
}

export function SalonPhotosStep({ state, dispatch, goBack, onSubmit, isSubmitting, submitError }: StepProps): React.ReactElement {
    const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const { t } = useLanguage();

    const handleFiles = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setIsUploading(true);
        setUploadError(null);

        for (const file of Array.from(files)) {
            try {
                const item = await portfolioService.uploadImage(file);
                dispatch({ type: 'ADD_PORTFOLIO_ITEM', payload: item.id });
                setPhotos((prev) => [...prev, { id: item.id, url: item.imageUrl }]);
            } catch (e) {
                setUploadError(getErrorMessage(e));
                break;
            }
        }
        setIsUploading(false);
    }, [dispatch]);

    const handleRemove = (id: string): void => {
        dispatch({ type: 'REMOVE_PORTFOLIO_ITEM', payload: id });
        setPhotos((prev) => prev.filter((p) => p.id !== id));
    };

    const canSubmit = state.portfolioItemIds.length >= 1;

    return (
        <WizardLayout
            title={t('onboarding.salon_photos_title')}
            subtitle={t('onboarding.salon_photos_subtitle')}
            onNext={onSubmit}
            onBack={goBack}
            nextLabel={t('onboarding.btn_complete')}
            backLabel={t('onboarding.btn_back')}
            nextDisabled={!canSubmit}
            nextLoading={isSubmitting}
        >
            <div className="space-y-4">
                <label
                    className={cn(
                        'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer',
                        isUploading
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-border hover:border-primary/40 hover:bg-primary/5',
                    )}
                >
                    <CloudArrowUp size={32} className="text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        {isUploading ? t('onboarding.portfolio_uploading') : t('onboarding.portfolio_upload')}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('onboarding.portfolio_formats')}</p>
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={(e) => handleFiles(e.target.files)}
                        className="hidden"
                        disabled={isUploading}
                    />
                </label>

                {uploadError && (
                    <p className="text-xs text-destructive">{uploadError}</p>
                )}

                {photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                        {photos.map((photo) => (
                            <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl border border-border/60">
                                <img
                                    src={getServerImageUrl(photo.url)}
                                    alt="Salon"
                                    className="h-full w-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemove(photo.id)}
                                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {submitError && (
                    <p className="text-center text-xs text-destructive">{submitError}</p>
                )}
            </div>
        </WizardLayout>
    );
}
