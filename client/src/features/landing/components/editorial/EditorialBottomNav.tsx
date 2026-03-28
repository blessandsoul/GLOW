'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { ROUTES } from '@/lib/constants/routes';

type Tab = {
  icon: string;
  label: string;
  href: string;
  exact?: boolean;
};

const TABS: Tab[] = [
  { icon: 'home', label: 'nav.home', href: ROUTES.HOME, exact: true },
  { icon: 'shopping_bag', label: 'nav.marketplace', href: ROUTES.MARKETPLACE },
  { icon: 'explore', label: 'nav.map', href: ROUTES.MAP },
  { icon: 'article', label: 'nav.blog', href: ROUTES.BLOG },
  { icon: 'person', label: 'nav.profile', href: ROUTES.DASHBOARD_PROFILE },
];

const isTabActive = (tab: Tab, pathname: string): boolean =>
  tab.exact ? pathname === tab.href : pathname === tab.href || pathname.startsWith(tab.href + '/');

export const EditorialBottomNav = (): React.ReactElement | null => {
  const { isAuthenticated, isInitializing } = useAuth();
  const pathname = usePathname();
  const { t } = useLanguage();

  if (isInitializing || !isAuthenticated) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-50 md:hidden backdrop-blur-2xl border-t border-(--ed-outline-variant)/15 shadow-[0_-10px_30px_rgba(26,28,28,0.04)]"
      style={{
        backgroundColor: 'color-mix(in oklch, var(--ed-surface) 90%, transparent)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex justify-around items-center px-4 pb-3 pt-2">
        {TABS.map((tab) => {
          const active = isTabActive(tab, pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-95"
              style={{
                color: active ? '#680005' : 'rgba(26,28,28,0.5)',
              }}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={{ fontVariationSettings: active ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 300" }}
              >
                {tab.icon}
              </span>
              <span
                className="text-[10px] font-medium tracking-wide"
                style={{ fontFamily: 'var(--font-inter), var(--font-noto-georgian), sans-serif' }}
              >
                {t(tab.label)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
