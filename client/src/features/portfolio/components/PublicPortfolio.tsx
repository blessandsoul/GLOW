'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Share, InstagramLogo, PaperPlaneTilt,
    ChatCircle, X, CalendarBlank, MapPin, Star, Clock,
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppSelector } from '@/store/hooks';
import { usePublicPortfolio } from '../hooks/usePortfolio';
import { getThumbUrl } from '@/lib/utils/image';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { getCityLabel } from '@/lib/constants/cities';
import { MasterBadgesRow } from '@/features/masters/components/MasterBadges';
import { ImageLightbox } from './ImageLightbox';
import { ReviewsSection } from './ReviewsSection';
import { ReviewForm } from '@/features/reviews/components/ReviewForm';
import { FavoriteButton } from '@/features/favorites/components/FavoriteButton';
import { useFavoriteStatus } from '@/features/favorites/hooks/useFavorites';
import { MasterProductsSection } from '@/features/marketplace/components/MasterProductsSection';
import type { PublicPortfolioData } from '../types/portfolio.types';
import { cn } from '@/lib/utils';

interface PublicPortfolioProps {
    username: string;
}

export function PublicPortfolio({ username }: PublicPortfolioProps): React.ReactElement {
    const { t, language } = useLanguage();
    const router = useRouter();
    const user = useAppSelector((s) => s.auth.user);
    const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
    const isOwnProfile = user?.username === username;
    const { portfolio, isLoading, isError } = usePublicPortfolio(username);
    const [lightboxIndex, setLightboxIndex] = useState(-1);
    const [bookingOpen, setBookingOpen] = useState(false);

    const masterProfileId = portfolio?.masterId ?? '';
    const { status: favoriteStatus } = useFavoriteStatus(
        isAuthenticated && !isOwnProfile && masterProfileId ? [masterProfileId] : [],
        [],
    );

    const handleOpenLightbox = useCallback((index: number): void => setLightboxIndex(index), []);
    const handleCloseLightbox = useCallback((): void => setLightboxIndex(-1), []);

    if (isLoading) return <PortfolioSkeleton />;

    if (isError || !portfolio) {
        return (
            <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
                <p className="text-lg font-semibold text-foreground">{t('ui.text_20pmm4')}</p>
                <p className="text-sm text-muted-foreground">{t('ui.text_p08e8w')}</p>
            </div>
        );
    }

    const isFavorited = masterProfileId ? favoriteStatus?.masters?.[masterProfileId] ?? false : false;
    const lightboxImages = portfolio.items.map((item) => ({ imageUrl: item.imageUrl, title: item.title }));
    const hasContacts = portfolio.instagram || portfolio.whatsapp || portfolio.telegram;

    return (
        <>
            {/* Page content */}
            <main className="pb-28">
                {/* Back + share row */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3">
                    <button
                        type="button"
                        onClick={() => {
                            if (isOwnProfile) {
                                if (window.history.length > 1) router.back();
                                else router.push('/dashboard/portfolio');
                            } else {
                                router.back();
                            }
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground/70 hover:text-foreground hover:bg-muted transition-all duration-150 cursor-pointer"
                        aria-label="Back"
                    >
                        <ArrowLeft size={18} weight="bold" />
                    </button>
                    <div className="flex items-center gap-1">
                        {isAuthenticated && !isOwnProfile && masterProfileId && (
                            <FavoriteButton
                                entityType="master"
                                entityId={masterProfileId}
                                isFavorited={isFavorited}
                                favoritesCount={portfolio.favoritesCount}
                            />
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                if (navigator.share) {
                                    void navigator.share({ title: portfolio.displayName, url: window.location.href });
                                } else {
                                    void navigator.clipboard.writeText(window.location.href);
                                }
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground/70 hover:text-foreground hover:bg-muted transition-all duration-150 cursor-pointer"
                            aria-label="Share"
                        >
                            <Share size={18} />
                        </button>
                    </div>
                </div>

                <HeroSection portfolio={portfolio} language={language} />

                {portfolio.items.length > 0 && (
                    <PortfolioGrid
                        items={portfolio.items}
                        displayName={portfolio.displayName}
                        onOpenLightbox={handleOpenLightbox}
                    />
                )}

                {portfolio.services.length > 0 && (
                    <ServicesSection services={portfolio.services} t={t} />
                )}

                <MasterProductsSection username={username} />

                <div className="mx-auto max-w-2xl px-4 space-y-10 mt-16">
                    <ReviewsSection
                        reviews={portfolio.reviews}
                        averageRating={portfolio.averageRating}
                        reviewsCount={portfolio.reviewsCount}
                    />
                    <ReviewForm masterId={portfolio.userId} />
                    <p className="text-center text-xs text-muted-foreground pb-4">
                        {t('ui.text_r4tl4y')}{' '}
                        <a href="/" className="font-medium text-primary hover:underline">Glow.GE</a>
                    </p>
                </div>
            </main>

            {/* Sticky booking bar */}
            {hasContacts && !isOwnProfile && (
                <div className="fixed bottom-0 inset-x-0 z-50 p-4 flex justify-center">
                    <motion.button
                        type="button"
                        onClick={() => setBookingOpen(true)}
                        className="flex items-center gap-3 bg-primary text-primary-foreground px-10 py-4 rounded-2xl shadow-xl shadow-primary/25 text-sm font-semibold tracking-wide cursor-pointer active:scale-95 transition-transform"
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6, type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <CalendarBlank size={18} weight="fill" />
                        ჩაწერა / დაკავშირება
                    </motion.button>
                </div>
            )}

            <BookingModal
                open={bookingOpen}
                onClose={() => setBookingOpen(false)}
                portfolio={portfolio}
            />

            <ImageLightbox
                images={lightboxImages}
                initialIndex={lightboxIndex}
                open={lightboxIndex >= 0}
                onClose={handleCloseLightbox}
                editable={isOwnProfile}
            />
        </>
    );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

interface HeroSectionProps {
    portfolio: PublicPortfolioData;
    language: string;
}

function HeroSection({ portfolio, language }: HeroSectionProps): React.ReactElement {
    const heroImage = portfolio.items[0]?.imageUrl ?? null;
    const tierLabel = TIER_LABELS[portfolio.masterTier ?? ''] ?? null;

    return (
        <section className="flex flex-col md:flex-row min-h-[60dvh] md:min-h-[75dvh]">
            {/* Portrait */}
            <div className="relative w-full md:w-1/2 aspect-[3/4] md:aspect-auto overflow-hidden bg-muted">
                {heroImage ? (
                    <Image
                        src={getThumbUrl(heroImage, 800)}
                        alt={portfolio.displayName}
                        fill
                        className="object-cover object-center grayscale hover:grayscale-0 transition-all duration-700"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                        unoptimized
                    />
                ) : portfolio.avatar ? (
                    <Image
                        src={getThumbUrl(portfolio.avatar, 800)}
                        alt={portfolio.displayName}
                        fill
                        className="object-cover object-center grayscale hover:grayscale-0 transition-all duration-700"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                        unoptimized
                    />
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <span className="text-8xl font-bold text-muted-foreground/10">
                            {portfolio.displayName.charAt(0)}
                        </span>
                    </div>
                )}
                {/* gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 pointer-events-none" />

                {/* Tier badge overlay */}
                {tierLabel && (
                    <div className="absolute bottom-6 left-6">
                        <span className="bg-primary text-primary-foreground text-[10px] font-bold tracking-[0.18em] px-3 py-1.5 uppercase">
                            {tierLabel}
                        </span>
                    </div>
                )}
            </div>

            {/* Typography side */}
            <motion.div
                className="w-full md:w-1/2 flex flex-col justify-center px-8 py-12 md:px-16 md:py-20 bg-background"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                <div className="max-w-sm">
                    {/* Name */}
                    <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-[0.9] tracking-tight mb-3">
                        {portfolio.displayName.split(' ').map((word, i) => (
                            <span key={i} className="block">{word}</span>
                        ))}
                    </h1>

                    {/* Niche */}
                    {portfolio.niche && (
                        <p className="text-primary text-[11px] uppercase tracking-[0.2em] font-semibold mb-6">
                            {portfolio.niche}
                        </p>
                    )}

                    {/* Badges */}
                    <div className="mb-8 flex flex-wrap gap-4">
                        <MasterBadgesRow masterTier={portfolio.masterTier} isVerified={portfolio.isVerified} badges={portfolio.badges} size="md" />
                        {portfolio.experienceYears && portfolio.experienceYears > 0 && (
                            <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                                <Clock size={13} />
                                {portfolio.experienceYears} წელი
                            </span>
                        )}
                        {portfolio.city && (
                            <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                                <MapPin size={13} />
                                {getCityLabel(portfolio.city, language)}
                            </span>
                        )}
                        {portfolio.reviewsCount > 0 && (
                            <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                                <Star size={13} weight="fill" className="text-warning" />
                                {portfolio.averageRating.toFixed(1)} ({portfolio.reviewsCount})
                            </span>
                        )}
                    </div>

                    {/* Bio */}
                    {portfolio.bio && (
                        <p className="text-foreground/60 text-sm leading-relaxed text-justify">
                            {portfolio.bio}
                        </p>
                    )}
                </div>
            </motion.div>
        </section>
    );
}

// ─── Portfolio Grid ───────────────────────────────────────────────────────────

interface PortfolioGridProps {
    items: PublicPortfolioData['items'];
    displayName: string;
    onOpenLightbox: (index: number) => void;
}

function PortfolioGrid({ items, displayName, onOpenLightbox }: PortfolioGridProps): React.ReactElement {
    const large = items[0];
    const rest = items.slice(1, 5);

    return (
        <section className="mt-20 px-4 sm:px-6 max-w-screen-xl mx-auto">
            <div className="flex items-end justify-between gap-6 mb-10 pb-6 border-b border-border/20">
                <h2 className="text-3xl font-bold tracking-tight uppercase italic text-foreground">Portfolio</h2>
                <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    {displayName} · {items.length} ნამუშევარი
                </span>
            </div>

            {/* Editorial grid */}
            <div className="grid grid-cols-12 grid-rows-2 gap-1 sm:gap-2 h-[70dvh] sm:h-[80dvh] max-h-[800px]">
                {/* Large hero cell */}
                <button
                    type="button"
                    onClick={() => onOpenLightbox(0)}
                    className="col-span-12 sm:col-span-8 row-span-2 relative overflow-hidden bg-muted cursor-zoom-in group"
                >
                    <Image
                        src={getThumbUrl(large.imageUrl, 1200)}
                        alt={large.title ?? displayName}
                        fill
                        className="object-cover grayscale contrast-110 hover:grayscale-0 transition-all duration-700"
                        sizes="(max-width: 640px) 100vw, 66vw"
                        unoptimized
                    />
                    {large.title && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-4 pt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-xs font-medium text-white uppercase tracking-wider">{large.title}</span>
                        </div>
                    )}
                </button>

                {/* Side cells — top */}
                {rest[0] && (
                    <button
                        type="button"
                        onClick={() => onOpenLightbox(1)}
                        className="col-span-6 sm:col-span-4 row-span-1 relative overflow-hidden bg-muted cursor-zoom-in group"
                    >
                        <Image
                            src={getThumbUrl(rest[0].imageUrl, 600)}
                            alt={rest[0].title ?? ''}
                            fill
                            className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
                            sizes="(max-width: 640px) 50vw, 34vw"
                            unoptimized
                        />
                    </button>
                )}

                {/* Side cells — bottom row, split into 2 */}
                <div className="col-span-6 sm:col-span-2 row-span-1 relative overflow-hidden bg-muted group">
                    {rest[1] && (
                        <button type="button" onClick={() => onOpenLightbox(2)} className="w-full h-full cursor-zoom-in">
                            <Image
                                src={getThumbUrl(rest[1].imageUrl, 400)}
                                alt={rest[1].title ?? ''}
                                fill
                                className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
                                sizes="25vw"
                                unoptimized
                            />
                        </button>
                    )}
                </div>
                <div className="col-span-6 sm:col-span-2 row-span-1 relative overflow-hidden bg-muted group">
                    {rest[2] ? (
                        <button type="button" onClick={() => onOpenLightbox(3)} className="w-full h-full cursor-zoom-in">
                            <Image
                                src={getThumbUrl(rest[2].imageUrl, 400)}
                                alt={rest[2].title ?? ''}
                                fill
                                className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
                                sizes="25vw"
                                unoptimized
                            />
                            {items.length > 4 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">+{items.length - 4}</span>
                                </div>
                            )}
                        </button>
                    ) : null}
                </div>
            </div>
        </section>
    );
}

// ─── Services Section ─────────────────────────────────────────────────────────

interface ServicesSectionProps {
    services: PublicPortfolioData['services'];
    t: (key: string) => string;
}

function ServicesSection({ services, t }: ServicesSectionProps): React.ReactElement {
    return (
        <section className="mt-24 px-4 sm:px-6 max-w-2xl mx-auto">
            <h2 className="font-bold text-3xl mb-12 text-center italic tracking-tight text-foreground">
                {t('ui.text_280we2')}
            </h2>
            <div className="divide-y divide-border/40 border-t border-b border-border/40">
                {services.map((service) => (
                    <div
                        key={service.name}
                        className="group py-6 flex items-center justify-between hover:px-4 transition-all duration-300"
                    >
                        <div>
                            <h3 className="text-base font-semibold text-foreground">{service.name}</h3>
                            {service.priceType === 'hourly' && (
                                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">
                                    პერ საათი
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-6">
                            <span className="text-xl font-bold text-primary tabular-nums">
                                {service.startingFrom && (
                                    <span className="text-xs font-normal text-muted-foreground mr-1">
                                        {t('ui.text_svc_starting_from')}
                                    </span>
                                )}
                                {service.price} ₾
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Booking Modal ────────────────────────────────────────────────────────────

interface BookingModalProps {
    open: boolean;
    onClose: () => void;
    portfolio: PublicPortfolioData;
}

function BookingModal({ open, onClose, portfolio }: BookingModalProps): React.ReactElement {
    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Slide-up panel */}
                    <motion.div
                        className="fixed bottom-0 inset-x-0 z-[80] bg-background rounded-t-3xl px-6 pt-3 pb-10 max-w-lg mx-auto"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                    >
                        {/* Drag handle */}
                        <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-8" />

                        <h3 className="text-2xl font-bold text-center text-foreground mb-1 italic tracking-tight">
                            დაკავშირება
                        </h3>
                        <p className="text-center text-muted-foreground text-xs uppercase tracking-widest mb-8">
                            {portfolio.displayName}
                        </p>

                        <div className="space-y-2">
                            {portfolio.whatsapp && (
                                <ContactRow
                                    href={`https://wa.me/${portfolio.whatsapp.replace(/\D/g, '')}`}
                                    icon={<ChatCircle size={18} weight="fill" />}
                                    label="WhatsApp"
                                    hoverClass="hover:bg-[#25D366] hover:text-white hover:border-[#25D366]"
                                />
                            )}
                            {portfolio.telegram && (
                                <ContactRow
                                    href={`https://t.me/${portfolio.telegram.replace('@', '')}`}
                                    icon={<PaperPlaneTilt size={18} weight="fill" />}
                                    label="Telegram"
                                    hoverClass="hover:bg-[#2AABEE] hover:text-white hover:border-[#2AABEE]"
                                />
                            )}
                            {portfolio.instagram && (
                                <ContactRow
                                    href={`https://instagram.com/${portfolio.instagram.replace('@', '')}`}
                                    icon={<InstagramLogo size={18} weight="fill" />}
                                    label={`Instagram · ${portfolio.instagram}`}
                                    hoverClass="hover:bg-gradient-to-br hover:from-[#F58529] hover:to-[#DD2A7B] hover:text-white hover:border-transparent"
                                />
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-8 w-full py-3 text-center text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                            <X size={14} />
                            გაუქმება
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

interface ContactRowProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    hoverClass: string;
}

function ContactRow({ href, icon, label, hoverClass }: ContactRowProps): React.ReactElement {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                'flex items-center justify-between px-5 py-4 bg-muted/50 border border-border/50 rounded-xl text-sm font-medium text-foreground transition-all duration-200',
                hoverClass,
            )}
        >
            <span>{label}</span>
            {icon}
        </a>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PortfolioSkeleton(): React.ReactElement {
    return (
        <div className="pt-14">
            <div className="flex flex-col md:flex-row min-h-[75dvh]">
                <Skeleton className="w-full md:w-1/2 aspect-[3/4] md:aspect-auto" />
                <div className="w-full md:w-1/2 p-12 md:p-20 space-y-6 flex flex-col justify-center">
                    <Skeleton className="h-16 w-48" />
                    <Skeleton className="h-16 w-36" />
                    <Skeleton className="h-3 w-28" />
                    <div className="flex gap-3 pt-2">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        </div>
    );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_LABELS: Record<string, string> = {
    TOP_MASTER: 'TOP MASTER',
    PROFESSIONAL: 'PROFESSIONAL',
    INTERMEDIATE: 'INTERMEDIATE',
};
