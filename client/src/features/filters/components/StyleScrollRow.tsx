'use client';

import { memo } from 'react';
import type { ReactNode, ReactElement } from 'react';

import { cn } from '@/lib/utils';
import { StyleCard } from './StyleCard';
import type { Style } from '../types/styles.types';
import type { SupportedLanguage } from '@/i18n/config';

interface StyleScrollRowProps {
  title: string;
  icon: ReactNode;
  styles: Style[];
  selectedId: string | null;
  onSelect: (style: Style) => void;
  language: SupportedLanguage;
  isLoading?: boolean;
}

function StyleScrollRowInner({
  title,
  icon,
  styles,
  selectedId,
  onSelect,
  language,
  isLoading = false,
}: StyleScrollRowProps): ReactElement | null {
  if (!isLoading && styles.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {/* Section header */}
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[11px] font-semibold text-foreground">{title}</span>
        {!isLoading && (
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {styles.length}
          </span>
        )}
      </div>

      {/* Scroll container */}
      <div
        className={cn(
          'flex gap-2 overflow-x-auto pb-1',
          'snap-x snap-mandatory',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] w-[100px] shrink-0 snap-start rounded-lg bg-muted animate-pulse"
              />
            ))
          : styles.map((style) => (
              <div key={style.id} className="w-[100px] shrink-0 snap-start">
                <StyleCard
                  style={style}
                  isSelected={selectedId === style.id}
                  onSelect={onSelect}
                  language={language}
                  size="sm"
                />
              </div>
            ))}
      </div>
    </div>
  );
}

export const StyleScrollRow = memo(StyleScrollRowInner);
