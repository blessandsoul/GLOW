'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFeaturedMasters } from '@/features/masters/hooks/useFeaturedMasters';
import { getThumbUrl } from '@/lib/utils/image';
import { ROUTES } from '@/lib/constants/routes';
import type { FeaturedMaster } from '@/features/masters/types/masters.types';

interface MasterCardProps {
  master: FeaturedMaster;
}

const MasterCard = ({ master }: MasterCardProps): React.ReactElement => {
  const imageUrl = master.avatar ? getThumbUrl(master.avatar, 80) : null;

  return (
    <Link
      href={ROUTES.PORTFOLIO_PUBLIC(master.username)}
      className="shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl group"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)',
        transition: 'background 0.2s, border-color 0.2s',
        width: 220,
      }}
      draggable={false}
    >
      {/* Avatar */}
      <div className="shrink-0 w-11 h-11 rounded-full overflow-hidden flex items-center justify-center bg-primary/20">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={master.displayName}
            width={44}
            height={44}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <span className="text-sm font-bold text-primary-foreground">
            {master.displayName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0">
        <p
          className="text-[#f9f9f9] text-sm font-semibold truncate leading-tight"
          style={{ fontFamily: 'var(--font-noto-georgian), sans-serif' }}
        >
          {master.displayName}
        </p>
        {master.niche && (
          <p
            className="text-[#f9f9f9]/50 text-xs truncate mt-0.5"
            style={{ fontFamily: 'var(--font-noto-georgian), sans-serif' }}
          >
            {master.niche}
          </p>
        )}
        {master.masterTier === 'TOP_MASTER' && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[#fcd34d] text-xs">★</span>
            <span className="text-[#f9f9f9]/80 text-xs font-medium">Glow Star</span>
          </div>
        )}
      </div>
    </Link>
  );
};

export const EditorialHero = (): React.ReactElement => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { masters, isLoading } = useFeaturedMasters();

  // Double for infinite marquee effect
  const doubled = masters.length > 0 ? [...masters, ...masters] : [];

  // Drag-to-scroll: pause auto-scroll on user interaction
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const isDragging = useRef(false);
  const dragMoved = useRef(false);
  const startX = useRef(0);
  const scrollLeftRef = useRef(0);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!marqueeRef.current) return;
    isDragging.current = true;
    dragMoved.current = false;
    setPaused(true);
    startX.current = e.clientX - marqueeRef.current.getBoundingClientRect().left;
    scrollLeftRef.current = marqueeRef.current.scrollLeft;
    marqueeRef.current.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !marqueeRef.current) return;
    const x = e.clientX - marqueeRef.current.getBoundingClientRect().left;
    const diff = x - startX.current;
    if (Math.abs(diff) > 3) dragMoved.current = true;
    marqueeRef.current.scrollLeft = scrollLeftRef.current - diff;
  }, []);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Prevent click navigation when dragging
  const onClickCapture = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (dragMoved.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return (
    <section className="relative h-187.75 w-full overflow-hidden bg-[#1a1c1c]">
      {/* Background video */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          src="/hero-video.mp4"
          muted
          autoPlay
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between">

        {/* TOP — headline */}
        <div className="px-8 lg:px-16 xl:px-24 pt-20 space-y-4">
          <h1
            className="text-4xl md:text-7xl lg:text-8xl text-[#f9f9f9] leading-tight text-balance"
            style={{ fontFamily: 'var(--font-noto-georgian), sans-serif', letterSpacing: '-0.02em' }}
          >
            Glow.ge — სილამაზის ინდუსტრიის ლიდერთა სივრცე
          </h1>
          <p
            className="text-lg text-[#f9f9f9]/75 max-w-md lg:max-w-lg leading-relaxed"
            style={{ fontFamily: 'var(--font-manrope), var(--font-noto-georgian), sans-serif' }}
          >
            მიანდე შენი ვიზუალი მათ, ვინც სილამაზის ინდუსტრიის წესებს ქმნის
          </p>
        </div>

        {/* BOTTOM — top masters slider */}
        <div className="pb-32">
          {/* Label */}
          <div className="px-8 lg:px-16 mb-4 flex items-center gap-3">
            <span
              className="text-xs uppercase tracking-[0.18em] text-[#f9f9f9]/40 font-medium"
              style={{ fontFamily: 'var(--font-noto-georgian), sans-serif' }}
            >
              ტოპ მასტერები
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Marquee */}
          {!isLoading && doubled.length > 0 && (
            <div
              ref={marqueeRef}
              className="overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing select-none"
              style={{
                maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
                scrollbarWidth: 'none',
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              onClickCapture={onClickCapture}
            >
              <div
                className="flex gap-3 px-8 lg:px-16"
                style={{
                  animation: paused ? 'none' : 'marquee-masters 40s linear infinite',
                  width: 'max-content',
                }}
              >
                {doubled.map((master, i) => (
                  <MasterCard key={`${master.username}-${i}`} master={master} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom fade to white background */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, oklch(1 0 0))',
        }}
      />

      <style>{`
        @keyframes marquee-masters {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
};
