'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { Heart } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useFavoriteToggle } from '../hooks/useFavorites';
import { useLanguage } from '@/i18n/hooks/useLanguage';

interface FavoriteButtonProps {
  entityType: 'master' | 'portfolio';
  entityId: string;
  isFavorited: boolean;
  size?: number;
  className?: string;
}

export function FavoriteButton({
  entityType,
  entityId,
  isFavorited,
  size = 20,
  className,
}: FavoriteButtonProps): React.ReactElement {
  const { toggleMaster, togglePortfolioItem, isTogglingMaster, isTogglingPortfolioItem } =
    useFavoriteToggle();
  const { t } = useLanguage();

  const [optimistic, setOptimistic] = useState(isFavorited);
  const isPending = isTogglingMaster || isTogglingPortfolioItem;

  // Sync optimistic state when prop changes (after query refetch), but not while pending
  useEffect(() => {
    if (!isPending) {
      setOptimistic(isFavorited);
    }
  }, [isFavorited, isPending]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isPending) return;

      const nextState = !optimistic;
      setOptimistic(nextState);

      if (entityType === 'master') {
        toggleMaster({ masterProfileId: entityId, isFavorited: optimistic });
      } else {
        togglePortfolioItem({ portfolioItemId: entityId, isFavorited: optimistic });
      }
    },
    [entityType, entityId, optimistic, isPending, toggleMaster, togglePortfolioItem],
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={optimistic ? t('favorites.remove') : t('favorites.add')}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm',
        'transition-all duration-200 hover:scale-110 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        'disabled:pointer-events-none disabled:opacity-60',
        className,
      )}
    >
      <Heart
        size={size}
        weight={optimistic ? 'fill' : 'regular'}
        className={cn(
          'transition-colors duration-200',
          optimistic ? 'text-destructive' : 'text-foreground/60',
        )}
      />
    </button>
  );
}
