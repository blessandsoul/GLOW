'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { MapPin, InstagramLogo, ChatCircle, PaperPlaneTilt } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicPortfolio } from '../hooks/usePortfolio';
import { getServerImageUrl } from '@/lib/utils/image';
import { useLanguage } from "@/i18n/hooks/useLanguage";
import { ImageLightbox } from './ImageLightbox';

interface PublicPortfolioProps {
    username: string;
}

export function PublicPortfolio({ username }: PublicPortfolioProps): React.ReactElement {
    const { t } = useLanguage();
    const { portfolio, isLoading, isError } = usePublicPortfolio(username);
    const [lightboxIndex, setLightboxIndex] = useState(-1);

    const handleOpenLightbox = useCallback((index: number): void => {
        setLightboxIndex(index);
    }, []);

    const handleCloseLightbox = useCallback((): void => {
        setLightboxIndex(-1);
    }, []);

    if (isLoading) {
        return (
            <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
                <div className="flex flex-col items-center gap-3">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-3/4 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (isError || !portfolio) {
        return (
            <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
                <p className="text-lg font-semibold text-foreground">{t('ui.text_20pmm4')}</p>
                <p className="text-sm text-muted-foreground">
                    {t('ui.text_p08e8w')}</p>
            </div>
        );
    }

    const lightboxImages = portfolio.items.map((item) => ({
        imageUrl: item.imageUrl,
        title: item.title,
    }));

    return (
        <div className="mx-auto max-w-3xl space-y-10 px-4 py-10">
            {/* Profile header */}
            <div className="flex flex-col items-center gap-4 text-center">
                {portfolio.avatar ? (
                    <Image
                        src={getServerImageUrl(portfolio.avatar)}
                        alt={portfolio.displayName}
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-full object-cover border border-border/50"
                        unoptimized
                    />
                ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                        {portfolio.displayName.charAt(0).toUpperCase()}
                    </div>
                )}
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{portfolio.displayName}</h1>
                    {portfolio.city && (
                        <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <MapPin size={14} />
                            {portfolio.city}
                        </p>
                    )}
                </div>

                {portfolio.bio && (
                    <p className="max-w-prose text-sm text-muted-foreground leading-relaxed">
                        {portfolio.bio}
                    </p>
                )}

                {/* Social links */}
                {(portfolio.instagram || portfolio.whatsapp || portfolio.telegram) && <div className="flex gap-2">
                    {portfolio.instagram && (
                        <Button variant="outline" size="sm" className="gap-1.5" asChild>
                            <a
                                href={`https://instagram.com/${portfolio.instagram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <InstagramLogo size={16} />
                                {portfolio.instagram}
                            </a>
                        </Button>
                    )}
                    {portfolio.whatsapp && (
                        <Button variant="outline" size="sm" className="gap-1.5" asChild>
                            <a
                                href={`https://wa.me/${portfolio.whatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ChatCircle size={16} />
                                WhatsApp
                            </a>
                        </Button>
                    )}
                    {portfolio.telegram && (
                        <Button variant="outline" size="sm" className="gap-1.5" asChild>
                            <a
                                href={`https://t.me/${portfolio.telegram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <PaperPlaneTilt size={16} />
                                Telegram
                            </a>
                        </Button>
                    )}
                </div>}
            </div>

            {/* Services */}
            {portfolio.services.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold text-foreground">{t('ui.text_280we2')}</h2>
                    <div className="grid gap-2">
                        {portfolio.services.map((service) => (
                            <div
                                key={service.name}
                                className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-4 py-3"
                            >
                                <span className="text-sm text-foreground">{service.name}</span>
                                <span className="text-sm font-semibold text-foreground">
                                    {service.price} ₾{service.priceType === 'hourly' ? ' / საათი' : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Gallery */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">{t('ui.text_jow7ra')}</h2>
                {portfolio.items.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        {t('ui.text_kfi678')}</p>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {portfolio.items.map((item, index) => (
                            <button
                                type="button"
                                key={item.id}
                                className="group relative overflow-hidden rounded-xl border border-border/50 transition-all duration-200 hover:shadow-md cursor-pointer"
                                onClick={() => handleOpenLightbox(index)}
                            >
                                <div className="relative aspect-3/4">
                                    <Image
                                        src={getServerImageUrl(item.imageUrl)}
                                        alt={item.title ?? t('ui.text_kaosed')}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        sizes="(max-width: 640px) 50vw, 33vw"
                                        unoptimized
                                    />
                                </div>
                                {item.title && (
                                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent px-3 pb-2.5 pt-6">
                                        <span className="text-xs font-medium text-white">
                                            {item.title}
                                        </span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* Footer */}
            <div className="text-center">
                <p className="text-xs text-muted-foreground">
                    {t('ui.text_r4tl4y')}{' '}
                    <a href="/" className="font-medium text-primary hover:underline">
                        Glow.GE
                    </a>
                </p>
            </div>

            {/* Lightbox */}
            <ImageLightbox
                images={lightboxImages}
                initialIndex={lightboxIndex}
                open={lightboxIndex >= 0}
                onClose={handleCloseLightbox}
            />
        </div>
    );
}
