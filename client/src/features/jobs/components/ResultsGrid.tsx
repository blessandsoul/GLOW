'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    DownloadSimple, Sparkle, WarningCircle, ShareNetwork, Lock, Eye,
    ChatText, DeviceMobile, Eraser, PaperPlaneTilt, ChatCircle,
    LinkSimple, Clock, CaretDown, CaretUp, InstagramLogo, Flask,
    EyeSlash, Stamp,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants/routes';
import { GuestResultBanner } from '@/features/upload/components/GuestResultBanner';
import { CaptionGenerator } from '@/features/captions/components/CaptionGenerator';
import { ImageCompare } from '@/components/ui/ImageCompare';
import { WatermarkOverlay } from '@/features/branding/components/WatermarkPreview';
import { useBranding } from '@/features/branding/hooks/useBranding';
import type { Job } from '../types/job.types';
import { useLanguage } from "@/i18n/hooks/useLanguage";
import { getServerImageUrl } from '@/lib/utils/image';

interface ResultsGridProps {
    job: Job;
    isAuthenticated: boolean;
    isGuest?: boolean;
    isDemo?: boolean;
    onDownload: (url: string, jobId: string, variantIndex: number, branded: boolean) => void;
    onGenerateCaption?: () => void;
    onGenerateStories?: () => void;
    onRetouch?: (url: string) => void;
}

// ─── "Send to Client" panel ───────────────────────────────────────────────────
interface SendToClientPanelProps {
    jobId: string;
}

