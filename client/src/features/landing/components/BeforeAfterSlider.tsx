'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useLanguage } from "@/i18n/hooks/useLanguage";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  alt: string;
  defaultPosition?: number;
}

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  alt,
  defaultPosition = 50,
}: BeforeAfterSliderProps): React.ReactElement {
  const { t } = useLanguage();
  const [position, setPosition] = useState<number>(defaultPosition);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientX: number): void => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clamped = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setPosition(clamped);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      updatePosition(e.clientX);
    },
    [updatePosition],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      if (!isDragging) return;
      updatePosition(e.clientX);
    },
    [isDragging, updatePosition],
  );

  const handlePointerUp = useCallback((): void => {
    setIsDragging(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative aspect-[3/4] overflow-hidden rounded-xl touch-none select-none cursor-ew-resize"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Before image (left side) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <Image
          src={beforeSrc}
          alt={`${t('ui.text_pt6')}: ${alt}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </div>

      {/* After image (right side) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 0 0 ${position}%)` }}
      >
        <Image
          src={afterSrc}
          alt={`${t('ui.text_gnzjzw')}: ${alt}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </div>

      {/* Drag handle line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg cursor-ew-resize z-10 motion-safe:transition-none"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        onPointerDown={handlePointerDown}
      >
        {/* Handle circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center gap-0.5">
          {/* Left arrow */}
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 2L3 5L6 8"
              stroke="#374151"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {/* Right arrow */}
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 2L7 5L4 8"
              stroke="#374151"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* "До" label */}
      <span className="absolute top-3 left-3 z-20 text-xs font-medium text-white bg-black/40 px-2 py-1 rounded-md pointer-events-none">
        {t('ui.text_pt6')}</span>

      {/* "После" label */}
      <span className="absolute top-3 right-3 z-20 text-xs font-medium text-white bg-black/40 px-2 py-1 rounded-md pointer-events-none">
        {t('ui.text_gnzjzw')}</span>
    </div>
  );
}
