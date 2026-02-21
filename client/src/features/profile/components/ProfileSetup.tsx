'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Plus, UserCircle, SpinnerGap, Camera } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfile } from '../hooks/useProfile';
import { CITIES, NICHES, DEFAULT_PROFILE, SERVICE_CATEGORIES } from '../types/profile.types';
import type { ProfileFormData, ServiceItem } from '../types/profile.types';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useAppSelector } from '@/store/hooks';
import { ServiceRow } from './ServiceRow';
import { AddServicePanel } from './AddServicePanel';

// ─── Personal Info section ────────────────────────────────────────────────────

function PersonalInfoSection(): React.ReactElement {
    const { t } = useLanguage();
    const user = useAppSelector((s) => s.auth.user);
    const [firstName, setFirstName] = useState(user?.firstName ?? '');
    const [lastName, setLastName] = useState(user?.lastName ?? '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = useCallback(async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // TODO: wire to usersService.updateMe({ firstName, lastName })
            await new Promise((r) => setTimeout(r, 500));
        } finally {
            setIsSaving(false);
        }
    }, [firstName, lastName]);

    return (
        <section className="space-y-4 rounded-xl border border-border/50 bg-card p-6">
            <p className="text-sm font-semibold text-foreground">Personal info</p>

            {/* Avatar */}
            <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="h-16 w-16 rounded-full object-cover border border-border/50"
                        />
                    ) : (
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border border-border/50">
                            <UserCircle size={32} className="text-primary" />
                        </div>
                    )}
                    <button
                        type="button"
                        className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-card border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-sm"
                        aria-label="Change avatar"
                    >
                        <Camera size={12} />
                    </button>
                </div>
                <div>
                    <p className="text-sm font-medium text-foreground">
                        {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {/* TODO: enable upload when backend supports it */}
                        JPG, PNG or WebP · max 5 MB
                    </p>
                </div>
            </div>

            {/* Name fields */}
            <form onSubmit={handleSave} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="firstName" className="text-xs text-muted-foreground">First name</Label>
                        <Input
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Anna"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="lastName" className="text-xs text-muted-foreground">Last name</Label>
                        <Input
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Beridze"
                        />
                    </div>
                </div>
                <Button type="submit" size="sm" disabled={isSaving} className="gap-1.5">
                    {isSaving && <SpinnerGap size={14} className="animate-spin" />}
                    {isSaving ? t('ui.text_y9fzx8') : 'Save name'}
                </Button>
            </form>
        </section>
    );
}

// ─── Main ProfileSetup ────────────────────────────────────────────────────────

