import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export const EditorialHero = (): React.ReactElement => {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        height: '100dvh',
        minHeight: '640px',
        backgroundColor: 'var(--ed-on-surface)',
      }}
    >
      {/* Background image */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/images/editorial-hero.jpg"
          alt="Glow.GE"
          fill
          priority
          style={{ objectFit: 'cover', objectPosition: 'center top' }}
        />
      </div>

      {/* Dark overlays */}
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, var(--ed-on-surface) 0%, transparent 55%)',
        }}
      />
      {/* Subtle vignette sides */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to right, color-mix(in oklch, var(--ed-on-surface) 25%, transparent) 0%, transparent 40%, transparent 60%, color-mix(in oklch, var(--ed-on-surface) 25%, transparent) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end px-6 md:px-10 pb-20 md:pb-24 space-y-5 max-w-4xl">
        {/* Issue label */}
        <p
          className="text-xs tracking-[0.3em] uppercase mb-1"
          style={{
            color: 'color-mix(in oklch, var(--ed-surface) 55%, transparent)',
            fontFamily: 'var(--font-ed-label)',
          }}
        >
          Glow.GE &mdash; Spring 2026
        </p>

        <h1
          className="text-5xl md:text-7xl leading-[1.05] tracking-tight"
          style={{
            color: 'var(--ed-surface)',
            fontFamily: 'var(--font-ed-display)',
            textWrap: 'balance',
          }}
        >
          სადაც ხელოვნება<br />
          ხვდება სრულყოფილებას
        </h1>

        <p
          className="text-base md:text-lg max-w-md leading-relaxed"
          style={{
            color: 'color-mix(in oklch, var(--ed-surface) 75%, transparent)',
            fontFamily: 'var(--font-ed-body)',
          }}
        >
          აღმოაჩინეთ საქართველოს საუკეთესო სილამაზის პროფესიონალები,
          ტოპ არტისტებიდან დამწყებ სპეციალისტებამდე.
        </p>

        <div className="flex items-center gap-4 pt-1">
          <Link
            href="/masters"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-medium tracking-wide uppercase transition-all duration-200 active:scale-[0.97] hover:brightness-110"
            style={{
              backgroundColor: 'var(--ed-primary)',
              color: 'var(--ed-on-primary)',
              fontFamily: 'var(--font-ed-label)',
            }}
          >
            მასტერების პოვნა →
          </Link>
        </div>
      </div>
    </section>
  );
};
