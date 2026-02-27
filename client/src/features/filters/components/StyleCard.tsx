'use client';

import { memo, useState, useCallback } from 'react';
import Image from 'next/image';
import { Check, Sparkle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { Style } from '../types/styles.types';
import { localized } from '@/i18n/config';
import type { SupportedLanguage } from '@/i18n/config';

const PLACEHOLDER_URL = '/filters/placeholder.svg';

interface StyleCardProps {
  style: Style;
  isSelected: boolean;
  onSelect: (style: Style) => void;
  language: SupportedLanguage;
  size?: 'sm' | 'md';
}

function StyleCardInner({ style, isSelected, onSelect, language, size = 'md' }: StyleCardProps): React.ReactElement {
  const name = localized(style, 'name', language);
  const isPlaceholder = style.previewUrl === PLACEHOLDER_URL;
  const [imgError, setImgError] = useState(false);
  const [beforeImgError, setBeforeImgError] = useState(false);
  const hasBefore = !!style.beforeUrl && !beforeImgError;

  const handleClick = useCallback((): void => {
    onSelect(style);
  }, [onSelect, style]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(style); } }}
      className={cn(
        'group relative w-full overflow-hidden rounded-lg transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        isSelected ? 'border-2 border-primary' : 'border border-border/40',
      )}
    >
      <div className="relative aspect-[3/4] w-full">
        {isPlaceholder || imgError ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-primary/5 to-primary/10">
            <Sparkle size={size === 'sm' ? 16 : 20} className="text-primary/30" weight="fill" />
          </div>
        ) : hasBefore ? (
          /* Split card: before on left, after on right */
          <div className="absolute inset-0 flex">
            {/* Before half */}
            <div className="relative w-1/2 overflow-hidden">
              <Image
                src={style.beforeUrl!}
                alt={`${name} - before`}
                fill
                sizes={size === 'sm' ? '(max-width: 640px) 15vw, 10vw' : '(max-width: 640px) 18vw, 13vw'}
                className="object-cover object-center"
                onError={() => setBeforeImgError(true)}
              />
            </div>
            {/* Divider */}
            <div className="relative z-10 w-px bg-white/60 shadow-sm" />
            {/* After half */}
            <div className="relative w-1/2 overflow-hidden">
              <Image
                src={style.previewUrl}
                alt={name}
                fill
                sizes={size === 'sm' ? '(max-width: 640px) 15vw, 10vw' : '(max-width: 640px) 18vw, 13vw'}
                className="object-cover object-center"
                onError={() => setImgError(true)}
              />
            </div>
          </div>
        ) : (
          /* Single image (no before available) */
          <Image
            src={style.previewUrl}
            alt={name}
            fill
            sizes={size === 'sm' ? '(max-width: 640px) 30vw, 20vw' : '(max-width: 640px) 35vw, 25vw'}
            className="object-cover"
            onError={() => setImgError(true)}
          />
        )}

        {/* Selected checkmark */}
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
            <Check size={12} className="text-primary-foreground" weight="bold" />
          </div>
        )}

        {/* Name overlay */}
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/60 to-transparent px-1.5 pb-1.5 pt-5">
          <p className={cn(
            'truncate font-semibold text-white',
            size === 'sm' ? 'text-[9px]' : 'text-[10px]',
          )}>
            {name}
          </p>
        </div>
      </div>
    </div>
  );
}

export const StyleCard = memo(StyleCardInner, (prev, next) =>
  prev.style.id === next.style.id &&
  prev.isSelected === next.isSelected &&
  prev.language === next.language &&
  prev.size === next.size &&
  prev.onSelect === next.onSelect,
);
