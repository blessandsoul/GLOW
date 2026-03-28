import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Category {
  label: string;
  slug: string;
  image: string;
  offset: boolean;
}

const CATEGORIES: Category[] = [
  { label: 'თმა', slug: 'hair', image: '/images/categories/hair.jpg', offset: false },
  { label: 'მაკიაჟი', slug: 'makeup', image: '/images/categories/makeup.jpg', offset: true },
  { label: 'ფრჩხილები', slug: 'nails', image: '/images/categories/nails.jpg', offset: false },
  { label: 'წამწამები და წარბები', slug: 'lashes', image: '/images/categories/lashes.jpg', offset: false },
  { label: 'პერმანენტული მაკიაჟი', slug: 'pmu', image: '/images/categories/pmu.jpg', offset: true },
  { label: 'სახის ესთეტიკა', slug: 'skincare', image: '/images/categories/skincare.jpg', offset: false },
];

export const EditorialCategories = (): React.ReactElement => {
  return (
    <section
      className="py-16 px-8"
      style={{ backgroundColor: 'var(--ed-surface)' }}
    >
      {/* Section header */}
      <div className="mb-10">
        <p
          className="text-xs tracking-[0.3em] uppercase mb-2"
          style={{
            color: 'color-mix(in oklch, var(--ed-on-surface) 40%, transparent)',
            fontFamily: 'var(--font-ed-label)',
          }}
        >
          კატეგორიები
        </p>
        <h2
          className="text-3xl md:text-4xl leading-tight tracking-tight"
          style={{
            color: 'var(--ed-on-surface)',
            fontFamily: 'var(--font-ed-display)',
          }}
        >
          სილამაზის სამყარო
        </h2>
      </div>

      {/* 2-col asymmetric grid */}
      <div className="grid grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/masters?niche=${cat.slug}`}
            className={`group relative aspect-[4/5] overflow-hidden cursor-pointer${cat.offset ? ' translate-y-8' : ''}`}
          >
            <div className="relative w-full h-full">
              <Image
                src={cat.image}
                alt={cat.label}
                fill
                sizes="50vw"
                className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              />
            </div>
            {/* Overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: 'color-mix(in oklch, var(--ed-on-surface) 20%, transparent)' }}
            >
              <span
                className="text-xs tracking-[0.2em] uppercase text-white text-center px-2"
                style={{ fontFamily: 'var(--font-ed-label)' }}
              >
                {cat.label}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* AI Retouch — full-width card */}
      <Link
        href="/masters?niche=ai-retouch"
        className="group relative mt-8 block w-full overflow-hidden cursor-pointer"
        style={{ aspectRatio: '16/7', backgroundColor: 'rgb(24 24 27)' }}
      >
        <Image
          src="/images/categories/ai-retouch.jpg"
          alt="AI რეტუში"
          fill
          sizes="100vw"
          className="object-cover opacity-60 group-hover:opacity-100 grayscale group-hover:grayscale-0 transition-all duration-700"
        />
        {/* Gradient overlay from left */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, rgba(24,24,27,0.9) 0%, rgba(24,24,27,0.5) 50%, transparent 100%)',
          }}
        />
        {/* Text + icon */}
        <div className="absolute inset-0 flex items-center px-8 gap-3">
          <span
            className="material-symbols-outlined text-white/80 group-hover:text-white transition-colors duration-300"
            style={{ fontSize: '2rem' }}
          >
            blur_on
          </span>
          <div>
            <p
              className="text-xs tracking-[0.3em] uppercase mb-1"
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'var(--font-ed-label)',
              }}
            >
              ახალი
            </p>
            <span
              className="text-2xl md:text-3xl tracking-tight text-white"
              style={{ fontFamily: 'var(--font-ed-display)' }}
            >
              AI რეტუში
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
};
