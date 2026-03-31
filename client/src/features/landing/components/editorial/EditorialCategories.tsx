'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Eye,
  Hand,
  Sparkles,
  Paintbrush,
  Scissors,
  Droplets,
  Wand2,
} from 'lucide-react';
import { useServiceCategories } from '@/features/profile/hooks/useCatalog';

const CATEGORY_IMAGES: Record<string, string> = {
  'lashes-brows':     '/categories/lash.jpg',
  nails:              '/categories/nail.jpg',
  makeup:             '/categories/makeup.jpg',
  hair:               '/categories/hair.jpg',
  'permanent-makeup': '/categories/permanent.jpg',
  skincare:           '/categories/skinandbody.jpg',
  waxing:             '/categories/skinandbody.jpg',
  body:               '/categories/skinandbody.jpg',
  cosmetology:        '/categories/skinandbody.jpg',
  'tattoo-piercing':  '/categories/tattoo.jpg',
  retouch:            '/categories/retouch.jpg',
  other:              '/categories/tattoo.jpg',
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'lashes-brows':     Eye,
  nails:              Hand,
  'permanent-makeup': Wand2,
  makeup:             Paintbrush,
  hair:               Scissors,
  cosmetology:        Droplets,
  'tattoo-piercing':  Wand2,
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80';
const DEFAULT_ICON = Sparkles;

const STATIC_CATEGORIES = [
  { slug: 'lashes-brows',     label: 'წამწამები და წარბები' },
  { slug: 'nails',            label: 'ფრჩხილის მოვლა' },
  { slug: 'permanent-makeup', label: 'პერმანენტული მაკიაჟი' },
  { slug: 'makeup',           label: 'მაკიაჟი' },
  { slug: 'hair',             label: 'თმის მოვლა' },
  { slug: 'cosmetology',      label: 'კოსმეტოლოგია და სხეულის მოვლა' },
  { slug: 'tattoo-piercing',  label: 'ტატუ და პირსინგი' },
];

export const EditorialCategories = (): React.ReactElement => {
  const { categories: apiCategories, isLoading } = useServiceCategories();
  const specialities = apiCategories.length > 0 ? apiCategories : (!isLoading ? STATIC_CATEGORIES : []);

  return (
    <section className="py-16 px-8 md:px-12 lg:px-16 bg-[#f9f9f9]">
      {isLoading ? (
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-12">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`aspect-4/5 bg-[#e8e8e8] animate-pulse${i % 2 === 1 ? ' translate-y-8 md:translate-y-0' : ''}`} />
          ))}
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-12">
          {specialities.map((spec, i) => {
            const image = CATEGORY_IMAGES[spec.slug];
            const Icon = CATEGORY_ICONS[spec.slug] ?? DEFAULT_ICON;
            return (
              <Link
                key={spec.slug}
                href={`/masters?niche=${spec.slug}`}
                className={`group relative aspect-4/5 bg-[#f3f3f3] overflow-hidden cursor-pointer${i % 2 === 1 ? ' translate-y-8 md:translate-y-0' : ''}`}
              >
                {image ? (
                  <Image
                    src={image}
                    alt={spec.label}
                    fill
                    sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw"
                    unoptimized
                    className="h-full w-full object-cover transition-all duration-700 ease-in-out"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#ececec]">
                    <Icon size={48} strokeWidth={1} className="text-[#aaa]" />
                  </div>
                )}
                <div className="absolute inset-0 bg-[#1a1c1c]/20 flex items-center justify-center">
                  <span
                    className="text-xs tracking-[0.2em] uppercase text-white text-center px-4 leading-relaxed"
                    style={{ fontFamily: 'var(--font-inter), var(--font-noto-georgian), sans-serif' }}
                  >
                    {spec.label}
                  </span>
                </div>
              </Link>
            );
          })}

          {/* AI რეტუში — full-width */}
          <Link
            href="/create"
            className="group relative col-span-2 md:col-span-3 lg:col-span-4 bg-zinc-900 overflow-hidden mt-8 cursor-pointer"
            style={{ aspectRatio: '16/7' }}
          >
            <Image
              src="/categories/retouch.jpg"
              alt="AI რეტუში"
              fill
              sizes="100vw"
              className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-1000"
            />
            <div
              className="absolute inset-0 flex items-center px-12"
              style={{ background: 'linear-gradient(to right, rgba(26,28,28,0.6), transparent)' }}
            >
              <div className="space-y-2">
                <span
                  className="block text-[10px] tracking-[0.4em] uppercase opacity-70 text-white"
                  style={{ fontFamily: 'var(--font-inter), var(--font-noto-georgian), sans-serif' }}
                >
                  სილამაზის მომავალი
                </span>
                <h3
                  className="text-white text-3xl"
                  style={{ fontFamily: 'var(--font-noto-georgian), sans-serif' }}
                >
                  AI რეტუში
                </h3>
              </div>
            </div>
            <div className="absolute bottom-6 right-8">
              <span className="material-symbols-outlined text-white/50 text-4xl" style={{ fontVariationSettings: "'wght' 100" }}>
                blur_on
              </span>
            </div>
          </Link>
        </div>
      )}
    </section>
  );
};
