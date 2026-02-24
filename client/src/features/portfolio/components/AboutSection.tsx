'use client';

import React, { useCallback } from 'react';
import { CloudCheck, SpinnerGap, Warning, MapPin, InstagramLogo, WhatsappLogo, TelegramLogo, Phone } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { CITIES, NICHES } from '@/features/profile/types/profile.types';
import type { ProfileFormData } from '@/features/profile/types/profile.types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AboutSectionProps {
    form: ProfileFormData;
    updateField: <K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => void;
    saveStatus: SaveStatus;
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

export function AboutSection({ form, updateField, saveStatus }: AboutSectionProps): React.ReactElement {
    const { t } = useLanguage();

    const handleBioChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
        if (e.target.value.length <= 500) {
            updateField('bio', e.target.value);
        }
    }, [updateField]);

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

            {/* Basic info card */}
            <div className="space-y-4 rounded-xl border border-border/50 bg-card p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="builder-city" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin size={12} />
                            {t('ui.text_ghe07f')}
                        </Label>
                        <Select value={form.city} onValueChange={(v) => updateField('city', v)}>
                            <SelectTrigger id="builder-city" className="w-full">
                                <SelectValue placeholder={t('ui.text_46q4bx')} />
                            </SelectTrigger>
                            <SelectContent>
                                {CITIES.map((c) => (
                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                                {NICHES.map((n) => (
                                    <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
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
