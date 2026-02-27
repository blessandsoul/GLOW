'use client';

import { useState, useCallback, useEffect, useId } from 'react';
import Image from 'next/image';
import {
    Palette,
    Check,
    InstagramLogo,
    FacebookLogo,
    TiktokLogo,
    User,
    ArrowRight,
    SpinnerGap,
    DeviceMobile,
    Images,
    Star,
    Trash,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useBranding } from '../hooks/useBranding';
import { DEFAULT_BRANDING } from '../types/branding.types';
import type { WatermarkStyle, BrandingFormData } from '../types/branding.types';
import { useBrandingStyles } from '../hooks/useBrandingStyles';
import { WatermarkPreview, WatermarkOverlay } from './WatermarkPreview';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useAppSelector } from '@/store/hooks';

// ─── Preset brand palette ─────────────────────────────────────────────────────
const COLOR_PRESETS = [
    '#d4738a',
    '#c9956b',
    '#8b7355',
    '#6b8cae',
    '#8f7ab5',
    '#5f8f7a',
    '#c4975a',
    '#2d2d2d',
];

// ─── Phone preview tabs ───────────────────────────────────────────────────────
type PreviewTab = 'result' | 'stories' | 'profile';

// ─── Phone Mockup ─────────────────────────────────────────────────────────────
interface PhoneMockupProps {
    tab: PreviewTab;
    onTabChange: (tab: PreviewTab) => void;
    color: string;
    name: string;
    handle: string;
    username: string;
    logoUrl: string | null;
    watermarkStyle: WatermarkStyle;
    watermarkOpacity: number;
}

