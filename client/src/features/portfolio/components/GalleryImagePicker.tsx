'use client';

import React, { useState, useCallback } from 'react';
import { CheckCircle, Plus, SpinnerGap } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { getServerImageUrl } from '@/lib/utils/image';
import type { JobResultImage } from '../types/builder.types';
import type { PortfolioItemFormData } from '../types/portfolio.types';

interface GalleryImagePickerProps {
    jobResults: JobResultImage[];
    portfolioImageUrls: Set<string>;
    onAdd: (data: PortfolioItemFormData) => Promise<void>;
}

export function GalleryImagePicker({ jobResults, portfolioImageUrls, onAdd }: GalleryImagePickerProps): React.ReactElement {
    const { t } = useLanguage();
    const [selectedImage, setSelectedImage] = useState<JobResultImage | null>(null);
    const [title, setTitle] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleSelect = useCallback((img: JobResultImage): void => {
        if (portfolioImageUrls.has(img.imageUrl)) return;
        setSelectedImage(img);
        setTitle('');
    }, [portfolioImageUrls]);

    const handleAdd = useCallback(async (): Promise<void> => {
        if (!selectedImage) return;
        setIsAdding(true);
        try {
            await onAdd({
                imageUrl: selectedImage.imageUrl,
                title: title.trim() || '',
                niche: '',
                isPublished: true,
                jobId: selectedImage.jobId,
            });
            setSelectedImage(null);
            setTitle('');
        } finally {
            setIsAdding(false);
        }
    }, [selectedImage, title, onAdd]);

    return (
        <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {jobResults.map((img) => {
                    const isInPortfolio = portfolioImageUrls.has(img.imageUrl);
                    return (
                        <button
                            key={`${img.jobId}-${img.variantIndex}`}
                            type="button"
                            onClick={() => handleSelect(img)}
                            disabled={isInPortfolio}
                            className={cn(
                                'group relative overflow-hidden rounded-xl border transition-all duration-200',
                                isInPortfolio
                                    ? 'cursor-default border-success/30 opacity-70'
                                    : 'cursor-pointer border-border/50 hover:border-primary/50 hover:shadow-md active:scale-[0.98]'
                            )}
                        >
                            <div className="aspect-[3/4]">
                                <img
                                    src={getServerImageUrl(img.imageUrl)}
                                    alt={t('portfolio.nav_gallery')}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            </div>

                            {isInPortfolio ? (
                                <div className="absolute right-2 top-2">
                                    <span className="flex items-center gap-1 rounded-full bg-success/90 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                                        <CheckCircle size={10} weight="fill" />
                                        {t('portfolio.added_badge')}
                                    </span>
                                </div>
                            ) : (
                                <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                                    <div className="rounded-full bg-primary p-1.5 text-primary-foreground shadow-md">
                                        <Plus size={12} weight="bold" />
                                    </div>
                                </div>
                            )}

                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-2">
                                <p className="text-[10px] text-white/80">
                                    {new Date(img.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Add to portfolio drawer */}
            <Drawer open={selectedImage !== null} onOpenChange={(open) => { if (!open) setSelectedImage(null); }}>
                <DrawerContent className="px-4 pb-8">
                    <DrawerHeader className="px-0">
                        <DrawerTitle>{t('portfolio.add_to_portfolio')}</DrawerTitle>
                    </DrawerHeader>

                    {selectedImage && (
                        <div className="space-y-4">
                            <div className="mx-auto w-48 overflow-hidden rounded-xl">
                                <img
                                    src={getServerImageUrl(selectedImage.imageUrl)}
                                    alt="Selected"
                                    className="aspect-[3/4] w-full object-cover"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground">{t('portfolio.title_optional')}</label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={t('portfolio.title_placeholder')}
                                    maxLength={200}
                                />
                            </div>
                            <Button
                                onClick={handleAdd}
                                disabled={isAdding}
                                className="w-full gap-1.5"
                            >
                                {isAdding ? (
                                    <SpinnerGap size={16} className="animate-spin" />
                                ) : (
                                    <Plus size={16} />
                                )}
                                {isAdding ? t('portfolio.adding') : t('portfolio.add_to_portfolio')}
                            </Button>
                        </div>
                    )}
                </DrawerContent>
            </Drawer>
        </>
    );
}
