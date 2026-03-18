'use client';

import { Heart } from '@phosphor-icons/react';
import { useLanguage } from '@/i18n/hooks/useLanguage';

export default function FavoritesPage(): React.ReactElement {
    const { t } = useLanguage();

    return (
        <div className="container mx-auto flex min-h-[60dvh] flex-col items-center justify-center px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Heart size={32} className="text-primary" />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-foreground">
                {t('favorites.empty_title')}
            </h1>
            <p className="mt-2 max-w-xs text-center text-sm text-muted-foreground">
                {t('favorites.empty_description')}
            </p>
        </div>
    );
}
