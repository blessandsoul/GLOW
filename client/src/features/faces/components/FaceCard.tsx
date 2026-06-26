'use client';

import Image from 'next/image';
import Link from 'next/link';
import { UserFocus, Heart } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants/routes';
import { getThumbUrl } from '@/lib/utils/image';
import { InterestButton } from './InterestButton';
import type { ModelCard } from '../types/faces.types';

interface FaceCardProps {
    model: ModelCard;
    liked: boolean;
    className?: string;
}

export function FaceCard({ model, liked, className }: FaceCardProps): React.ReactElement {
    const primary = model.photos[0];
    const subtitle = [model.age ? `${model.age}` : null, model.city].filter(Boolean).join(' · ');

    return (
        <Link
            href={ROUTES.FACE_DETAIL(model.id)}
            className={cn(
                'group flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm',
                'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md',
                className,
            )}
        >
            <div className="relative aspect-square overflow-hidden bg-muted">
                {primary ? (
                    <Image
                        src={getThumbUrl(primary.imageUrl, 512)}
                        alt={model.displayName ?? 'Model'}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className={cn(
                            'object-cover transition-transform duration-500 group-hover:scale-[1.03]',
                            model.blurred && 'blur-md',
                        )}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <UserFocus size={40} className="text-muted-foreground/30" />
                    </div>
                )}

                <div className="absolute right-2 top-2">
                    <InterestButton modelId={model.id} liked={liked} />
                </div>

                {model.interestedCount > 0 && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-medium text-foreground backdrop-blur-sm">
                        <Heart size={12} weight="fill" className="text-primary" />
                        <span className="tabular-nums">{model.interestedCount}</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-0.5 p-3">
                <h3 className="line-clamp-1 text-sm font-medium text-foreground">
                    {model.displayName ?? ''}
                </h3>
                {subtitle && <p className="text-xs text-muted-foreground tabular-nums">{subtitle}</p>}
            </div>
        </Link>
    );
}