export function ProfileSetup(): React.ReactElement {
    const { t } = useLanguage();
    const { profile, isLoading, save, isSaving } = useProfile();
    const [form, setForm] = useState<ProfileFormData>(DEFAULT_PROFILE);
    const [showAddPanel, setShowAddPanel] = useState(false);

    useEffect(() => {
        if (profile) {
            setForm({
                city: profile.city ?? '',
                niche: profile.niche ?? '',
                bio: profile.bio ?? '',
                phone: profile.phone ?? '',
                whatsapp: profile.whatsapp ?? '',
                telegram: profile.telegram ?? '',
                instagram: profile.instagram ?? '',
                services: (profile.services ?? []).map((s) => ({
                    ...s,
                    category: (s as ServiceItem).category ?? 'other',
                })),
            });
        }
    }, [profile]);

    const handleChange = useCallback((field: keyof ProfileFormData, value: string): void => {
        setForm((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleAddService = useCallback((service: ServiceItem): void => {
        setForm((prev) => ({ ...prev, services: [...prev.services, service] }));
        setShowAddPanel(false);
    }, []);

    const handleRemoveService = useCallback((index: number): void => {
        setForm((prev) => ({
            ...prev,
            services: prev.services.filter((_, i) => i !== index),
        }));
    }, []);

    const handleServiceChange = useCallback(
        (index: number, field: keyof ServiceItem, value: string | number): void => {
            setForm((prev) => ({
                ...prev,
                services: prev.services.map((s, i) =>
                    i === index ? { ...s, [field]: value } : s
                ),
            }));
        },
        []
    );

    const handleSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>): void => {
            e.preventDefault();
            save(form);
        },
        [form, save]
    );

    // Group services by category for display
    const servicesByCategory = SERVICE_CATEGORIES
        .map((cat) => ({
            category: cat,
            services: form.services
                .map((s, i) => ({ service: s, originalIndex: i }))
                .filter(({ service }) => service.category === cat.id),
        }))
        .filter(({ services }) => services.length > 0);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-3">
                    <UserCircle size={24} className="text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('ui.text_5r2sry')}</h1>
                    <p className="text-sm text-muted-foreground">
                        {t('ui.text_vj9eal')}</p>
                </div>
            </div>

            {/* Basic info */}
            <section className="space-y-4 rounded-xl border border-border/50 bg-card p-6">
                <p className="text-sm font-semibold text-foreground">{t('ui.text_xhrrs6')}</p>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="city" className="text-xs text-muted-foreground">{t('ui.text_ghe07f')}</Label>
                        <Select value={form.city} onValueChange={(v) => handleChange('city', v)}>
                            <SelectTrigger id="city" className="w-full">
                                <SelectValue placeholder={t('ui.text_46q4bx')} />
                            </SelectTrigger>
                            <SelectContent>
                                {CITIES.map((c) => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="niche" className="text-xs text-muted-foreground">{t('ui.text_x8m0rk')}</Label>
                        <Select value={form.niche} onValueChange={(v) => handleChange('niche', v)}>
                            <SelectTrigger id="niche" className="w-full">
                                <SelectValue placeholder={t('ui.text_vy4xke')} />
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
                    <Label htmlFor="bio" className="text-xs text-muted-foreground">{t('ui.text_2v8yka')}</Label>
                    <textarea
                        id="bio"
                        value={form.bio}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        placeholder={t('ui.text_ve2tga')}
                        rows={3}
                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                </div>
            </section>

            {/* Contacts */}
            <section className="space-y-4 rounded-xl border border-border/50 bg-card p-6">
                <p className="text-sm font-semibold text-foreground">{t('ui.text_3euvtw')}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-xs text-muted-foreground">{t('ui.text_31346u')}</Label>
                        <Input
                            id="phone"
                            value={form.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            placeholder="+995 555 123 456"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="instagram" className="text-xs text-muted-foreground">Instagram</Label>
                        <Input
                            id="instagram"
                            value={form.instagram}
                            onChange={(e) => handleChange('instagram', e.target.value)}
                            placeholder="@anna_lashes"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="whatsapp" className="text-xs text-muted-foreground">WhatsApp</Label>
                        <Input
                            id="whatsapp"
                            value={form.whatsapp}
                            onChange={(e) => handleChange('whatsapp', e.target.value)}
                            placeholder="+995 555 123 456"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="telegram" className="text-xs text-muted-foreground">Telegram</Label>
                        <Input
                            id="telegram"
                            value={form.telegram}
                            onChange={(e) => handleChange('telegram', e.target.value)}
                            placeholder="@anna_lashes"
                        />
                    </div>
                </div>
            </section>

            {/* Services */}
            <section className="space-y-4 rounded-xl border border-border/50 bg-card p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-foreground">{t('ui.text_ldk28b')}</p>
                        {form.services.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">{form.services.length} {t('ui.text_svc_added')}</p>
                        )}
                    </div>
                    {!showAddPanel && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => setShowAddPanel(true)}
                        >
                            <Plus size={14} />
                            {t('ui.text_usbwt5')}
                        </Button>
                    )}
                </div>

                {/* Add service panel */}
                {showAddPanel && (
                    <AddServicePanel
                        onAdd={handleAddService}
                        onCancel={() => setShowAddPanel(false)}
                    />
                )}

                {/* Grouped services list */}
                {form.services.length === 0 && !showAddPanel ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="mb-2 rounded-full bg-muted p-3">
                            <Plus size={20} className="text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">{t('ui.text_svc_none')}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {t('ui.text_kgt96g')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {servicesByCategory.map(({ category, services }) => (
                            <div key={category.id} className="space-y-2">
                                {/* Category heading */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        {category.label}
                                    </span>
                                    <div className="h-px flex-1 bg-border/60" />
                                    <span className="text-xs text-muted-foreground">{services.length}</span>
                                </div>

                                {/* Services in this category */}
                                <div className="space-y-2">
                                    {services.map(({ service, originalIndex }) => (
                                        <ServiceRow
                                            key={originalIndex}
                                            service={service}
                                            index={originalIndex}
                                            showLabels={false}
                                            onRemove={handleRemoveService}
                                            onChange={handleServiceChange}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Submit */}
            <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? (
                    <>
                        <SpinnerGap size={16} className="mr-2 animate-spin" />
                        {t('ui.text_y9fzx8')}</>
                ) : (
                    t('ui.text_qb5m67')
                )}
            </Button>
        </form>
    );
}

export { PersonalInfoSection };
