'use client';

import { Heart } from '@phosphor-icons/react';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useToggleInterest } from '../hooks/useFaceInterest';

interface InterestButtonProps {
    modelId: string;
    liked: boolean;
    className?: string;
    size?: number;
}

export function InterestButton({ modelId, liked, className, size = 18 }: InterestButtonProps): React.ReactElement | null {
    const { t } = useLanguage();
    const role = useAppSelector((s) => s.auth.user?.role);
    const { toggle, isPending } = useToggleInterest();

    // Admins moderate the catalog, they don't express interest — the interest API
    // forbids them (403/404). Hide the control entirely so no error toast can fire.
    if (role === 'ADMIN') return null;

    return (
        <button
            type="button"
            aria-pressed={liked}
            aria-label={liked ? t('faces.interest_remove') : t('faces.interest_add')}
            disabled={isPending}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggle(modelId, liked);
            }}
            className={cn(
                'flex items-center justify-center rounded-full bg-background/80 p-2 backdrop-blur-sm transition-all duration-150 active:scale-90 disabled:opacity-50',
                liked ? 'text-primary' : 'text-muted-foreground hover:text-primary',
                className,
            )}
        >
            <Heart size={size} weight={liked ? 'fill' : 'regular'} />
        </button>
    );
}
