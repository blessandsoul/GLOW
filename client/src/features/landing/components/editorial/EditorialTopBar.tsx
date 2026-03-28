'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/lib/constants/routes';

const NAV_LINKS = [
  { href: '/', label: 'მთავარი', icon: 'home' },
  { href: '/masters', label: 'სპეციალისტები', icon: 'shopping_bag' },
  { href: '/blog', label: 'ბლოგი', icon: 'edit_note' },
] as const;

export const EditorialTopBar = (): React.ReactElement => {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent): void => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <nav
        className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-(--ed-outline-variant)/10"
        style={{ backgroundColor: 'color-mix(in oklch, var(--ed-surface) 85%, transparent)' }}
      >
        <div className="flex justify-between items-center px-6 py-4 w-full relative">
          {/* Left — hamburger */}
          <div className="flex-1 flex justify-start">
            <button
              type="button"
              className="p-1 transition-colors duration-300 active:opacity-70"
              style={{ color: 'var(--ed-on-surface)' }}
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--ed-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--ed-on-surface)')}
            >
              <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>

          {/* Center — wordmark */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 text-2xl uppercase tracking-[0.2em] select-none"
            style={{ fontFamily: 'var(--font-noto-serif-georgian), var(--font-noto-serif), serif', color: 'var(--ed-on-surface)' }}
          >
            GLOW.GE
          </Link>

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

      {/* Backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <div
        className="fixed left-0 top-14 z-50 h-[calc(100dvh-3.5rem)] w-72 overflow-y-auto border-r border-(--ed-outline-variant)/20 transition-transform duration-300 ease-out"
        style={{
          backgroundColor: 'var(--ed-surface)',
          transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
        aria-hidden={!menuOpen}
      >
        <div className="flex flex-col gap-1 p-4">
          <p
            className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'color-mix(in oklch, var(--ed-on-surface) 40%, transparent)' }}
          >
            ნავიგაცია
          </p>

          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 active:scale-[0.98]"
                style={{
                  backgroundColor: isActive ? 'color-mix(in oklch, var(--ed-primary) 12%, transparent)' : undefined,
                  color: isActive ? 'var(--ed-primary)' : 'var(--ed-on-surface)',
                }}
              >
                <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-inter), var(--font-noto-georgian), sans-serif' }}>
                  {link.label}
                </span>
              </Link>
            );
          })}

          <div className="my-3 h-px" style={{ backgroundColor: 'color-mix(in oklch, var(--ed-outline-variant) 50%, transparent)' }} />

          <Link
            href={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN}
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 active:scale-[0.98]"
            style={{ color: 'var(--ed-on-surface)' }}
          >
            <span className="material-symbols-outlined text-[20px]">person</span>
            <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-inter), var(--font-noto-georgian), sans-serif' }}>
              {isAuthenticated ? 'პროფილი' : 'შესვლა'}
            </span>
          </Link>
        </div>
      </div>
    </>
  );
};
