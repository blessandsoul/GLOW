'use client';

import Link from 'next/link';
import { X, ArrowRight, MapPin, Briefcase } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { getThumbUrl } from '@/lib/utils/image';
import { ROUTES } from '@/lib/constants/routes';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { MasterBadgesRow } from '../MasterBadges';
import type { FeaturedMaster, MasterServiceItem } from '../../types/masters.types';

interface MasterPopupCardProps {
  master: FeaturedMaster | null;
  onClose: () => void;
}

export function MasterPopupCard({ master, onClose }: MasterPopupCardProps): React.ReactElement {
  const { t } = useLanguage();
  const services = (master?.services ?? []) as MasterServiceItem[];
  const topServices = services.slice(0, 3);

  return (
    <AnimatePresence>
      {master && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-36 left-3 right-3 z-1000 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl lg:bottom-auto lg:left-auto lg:right-4 lg:top-4 lg:w-80"
        >
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
            className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            aria-label="Close"
          >
            <X size={14} weight="bold" />
          </button>

          {/* Portfolio preview strip */}
          {master.portfolioImages && master.portfolioImages.length > 0 && (
            <div className="flex h-28 w-full gap-px overflow-hidden">
              {master.portfolioImages.slice(0, 4).map((img) => (
                <div key={img.id} className="relative flex-1 overflow-hidden">
                  <img
                    src={getThumbUrl(img.imageUrl, 256)}
                    alt={img.title ?? ''}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          <Link
            href={ROUTES.PORTFOLIO_PUBLIC(master.username)}
            className="block p-4"
          >
            {/* Top row: avatar + name */}
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-background">
                {master.avatar ? (
                  <img
                    src={getThumbUrl(master.avatar, 96)}
                    alt={master.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-sm font-bold text-primary">
                    {master.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{master.displayName}</p>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  {master.niche && <span className="capitalize">{master.niche}</span>}
                  {master.niche && master.district && <span className="text-muted-foreground/40">·</span>}
                  {master.district && (
                    <span className="flex items-center gap-0.5">
                      <MapPin size={10} weight="fill" />
                      {master.district.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Badges */}
            {master.badges && (
              <div className="mt-2">
                <MasterBadgesRow masterTier={master.masterTier} badges={master.badges} size="sm" />
              </div>
            )}

            {/* Services preview */}
            {topServices.length > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-border/40 pt-3">
                {topServices.map((svc, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="truncate text-muted-foreground">{svc.name}</span>
                    <span className="shrink-0 font-medium tabular-nums text-foreground">
                      {svc.price} ₾
                    </span>
                  </div>
                ))}
                {services.length > 3 && (
                  <p className="text-[11px] text-muted-foreground/60">+{services.length - 3} {t('catalog.more_services')}</p>
                )}
              </div>
            )}

            {/* Experience */}
            {master.experienceYears != null && master.experienceYears > 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Briefcase size={11} />
                <span>{master.experienceYears} {t('catalog.years_many')}</span>
              </div>
            )}

            {/* CTA */}
            <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-primary/8 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/15">
              {t('catalog.view_profile')}
              <ArrowRight size={12} weight="bold" />
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
