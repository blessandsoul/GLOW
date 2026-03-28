'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/lib/constants/routes';

export const EditorialTopBar = (): React.ReactElement => {
  const { isAuthenticated } = useAuth();

  return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-(--ed-outline-variant)/10"
      style={{ backgroundColor: 'color-mix(in oklch, var(--ed-surface) 85%, transparent)' }}>
      <div className="flex justify-between items-center px-6 py-4 w-full relative">
        {/* Left — hamburger */}
        <div className="flex-1 flex justify-start">
          <button
            className="p-1 transition-colors duration-300 active:opacity-70"
            style={{ color: 'var(--ed-on-surface)' }}
            aria-label="Menu"
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--ed-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--ed-on-surface)')}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>

        {/* Center — wordmark */}
        <div className="absolute left-1/2 -translate-x-1/2 text-2xl uppercase tracking-[0.2em] select-none"
          style={{ fontFamily: 'var(--font-noto-serif-georgian), var(--font-noto-serif), serif', color: 'var(--ed-on-surface)' }}
        >
          GLOW.GE
        </div>

        {/* Right — profile */}
        <div className="flex-1 flex justify-end">
          <Link
            href={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN}
            className="flex items-center justify-center bg-[#680005] text-white hover:bg-[#92000a] transition-all duration-300 active:scale-95 rounded-full w-10 h-10"
            aria-label="Profile"
          >
            <span className="material-symbols-outlined text-[20px]">person</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};
