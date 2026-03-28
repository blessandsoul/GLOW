'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

const VIDEOS = [
  '/hero-video-1.mp4',
  '/hero-video-2.mp4',
  '/hero-video-3.mp4',
  '/hero-video-4.mp4',
];

const FADE_MS = 1000;

const TOP_MASTERS = [
  { id: '1', name: 'ნინო ბერიძე',    specialty: 'ბოლქვოვანი შუქი',   rating: 4.9, reviews: 312, initials: 'НБ', color: '#c084fc' },
  { id: '2', name: 'მარიამ კობახიძე', specialty: 'კლასიკური ლაშები',  rating: 4.8, reviews: 278, initials: 'МК', color: '#f9a8d4' },
  { id: '3', name: 'ანა გელაშვილი',  specialty: 'მეგა-ვოლუმი',       rating: 5.0, reviews: 401, initials: 'АГ', color: '#6ee7b7' },
  { id: '4', name: 'სოფო ჯაჯანიძე',  specialty: 'ვეט-ლუქი',          rating: 4.9, reviews: 187, initials: 'СД', color: '#fcd34d' },
  { id: '5', name: 'თამარ ელიავა',   specialty: 'ბუნებრივი სტილი',   rating: 4.7, reviews: 234, initials: 'ТЭ', color: '#93c5fd' },
  { id: '6', name: 'ლიკა ჩხეიძე',   specialty: 'წამწამების ლამინირება', rating: 4.9, reviews: 156, initials: 'ЛЧ', color: '#fb923c' },
  { id: '7', name: 'ქეთი ქარჩავა',  specialty: 'კატ-აი ეფექტი',     rating: 4.8, reviews: 298, initials: 'КК', color: '#e879f9' },
  { id: '8', name: 'სალომე ვაჩნაძე', specialty: 'ფოქსი-ეფექტი',      rating: 5.0, reviews: 362, initials: 'СВ', color: '#34d399' },
];

interface MasterCardProps {
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  initials: string;
  color: string;
}

const MasterCard = ({ name, specialty, rating, reviews, initials, color }: MasterCardProps): React.ReactElement => (
  <div
    className="shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer group"
    style={{
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(12px)',
      transition: 'background 0.2s, border-color 0.2s',
      width: 220,
    }}
  >
    {/* Avatar */}
    <div
      className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-[#1a1c1c]"
      style={{ background: color, boxShadow: `0 0 16px ${color}55` }}
    >
      {initials}
    </div>

    {/* Info */}
    <div className="min-w-0">
      <p
        className="text-[#f9f9f9] text-sm font-semibold truncate leading-tight"
        style={{ fontFamily: 'var(--font-manrope), sans-serif' }}
      >
        {name}
      </p>
      <p
        className="text-[#f9f9f9]/50 text-xs truncate mt-0.5"
        style={{ fontFamily: 'var(--font-manrope), sans-serif' }}
      >
        {specialty}
      </p>
      <div className="flex items-center gap-1 mt-1">
        <span className="text-[#fcd34d] text-xs">★</span>
        <span className="text-[#f9f9f9]/80 text-xs font-medium">{rating}</span>
        <span className="text-[#f9f9f9]/30 text-xs">· {reviews}</span>
      </div>
    </div>
  </div>
);

export const EditorialHero = (): React.ReactElement => {
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const [srcA, setSrcA] = useState(VIDEOS[0]);
  const [srcB, setSrcB] = useState(VIDEOS[1]);
  const refA = useRef<HTMLVideoElement>(null);
  const refB = useRef<HTMLVideoElement>(null);
  const indexRef = useRef(0);
  const transitioningRef = useRef(false);

  const advance = useCallback(() => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;

    const nextIndex = (indexRef.current + 1) % VIDEOS.length;
    const nextSlot = activeSlot === 0 ? 1 : 0;
    const nextVideo = nextSlot === 0 ? refA.current : refB.current;

    if (nextSlot === 0) setSrcA(VIDEOS[nextIndex]);
    else setSrcB(VIDEOS[nextIndex]);

    setTimeout(() => {
      if (nextVideo) {
        nextVideo.currentTime = 0;
        nextVideo.play().catch(() => {});
      }
      setActiveSlot(nextSlot as 0 | 1);
      indexRef.current = nextIndex;

      setTimeout(() => {
        transitioningRef.current = false;
      }, FADE_MS);
    }, 50);
  }, [activeSlot]);

  useEffect(() => {
    refA.current?.play().catch(() => {});
  }, []);

  const videoStyle = (slot: 0 | 1): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: activeSlot === slot ? 1 : 0,
    transition: `opacity ${FADE_MS}ms ease-in-out`,
  });

  const doubled = [...TOP_MASTERS, ...TOP_MASTERS];

  // Drag-to-scroll: pause auto-scroll on user interaction
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!marqueeRef.current) return;
    isDragging.current = true;
    setPaused(true);
    startX.current = e.clientX - marqueeRef.current.getBoundingClientRect().left;
    scrollLeft.current = marqueeRef.current.scrollLeft;
    marqueeRef.current.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !marqueeRef.current) return;
    const x = e.clientX - marqueeRef.current.getBoundingClientRect().left;
    marqueeRef.current.scrollLeft = scrollLeft.current - (x - startX.current);
  }, []);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <section className="relative h-187.75 w-full overflow-hidden bg-[#1a1c1c]">
      {/* Background videos */}
      <div className="absolute inset-0">
        <video ref={refA} src={srcA} muted playsInline onEnded={activeSlot === 0 ? advance : undefined} style={videoStyle(0)} />
        <video ref={refB} src={srcB} muted playsInline onEnded={activeSlot === 1 ? advance : undefined} style={videoStyle(1)} />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-[#1a1c1c]" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between">

        {/* TOP — headline */}
        <div className="px-8 pt-20 space-y-4">
          <h1
            className="text-4xl md:text-7xl text-[#f9f9f9] leading-tight text-balance"
            style={{ fontFamily: 'var(--font-noto-serif-georgian), var(--font-noto-serif), serif', letterSpacing: '-0.02em' }}
          >
            Glow.ge — სადაც ხელოვნება ხვდება სრულყოფილებას
          </h1>
          <p
            className="text-lg text-[#f9f9f9]/75 max-w-md leading-relaxed"
            style={{ fontFamily: 'var(--font-manrope), var(--font-noto-georgian), sans-serif' }}
          >
            აღმოაჩინეთ საქართველოს საუკეთესო სილამაზის პროფესიონალები.
          </p>
        </div>

        {/* BOTTOM — top masters slider */}
        <div className="pb-32">
          {/* Label */}
          <div className="px-8 mb-4 flex items-center gap-3">
            <span
              className="text-xs uppercase tracking-[0.18em] text-[#f9f9f9]/40 font-medium"
              style={{ fontFamily: 'var(--font-noto-serif-georgian), var(--font-noto-georgian), serif' }}
            >
              ტოპ მასტერები
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Marquee */}
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
          >
            <div
              className="flex gap-3 px-8"
              style={{
                animation: paused ? 'none' : 'marquee-masters 40s linear infinite',
                width: 'max-content',
              }}
            >
              {doubled.map((master, i) => (
                <MasterCard key={`${master.id}-${i}`} {...master} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee-masters {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
};
