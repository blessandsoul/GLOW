'use client';

import Image from 'next/image';
import Link from 'next/link';
import { X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { getServerImageUrl } from '@/lib/utils/image';
import { MasterBadgesRow } from '../MasterBadges';
import { cn } from '@/lib/utils';
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
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-4 left-4 right-4 z-[1000] rounded-2xl border border-border/60 bg-card p-4 shadow-xl lg:bottom-auto lg:left-auto lg:right-4 lg:top-4 lg:w-80"
        >
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-muted/80 text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Close"
          >
            <X size={14} weight="bold" />
          </button>

          <Link href={`/masters/${master.username}`} className="flex gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
              {master.avatar ? (
                <Image
                  src={getServerImageUrl(master.avatar)}
                  alt={master.displayName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-lg font-semibold text-muted-foreground">
                  {master.displayName.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{master.displayName}</p>
              {master.niche && (
                <p className="mt-0.5 text-xs capitalize text-muted-foreground">{master.niche}</p>
              )}
              {master.district && (
                <p className="mt-0.5 text-xs text-muted-foreground">{master.district.name}</p>
              )}
              {master.badges && (
                <MasterBadgesRow badges={master.badges} size="sm" className="mt-1.5" />
              )}
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