function SendToClientPanel({ jobId }: SendToClientPanelProps): React.ReactElement {
    const showcaseUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/showcase/${jobId}`
        : `/showcase/${jobId}`;

    const handleWhatsApp = (): void => {
        const text = encodeURIComponent(`Посмотрите результат вашей процедуры: ${showcaseUrl}`);
        window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    };

    const handleTelegram = (): void => {
        const url = encodeURIComponent(showcaseUrl);
        const text = encodeURIComponent('Посмотрите результат вашей процедуры 💅');
        window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer');
    };

    const handleCopyLink = async (): Promise<void> => {
        try {
            await navigator.clipboard.writeText(showcaseUrl);
            toast.success('Ссылка скопирована');
        } catch {
            toast.error('Не удалось скопировать');
        }
    };

    return (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="mb-3 flex items-start gap-3">
                <div className="shrink-0 rounded-full bg-primary/10 p-2">
                    <PaperPlaneTilt size={16} className="text-primary" weight="fill" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-foreground">Отправить клиенту</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Красивая страница с работой — не просто картинка в чате
                    </p>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                <Button
                    size="sm"
                    onClick={handleWhatsApp}
                    className="min-w-30 flex-1 gap-1.5 border-0 bg-[#25D366] text-white hover:bg-[#22c55e]"
                >
                    <ChatCircle size={14} weight="fill" />
                    WhatsApp
                </Button>
                <Button
                    size="sm"
                    onClick={handleTelegram}
                    className="min-w-30 flex-1 gap-1.5 border-0 bg-[#229ED9] text-white hover:bg-[#0ea5e9]"
                >
                    <PaperPlaneTilt size={14} weight="fill" />
                    Telegram
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="gap-1.5"
                >
                    <LinkSimple size={14} />
                    Скопировать
                </Button>
            </div>
        </div>
    );
}

// ─── Instagram caption panel ──────────────────────────────────────────────────
function InstagramPanel({ jobId }: { jobId: string }): React.ReactElement {
    const [open, setOpen] = useState(false);

    return (
        <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/30"
            >
                <div className="flex items-center gap-3">
                    <div className="rounded-full bg-linear-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-2">
                        <InstagramLogo size={16} className="text-white" weight="fill" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-semibold text-foreground">Пост для Instagram</p>
                        <p className="text-xs text-muted-foreground">Текст + хэштеги за 10 секунд</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                        <Clock size={10} />
                        Пт 19:00 — пик
                    </div>
                    {open
                        ? <CaretUp size={14} className="text-muted-foreground" />
                        : <CaretDown size={14} className="text-muted-foreground" />
                    }
                </div>
            </button>
            {open && (
                <div className="border-t border-border/30 p-4">
                    <CaptionGenerator jobId={jobId} />
                </div>
            )}
        </div>
    );
}

// ─── Demo banner ──────────────────────────────────────────────────────────────
function DemoBanner(): React.ReactElement {
    return (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50/80 p-3.5 dark:border-amber-800/40 dark:bg-amber-950/30">
            <div className="mt-0.5 shrink-0 rounded-full bg-amber-100 p-1.5 dark:bg-amber-900/40">
                <Flask size={14} className="text-amber-600 dark:text-amber-400" weight="fill" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    შედეგების მაგალითი
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-amber-700/80 dark:text-amber-400/80">
                    ეს დემო-ვარიანტია. რეგისტრაციის შემდეგ AI დაამუშავებს შენს ფოტოს და მიიღებ პროფესიულ შედეგს.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-amber-700"
                    >
                        რეგისტრაცია
                    </Link>
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 px-2.5 py-1 text-[11px] text-amber-700 dark:border-amber-800 dark:text-amber-400">
                        <Sparkle size={10} weight="fill" />
                        1 კრედიტი = 1 ფოტო
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── Download panel for selected image ───────────────────────────────────────
interface DownloadPanelProps {
    jobId: string;
    variantIndex: number;
    hasBranding: boolean;
    onDownload: (url: string, jobId: string, variantIndex: number, branded: boolean) => void;
    resultUrl: string;
}

function DownloadPanel({ jobId, variantIndex, hasBranding, onDownload, resultUrl }: DownloadPanelProps): React.ReactElement {
    return (
        <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/20 p-3">
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">
                    #{variantIndex + 1}
                </p>
            </div>
            <div className="flex items-center gap-1.5">
                {hasBranding && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-[11px]"
                        onClick={() => onDownload(resultUrl, jobId, variantIndex, true)}
                    >
                        <Stamp size={12} weight="fill" />
                        With branding
                    </Button>
                )}
                <Button
                    size="sm"
                    variant={hasBranding ? 'ghost' : 'outline'}
                    className="gap-1.5 text-[11px]"
                    onClick={() => onDownload(resultUrl, jobId, variantIndex, false)}
                >
                    <DownloadSimple size={12} />
                    {hasBranding ? 'Clean' : 'Download'}
                </Button>
            </div>
        </div>
    );
}

// ─── Main ResultsGrid ─────────────────────────────────────────────────────────
export function ResultsGrid({ job, isAuthenticated, isGuest, isDemo, onDownload, onGenerateCaption, onGenerateStories, onRetouch }: ResultsGridProps): React.ReactElement {
    const { t } = useLanguage();
    const { profile: brandingProfile } = useBranding();

    const hasBranding = !!(isAuthenticated && !isDemo && brandingProfile?.isActive &&
        brandingProfile.displayName && brandingProfile.instagramHandle);

    const [showBranding, setShowBranding] = useState(true);
    const [selectedAfterIdx, setSelectedAfterIdx] = useState(0);

    if (job.status === 'PENDING' || job.status === 'PROCESSING') {
        return (
            <div className="flex w-full flex-col items-center gap-6 py-8">
                <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-4">
                        <Sparkle size={32} className="animate-pulse text-primary" />
                    </div>
                    <div className="text-center">
                        <p className="text-base font-semibold text-foreground">{t('ui.text_c0yn6g')}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{t('ui.text_wyqnkc')}</p>
                    </div>
                </div>
                <div className="flex w-full max-w-sm justify-center">
                    <Skeleton className="aspect-3/4 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    if (job.status === 'FAILED') {
        return (
            <div className="flex w-full flex-col items-center gap-4 py-12">
                <div className="rounded-full bg-destructive/10 p-4">
                    <WarningCircle size={32} className="text-destructive" />
                </div>
                <div className="text-center">
                    <p className="text-base font-semibold text-foreground">{t('ui.text_y81efi')}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t('ui.text_6hw7ec')}</p>
                </div>
            </div>
        );
    }

    const results = job.results ?? [];
    const brandingVisible = hasBranding && showBranding;

    const handleShare = async (url: string): Promise<void> => {
        try {
            await navigator.clipboard.writeText(url);
            toast.success(t('ui.text_fj1r2r'));
        } catch {
            toast.error(t('ui.text_h1ne34'));
        }
    };

    return (
        <div className="flex w-full flex-col gap-5 py-4">
            {isDemo && <DemoBanner />}
            {isGuest && !isDemo && <GuestResultBanner jobId={job.id} />}

            {/* Before / After comparison — uses same ImageCompare as hero section */}
            {isAuthenticated && !isDemo && results.length > 0 && job.originalUrl && (
                <div className="flex flex-col items-center gap-2">
                    <div className="flex w-full max-w-sm items-center justify-between px-1">
                        <span className="text-xs font-medium text-muted-foreground">{t('ui.text_pt6')}</span>
                        <span className="text-xs font-medium text-primary">{t('ui.text_gnzjzw')}</span>
                    </div>
                    <ImageCompare
                        beforeSrc={getServerImageUrl(job.originalUrl)}
                        afterSrc={getServerImageUrl(results[selectedAfterIdx] ?? results[0])}
                        beforeAlt={t('ui.text_pt6')}
                        afterAlt={t('ui.text_gnzjzw')}
                        initialPosition={50}
                        className="aspect-[3/4] w-full max-w-sm rounded-xl"
                    />
                    {results.length > 1 && (
                        <p className="text-[10px] text-muted-foreground">
                            {t('ui.text_tfd6xc')} #{selectedAfterIdx + 1}
                        </p>
                    )}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-base font-semibold text-foreground">
                        {isDemo ? 'შედეგების მაგალითი' : t('ui.text_k25oyf')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {isDemo
                            ? 'ასე გამოიყურება დამუშავებული ფოტო — შენი კიდევ უკეთესი იქნება'
                            : `${results.length} ${t('ui.text_mhnuxr')}${results.length > 1 ? t('ui.text_ts') : ''} ${t('ui.text_tfd6xc')}`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Branding toggle */}
                    {hasBranding && (
                        <button
                            type="button"
                            onClick={() => setShowBranding((v) => !v)}
                            className={cn(
                                'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-200',
                                showBranding
                                    ? 'border-primary/30 bg-primary/10 text-primary'
                                    : 'border-border/50 bg-muted/30 text-muted-foreground',
                            )}
                            aria-label={showBranding ? 'Hide branding' : 'Show branding'}
                        >
                            {showBranding ? <Stamp size={12} weight="fill" /> : <EyeSlash size={12} />}
                            {showBranding ? 'Branded' : 'Clean'}
                        </button>
                    )}
                    {!isAuthenticated && !isGuest && (
                        <Button size="sm" className="gap-1.5 text-xs" asChild>
                            <Link href="/register">
                                <Lock size={12} />
                                {t('ui.text_l7x1oj')}
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Results grid */}
            <div className={cn(
                results.length === 1
                    ? 'flex justify-center'
                    : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4',
            )}>
                {results.map((url, i) => (
                    <div
                        key={i}
                        className={cn(
                            'group relative overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer',
                            results.length === 1 && 'w-full max-w-sm',
                            selectedAfterIdx === i && isAuthenticated && !isDemo
                                ? 'border-primary/50 ring-2 ring-primary/20'
                                : 'border-border/50',
                        )}
                        onClick={() => setSelectedAfterIdx(i)}
                    >
                        <div className={cn('relative aspect-3/4', (!isAuthenticated || isDemo) && 'blur-sm')}>
                            <Image
                                src={getServerImageUrl(url)}
                                alt={`Вариант ${i + 1}`}
                                fill
                                unoptimized
                                className="object-cover"
                                sizes="(max-width: 640px) 50vw, 25vw"
                            />
                            {/* Branding overlay */}
                            {brandingVisible && brandingProfile && (
                                <WatermarkOverlay
                                    style={brandingProfile.watermarkStyle}
                                    color={brandingProfile.primaryColor}
                                    name={brandingProfile.displayName ?? ''}
                                    handle={brandingProfile.instagramHandle ?? ''}
                                    logoUrl={brandingProfile.logoUrl ? getServerImageUrl(brandingProfile.logoUrl) : null}
                                    opacity={brandingProfile.watermarkOpacity}
                                />
                            )}
                        </div>
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/70 via-black/30 to-transparent p-2.5 pt-8">
                            <span className="text-xs font-medium text-white/80">
                                {isDemo ? 'Demo' : `#${i + 1}`}
                            </span>
                            {isAuthenticated && !isDemo && (
                                <div className="flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                                    {onRetouch && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); onRetouch(url); }}
                                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/40"
                                            aria-label={t('ui.text_jry5cq')}
                                        >
                                            <Eraser size={12} className="text-white" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleShare(url); }}
                                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/40"
                                        aria-label={t('ui.text_nq6g7p')}
                                    >
                                        <ShareNetwork size={12} className="text-white" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); onDownload(url, job.id, i, brandingVisible); }}
                                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/40"
                                        aria-label={t('ui.text_9ftpjq')}
                                    >
                                        <DownloadSimple size={12} className="text-white" />
                                    </button>
                                </div>
                            )}
                        </div>
                        {(!isAuthenticated || isDemo) && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="rounded-full bg-background/80 p-2 shadow-sm backdrop-blur-sm">
                                    <Lock size={16} className="text-muted-foreground" />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Download panel — explicit branded/clean options for selected image */}
            {isAuthenticated && !isDemo && results.length > 0 && (
                <DownloadPanel
                    jobId={job.id}
                    variantIndex={selectedAfterIdx}
                    hasBranding={hasBranding}
                    onDownload={onDownload}
                    resultUrl={results[selectedAfterIdx] ?? results[0]}
                />
            )}

            {/* Authenticated action panels */}
            {isAuthenticated && !isDemo && results.length > 0 && (
                <div className="flex flex-col gap-3">
                    {/* Primary CTA: Send to client */}
                    <SendToClientPanel jobId={job.id} />

                    {/* Instagram caption */}
                    <InstagramPanel jobId={job.id} />

                    {/* Secondary actions row */}
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="gap-1.5" asChild>
                            <Link href={ROUTES.SHOWCASE(job.id)} target="_blank" rel="noopener noreferrer">
                                <Eye size={14} />
                                {t('ui.text_oxzcqg')}
                            </Link>
                        </Button>
                        {onGenerateStories && (
                            <Button variant="outline" size="sm" className="gap-1.5" onClick={onGenerateStories}>
                                <DeviceMobile size={14} />
                                {t('ui.text_votwmr')}
                            </Button>
                        )}
                        {onGenerateCaption && (
                            <Button variant="outline" size="sm" className="gap-1.5" onClick={onGenerateCaption}>
                                <ChatText size={14} />
                                {t('ui.text_2kgc5q')}
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
