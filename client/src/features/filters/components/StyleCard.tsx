'use client';

import { memo, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Check, Sparkle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { Style } from '../types/styles.types';
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
  const name = language === 'ka' ? style.name_ka : style.name_ru;
  const isPlaceholder = style.previewUrl === PLACEHOLDER_URL;
  const [imgError, setImgError] = useState(false);
  const [beforeImgError, setBeforeImgError] = useState(false);
  const hasBefore = !!style.beforeUrl && !beforeImgError;

  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientX: number): void => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clamped = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setSliderPos(clamped);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      if (!hasBefore) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      dragStartedRef.current = false;
      updatePosition(e.clientX);
    },
    [hasBefore, updatePosition],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      if (!isDragging) return;
      dragStartedRef.current = true;
      updatePosition(e.clientX);
    },
    [isDragging, updatePosition],
  );

  const handlePointerUp = useCallback((): void => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback((): void => {
    if (!dragStartedRef.current) {
      onSelect(style);
    }
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
      <div
        ref={containerRef}
        className={cn(
          'relative aspect-[3/4] w-full',
          hasBefore && 'touch-none select-none cursor-ew-resize',
        )}
        onPointerDown={hasBefore ? handlePointerDown : undefined}
        onPointerMove={hasBefore ? handlePointerMove : undefined}
        onPointerUp={hasBefore ? handlePointerUp : undefined}
        onPointerCancel={hasBefore ? handlePointerUp : undefined}
      >
        {isPlaceholder || imgError ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-primary/5 to-primary/10">
            <Sparkle size={size === 'sm' ? 16 : 20} className="text-primary/30" weight="fill" />
          </div>
        ) : (
          <>
            {/* Before image (left side, revealed by dragging) */}
            {hasBefore && (
              <div
                className="absolute inset-0"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <Image
                  src={style.beforeUrl!}
                  alt={`${name} - before`}
                  fill
                  sizes={size === 'sm' ? '120px' : '160px'}
                  className="object-cover"
                  onError={() => setBeforeImgError(true)}
                />
              </div>
            )}

            {/* After image (right side / full when slider at 100) */}
            <div
              className="absolute inset-0"
              style={hasBefore ? { clipPath: `inset(0 0 0 ${sliderPos}%)` } : undefined}
            >
              <Image
                src={style.previewUrl}
                alt={name}
                fill
                sizes={size === 'sm' ? '120px' : '160px'}
                className="object-cover"
                onError={() => setImgError(true)}
              />
            </div>

            {/* Slider divider line + handle — always visible when before image exists */}
            {hasBefore && (
              <div
                className={cn(
                  'absolute top-0 bottom-0 z-10 w-0.5 shadow-sm',
                  sliderPos >= 99 ? 'bg-white/40' : 'bg-white/80',
                )}
                style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
              >
                <div className={cn(
                  'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full shadow-sm transition-opacity duration-200',
                  size === 'sm' ? 'h-4 w-4' : 'h-5 w-5',
                  sliderPos >= 99 ? 'bg-white/70' : 'bg-white',
                )}>
                  <svg width={size === 'sm' ? '5' : '7'} height={size === 'sm' ? '5' : '7'} viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M6 2L3 5L6 8" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <svg width={size === 'sm' ? '5' : '7'} height={size === 'sm' ? '5' : '7'} viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M4 2L7 5L4 8" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            )}
          </>
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
