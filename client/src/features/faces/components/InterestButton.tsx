'use client';

import { Heart } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useToggleInterest } from '../hooks/useFaceInterest';

interface InterestButtonProps {
    modelId: string;
    liked: boolean;
    className?: string;
    size?: number;
}

export function InterestButton({ modelId, liked, className, size = 18 }: InterestButtonProps): React.ReactElement {
    const { toggle, isPending } = useToggleInterest();

    return (
        <button
            type="button"
            aria-pressed={liked}
            aria-label={liked ? 'Remove interest' : 'Express interest'}
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
