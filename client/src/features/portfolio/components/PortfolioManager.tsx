'use client';

import { useCallback } from 'react';
import Image from 'next/image';
import { Eye, EyeSlash, Trash, ArrowSquareOut, Images, LinkSimple } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getServerImageUrl } from '@/lib/utils/image';
import { useMyPortfolio } from '../hooks/usePortfolio';
import { useAppSelector } from '@/store/hooks';
import { ROUTES } from '@/lib/constants/routes';
import type { PortfolioItem } from '../types/portfolio.types';
import { useLanguage } from "@/i18n/hooks/useLanguage";

function PortfolioItemCard({
    item,
    onTogglePublish,
    onDelete,
}: {
    item: PortfolioItem;
    onTogglePublish: (id: string, published: boolean) => void;
    onDelete: (id: string) => void;
}): React.ReactElement {
    const { t } = useLanguage();
    return (
        <div className={cn(
            'group relative overflow-hidden rounded-xl border transition-all duration-200',
            item.isPublished
                ? 'border-border/50 hover:shadow-md'
                : 'border-dashed border-border/30 opacity-60'
        )}>
            <div className="relative aspect-3/4">
                <Image
                    src={getServerImageUrl(item.imageUrl)}
                    alt={item.title ?? 'Portfolio item'}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 flex items-end bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <div className="flex w-full items-center justify-between p-3">
                        <span className="truncate text-xs font-medium text-white">
                            {item.title ?? t('ui.text_4ts4nz')}
                        </span>
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => onTogglePublish(item.id, !item.isPublished)}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/40"
                                aria-label={item.isPublished ? t('ui.text_kbpmj2') : t('ui.text_z5nf3c')}
                            >
                                {item.isPublished ? (
                                    <EyeSlash size={14} className="text-white" />
                                ) : (
                                    <Eye size={14} className="text-white" />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(item.id)}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors hover:bg-destructive/80"
                                aria-label={t('ui.text_h2hmme')}
                            >
                                <Trash size={14} className="text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {!item.isPublished && (
                <div className="absolute left-2 top-2 rounded-full bg-muted/80 px-2 py-0.5 text-xs text-muted-foreground backdrop-blur-sm">
                    {t('ui.text_kbpmio')}</div>
            )}
        </div>
    );
}

export function PortfolioManager(): React.ReactElement {
    const { t } = useLanguage();
    const { items, isLoading, updateItem, deleteItem } = useMyPortfolio();
    const user = useAppSelector((state) => state.auth.user);

    const username = user?.username ?? null;
    const portfolioUrl = username
        ? (typeof window !== 'undefined' ? `${window.location.origin}${ROUTES.PORTFOLIO_PUBLIC(username)}` : ROUTES.PORTFOLIO_PUBLIC(username))
        : null;

    const handleCopyPortfolioLink = async (): Promise<void> => {
        if (!portfolioUrl) return;
        try {
            await navigator.clipboard.writeText(portfolioUrl);
            toast.success(t('ui.text_fta2fm'));
        } catch {
            toast.error(t('ui.text_v5k3op'));
        }
    };

    const handleTogglePublish = useCallback(
        (id: string, isPublished: boolean): void => {
            updateItem({ id, data: { isPublished } });
        },
        [updateItem]
    );

    const handleDelete = useCallback(
        (id: string): void => {
            deleteItem(id);
        },
        [deleteItem]
    );

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-3/4 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    const published = items.filter((i) => i.isPublished).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-3">
                        <Images size={24} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{t('ui.text_vewk2z')}</h1>
                        <p className="text-sm text-muted-foreground">
                            {published} {t('ui.text_qnz')} {items.length} {t('ui.text_x5moen')}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {username && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5"
                            onClick={handleCopyPortfolioLink}
                            aria-label={t('ui.text_copy_link')}
                        >
                            <LinkSimple size={14} />
                        </Button>
                    )}
                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                        <a
                            href={username ? ROUTES.PORTFOLIO_PUBLIC(username) : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ArrowSquareOut size={14} />
                            {t('ui.text_yuc5wf')}
                        </a>
                    </Button>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/50 bg-muted/20 py-16">
                    <div className="rounded-full bg-primary/10 p-4">
                        <Images size={32} className="text-primary" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">{t('ui.text_psyij7')}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {t('ui.text_33b0q5')}</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {items.map((item) => (
                        <PortfolioItemCard
                            key={item.id}
                            item={item}
                            onTogglePublish={handleTogglePublish}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
