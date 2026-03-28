'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';

interface NavTab {
  label: string;
  href: string;
  icon: string;
}

const TABS: NavTab[] = [
  { label: 'მთავარი', href: ROUTES.HOME, icon: 'home' },
  { label: 'მასტერები', href: ROUTES.MASTERS, icon: 'shopping_bag' },
  { label: 'რუკა', href: '#map-placeholder', icon: 'explore' },
  { label: 'ბლოგი', href: ROUTES.BLOG, icon: 'edit_note' },
  { label: 'პროფილი', href: ROUTES.DASHBOARD, icon: 'person' },
];

export const EditorialBottomNav = (): React.ReactElement => {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-50 border-t"
      style={{
        backgroundColor: 'color-mix(in oklch, var(--ed-surface) 90%, transparent)',
        backdropFilter: 'blur(24px) saturate(1.5)',
        borderColor: 'color-mix(in oklch, var(--ed-outline-variant, var(--ed-primary)) 15%, transparent)',
        boxShadow: '0 -10px 30px rgba(26,28,28,0.04)',
      }}
    >
      <div className="flex justify-around items-center px-4 pb-6 pt-3">
        {TABS.map((tab) => {
          const isActive = tab.href !== '#map-placeholder' && pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-0.5 transition-all duration-150"
              style={{
                color: isActive
                  ? 'var(--ed-primary)'
                  : 'color-mix(in oklch, var(--ed-on-surface) 60%, transparent)',
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>
                {tab.icon}
              </span>
              <span
                className="text-[10px] tracking-widest uppercase"
                style={{ fontFamily: 'var(--font-ed-label)' }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
