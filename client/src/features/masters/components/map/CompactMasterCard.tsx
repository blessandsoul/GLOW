'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin } from '@phosphor-icons/react';
import { getThumbUrl } from '@/lib/utils/image';
import { ROUTES } from '@/lib/constants/routes';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { getCityLabel } from '@/lib/constants/cities';
import { cn } from '@/lib/utils';
import { MasterBadgesRow } from '../MasterBadges';
import type { FeaturedMaster } from '../../types/masters.types';

interface CompactMasterCardProps {
  master: FeaturedMaster;
  isHighlighted: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function CompactMasterCard({
  master,
  isHighlighted,
  onMouseEnter,
  onMouseLeave,
}: CompactMasterCardProps): React.ReactElement {
  const { language } = useLanguage();
  const cityDisplay = master.city ? getCityLabel(master.city, language) : null;

  return (
    <Link
      href={ROUTES.PORTFOLIO_PUBLIC(master.username)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label={`View ${master.displayName}'s portfolio`}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3 transition-all duration-200 hover:shadow-md hover:border-border/80 hover:-translate-y-px',
        isHighlighted && 'ring-2 ring-primary/50 bg-primary/5 border-primary/30',
      )}
    >
      {/* Avatar */}
      {master.avatar ? (
        <Image
          src={getThumbUrl(master.avatar, 96)}
          alt={master.displayName}
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-background"
          unoptimized
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary ring-2 ring-background">
          {master.displayName.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{master.displayName}</p>
        <MasterBadgesRow masterTier={master.masterTier} isVerified={master.isVerified} badges={master.badges} size="sm" />
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          {master.niche && <span className="capitalize">{master.niche}</span>}
          {master.niche && cityDisplay && <span className="text-border">·</span>}
          {cityDisplay && (
            <span className="flex items-center gap-0.5">
              <MapPin size={10} weight="fill" className="shrink-0" />
              {cityDisplay}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