function PhoneMockup({ tab, onTabChange, color, name, handle, username, logoUrl, watermarkStyle, watermarkOpacity }: PhoneMockupProps): React.ReactElement {
    const { t } = useLanguage();
    const displayName = name || t('ui.text_8z0fqz');
    const displayHandle = handle || '@your_handle';

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Tab switcher */}
            <div className="flex items-center rounded-full border border-border/50 bg-muted/40 p-1 gap-0.5">
                {([
                    { id: 'result', icon: Images, label: t('branding.preview_tab_result'), disabled: false },
                    { id: 'stories', icon: DeviceMobile, label: t('branding.preview_tab_stories'), disabled: true },
                    { id: 'profile', icon: Star, label: t('branding.preview_tab_profile'), disabled: true },
                ] as { id: PreviewTab; icon: typeof Images; label: string; disabled: boolean }[]).map(({ id, icon: Icon, label, disabled }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => !disabled && onTabChange(id)}
                        disabled={disabled}
                        className={cn(
                            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200',
                            disabled
                                ? 'cursor-not-allowed text-muted-foreground/40'
                                : tab === id
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <Icon size={12} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Phone frame */}
            <div className="relative">
                {/* Phone shell */}
                <div className="relative h-[520px] w-[248px] rounded-[2.5rem] border-[6px] border-foreground/15 bg-foreground/10 shadow-2xl shadow-black/20">
                    {/* Screen */}
                    <div className="absolute inset-0 overflow-hidden rounded-[2rem] bg-black">

                        {/* ── RESULT TAB ── */}
                        {tab === 'result' && (
                            <div className="flex h-full flex-col bg-white">
                                {/* Fake status bar */}
                                <div className="flex items-center justify-between px-5 pt-3 pb-1">
                                    <span className="text-[9px] text-black/60 font-medium">9:41</span>
                                    <div className="flex items-center gap-1">
                                        <div className="h-1.5 w-3.5 rounded-full border border-black/30">
                                            <div className="h-full w-2/3 rounded-full bg-black/50" />
                                        </div>
                                    </div>
                                </div>

                                {/* Instagram-style header */}
                                <div className="flex items-center gap-2 px-3 py-2 border-b border-black/10">
                                    {logoUrl ? (
                                        <div className="relative h-7 w-7 overflow-hidden rounded-full ring-1 ring-black/10">
                                            <Image src={logoUrl} alt="" fill className="object-cover" />
                                        </div>
                                    ) : (
                                        <div
                                            className="flex h-7 w-7 items-center justify-center rounded-full text-white text-[10px] font-bold"
                                            style={{ backgroundColor: color }}
                                        >
                                            {displayName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-semibold text-black leading-tight truncate">{displayHandle}</p>
                                        <p className="text-[8px] text-black/40 leading-tight">{t('branding.preview_platform')}</p>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="h-0.75 w-0.75 rounded-full bg-black/30" />
                                        ))}
                                    </div>
                                </div>

                                {/* Photo with watermark */}
                                <div className="relative flex-1 bg-zinc-900 overflow-hidden">
                                    {/* Real lash photo */}
                                    <Image
                                        src="/demo-lash-v2.png"
                                        alt=""
                                        fill
                                        className="object-cover object-top"
                                        sizes="248px"
                                    />
                                    {/* Watermark overlay */}
                                    <WatermarkOverlay
                                        style={watermarkStyle}
                                        color={color}
                                        name={displayName}
                                        handle={displayHandle}
                                        logoUrl={logoUrl}
                                        opacity={watermarkOpacity}
                                    />
                                </div>

                                {/* Instagram actions bar */}
                                <div className="flex items-center justify-between px-4 py-2 border-t border-black/10">
                                    <div className="flex items-center gap-3">
                                        {/* Heart */}
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeOpacity="0.6">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                        </svg>
                                        {/* Comment */}
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeOpacity="0.6">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        </svg>
                                        {/* Share */}
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeOpacity="0.6">
                                            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                                        </svg>
                                    </div>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeOpacity="0.6">
                                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                    </svg>
                                </div>

                                {/* Likes + caption */}
                                <div className="px-3 pb-3 space-y-0.5">
                                    <p className="text-[9px] font-semibold text-black">{t('branding.preview_likes')}</p>
                                    <p className="text-[9px] text-black/60 leading-relaxed">
                                        <span className="font-semibold text-black">{displayHandle} </span>
                                        {t('branding.preview_post_caption')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ── STORIES TAB ── */}
                        {tab === 'stories' && (
                            <div className="relative h-full bg-black overflow-hidden">
                                {/* Real lash photo as story bg */}
                                <Image
                                    src="/demo-lash-v2.png"
                                    alt=""
                                    fill
                                    className="object-cover object-top"
                                    sizes="248px"
                                />
                                {/* Dark overlay for readability */}
                                <div className="absolute inset-0 bg-black/30" />

                                {/* Story progress bar */}
                                <div className="absolute top-0 inset-x-0 px-2 pt-2 flex gap-1">
                                    <div className="h-[2px] flex-1 rounded-full bg-white/30">
                                        <div className="h-full w-full rounded-full bg-white" />
                                    </div>
                                    <div className="h-[2px] flex-1 rounded-full bg-white/30" />
                                    <div className="h-[2px] flex-1 rounded-full bg-white/30" />
                                </div>

                                {/* Story header */}
                                <div className="absolute top-5 inset-x-0 flex items-center gap-2 px-3">
                                    {logoUrl ? (
                                        <div className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-white/60">
                                            <Image src={logoUrl} alt="" fill className="object-cover" />
                                        </div>
                                    ) : (
                                        <div
                                            className="flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-white/60 text-white text-xs font-bold"
                                            style={{ backgroundColor: color }}
                                        >
                                            {displayName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-[10px] font-semibold text-white leading-tight">{displayHandle}</p>
                                        <p className="text-[8px] text-white/60">{t('branding.preview_ago')}</p>
                                    </div>
                                </div>

                                {/* STORIES_TEMPLATE watermark at top — matching the style */}
                                {watermarkStyle === 'STORIES_TEMPLATE' && (
                                    <div
                                        className="absolute top-0 inset-x-0 flex items-center justify-center gap-2 py-10 pt-16"
                                        style={{ backgroundColor: `${color}cc` }}
                                    >
                                        {logoUrl && (
                                            <div className="relative h-5 w-5 overflow-hidden rounded-full ring-1 ring-white/30">
                                                <Image src={logoUrl} alt="" fill className="object-cover" />
                                            </div>
                                        )}
                                        <span className="text-xs font-bold text-white">{displayName}</span>
                                        <span className="text-[10px] text-white/70">{displayHandle}</span>
                                    </div>
                                )}

                                {/* MINIMAL watermark */}
                                {watermarkStyle === 'MINIMAL' && (
                                    <div className="absolute bottom-20 right-4 flex items-center gap-2">
                                        {logoUrl && (
                                            <div className="relative h-6 w-6 overflow-hidden rounded-full ring-1 ring-white/30">
                                                <Image src={logoUrl} alt="" fill className="object-cover" />
                                            </div>
                                        )}
                                        <span className="text-sm font-semibold drop-shadow-md" style={{ color }}>{displayHandle}</span>
                                    </div>
                                )}

                                {/* FRAMED watermark */}
                                {watermarkStyle === 'FRAMED' && (
                                    <>
                                        <div className="absolute inset-x-4 bottom-24 top-16 rounded-xl" style={{ border: `2px solid ${color}` }} />
                                        <div className="absolute bottom-24 inset-x-4 flex items-center justify-center gap-2 py-2 rounded-b-xl" style={{ backgroundColor: color }}>
                                            {logoUrl && (
                                                <div className="relative h-5 w-5 overflow-hidden rounded-full ring-1 ring-white/30">
                                                    <Image src={logoUrl} alt="" fill className="object-cover" />
                                                </div>
                                            )}
                                            <span className="text-xs font-bold text-white">{displayName}</span>
                                        </div>
                                    </>
                                )}

                                {/* DIAGONAL watermark */}
                                {watermarkStyle === 'DIAGONAL' && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                                        <span
                                            className="font-georgian text-xl font-bold tracking-widest uppercase select-none whitespace-nowrap opacity-55"
                                            style={{ color, transform: 'rotate(-30deg)', textShadow: '0 1px 6px rgba(0,0,0,0.5)', letterSpacing: '0.2em' }}
                                        >
                                            {displayName}
                                        </span>
                                    </div>
                                )}

                                {/* BADGE watermark */}
                                {watermarkStyle === 'BADGE' && (
                                    <div
                                        className="absolute bottom-20 left-4 flex items-center gap-1.5 rounded-full px-2.5 py-1"
                                        style={{ backgroundColor: `${color}dd` }}
                                    >
                                        {logoUrl && (
                                            <div className="relative h-5 w-5 overflow-hidden rounded-full ring-1 ring-white/30">
                                                <Image src={logoUrl} alt="" fill className="object-cover" />
                                            </div>
                                        )}
                                        <span className="text-[10px] font-bold text-white">{displayName}</span>
                                    </div>
                                )}

                                {/* SPLIT watermark */}
                                {watermarkStyle === 'SPLIT' && (
                                    <div
                                        className="absolute bottom-14 inset-x-0 flex items-center gap-2 px-4 py-2"
                                        style={{ background: `linear-gradient(to top, ${color}f5, ${color}88)` }}
                                    >
                                        {logoUrl && (
                                            <div className="relative h-6 w-6 overflow-hidden rounded-full ring-1 ring-white/30 shrink-0">
                                                <Image src={logoUrl} alt="" fill className="object-cover" />
                                            </div>
                                        )}
                                        <span className="text-xs font-bold text-white truncate">{displayName}</span>
                                        <div className="flex-1 h-px bg-white/20" />
                                        <span className="text-[10px] italic text-white/70 shrink-0">{displayHandle}</span>
                                    </div>
                                )}

                                {/* Story center content */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center space-y-1">
                                        <p className="text-lg font-bold text-white drop-shadow-lg">до → после</p>
                                    </div>
                                </div>

                                {/* Story bottom — reply */}
                                <div className="absolute bottom-4 inset-x-3">
                                    <div className="flex items-center gap-2 rounded-full border border-white/30 px-3 py-2">
                                        <span className="text-[9px] text-white/50 flex-1">{t('branding.preview_reply')}</span>
                                        <InstagramLogo size={12} className="text-white/40" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── PROFILE TAB ── */}
                        {tab === 'profile' && (
                            <div className="flex h-full flex-col bg-background overflow-hidden">
                                {/* Status bar */}
                                <div className="flex items-center justify-between px-4 pt-3 pb-1 bg-background">
                                    <span className="text-[9px] text-foreground/40 font-medium">9:41</span>
                                </div>

                                {/* Profile header */}
                                <div className="flex items-start gap-3 px-3 py-3 bg-background">
                                    {logoUrl ? (
                                        <div
                                            className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-offset-2"
                                            style={{ ringColor: color } as React.CSSProperties}
                                        >
                                            <Image src={logoUrl} alt="" fill className="object-cover" />
                                        </div>
                                    ) : (
                                        <div
                                            className="flex h-14 w-14 items-center justify-center rounded-full text-white text-lg font-bold ring-2 ring-offset-2"
                                            style={{ backgroundColor: color, outlineColor: color }}
                                        >
                                            {displayName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0 pt-1">
                                        <p className="text-sm font-bold text-foreground truncate">{displayHandle.replace('@', '')}</p>
                                        <div className="mt-1.5 flex gap-3">
                                            {[
                                                ['48', t('branding.preview_photos')],
                                                ['1.2K', t('branding.preview_followers')],
                                                ['834', t('branding.preview_following')],
                                            ].map(([n, l]) => (
                                                <div key={l} className="text-center">
                                                    <p className="text-xs font-bold text-foreground">{n}</p>
                                                    <p className="text-[8px] text-muted-foreground">{l}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Bio */}
                                <div className="px-3 pb-2">
                                    <p className="text-[10px] font-semibold text-foreground">{displayName}</p>
                                    <p className="text-[9px] text-muted-foreground leading-relaxed mt-0.5 whitespace-pre-line">
                                        {t('branding.preview_bio')}
                                    </p>
                                    <p className="text-[9px] font-medium mt-0.5" style={{ color }}>
                                        glow.ge/{username}
                                    </p>
                                </div>

                                {/* CTA button */}
                                <div className="px-3 pb-2">
                                    <div
                                        className="rounded-md py-1.5 text-center text-[9px] font-semibold text-white"
                                        style={{ backgroundColor: color }}
                                    >
                                        {t('branding.preview_book')}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-border/40 mx-0" />

                                {/* Grid preview */}
                                <div className="flex-1 overflow-hidden">
                                    <div className="grid grid-cols-3 gap-px">
                                        {[
                                            '/demo-lash-v2.png',
                                            '/demo-lash2.png',
                                            '/demo-lash3.png',
                                            '/demo-lash3.png',
                                            '/demo-lash-v2.png',
                                            '/demo-lash2.png',
                                            '/demo-lash2.png',
                                            '/demo-lash3.png',
                                            '/demo-lash-v2.png',
                                        ].map((src, i) => (
                                            <div key={i} className="relative aspect-square overflow-hidden">
                                                <Image src={src} alt="" fill className="object-cover object-top" sizes="83px" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Phone notch */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 h-4 w-16 rounded-full bg-foreground/20" />
                </div>

                {/* Phone shadow */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 h-8 w-40 rounded-full bg-black/20 blur-xl" />
            </div>

        </div>
    );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function BrandingLoadingSkeleton(): React.ReactElement {
    return (
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
            <div className="hidden lg:flex flex-col items-center gap-4">
                <Skeleton className="h-10 w-56 rounded-full" />
                <Skeleton className="h-[520px] w-[248px] rounded-[2.5rem]" />
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function BrandingSetup(): React.ReactElement {
    const { t } = useLanguage();
    const { WATERMARK_STYLES } = useBrandingStyles();
    const { profile, isLoading, save, isSaving, remove, isRemoving } = useBranding();

    const [form, setForm] = useState<BrandingFormData>(DEFAULT_BRANDING);
    const [formErrors, setFormErrors] = useState<{ displayName?: string }>({});
    const [activeTab, setActiveTab] = useState<PreviewTab>('result');
    const colorInputId = useId();

    useEffect(() => {
        if (profile) {
            setForm({
                displayName: profile.displayName ?? '',
                instagramHandle: profile.instagramHandle ?? '',
                facebookHandle: profile.facebookHandle ?? '',
                tiktokHandle: profile.tiktokHandle ?? '',
                primaryColor: profile.primaryColor,
                watermarkStyle: profile.watermarkStyle,
                watermarkOpacity: profile.watermarkOpacity ?? 1,
            });
        }
    }, [profile]);

    const handleStyleSelect = useCallback((value: WatermarkStyle) => {
        setForm((prev) => ({ ...prev, watermarkStyle: value }));
    }, []);

    const handleColorPreset = useCallback((color: string) => {
        setForm((prev) => ({ ...prev, primaryColor: color }));
    }, []);

    const validateForm = useCallback((): boolean => {
        const errors: { displayName?: string } = {};
        if (!form.displayName.trim()) {
            errors.displayName = t('branding.name_required');
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [form.displayName, t]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        save(form);
    }, [form, save, validateForm]);

    const user = useAppSelector((state) => state.auth.user);
    const previewUsername = user
        ? `${user.firstName}${user.lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '_')
        : 'username';

    if (isLoading) return <BrandingLoadingSkeleton />;

    const previewName = form.displayName || t('ui.text_8z0fqz');
    const previewHandle = form.instagramHandle || form.tiktokHandle || form.facebookHandle || '@handle';

    return (
        <div className="grid gap-8 lg:grid-cols-[1fr_280px] lg:items-start">

            {/* ── LEFT: Form ───────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} className="space-y-5">

                {/* Header */}
                <h1 className="text-lg font-semibold text-foreground">{t('ui.text_o8dusv')}</h1>

                {/* Section 1: Identity */}
                <section className="space-y-3 rounded-xl border border-border/50 bg-card p-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="displayName" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User size={11} />
                            {t('ui.text_6m8ujt')} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="displayName"
                            placeholder="Anna Lashes"
                            value={form.displayName}
                            onChange={(e) => {
                                setForm((prev) => ({ ...prev, displayName: e.target.value }));
                                if (formErrors.displayName) setFormErrors((prev) => ({ ...prev, displayName: undefined }));
                            }}
                            className={cn('h-9', formErrors.displayName && 'border-destructive')}
                        />
                        {formErrors.displayName && (
                            <p className="text-xs text-destructive">{formErrors.displayName}</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="instagramHandle" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <InstagramLogo size={11} />
                            Instagram
                        </Label>
                        <Input
                            id="instagramHandle"
                            placeholder="@anna_lashes"
                            value={form.instagramHandle}
                            onChange={(e) => setForm((prev) => ({ ...prev, instagramHandle: e.target.value }))}
                            className="h-9"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="facebookHandle" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <FacebookLogo size={11} />
                            Facebook
                        </Label>
                        <Input
                            id="facebookHandle"
                            placeholder="Anna Lashes"
                            value={form.facebookHandle}
                            onChange={(e) => setForm((prev) => ({ ...prev, facebookHandle: e.target.value }))}
                            className="h-9"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="tiktokHandle" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <TiktokLogo size={11} />
                            TikTok
                        </Label>
                        <Input
                            id="tiktokHandle"
                            placeholder="@anna_lashes"
                            value={form.tiktokHandle}
                            onChange={(e) => setForm((prev) => ({ ...prev, tiktokHandle: e.target.value }))}
                            className="h-9"
                        />
                    </div>
                </section>

                {/* Section 2: Brand Color */}
                <section className="space-y-4 rounded-xl border border-border/50 bg-card p-5">
                    {/* Header row with live swatch */}
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('ui.text_rzblie')}</p>
                        <div className="flex items-center gap-2">
                            <div
                                className="h-5 w-5 rounded-full shadow-sm transition-all duration-300"
                                style={{ backgroundColor: form.primaryColor, boxShadow: `0 0 0 2px ${form.primaryColor}33` }}
                            />
                            <span className="font-mono text-xs text-muted-foreground">{form.primaryColor.toUpperCase()}</span>
                        </div>
                    </div>

                    {/* Color gradient preview bar */}
                    <div
                        className="h-1.5 w-full rounded-full opacity-60 transition-all duration-500"
                        style={{
                            background: `linear-gradient(to right, ${form.primaryColor}22, ${form.primaryColor}, ${form.primaryColor}22)`,
                        }}
                    />

                    {/* Preset swatches */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">Presets</p>
                        <div className="flex flex-wrap gap-2.5">
                            {COLOR_PRESETS.map((preset) => {
                                const isActive = form.primaryColor.toLowerCase() === preset.toLowerCase();
                                return (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => handleColorPreset(preset)}
                                        aria-label={preset}
                                        title={preset}
                                        className={cn(
                                            'relative h-8 w-8 rounded-full transition-all duration-200 cursor-pointer',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
                                            isActive
                                                ? 'scale-110 shadow-lg'
                                                : 'hover:scale-110 hover:shadow-md opacity-75 hover:opacity-100',
                                        )}
                                        style={{
                                            backgroundColor: preset,
                                            boxShadow: isActive ? `0 0 0 3px white, 0 0 0 5px ${preset}` : undefined,
                                        }}
                                    >
                                        {isActive && (
                                            <Check size={12} weight="bold" className="absolute inset-0 m-auto text-white drop-shadow-md" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="h-px bg-border/40" />

                    {/* Custom color row */}
                    <div className="flex items-center gap-3">
                        <label htmlFor={colorInputId} className="cursor-pointer group shrink-0">
                            <div
                                className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border-2 border-border/50 transition-all duration-200 group-hover:scale-105 group-hover:border-primary/40 group-hover:shadow-md"
                                style={{ backgroundColor: form.primaryColor }}
                            >
                                <input
                                    id={colorInputId}
                                    type="color"
                                    value={form.primaryColor}
                                    onChange={(e) => setForm((prev) => ({ ...prev, primaryColor: e.target.value }))}
                                    className="sr-only"
                                />
                                <Palette size={14} className="text-white/90 drop-shadow" />
                            </div>
                        </label>

                        <div className="flex-1 space-y-1">
                            <p className="text-[10px] font-medium text-muted-foreground">Custom color</p>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={form.primaryColor}
                                    onChange={(e) => setForm((prev) => ({ ...prev, primaryColor: e.target.value }))}
                                    className="h-8 w-28 font-mono text-xs"
                                    maxLength={7}
                                    aria-label="Hex color"
                                />
                                <span className="text-[10px] text-muted-foreground/50">HEX</span>
                            </div>
                        </div>

                        {/* Opacity picker */}
                        <div className="flex flex-col items-center gap-1 shrink-0">
                            <span className="text-[10px] tabular-nums text-muted-foreground/70 font-mono">
                                {Math.round(form.watermarkOpacity * 100)}%
                            </span>
                            <div className="flex items-end gap-1" role="group" aria-label="Watermark opacity">
                                {([0.2, 0.4, 0.6, 0.8, 1] as const).map((opacityValue, i) => {
                                    const isActive = form.watermarkOpacity === opacityValue;
                                    const hex = form.primaryColor;
                                    const alphaHex = Math.round(opacityValue * 255).toString(16).padStart(2, '0');
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            title={`${Math.round(opacityValue * 100)}%`}
                                            aria-label={`Opacity ${Math.round(opacityValue * 100)}%`}
                                            onClick={() => setForm((prev) => ({ ...prev, watermarkOpacity: opacityValue }))}
                                            className={cn(
                                                'rounded-sm transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary/60',
                                                isActive ? 'scale-110' : 'hover:scale-105',
                                            )}
                                            style={{
                                                backgroundColor: `${hex}${alphaHex}`,
                                                width: '10px',
                                                height: `${(i + 1) * 6 + 8}px`,
                                                boxShadow: isActive ? `0 0 0 2px white, 0 0 0 3.5px ${hex}` : undefined,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 3: Watermark Style */}
                <section className="space-y-3 rounded-xl border border-border/50 bg-card p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('ui.text_ie5d6c')}</p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {WATERMARK_STYLES.map(({ value, label, description }) => {
                            const isSelected = form.watermarkStyle === value;
                            return (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => handleStyleSelect(value)}
                                    className={cn(
                                        'group relative flex flex-col gap-2 rounded-xl p-3 text-left transition-all duration-200 cursor-pointer',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                        isSelected
                                            ? 'border-2 border-primary bg-primary/5 shadow-sm'
                                            : 'border border-border/50 hover:border-primary/30 hover:bg-muted/30',
                                    )}
                                >
                                    {isSelected && (
                                        <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary shadow-sm">
                                            <Check size={10} weight="bold" className="text-primary-foreground" />
                                        </div>
                                    )}
                                    <WatermarkPreview
                                        style={value}
                                        color={form.primaryColor}
                                        name={previewName}
                                        handle={previewHandle}
                                    />
                                    <div>
                                        <p className="text-xs font-semibold text-foreground">{label}</p>
                                        <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{description}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Button type="submit" disabled={isSaving} className="gap-2">
                        {isSaving ? (
                            <>
                                <SpinnerGap size={14} className="animate-spin" />
                                {t('ui.text_miwi1p')}
                            </>
                        ) : (
                            <>
                                {profile ? t('ui.text_x4lhu5') : t('ui.text_igwmrw')}
                                <ArrowRight size={14} />
                            </>
                        )}
                    </Button>

                    {profile && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isRemoving}
                            className="gap-1.5 text-muted-foreground hover:text-destructive"
                            onClick={() => remove()}
                        >
                            {isRemoving ? <SpinnerGap size={13} className="animate-spin" /> : <Trash size={13} />}
                            {t('ui.text_h2hmme')}
                        </Button>
                    )}
                </div>
            </form>

            {/* ── MOBILE: Full phone mockup below form ─────────────────────── */}
            <div className="block lg:hidden">
                <PhoneMockup
                    tab={activeTab}
                    onTabChange={setActiveTab}
                    color={form.primaryColor}
                    name={previewName}
                    handle={previewHandle}
                    username={previewUsername}
                    logoUrl={profile?.logoUrl ?? null}
                    watermarkStyle={form.watermarkStyle}
                    watermarkOpacity={form.watermarkOpacity}
                />
            </div>

            {/* ── RIGHT: Phone mockup (desktop only) ───────────────────────── */}
            <div className="hidden lg:block sticky top-24">
                <PhoneMockup
                    tab={activeTab}
                    onTabChange={setActiveTab}
                    color={form.primaryColor}
                    name={previewName}
                    handle={previewHandle}
                    username={previewUsername}
                    logoUrl={profile?.logoUrl ?? null}
                    watermarkStyle={form.watermarkStyle}
                    watermarkOpacity={form.watermarkOpacity}
                />
            </div>
        </div>
    );
}
