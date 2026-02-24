'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DownloadSimple, Sparkle, WarningCircle, Lock, SquaresFour, DeviceMobile, PaperPlaneTilt, ChatCircle, LinkSimple } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BeforeAfterJob } from '../types/before-after.types';
import { useLanguage } from "@/i18n/hooks/useLanguage";
import { getServerImageUrl } from '@/lib/utils/image';

interface BeforeAfterResultsProps {
    job: BeforeAfterJob;
    isAuthenticated: boolean;
    onDownload: (url: string, jobId: string, variantIndex: number) => void;
}

type ResultTab = 'carousel' | 'stories';

export function BeforeAfterResults({ job, isAuthenticated, onDownload }: BeforeAfterResultsProps): React.ReactElement {
    const { t } = useLanguage();
    const [tab, setTab] = useState<ResultTab>('carousel');

    if (job.status === 'PENDING' || job.status === 'PROCESSING') {
        return (
            <div className="flex w-full flex-col items-center gap-6 py-8">
                <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-4">
                        <Sparkle size={32} className="animate-pulse text-primary" />
                    </div>
                    <div className="text-center">
                        <p className="text-base font-semibold text-foreground">{t('ui.text_d4snqy')}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{t('ui.text_f8qb88')}</p>
                    </div>
                </div>
                <div className="w-full max-w-md space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="aspect-square rounded-xl" />
                        <Skeleton className="aspect-square rounded-xl" />
                    </div>
                    <Skeleton className="h-24 w-full rounded-xl" />
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
                    <p className="text-base font-semibold text-foreground">{t('ui.text_kt5lhs')}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t('ui.text_ajdfyq')}</p>
                </div>
            </div>
        );
    }

    const results = job.results;
    if (!results) return <></>;

    const currentResults = tab === 'carousel' ? results.carousel : results.stories;

    const handleShare = async (url: string): Promise<void> => {
        try {
            await navigator.clipboard.writeText(url);
            toast.success(t('ui.text_fj1r2r'));
        } catch {
            toast.error(t('ui.text_v5k3op'));
        }
    };

    return (
        <div className="flex w-full flex-col gap-4 py-4">
            {/* Header with tabs */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-base font-semibold text-foreground">{t('ui.text_cmy2e6')}</p>
                    <p className="text-sm text-muted-foreground">
                        {results.carousel.length + results.stories.length} {t('ui.text_k3ox8z')}</p>
                </div>
                {!isAuthenticated && (
                    <Button size="sm" className="gap-1.5 text-xs" asChild>
                        <Link href="/register">
                            <Lock size={12} />
                            {t('ui.text_l7x1oj')}</Link>
                    </Button>
                )}
            </div>

            {/* Format tabs */}
            <div className="flex gap-1 rounded-lg border border-border/50 bg-muted/40 p-0.5 w-fit">
                <TabButton
                    active={tab === 'carousel'}
                    icon={<SquaresFour size={12} />}
                    label={`Carousel (${results.carousel.length})`}
                    onClick={() => setTab('carousel')}
                />
                <TabButton
                    active={tab === 'stories'}
                    icon={<DeviceMobile size={12} />}
                    label={`Stories (${results.stories.length})`}
                    onClick={() => setTab('stories')}
                />
            </div>

            {/* Results grid */}
            <div className={cn(
                'grid gap-3',
                tab === 'carousel' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3',
            )}>
                {currentResults.map((url, i) => (
                    <div key={i} className="group relative overflow-hidden rounded-xl border border-border/50 transition-all duration-200 hover:shadow-md">
                        <div className={cn(
                            'relative',
                            tab === 'carousel' ? 'aspect-square' : 'aspect-9/16',
                            !isAuthenticated && 'blur-sm',
                        )}>
                            <Image src={getServerImageUrl(url)} alt={`${tab === 'carousel' ? 'Carousel' : 'Stories'} ${i + 1}`}
                                fill className="object-cover" sizes="(max-width: 640px) 50vw, 25vw" unoptimized />
                        </div>
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/70 via-black/30 to-transparent p-2.5 pt-8">
                            <span className="text-xs font-medium text-white/80">
                                {tab === 'carousel' ? `Slide ${i + 1}` : `Story ${i + 1}`}
                            </span>
                            {isAuthenticated && (
                                <button type="button" onClick={() => onDownload(url, job.id, i)}
                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-white/40"
                                    aria-label={t('ui.text_9ftpjq')}>
                                    <DownloadSimple size={12} className="text-white" />
                                </button>
                            )}
                        </div>
                        {!isAuthenticated && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="rounded-full bg-background/80 p-2 shadow-sm backdrop-blur-sm">
                                    <Lock size={16} className="text-muted-foreground" />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Action bar: download all + send to client */}
            {isAuthenticated && currentResults.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                            currentResults.forEach((url, i) => onDownload(url, job.id, i));
                        }}
                    >
                        <DownloadSimple size={14} />
                        Скачать все ({currentResults.length})
                    </Button>
                    <Button
                        size="sm"
                        className="gap-1.5 border-0 bg-[#25D366] text-white hover:bg-[#22c55e]"
                        onClick={() => {
                            const url = typeof window !== 'undefined'
                                ? `${window.location.origin}/showcase/${job.id}`
                                : `/showcase/${job.id}`;
                            const text = encodeURIComponent(`Результат до/после вашей процедуры: ${url}`);
                            window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
                        }}
                    >
                        <ChatCircle size={14} weight="fill" />
                        WhatsApp
                    </Button>
                    <Button
                        size="sm"
                        className="gap-1.5 border-0 bg-[#229ED9] text-white hover:bg-[#0ea5e9]"
                        onClick={() => {
                            const url = typeof window !== 'undefined'
                                ? `${window.location.origin}/showcase/${job.id}`
                                : `/showcase/${job.id}`;
                            const encodedUrl = encodeURIComponent(url);
                            const text = encodeURIComponent('Результат до/после вашей процедуры 💅');
                            window.open(`https://t.me/share/url?url=${encodedUrl}&text=${text}`, '_blank', 'noopener,noreferrer');
                        }}
                    >
                        <PaperPlaneTilt size={14} weight="fill" />
                        Telegram
                    </Button>
                </div>
            )}
        </div>
    );
}

function TabButton({ active, icon, label, onClick }: {
    active: boolean;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}): React.ReactElement {
    return (
        <button type="button" onClick={onClick}
            className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}>
            {icon}{label}
        </button>
    );
}
