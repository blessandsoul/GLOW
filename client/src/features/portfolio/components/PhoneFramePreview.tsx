'use client';

import React from 'react';
import { MapPin, Star } from '@phosphor-icons/react';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { getServerImageUrl } from '@/lib/utils/image';
import { CITIES, NICHES } from '@/features/profile/types/profile.types';
import type { ServiceItem } from '@/features/profile/types/profile.types';
import type { PortfolioItem } from '../types/portfolio.types';

interface PhoneFramePreviewProps {
    displayName: string;
    city: string;
    niche: string;
    bio: string;
    services: ServiceItem[];
    items: PortfolioItem[];
    avatar: string | null;
}

export function PhoneFramePreview({
    displayName,
    city,
    niche,
    bio,
    services,
    items,
    avatar,
}: PhoneFramePreviewProps): React.ReactElement {
    const { t } = useLanguage();
    const cityLabel = CITIES.find((c) => c.value === city)?.label ?? city;
    const nicheLabel = NICHES.find((n) => n.value === niche)?.label ?? niche;

    return (
        <div className="w-[260px] md:w-[280px] rounded-[2rem] border-[3px] border-foreground/15 bg-background shadow-xl overflow-hidden">
            {/* Notch */}
            <div className="mx-auto mt-2 h-1.5 w-16 rounded-full bg-foreground/10" />

            {/* Scrollable content */}
            <div className="h-[480px] overflow-y-auto p-4 [scrollbar-width:thin]">
                {/* Profile header */}
                <div className="flex flex-col items-center text-center">
                    {avatar ? (
                        <img
                            src={getServerImageUrl(avatar)}
                            alt={displayName}
                            className="h-14 w-14 rounded-full object-cover border border-border/50"
                        />
                    ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <p className="mt-2 text-sm font-semibold text-foreground">{displayName || t('portfolio.your_name')}</p>
                    {nicheLabel && (
                        <p className="text-[10px] text-muted-foreground">{nicheLabel}</p>
                    )}
                    {cityLabel && (
                        <p className="mt-0.5 flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <MapPin size={8} />
                            {cityLabel}
                        </p>
                    )}
                    {bio && (
                        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground line-clamp-3">
                            {bio}
                        </p>
                    )}
                </div>

                {/* Services */}
                {services.length > 0 && (
                    <div className="mt-4">
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {t('portfolio.nav_services')}
                        </p>
                        <div className="space-y-1">
                            {services.slice(0, 5).map((s, i) => (
                                <div key={i} className="flex items-center justify-between rounded-lg bg-muted/40 px-2 py-1">
                                    <span className="text-[10px] text-foreground truncate">{s.name}</span>
                                    <span className="text-[10px] font-medium text-foreground tabular-nums shrink-0 ml-1">
                                        {s.price} {s.currency}
                                    </span>
                                </div>
                            ))}
                            {services.length > 5 && (
                                <p className="text-center text-[9px] text-muted-foreground">
                                    +{services.length - 5} {t('portfolio.more_items')}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Gallery */}
                {items.length > 0 && (
                    <div className="mt-4">
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {t('portfolio.nav_gallery')}
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                            {items.slice(0, 6).map((item) => (
                                <div key={item.id} className="overflow-hidden rounded-lg">
                                    <img
                                        src={getServerImageUrl(item.imageUrl)}
                                        alt={item.title ?? ''}
                                        className="aspect-[3/4] w-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            ))}
                        </div>
                        {items.length > 6 && (
                            <p className="mt-1 text-center text-[9px] text-muted-foreground">
                                +{items.length - 6} {t('portfolio.more_items')}
                            </p>
                        )}
                    </div>
                )}

                {/* Footer */}
                <p className="mt-6 text-center text-[8px] text-muted-foreground/50">
                    {t('portfolio.created_with')}
                </p>
            </div>
        </div>
    );
}
