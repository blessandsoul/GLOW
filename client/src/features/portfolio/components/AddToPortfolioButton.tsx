'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Images, CheckCircle, SpinnerGap } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useMyPortfolio } from '../hooks/usePortfolio';
import { getServerImageUrl } from '@/lib/utils/image';

interface AddToPortfolioButtonProps {
    jobId: string;
    imageUrl: string;
}

export function AddToPortfolioButton({ jobId, imageUrl }: AddToPortfolioButtonProps): React.ReactElement {
    const { t } = useLanguage();
    const { items, addItem } = useMyPortfolio();
    const [isAdding, setIsAdding] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [title, setTitle] = useState('');

    const isInPortfolio = useMemo(
        () => items.some((item) => item.imageUrl === imageUrl),
        [items, imageUrl],
    );

    const handleAdd = useCallback(async (): Promise<void> => {
        setIsAdding(true);
        try {
            await addItem({
                imageUrl,
                title: title.trim() || '',
                niche: '',
                isPublished: true,
                jobId,
            });
            setDrawerOpen(false);
        } catch {
            // Error toast handled by useMyPortfolio hook
        } finally {
            setIsAdding(false);
        }
    }, [imageUrl, title, jobId, addItem]);

    if (isInPortfolio) {
        return (
            <Button variant="outline" size="sm" disabled className="gap-1.5">
                <CheckCircle size={16} weight="fill" className="text-success" />
                {t('portfolio.in_portfolio')}
            </Button>
        );
    }

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setDrawerOpen(true)}
            >
                <Images size={16} />
                {t('portfolio.add_to_portfolio')}
            </Button>

            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerContent className="px-4 pb-8">
                    <DrawerHeader className="px-0">
                        <DrawerTitle>{t('portfolio.add_to_portfolio')}</DrawerTitle>
                    </DrawerHeader>
                    <div className="space-y-4">
                        <div className="mx-auto w-48 overflow-hidden rounded-xl">
                            <img
                                src={getServerImageUrl(imageUrl)}
                                alt="Selected result"
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
                                <Images size={16} />
                            )}
                            {isAdding ? t('portfolio.adding') : t('portfolio.add_to_portfolio')}
                        </Button>
                    </div>
                </DrawerContent>
            </Drawer>
        </>
    );
}
