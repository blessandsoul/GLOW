'use client';

import Image from 'next/image';
import { Check } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { Style } from '../types/styles.types';
import type { SupportedLanguage } from '@/i18n/config';

interface StyleCardProps {
  style: Style;
  isSelected: boolean;
  onSelect: (style: Style) => void;
  language: SupportedLanguage;
  size?: 'sm' | 'md';
}

export function StyleCard({ style, isSelected, onSelect, language, size = 'md' }: StyleCardProps): React.ReactElement {
  const name = language === 'ka' ? style.name_ka : style.name_ru;

  return (
    <button
      type="button"
      onClick={() => onSelect(style)}
      className={cn(
        'group relative w-full overflow-hidden rounded-lg transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        isSelected ? 'border-2 border-primary' : 'border border-border/40',
      )}
    >
      <div className="relative aspect-[3/4] w-full">
        <Image
          src={style.previewUrl}
          alt={name}
          fill
          unoptimized
          sizes={size === 'sm' ? '120px' : '160px'}
          className="object-cover"
        />

        {/* Selected checkmark */}
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
            <Check size={12} className="text-primary-foreground" weight="bold" />
          </div>
        )}

        {/* Name overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 pb-1.5 pt-5">
          <p className={cn(
            'truncate font-semibold text-white',
            size === 'sm' ? 'text-[9px]' : 'text-[10px]',
          )}>
            {name}
          </p>
        </div>
      </div>
    </button>
  );
}
