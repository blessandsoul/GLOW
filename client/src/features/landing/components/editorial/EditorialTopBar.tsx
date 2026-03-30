'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useServiceCategories } from '@/features/profile/hooks/useCatalog';
import { ROUTES } from '@/lib/constants/routes';
import { IS_LAUNCH_MODE } from '@/lib/launch-mode';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

const STATIC_CATEGORIES = [
  { slug: 'lashes-brows',     label: 'წამწამები და წარბები' },
  { slug: 'nails',            label: 'ფრჩხილის მოვლა' },
  { slug: 'permanent-makeup', label: 'პერმანენტული მაკიაჟი' },
  { slug: 'makeup',           label: 'მაკიაჟი' },
  { slug: 'hair',             label: 'თმის მოვლა' },
  { slug: 'cosmetology',      label: 'კოსმეტოლოგია და სხეულის მოვლა' },
  { slug: 'tattoo-piercing',  label: 'ტატუ და პირსინგი' },
];

const CATEGORY_ICONS: Record<string, string> = {
  'lashes-brows':     'visibility',
  nails:              'pan_tool',
  'permanent-makeup': 'auto_fix_high',
  makeup:             'brush',
  hair:               'content_cut',
  cosmetology:        'water_drop',
  'tattoo-piercing':  'edit',
};

