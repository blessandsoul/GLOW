'use client';

import Link from 'next/link';
import { X, ArrowRight } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { getServerImageUrl } from '@/lib/utils/image';
import { ROUTES } from '@/lib/constants/routes';
import { MasterBadgesRow } from '../MasterBadges';
import type { FeaturedMaster } from '../../types/masters.types';

interface MasterPopupCardProps {
  master: FeaturedMaster | null;
  onClose: () => void;
}

export function MasterPopupCard({ master, onClose }: MasterPopupCardProps): React.ReactElement {
  return (
    <AnimatePresence>
      {master && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-4 left-3 right-3 z-[1000] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl lg:bottom-auto lg:left-auto lg:right-4 lg:top-4 lg:w-80"
        >
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-muted"
            aria-label="Close"
          >
            <X size={14} weight="bold" />
          </button>

          {/* Portfolio preview strip */}
          {master.portfolioImages && master.portfolioImages.length > 0 && (
            <div className="flex h-24 w-full gap-px overflow-hidden">
              {master.portfolioImages.slice(0, 4).map((img) => (
                <div key={img.id} className="relative flex-1 overflow-hidden">
                  <img
                    src={getServerImageUrl(img.imageUrl)}
                    alt={img.title ?? ''}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          <Link
            href={ROUTES.PORTFOLIO_PUBLIC(master.username)}
            className="flex items-center gap-3 p-4"
          >
            {/* Avatar */}
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-background">
              {master.avatar ? (
                <img
                  src={getServerImageUrl(master.avatar)}
                  alt={master.displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-sm font-bold text-primary">
                  {master.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{master.displayName}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                {master.niche && (
                  <span className="text-xs capitalize text-muted-foreground">{master.niche}</span>
                )}
                {master.niche && master.district && (
                  <span className="text-muted-foreground/40">·</span>
                )}
                {master.district && (
                  <span className="text-xs text-muted-foreground">{master.district.name}</span>
                )}
              </div>
              {master.badges && (
                <div className="mt-1">
                  <MasterBadgesRow badges={master.badges} size="sm" />
                </div>
              )}
            </div>

            <ArrowRight size={16} weight="bold" className="shrink-0 text-muted-foreground/40" />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
