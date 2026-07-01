'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { SpinnerGap, Plus, Star, Trash, Heart, Eye, EyeSlash } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getThumbUrl } from '@/lib/utils/image';
import { ROUTES } from '@/lib/constants/routes';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useMyModelProfile, useModelProfileActions } from '../hooks/useMyModelProfile';
import { validatePhotoFile } from '../lib/photoValidation';
import type { ModerationStatus, ModelVerificationStatus } from '../types/faces.types';

const STATUS_VARIANT: Record<ModelVerificationStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    NONE: 'outline',
    PENDING: 'secondary',
    VERIFIED: 'default',
    REJECTED: 'destructive',
};

const PHOTO_VARIANT: Record<ModerationStatus, 'default' | 'secondary' | 'destructive'> = {
    APPROVED: 'default',
    PENDING: 'secondary',
    REJECTED: 'destructive',
};

export function ModelDashboard(): React.ReactElement {
    const { t } = useLanguage();
    const { profile, isLoading, isError } = useMyModelProfile();
    const actions = useModelProfileActions();
    const fileInput = useRef<HTMLInputElement>(null);

    if (isLoading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <SpinnerGap size={24} className="animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isError || !profile) {
        return (
            <Card className="mx-auto max-w-md">
                <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                    <p className="text-muted-foreground">{t('faces.no_profile')}</p>
                    <Button asChild>
                        <Link href={ROUTES.FACES_JOIN}>{t('faces.join_cta')}</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const blurred = profile.blurredAt != null;
    const canRequestReview =
        (profile.verificationStatus === 'NONE' || profile.verificationStatus === 'REJECTED') &&
        profile.photos.length > 0;

    function handleFile(e: React.ChangeEvent<HTMLInputElement>): void {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        const errorKey = validatePhotoFile(file);
        if (errorKey) {
            toast.error(t(errorKey));
            return;
        }
        actions.uploadPhoto(file);
    }

    return (
        <div className="container mx-auto max-w-3xl px-4 py-8 md:px-6">
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{profile.displayName}</h1>
                    <div className="mt-2 flex items-center gap-2">
                        <Badge variant={STATUS_VARIANT[profile.verificationStatus]}>
                            {t(`faces.status_${profile.verificationStatus.toLowerCase()}`)}
                        </Badge>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Heart size={14} weight="fill" className="text-primary" />
                            <span className="tabular-nums">{profile.interestedCount}</span> {t('faces.interested_count')}
                        </span>
                    </div>
                    {profile.verificationStatus === 'REJECTED' && profile.rejectionReason && (
                        <p className="mt-2 text-sm text-destructive">{profile.rejectionReason}</p>
                    )}
                </div>
            </div>

            {/* Photos */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {profile.photos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
                        <Image
                            src={getThumbUrl(photo.imageUrl, 400)}
                            alt=""
                            fill
                            unoptimized
                            sizes="33vw"
                            className={cn('object-cover', blurred && 'blur-md')}
                        />
                        <div className="absolute left-2 top-2">
                            <Badge variant={PHOTO_VARIANT[photo.moderationStatus]} className="text-[10px]">
                                {t(`faces.photo_${photo.moderationStatus.toLowerCase()}`)}
                            </Badge>
                        </div>
                        <div className="absolute bottom-2 right-2 flex gap-1">
                            {!photo.isPrimary && (
                                <button
                                    type="button"
                                    aria-label={t('faces.set_primary')}
                                    disabled={actions.isBusy}
                                    onClick={() => actions.setPrimary(photo.id)}
                                    className="rounded-full bg-background/80 p-1.5 text-muted-foreground backdrop-blur-sm hover:text-primary"
                                >
                                    <Star size={15} weight={photo.isPrimary ? 'fill' : 'regular'} />
                                </button>
                            )}
                            <button
                                type="button"
                                aria-label={t('faces.delete_photo')}
                                disabled={actions.isBusy}
                                onClick={() => actions.deletePhoto(photo.id)}
                                className="rounded-full bg-background/80 p-1.5 text-muted-foreground backdrop-blur-sm hover:text-destructive"
                            >
                                <Trash size={15} />
                            </button>
                        </div>
                        {photo.isPrimary && (
                            <div className="absolute right-2 top-2 rounded-full bg-primary p-1 text-primary-foreground">
                                <Star size={12} weight="fill" />
                            </div>
                        )}
                    </div>
                ))}

                <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    disabled={actions.isUploading}
                    className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                    {actions.isUploading ? <SpinnerGap size={24} className="animate-spin" /> : <Plus size={24} />}
                    <span className="text-xs">{t('faces.add_photo')}</span>
                </button>
                <input
                    ref={fileInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={handleFile}
                />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
                {canRequestReview && (
                    <Button onClick={actions.requestReview} disabled={actions.isBusy}>
                        {t('faces.request_review')}
                    </Button>
                )}
                <Button variant="outline" onClick={() => actions.setBlur(!blurred)} disabled={actions.isBusy}>
                    {blurred ? <Eye size={16} className="mr-2" /> : <EyeSlash size={16} className="mr-2" />}
                    {blurred ? t('faces.unblur') : t('faces.blur')}
                </Button>
                <Button
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={actions.isBusy}
                    onClick={() => {
                        if (window.confirm(t('faces.withdraw_confirm'))) actions.withdraw();
                    }}
                >
                    {t('faces.withdraw')}
                </Button>
            </div>
        </div>
    );
}
