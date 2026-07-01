'use client';

import Image from 'next/image';
import { SpinnerGap, Heart, LockSimple, WhatsappLogo, InstagramLogo, TelegramLogo, Phone } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/utils';
import { getThumbUrl } from '@/lib/utils/image';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useFaceDetail } from '../hooks/useFacesCatalog';
import { useInterestStatus, useToggleInterest } from '../hooks/useFaceInterest';
import type { ModelContact } from '../types/faces.types';

function contactLinks(contact: ModelContact): { href: string; label: string; icon: React.ComponentType<{ size?: number; weight?: 'fill' }> }[] {
    const out: { href: string; label: string; icon: React.ComponentType<{ size?: number; weight?: 'fill' }> }[] = [];
    if (contact.phone) out.push({ href: `tel:${contact.phone}`, label: contact.phone, icon: Phone });
    if (contact.whatsapp) out.push({ href: `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`, label: 'WhatsApp', icon: WhatsappLogo });
    if (contact.instagram) out.push({ href: `https://instagram.com/${contact.instagram.replace('@', '')}`, label: 'Instagram', icon: InstagramLogo });
    if (contact.telegram) out.push({ href: `https://t.me/${contact.telegram.replace('@', '')}`, label: 'Telegram', icon: TelegramLogo });
    return out;
}

export function FaceDetail({ id }: { id: string }): React.ReactElement {
    const { t } = useLanguage();
    const role = useAppSelector((s) => s.auth.user?.role);
    const isAdmin = role === 'ADMIN';
    const { model, isLoading, isError } = useFaceDetail(id);
    const likedMap = useInterestStatus([id]);
    const { toggle, isPending } = useToggleInterest();
    const liked = !!likedMap[id];

    if (isLoading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <SpinnerGap size={28} className="animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isError || !model) {
        return <EmptyState title={t('faces.detail_not_found')} description={t('faces.detail_not_found_desc')} />;
    }

    const subtitle = [model.age ? `${model.age}` : null, model.city, model.heightCm ? `${model.heightCm} cm` : null]
        .filter(Boolean)
        .join(' · ');
    const links = model.contact ? contactLinks(model.contact) : [];

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8 md:px-6">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {model.photos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
                        <Image
                            src={getThumbUrl(photo.imageUrl, 640)}
                            alt={model.displayName ?? 'Model'}
                            fill
                            unoptimized
                            sizes="(max-width: 640px) 100vw, 33vw"
                            className={cn('object-cover', model.blurred && 'blur-md')}
                        />
                    </div>
                ))}
            </div>

            <div className="mt-6 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{model.displayName}</h1>
                        {subtitle && <p className="text-sm text-muted-foreground tabular-nums">{subtitle}</p>}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Heart size={16} weight="fill" className="text-primary" />
                        <span className="tabular-nums">{model.interestedCount}</span>
                    </div>
                </div>

                {model.niches.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {model.niches.map((n) => (
                            <Badge key={n} variant="secondary">{n}</Badge>
                        ))}
                    </div>
                )}

                {model.bio && <p className="max-w-prose text-sm leading-relaxed text-foreground">{model.bio}</p>}

                {/* Interest → contact reveal */}
                {model.contactRevealed ? (
                    <div className="rounded-2xl border border-border/50 bg-muted/30 p-4">
                        <p className="mb-3 text-sm font-medium text-foreground">{t('faces.contact_title')}</p>
                        <div className="flex flex-wrap gap-2">
                            {links.map((l) => (
                                <a
                                    key={l.href}
                                    href={l.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:text-primary"
                                >
                                    <l.icon size={16} weight="fill" />
                                    {l.label}
                                </a>
                            ))}
                            {links.length === 0 && (
                                <span className="text-sm text-muted-foreground">{t('faces.contact_none')}</span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-border p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                            <LockSimple size={16} />
                            {isAdmin ? t('faces.admin_interest_blocked') : t('faces.contact_locked')}
                        </div>
                        {!isAdmin && (
                            <Button
                                onClick={() => toggle(id, liked)}
                                disabled={isPending}
                                className="rounded-xl transition-all active:scale-[0.98]"
                            >
                                <Heart size={16} weight="fill" className="mr-2" />
                                {t('faces.interest_add')}
                            </Button>
                        )}
                    </div>
                )}

                {model.contactRevealed && !isAdmin && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggle(id, true)}
                        disabled={isPending}
                        className="self-start text-muted-foreground"
                    >
                        {t('faces.interest_remove')}
                    </Button>
                )}
            </div>
        </div>
    );
}
