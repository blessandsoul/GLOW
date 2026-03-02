'use client';

import React, { useCallback, useRef, useState } from 'react';
import { CloudCheck, SpinnerGap, Warning, MapPin, InstagramLogo, WhatsappLogo, TelegramLogo, Phone, Camera } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useSpecialities } from '@/features/profile/hooks/useCatalog';
import { usersService } from '@/features/users/services/users.service';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/features/auth/store/authSlice';
import { getServerImageUrl } from '@/lib/utils/image';
import { getErrorMessage } from '@/lib/utils/error';
import type { IUser } from '@/features/auth/types/auth.types';
import type { ProfileFormData } from '@/features/profile/types/profile.types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AboutSectionProps {
    form: ProfileFormData;
    updateField: <K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => void;
    saveStatus: SaveStatus;
    user: IUser | null;
}

function SaveIndicator({ status }: { status: SaveStatus }): React.ReactElement | null {
    const { t } = useLanguage();
    if (status === 'idle') return null;
    return (
        <span className="flex items-center gap-1 text-xs">
            {status === 'saving' && (
                <>
                    <SpinnerGap size={12} className="animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">{t('portfolio.saving')}</span>
                </>
            )}
            {status === 'saved' && (
                <>
                    <CloudCheck size={12} className="text-success" />
                    <span className="text-success">{t('portfolio.saved')}</span>
                </>
            )}
            {status === 'error' && (
                <>
                    <Warning size={12} className="text-destructive" />
                    <span className="text-destructive">{t('portfolio.save_failed')}</span>
                </>
            )}
        </span>
    );
}

export function AboutSection({ form, updateField, saveStatus, user }: AboutSectionProps): React.ReactElement {
    const { t } = useLanguage();
    const dispatch = useAppDispatch();
    const { specialities } = useSpecialities();
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    const handleBioChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
        if (e.target.value.length <= 500) {
            updateField('bio', e.target.value);
        }
    }, [updateField]);

    const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        if (file.size > 5 * 1024 * 1024) {
            toast.error(t('portfolio.file_too_large'));
            return;
        }

        setIsUploadingAvatar(true);
        try {
            const { avatarUrl } = await usersService.uploadAvatar(file);
            if (user) {
                dispatch(setUser({ ...user, avatar: avatarUrl }));
            }
            toast.success(t('portfolio.avatar_updated'));
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsUploadingAvatar(false);
        }
    }, [user, dispatch, t]);

    const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : '';

    return (
        <div className="space-y-6">
            {/* Section header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">{t('portfolio.about_title')}</h2>
                    <p className="text-sm text-muted-foreground">{t('portfolio.about_desc')}</p>
                </div>
                <SaveIndicator status={saveStatus} />
            </div>

            {/* Avatar card */}
            <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-5">
                <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*,.heic,.heif"
                    className="hidden"
                    onChange={handleAvatarChange}
                />
                <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border/50 transition-all duration-200 hover:border-primary/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={t('portfolio.change_avatar')}
                >
                    {user?.avatar ? (
                        <img
                            src={getServerImageUrl(user.avatar)}
                            alt={displayName}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/10 text-lg font-bold text-primary">
                            {displayName.charAt(0).toUpperCase() || '?'}
                        </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        {isUploadingAvatar ? (
                            <SpinnerGap size={18} className="text-white animate-spin" />
                        ) : (
                            <Camera size={18} className="text-white" />
                        )}
                    </div>
                </button>
                <div>
                    <p className="text-sm font-medium text-foreground">{t('portfolio.profile_photo')}</p>
                    <p className="text-xs text-muted-foreground">{t('portfolio.profile_photo_desc')}</p>
                </div>
            </div>

            {/* Basic info card */}
            <div className="space-y-4 rounded-xl border border-border/50 bg-card p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="builder-city" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin size={12} />
                            {t('ui.text_ghe07f')}
                        </Label>
                        <Input
                            id="builder-city"
                            value={form.city}
                            onChange={(e) => updateField('city', e.target.value)}
                            placeholder={t('ui.text_46q4bx')}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="builder-niche" className="text-xs text-muted-foreground">
                            {t('portfolio.specialty')}
                        </Label>
                        <Select value={form.niche} onValueChange={(v) => updateField('niche', v)}>
                            <SelectTrigger id="builder-niche" className="w-full">
                                <SelectValue placeholder={t('portfolio.select_specialty')} />
                            </SelectTrigger>
                            <SelectContent>
                                {specialities.map((n) => (
                                    <SelectItem key={n.slug} value={n.slug}>{n.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="builder-bio" className="text-xs text-muted-foreground">{t('ui.text_2v8yka')}</Label>
                        <span className="text-xs text-muted-foreground tabular-nums">{form.bio.length}/500</span>
                    </div>
                    <textarea
                        id="builder-bio"
                        value={form.bio}
                        onChange={handleBioChange}
                        placeholder={t('portfolio.bio_placeholder')}
                        rows={3}
                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                    />
                </div>
            </div>

            {/* Contacts card */}
            <div className="space-y-4 rounded-xl border border-border/50 bg-card p-5">
                <p className="text-sm font-semibold text-foreground">{t('ui.text_3euvtw')}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="builder-phone" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone size={12} />
                            {t('ui.text_31346u')}
                        </Label>
                        <Input
                            id="builder-phone"
                            value={form.phone}
                            onChange={(e) => updateField('phone', e.target.value)}
                            placeholder="+995 555 123 456"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="builder-instagram" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <InstagramLogo size={12} />
                            Instagram
                        </Label>
                        <Input
                            id="builder-instagram"
                            value={form.instagram}
                            onChange={(e) => updateField('instagram', e.target.value)}
                            placeholder="@anna_lashes"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="builder-whatsapp" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <WhatsappLogo size={12} />
                            WhatsApp
                        </Label>
                        <Input
                            id="builder-whatsapp"
                            value={form.whatsapp}
                            onChange={(e) => updateField('whatsapp', e.target.value)}
                            placeholder="+995 555 123 456"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="builder-telegram" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <TelegramLogo size={12} />
                            Telegram
                        </Label>
                        <Input
                            id="builder-telegram"
                            value={form.telegram}
                            onChange={(e) => updateField('telegram', e.target.value)}
                            placeholder="@anna_lashes"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
