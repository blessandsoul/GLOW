'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { icon: 'home', label: 'მთავარი', href: '/' },
  { icon: 'shopping_bag', label: 'მარკეტფლეისი', href: '/masters' },
  { icon: 'explore', label: 'რუკა', href: '/masters' },
  { icon: 'edit_note', label: 'ბლოგები', href: '/blog' },
  { icon: 'person', label: 'პროფილი', href: '/dashboard' },
] as const;

export const EditorialBottomNav = (): React.ReactElement => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 backdrop-blur-2xl border-t border-(--ed-outline-variant)/15 shadow-[0_-10px_30px_rgba(26,28,28,0.04)]"
      style={{ backgroundColor: 'color-mix(in oklch, var(--ed-surface) 90%, transparent)' }}>
      <div className="flex justify-around items-center px-4 pb-6 pt-3">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.icon}
              href={tab.href}
              className="flex flex-col items-center justify-center transition-all duration-200 active:scale-95"
              style={{
                color: isActive ? '#680005' : 'rgba(26,28,28,0.6)',
                transform: isActive ? 'scale(1.1)' : undefined,
              }}
            >
              <span className="material-symbols-outlined">{tab.icon}</span>
              <span
                className="text-[10px] font-medium tracking-widest uppercase mt-1"
                style={{ fontFamily: 'var(--font-inter), var(--font-noto-georgian), sans-serif' }}
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