export const EditorialTopBar = (): React.ReactElement => {
  const { isAuthenticated, isInitializing, user, logout } = useAuth();
  const isMasterRole = user?.role === 'MASTER' || user?.role === 'SALON' || user?.role === 'ADMIN';
  const { t } = useLanguage();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const { categories: apiCategories, isLoading: categoriesLoading } = useServiceCategories();
  const categories = apiCategories.length > 0 ? apiCategories : (!categoriesLoading ? STATIC_CATEGORIES : []);

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
          <div className="flex-1 flex justify-start items-center gap-2">
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
            <LanguageSwitcher />
          </div>

          {/* Center — wordmark */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 text-2xl uppercase tracking-[0.2em] select-none"
            style={{ fontFamily: 'var(--font-noto-georgian), sans-serif', color: 'var(--ed-on-surface)' }}
          >
            GLOW.GE
          </Link>

          {/* Right — profile / login */}
          <div className="flex-1 flex justify-end items-center gap-2">
            <Link
              href={isAuthenticated ? ROUTES.DASHBOARD_PROFILE : ROUTES.LOGIN}
              className="flex items-center justify-center bg-[#680005] text-white hover:bg-[#92000a] transition-all duration-300 active:scale-95 rounded-full w-10 h-10"
              aria-label={isAuthenticated ? t('nav.profile') : t('auth.login')}
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
        className="fixed left-0 top-14 z-50 h-[calc(100dvh-3.5rem)] w-80 overflow-y-auto border-r border-(--ed-outline-variant)/20 transition-transform duration-300 ease-out"
        style={{
          backgroundColor: 'var(--ed-surface)',
          transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
        aria-hidden={!menuOpen}
      >
        <div className="flex flex-col gap-5 p-5">

          {/* Categories */}
          <div>
            <p
              className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'color-mix(in oklch, var(--ed-on-surface) 40%, transparent)' }}
            >
              {t('landing.categories_title')}
            </p>
            {categoriesLoading ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl" style={{ backgroundColor: 'color-mix(in oklch, var(--ed-on-surface) 8%, transparent)' }} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => {
                  const icon = CATEGORY_ICONS[cat.slug] ?? 'auto_awesome';
                  return (
                    <Link
                      key={cat.slug}
                      href={`${ROUTES.MASTERS}?niche=${cat.slug}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all duration-200 active:scale-[0.98]"
                      style={{
                        backgroundColor: 'color-mix(in oklch, var(--ed-on-surface) 5%, transparent)',
                        color: 'var(--ed-on-surface)',
                      }}
                    >
                      <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--ed-primary)', fontVariationSettings: "'FILL' 0, 'wght' 300" }}>{icon}</span>
                      <span className="text-xs font-medium leading-tight" style={{ fontFamily: 'var(--font-inter), var(--font-noto-georgian), sans-serif' }}>
                        {cat.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="h-px" style={{ backgroundColor: 'color-mix(in oklch, var(--ed-outline-variant) 50%, transparent)' }} />

          {/* Navigation links */}
          <div className="flex flex-col gap-1">
            <p
              className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'color-mix(in oklch, var(--ed-on-surface) 40%, transparent)' }}
            >
              {t('nav.home')}
            </p>

            {/* Masters — always */}
            <NavLink
              href={ROUTES.MASTERS}
              icon="storefront"
              label={t('header.masters_link')}
              isActive={pathname === ROUTES.MASTERS}
              onClick={() => setMenuOpen(false)}
            />

            {/* Marketplace — authenticated users */}
            {isAuthenticated && (
              <NavLink
                href={ROUTES.MARKETPLACE}
                icon="shopping_bag"
                label="Маркетплейс"
                isActive={pathname === ROUTES.MARKETPLACE}
                onClick={() => setMenuOpen(false)}
              />
            )}

            {/* USER: Appointments + Favorites */}
            {isAuthenticated && !isMasterRole && (
              <>
                <NavLink
                  href={ROUTES.APPOINTMENTS}
                  icon="calendar_month"
                  label={t('nav.appointments')}
                  isActive={pathname === ROUTES.APPOINTMENTS}
                  onClick={() => setMenuOpen(false)}
                />
                <NavLink
                  href={ROUTES.FAVORITES}
                  icon="favorite"
                  label={t('nav.favorites')}
                  isActive={pathname === ROUTES.FAVORITES}
                  onClick={() => setMenuOpen(false)}
                />
              </>
            )}

            {/* MASTER/SALON/ADMIN links */}
            {isAuthenticated && isMasterRole && (
              <>
                <NavLink
                  href={ROUTES.CREATE}
                  icon="add_circle"
                  label={t('nav.create')}
                  isActive={pathname === ROUTES.CREATE}
                  onClick={() => setMenuOpen(false)}
                  accent
                />
                <NavLink
                  href={ROUTES.DASHBOARD}
                  icon="photo_library"
                  label={t('nav.dashboard')}
                  isActive={pathname === ROUTES.DASHBOARD}
                  onClick={() => setMenuOpen(false)}
                />
                <NavLink
                  href={ROUTES.DASHBOARD_PORTFOLIO}
                  icon="collections"
                  label={t('nav.portfolio')}
                  isActive={pathname.startsWith(ROUTES.DASHBOARD_PORTFOLIO)}
                  onClick={() => setMenuOpen(false)}
                />
                <NavLink
                  href={ROUTES.DASHBOARD_BRANDING}
                  icon="palette"
                  label={t('nav.branding')}
                  isActive={pathname.startsWith(ROUTES.DASHBOARD_BRANDING)}
                  onClick={() => setMenuOpen(false)}
                />
                <NavLink
                  href={ROUTES.DASHBOARD_REFERRALS}
                  icon="group_add"
                  label={t('nav.referrals')}
                  isActive={pathname.startsWith(ROUTES.DASHBOARD_REFERRALS)}
                  onClick={() => setMenuOpen(false)}
                />
                <NavLink
                  href="/dashboard/shop"
                  icon="sell"
                  label="Мой магазин"
                  isActive={pathname.startsWith('/dashboard/shop')}
                  onClick={() => setMenuOpen(false)}
                />
                {!IS_LAUNCH_MODE && (
                  <NavLink
                    href={ROUTES.DASHBOARD_CREDITS}
                    icon="toll"
                    label={`${t('dashboard.stats_credits')} — ${user?.credits ?? 0}`}
                    isActive={pathname.startsWith(ROUTES.DASHBOARD_CREDITS)}
                    onClick={() => setMenuOpen(false)}
                  />
                )}
                {user?.username && (
                  <NavLink
                    href={ROUTES.PORTFOLIO_PUBLIC(user.username)}
                    icon="open_in_new"
                    label={t('nav.my_page')}
                    isActive={false}
                    onClick={() => setMenuOpen(false)}
                    external
                  />
                )}
                {user?.role === 'ADMIN' && (
                  <NavLink
                    href={ROUTES.ADMIN}
                    icon="admin_panel_settings"
                    label="Admin"
                    isActive={pathname.startsWith(ROUTES.ADMIN)}
                    onClick={() => setMenuOpen(false)}
                  />
                )}
              </>
            )}

            {/* Blog — always */}
            <NavLink
              href={ROUTES.BLOG}
              icon="edit_note"
              label={t('nav.blog')}
              isActive={pathname.startsWith(ROUTES.BLOG)}
              onClick={() => setMenuOpen(false)}
            />
          </div>

          <div className="h-px" style={{ backgroundColor: 'color-mix(in oklch, var(--ed-outline-variant) 50%, transparent)' }} />

          {/* Auth section */}
          {isInitializing ? (
            <div className="h-12 animate-pulse rounded-xl" style={{ backgroundColor: 'color-mix(in oklch, var(--ed-on-surface) 8%, transparent)' }} />
          ) : !isAuthenticated ? (
            <div className="flex flex-col gap-2">
              <Link
                href={ROUTES.LOGIN}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.98]"
                style={{
                  border: '1px solid color-mix(in oklch, var(--ed-outline-variant) 50%, transparent)',
                  color: 'var(--ed-on-surface)',
                }}
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                {t('auth.login')}
              </Link>
              <Link
                href={ROUTES.REGISTER}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98]"
                style={{ backgroundColor: 'var(--ed-primary)' }}
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                {t('header.start_master')}
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href={ROUTES.DASHBOARD_PROFILE}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 active:scale-[0.98]"
                style={{ backgroundColor: 'color-mix(in oklch, var(--ed-on-surface) 6%, transparent)' }}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-semibold"
                  style={{ backgroundColor: 'var(--ed-primary)' }}
                >
                  {user?.firstName?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--ed-on-surface)' }}>
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: 'color-mix(in oklch, var(--ed-on-surface) 50%, transparent)' }}>
                    {t('nav.profile')}
                  </p>
                </div>
                {IS_LAUNCH_MODE && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ backgroundColor: 'color-mix(in oklch, var(--ed-on-surface) 8%, transparent)', color: 'color-mix(in oklch, var(--ed-on-surface) 50%, transparent)' }}
                  >
                    Free
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={() => { logout(); setMenuOpen(false); }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 active:scale-[0.98]"
                style={{ color: 'color-mix(in oklch, var(--ed-on-surface) 50%, transparent)' }}
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                {t('auth.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/* Reusable nav link inside the drawer */
function NavLink({ href, icon, label, isActive, onClick, accent, external }: {
  href: string;
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
  accent?: boolean;
  external?: boolean;
}): React.ReactElement {
  return (
    <Link
      href={href}
      onClick={onClick}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 active:scale-[0.98]"
      style={{
        backgroundColor: isActive
          ? 'color-mix(in oklch, var(--ed-primary) 12%, transparent)'
          : accent
            ? 'color-mix(in oklch, var(--ed-primary) 8%, transparent)'
            : undefined,
        color: isActive || accent ? 'var(--ed-primary)' : 'var(--ed-on-surface)',
      }}
    >
      <span
        className="material-symbols-outlined text-[20px]"
        style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 300" }}
      >
        {icon}
      </span>
      <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-inter), var(--font-noto-georgian), sans-serif' }}>
        {label}
      </span>
      {external && (
        <span className="material-symbols-outlined text-[14px] ml-auto" style={{ fontVariationSettings: "'wght' 200" }}>open_in_new</span>
      )}
    </Link>
  );
}
