'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Images } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/lib/constants/routes';
import { usePortfolioPreview } from '../hooks/usePortfolioPreview';

export function PortfolioPreview(): React.ReactElement {
    const { items, isLoading, publishedCount } = usePortfolioPreview();

    const preview = items.slice(0, 4);

    return (
        <section className="space-y-4 rounded-xl border border-border/50 bg-card p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Images size={16} className="text-muted-foreground" />
                    <div>
                        <p className="text-sm font-semibold text-foreground">Portfolio</p>
                        {!isLoading && items.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                                {publishedCount} published · {items.length} total
                            </p>
                        )}
                    </div>
                </div>
                <Button variant="outline" size="sm" asChild className="gap-1.5 cursor-pointer">
                    <Link href={ROUTES.DASHBOARD_PORTFOLIO}>
                        Manage
                        <ArrowRight size={14} />
                    </Link>
                </Button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-lg" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="mb-2 rounded-full bg-muted p-3">
                        <Images size={20} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No portfolio yet</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Process a photo and add it to your portfolio.
                    </p>
                    <Button variant="outline" size="sm" asChild className="mt-3 cursor-pointer">
                        <Link href={ROUTES.DASHBOARD_PORTFOLIO}>Add first work</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-2">
                    {preview.map((item) => (
                        <Link
                            key={item.id}
                            href={ROUTES.DASHBOARD_PORTFOLIO}
                            className="group relative aspect-square overflow-hidden rounded-lg border border-border/40 bg-muted cursor-pointer"
                        >
                            <Image
                                src={item.imageUrl}
                                alt={item.title ?? 'Portfolio work'}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                sizes="(max-width: 640px) 25vw, 120px"
                            />
                            {!item.isPublished && (
                                <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                                    <span className="text-[10px] font-medium text-muted-foreground bg-background/90 px-1.5 py-0.5 rounded">
                                        Hidden
                                    </span>
                                </div>
                            )}
                        </Link>
                    ))}
                    {items.length > 4 && (
                        <Link
                            href={ROUTES.DASHBOARD_PORTFOLIO}
                            className="aspect-square rounded-lg border border-border/40 bg-muted/30 flex items-center justify-center cursor-pointer hover:bg-muted/60 transition-colors"
                        >
                            <span className="text-xs font-medium text-muted-foreground">+{items.length - 4}</span>
                        </Link>
                    )}
                </div>
            )}
        </section>
    );
}
