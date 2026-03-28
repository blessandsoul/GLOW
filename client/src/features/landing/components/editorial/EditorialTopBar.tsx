'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/lib/constants/routes';

export const EditorialTopBar = (): React.ReactElement => {
  const { isAuthenticated } = useAuth();

  return (
    <nav
      className="fixed top-0 w-full z-50 backdrop-blur-xl"
      style={{
        backgroundColor: 'color-mix(in oklch, var(--ed-surface) 80%, transparent)',
        borderBottom: '1px solid color-mix(in oklch, var(--ed-on-surface) 8%, transparent)',
      }}
    >
      <div className="flex items-center justify-between px-6 py-4 w-full relative">

        {/* Left — hamburger (mobile) / nav links (desktop) */}
        <div className="flex-1 flex items-center justify-start gap-6">
          {/* Mobile: hamburger */}
          <button
            className="lg:hidden p-1 transition-colors duration-200 active:opacity-60"
            style={{ color: 'var(--ed-on-surface)' }}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          {/* Desktop: nav links */}
          <div className="hidden lg:flex items-center gap-6">
            {(['Masters', 'Blog'] as const).map((label) => (
              <Link
                key={label}
                href={label === 'Masters' ? '/masters' : '/blog'}
                className="text-sm tracking-wide uppercase transition-colors duration-150"
                style={{ color: 'color-mix(in oklch, var(--ed-on-surface) 65%, transparent)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ed-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'color-mix(in oklch, var(--ed-on-surface) 65%, transparent)')}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Center — wordmark */}
        <div
          className="absolute left-1/2 -translate-x-1/2 text-xl tracking-[0.22em] uppercase select-none"
          style={{
            color: 'var(--ed-on-surface)',
            fontFamily: 'var(--font-ed-label)',
          }}
        >
          GLOW.GE
        </div>

        {/* Right — auth */}
        <div className="flex-1 flex items-center justify-end gap-3">
          {/* Desktop: text auth links */}
          <div className="hidden lg:flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                href={ROUTES.DASHBOARD}
                className="flex items-center gap-1.5 text-sm tracking-wide uppercase transition-colors duration-150"
                style={{ color: 'var(--ed-primary)' }}
              >
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
            ) : (
              <Link
                href={ROUTES.LOGIN}
                className="text-sm tracking-wide uppercase transition-colors duration-150"
                style={{ color: 'color-mix(in oklch, var(--ed-on-surface) 65%, transparent)' }}
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile + Desktop: profile icon button */}
          <Link
            href={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN}
            className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 active:scale-95"
            style={{
              backgroundColor: 'var(--ed-primary)',
              color: 'var(--ed-on-primary)',
            }}
            aria-label={isAuthenticated ? 'Go to dashboard' : 'Sign in'}
          >
            <User size={16} />
          </Link>
        </div>

      </div>
    </nav>
  );
};
