'use client';

import { useState, useEffect } from 'react';
import { useCreditsBalance, useCreditHistory, usePurchasePackage } from '@/features/credits/hooks/useCredits';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Coins, ArrowDown, ArrowUp, Check, Star, Lightning, Crown, Sparkle, X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

// ── Quality tier types & metadata ─────────────────────────────────────────────
type Quality = 'low' | 'mid' | 'pro';

const QUALITY_META: Record<Quality, {
    label: string;
    sublabel: string;
    icon: React.ElementType;
    color: string;
    activeClass: string;
    techName: string;
    pricePerPhoto: string;        // per credit/photo at M size reference
    quizDescription: string;
    quizBadge: string;
    quizBadgeClass: string;
}> = {
    low: {
        label: 'ეკონომი',
        sublabel: 'სტანდარტული AI',
        icon: Star,
        color: 'text-muted-foreground',
        activeClass: 'bg-muted text-foreground border-border',
        techName: 'gpt-image-1.5 Low',
        pricePerPhoto: '0.13 ₾',
        quizDescription: 'კარგია სოციალური ქსელებისთვის, სწრაფი Preview-ებისთვის და დიდი რაოდენობის ფოტოებისთვის. ნაკლები დეტალი, მეტი სიჩქარე.',
        quizBadge: 'იაფი',
        quizBadgeClass: 'bg-muted text-muted-foreground',
    },
    mid: {
        label: 'სტანდარტი',
        sublabel: 'მაღალი AI ხარისხი',
        icon: Lightning,
        color: 'text-primary',
        activeClass: 'bg-primary/10 text-primary border-primary/40',
        techName: 'gpt-image-1.5 Medium',
        pricePerPhoto: '0.50 ₾',
        quizDescription: 'ბალანსი ხარისხსა და ფასს შორის. შესაფერისია პორტფოლიოსთვის, Instagram-ისთვის და კლიენტებზე გაგზავნისთვის.',
        quizBadge: 'პოპულარული',
        quizBadgeClass: 'bg-primary/10 text-primary',
    },
    pro: {
        label: 'პრო',
        sublabel: 'ულტრა-მაღალი AI',
        icon: Crown,
        color: 'text-warning',
        activeClass: 'bg-warning/10 text-warning border-warning/40',
        techName: 'gpt-image-1.5 High',
        pricePerPhoto: '2.00 ₾',
        quizDescription: 'მაქსიმალური სიმკვეთრე და დეტალი. საუკეთესოა კომერციული კლიენტებისთვის, print-ისთვის და პრემიუმ პრეზენტაციებისთვის.',
        quizBadge: 'საუკეთესო',
        quizBadgeClass: 'bg-warning/10 text-warning',
    },
};

// ── Subscription plan prices by quality ──────────────────────────────────────
const PLAN_PRICES = {
    pro:   { low: 9,   mid: 27,  pro: 109 },
    ultra: { low: 19,  mid: 49,  pro: 129 },
} as const;

// ── Package prices (tetri = 1/100 GEL) per size × quality ────────────────────
const PACKAGE_PRICES: Record<string, Record<Quality, number>> = {
    s: { low: 150,  mid: 550,  pro: 2190  },  // 10 credits
    m: { low: 390,  mid: 1490, pro: 5990  },  // 30 credits
    l: { low: 790,  mid: 2990, pro: 12900 },  // 70 credits
};
const PACKAGE_CREDITS: Record<string, number> = { s: 10, m: 30, l: 70 };
const PACKAGE_LABEL: Record<string, string>   = { s: 'S · მცირე', m: 'M · საშუალო', l: 'L · დიდი' };

function formatPrice(tetri: number): string {
    return `${(tetri / 100).toFixed(2)} ₾`;
}

// ── Quality Onboarding Overlay ────────────────────────────────────────────────
// Fullscreen darkened backdrop with centered quiz card.
// Blocks interaction with the page beneath until dismissed or answered.
function QualityOnboarding({
    onSelect,
    onSkip,
}: {
    onSelect: (q: Quality) => void;
    onSkip: () => void;
}): React.ReactElement {
    // Close on Escape
    useEffect(() => {
        function handleKey(e: KeyboardEvent): void {
            if (e.key === 'Escape') onSkip();
        }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onSkip]);

    return (
        /* Backdrop — scrollable on mobile, centered on desktop */
        <div
            className="fixed inset-0 z-50 overflow-y-auto bg-background/80 backdrop-blur-sm"
            aria-modal="true"
            role="dialog"
            aria-label="AI ხარისხის არჩევა"
        >
            <div className="flex min-h-full items-center justify-center px-3 py-4 sm:px-4 sm:py-10">
            {/* Modal card */}
            <div className="relative w-full max-w-xl animate-price-pop rounded-2xl border border-border/60 bg-card shadow-2xl">

                {/* Skip button */}
                <button
                    type="button"
                    onClick={onSkip}
                    aria-label="გამოტოვება"
                    className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    <X size={15} />
                </button>

                {/* Header */}
                <div className="px-4 pt-4 pb-3 text-center sm:px-6 sm:pt-7 sm:pb-5">
                    <p className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50 sm:block">
                        Glow.GE · AI ფოტო
                    </p>
                    <h2 className="text-lg font-extrabold leading-tight text-foreground sm:mt-3 sm:text-2xl">
                        რა ხარისხის{' '}
                        <span className="text-primary">AI ფოტო</span>{' '}
                        გჭირდება?
                    </h2>
                    <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground sm:mt-1.5 sm:text-sm">
                        ხარისხი პირდაპირ განსაზღვრავს ფასს.
                    </p>
                </div>

                {/* Divider with label */}
                <div className="flex items-center gap-3 px-4 pb-2 sm:px-6 sm:pb-3">
                    <div className="flex-1 h-px bg-border/50" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
                        აირჩიე ვარიანტი
                    </span>
                    <div className="flex-1 h-px bg-border/50" />
                </div>

                {/* Options */}
                <div className="flex flex-col gap-2 p-3 pt-1 sm:grid sm:grid-cols-3 sm:gap-3 sm:p-5 sm:pt-2">
                    {(['low', 'mid', 'pro'] as Quality[]).map((q) => {
                        const m = QUALITY_META[q];
                        const QIcon = m.icon;
                        const qualityLevel = q === 'low' ? 'დაბალი ხარისხი' : q === 'mid' ? 'საშუალო ხარისხი' : 'მაღალი ხარისხი';
                        const barCount = q === 'low' ? 1 : q === 'mid' ? 2 : 3;
                        return (
                            <button
                                key={q}
                                type="button"
                                onClick={() => onSelect(q)}
                                className={cn(
                                    'group relative flex cursor-pointer rounded-xl border text-left transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/50',
                                    'flex-row items-center gap-3 p-3 sm:flex-col sm:rounded-2xl sm:p-5',
                                    q === 'pro'
                                        ? 'border-warning/40 bg-warning/5 hover:border-warning/70 hover:shadow-md hover:shadow-warning/10'
                                        : q === 'mid'
                                            ? 'border-primary/30 bg-primary/5 hover:border-primary/60 hover:shadow-md hover:shadow-primary/10'
                                            : 'border-border/60 bg-muted/20 hover:border-border hover:shadow-md',
                                )}
                            >
                                {/* Icon */}
                                <span className={cn(
                                    'flex shrink-0 items-center justify-center rounded-xl h-10 w-10 sm:h-9 sm:w-9',
                                    q === 'pro' ? 'bg-warning/15' : q === 'mid' ? 'bg-primary/15' : 'bg-muted',
                                )}>
                                    <QIcon size={18} weight="fill" className={m.color} />
                                </span>

                                {/* Mobile layout */}
                                <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:hidden">
                                    {/* Quality level — primary accent */}
                                    <div className="flex items-center gap-1.5">
                                        {/* Quality bars */}
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3].map((i) => (
                                                <span
                                                    key={i}
                                                    className={cn(
                                                        'h-2.5 w-1 rounded-full',
                                                        i <= barCount
                                                            ? q === 'pro' ? 'bg-warning' : q === 'mid' ? 'bg-primary' : 'bg-muted-foreground'
                                                            : 'bg-border',
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <p className={cn('text-[11px] font-bold leading-none', m.color)}>{qualityLevel}</p>
                                    </div>
                                    <p className="text-sm font-extrabold text-foreground leading-none">{m.label}</p>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug line-clamp-2">{m.quizDescription}</p>
                                </div>

                                {/* Mobile: right side */}
                                <div className="flex shrink-0 flex-col items-end gap-1.5 sm:hidden">
                                    <p className="text-base font-extrabold tabular-nums text-foreground leading-none">{m.pricePerPhoto}</p>
                                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50">/ ფოტო</p>
                                    <div className={cn(
                                        'flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold',
                                        q === 'pro'
                                            ? 'bg-warning/15 text-warning group-hover:bg-warning/25'
                                            : q === 'mid'
                                                ? 'bg-primary/15 text-primary group-hover:bg-primary/25'
                                                : 'bg-muted text-muted-foreground group-hover:bg-muted/80',
                                    )}>
                                        <QIcon size={10} weight="fill" />
                                        არჩევა
                                    </div>
                                </div>

                                {/* Desktop layout */}
                                <div className="hidden sm:flex sm:w-full sm:flex-col">
                                    {/* Quality level + bars */}
                                    <div className="mb-2 flex items-center gap-2">
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3].map((i) => (
                                                <span
                                                    key={i}
                                                    className={cn(
                                                        'h-3 w-1.5 rounded-full',
                                                        i <= barCount
                                                            ? q === 'pro' ? 'bg-warning' : q === 'mid' ? 'bg-primary' : 'bg-muted-foreground'
                                                            : 'bg-border',
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <p className={cn('text-xs font-bold leading-none', m.color)}>{qualityLevel}</p>
                                    </div>
                                    <p className="mb-3 text-base font-extrabold text-foreground leading-none">{m.label}</p>
                                    <p className="mb-1 text-2xl font-extrabold tabular-nums text-foreground leading-none">{m.pricePerPhoto}</p>
                                    <p className="mb-3 text-[9px] uppercase tracking-wider text-muted-foreground/50">/ ფოტო</p>
                                    <p className="mb-4 flex-1 text-xs leading-relaxed text-muted-foreground">{m.quizDescription}</p>
                                    <div className={cn(
                                        'flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all duration-150',
                                        q === 'pro'
                                            ? 'bg-warning/15 text-warning group-hover:bg-warning/25'
                                            : q === 'mid'
                                                ? 'bg-primary/15 text-primary group-hover:bg-primary/25'
                                                : 'bg-muted text-muted-foreground group-hover:text-foreground group-hover:bg-muted/80',
                                    )}>
                                        <QIcon size={12} weight="fill" />
                                        არჩევა
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border/50 px-4 py-2.5 sm:px-6 sm:py-3">
                    <p className="text-[10px] text-muted-foreground">
                        შემდეგ ნებისმიერ დროს შეგიძლია ხარისხის შეცვლა
                    </p>
                    <button
                        type="button"
                        onClick={onSkip}
                        className="cursor-pointer text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                        გამოტოვება
                    </button>
                </div>
            </div>
            </div>
        </div>
    );
}

// ── Quality switcher pill row (reusable) ──────────────────────────────────────
function QualitySwitcher({
    quality,
    onChange,
}: {
    quality: Quality;
    onChange: (q: Quality) => void;
}): React.ReactElement {
    return (
        <div className="flex gap-1">
            {(['low', 'mid', 'pro'] as Quality[]).map((q) => {
                const qMeta = QUALITY_META[q];
                const QIcon = qMeta.icon;
                const isActive = quality === q;
                return (
                    <button
                        key={q}
                        type="button"
                        onClick={() => onChange(q)}
                        title={qMeta.techName}
                        className={cn(
                            'flex flex-1 items-center justify-center gap-1 rounded-lg border py-1.5 text-[11px] font-medium transition-all duration-150 cursor-pointer',
                            isActive
                                ? qMeta.activeClass
                                : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border',
                        )}
                    >
                        <QIcon size={11} weight={isActive ? 'fill' : 'regular'} />
                        {qMeta.label}
                    </button>
                );
            })}
        </div>
    );
}

// ── Plan card ─────────────────────────────────────────────────────────────────
function PlanCard({ plan, quality, onQualityChange }: {
    plan: {
        id: string;
        name: string;
        icon: React.ElementType;
        credits: number;
        currency: string;
        period: string;
        description: string;
        color: string;
        badgeClass: string;
        features: readonly string[];
        limits: readonly string[];
        ctaVariant: 'default' | 'outline';
        disabled: boolean;
        highlight: boolean;
    };
    quality: Quality;
    onQualityChange: (q: Quality) => void;
}): React.ReactElement {
    const [animKey, setAnimKey] = useState(0);
    const Icon = plan.icon;

    const hasPricing = plan.id === 'pro' || plan.id === 'ultra';
    const prices = hasPricing ? PLAN_PRICES[plan.id as 'pro' | 'ultra'] : null;
    const currentPrice = prices ? prices[quality] : 0;

    const qualityLabel = QUALITY_META[quality].label;
    const qualityFeature = plan.id === 'pro'
        ? `50 კრ. / თვეში · ${qualityLabel} ხარისხი`
        : plan.id === 'ultra'
            ? `ულიმიტო კრ. / თვეში · ${qualityLabel} ხარისხი`
            : null;

    function handleChange(q: Quality): void {
        setAnimKey((k) => k + 1);
        onQualityChange(q);
    }

    return (
        <div className={cn(
            'relative flex flex-col rounded-2xl border bg-card p-5 transition-all duration-300',
            plan.highlight ? 'border-primary/40 shadow-md shadow-primary/5' : 'border-border/50',
        )}>
            {plan.highlight && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] leading-4 font-semibold text-primary-foreground shadow-sm">
                        ყველაზე პოპულარული
                    </span>
                </div>
            )}

            <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-foreground">{plan.name}</span>
                <span className={cn('inline-flex items-center justify-center rounded-full p-1.5', plan.badgeClass)}>
                    <Icon size={14} weight="fill" />
                </span>
            </div>

            <div className="mt-3">
                <div className="flex items-baseline gap-1">
                    <span
                        key={animKey}
                        className="text-2xl font-bold tabular-nums text-foreground animate-price-pop"
                    >
                        {currentPrice === 0 ? 'უფასო' : `${currentPrice}`}
                    </span>
                    {currentPrice > 0 && (
                        <span className="text-sm text-muted-foreground">{plan.currency}/{plan.period}</span>
                    )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{plan.description}</p>
                {qualityFeature && (
                    <p className={cn('mt-1 text-sm font-medium', plan.color)}>{qualityFeature}</p>
                )}
                {!hasPricing && (
                    <p className={cn('mt-1 text-sm font-medium', plan.color)}>
                        {plan.credits} კრედიტი / თვეში
                    </p>
                )}
            </div>

            {hasPricing && (
                <div className="mt-3 space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                        ხარისხი
                    </span>
                    <QualitySwitcher quality={quality} onChange={handleChange} />
                </div>
            )}

            <div className="my-4 h-px bg-border/50" />

            <ul className="flex-1 space-y-2">
                {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                        <Check size={13} weight="bold" className="mt-0.5 shrink-0 text-success" />
                        {f}
                    </li>
                ))}
                {plan.limits.map((l) => (
                    <li key={l} className="flex items-start gap-2 text-xs text-muted-foreground line-through decoration-muted-foreground/40">
                        <span className="mt-0.5 flex h-3 w-3 shrink-0 items-center justify-center">–</span>
                        {l}
                    </li>
                ))}
            </ul>

            <Button
                variant={plan.ctaVariant}
                size="sm"
                disabled={plan.disabled}
                className={cn('mt-5 w-full', plan.highlight && 'shadow-sm')}
            >
                {plan.disabled
                    ? 'მიმდინარე გეგმა'
                    : `${plan.name} შეძენა — ${currentPrice} ₾/თვეში`
                }
            </Button>
        </div>
    );
}

const PLANS = [
    {
        id: 'free',
        name: 'Free',
        icon: Sparkle,
        credits: 3,
        currency: 'GEL',
        period: 'თვე',
        description: 'დასაწყისისთვის',
        color: 'text-muted-foreground',
        badgeClass: 'bg-muted text-muted-foreground',
        features: [
            '3 ფოტოს დამუშავება / თვეში',
            'ბაზისური პორტფოლიო (12 ფოტომდე)',
            'Glow.GE წყლის ნიშანი ექსპორტზე',
            'Showcase ბმული კლიენტებისთვის',
        ],
        limits: ['საკუთარი ბრენდინგი არ არის', 'AI წარწერები არ არის', 'Batch ატვირთვა არ არის'],
        ctaVariant: 'outline' as const,
        disabled: true,
        highlight: false,
    },
    {
        id: 'pro',
        name: 'Pro',
        icon: Lightning,
        credits: 50,
        currency: 'GEL',
        period: 'თვე',
        description: 'აქტიური ოსტატებისთვის',
        color: 'text-primary',
        badgeClass: 'bg-primary/10 text-primary',
        features: [
            'ულიმიტო პორტფოლიო',
            'საკუთარი ბრენდინგი და წყლის ნიშანი',
            'AI წარწერები + ჰეშთეგების გენერაცია',
            'Showcase ბმული კლიენტებისთვის',
        ],
        limits: ['Batch ატვირთვა არ არის'],
        ctaVariant: 'default' as const,
        disabled: false,
        highlight: true,
    },
    {
        id: 'ultra',
        name: 'Ultra',
        icon: Crown,
        credits: -1,
        currency: 'GEL',
        period: 'თვე',
        description: 'სტუდიებისა და დატვირთული ოსტატებისთვის',
        color: 'text-warning',
        badgeClass: 'bg-warning/10 text-warning',
        features: [
            'ულიმიტო პორტფოლიო',
            'საკუთარი ბრენდინგი · წყლის ნიშნის გარეშე',
            'AI წარწერები + ჰეშთეგების გენერაცია',
            'Batch ატვირთვა (20 ფოტომდე ერთდროულად)',
            'პრიორიტეტული დამუშავების რიგი',
            'ახალ ფუნქციებზე ადრეული წვდომა',
        ],
        limits: [],
        ctaVariant: 'outline' as const,
        disabled: false,
        highlight: false,
    },
] as const;

// ── Package card ──────────────────────────────────────────────────────────────
function PackageCard({ size, isPopular, quality, onQualityChange, onBuy, isPending }: {
    size: 'S' | 'M' | 'L';
    isPopular?: boolean;
    quality: Quality;
    onQualityChange: (q: Quality) => void;
    onBuy: (packageId: string) => void;
    isPending: boolean;
}): React.ReactElement {
    const key = size.toLowerCase() as 's' | 'm' | 'l';
    const [animKey, setAnimKey] = useState(0);
    const credits = PACKAGE_CREDITS[key];
    const price = PACKAGE_PRICES[key][quality];
    const meta = QUALITY_META[quality];
    const Icon = meta.icon;
    const packageId = `${quality}-${key}`;

    function handleChange(q: Quality): void {
        setAnimKey((k) => k + 1);
        onQualityChange(q);
    }

    return (
        <div className={cn(
            'relative flex flex-col rounded-2xl border bg-card p-5 transition-all duration-300 hover:shadow-md',
            quality === 'pro'
                ? 'border-warning/30 shadow-md shadow-warning/5'
                : quality === 'mid'
                    ? 'border-primary/20'
                    : 'border-border/50',
        )}>
            {isPopular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className={cn(
                        'rounded-full px-2.5 py-0.5 text-[10px] leading-4 font-semibold shadow-sm',
                        quality === 'pro'
                            ? 'bg-warning text-black'
                            : quality === 'mid'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-foreground text-background',
                    )}>
                        ყველაზე პოპულარული
                    </span>
                </div>
            )}

            <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {PACKAGE_LABEL[key]}
                </span>
                <span className={cn('text-xs font-semibold', meta.color)}>
                    {credits} კრ.
                </span>
            </div>

            <div className="mb-4">
                <div className="flex items-baseline gap-1">
                    <span
                        key={animKey}
                        className="text-3xl font-bold tabular-nums text-foreground animate-price-pop"
                    >
                        {formatPrice(price)}
                    </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    {credits} ფოტო · {credits * 2} ვარიანტი
                </p>
                <p className="text-[11px] text-muted-foreground/60">
                    {formatPrice(Math.round(price / credits))} / ფოტო
                </p>
            </div>

            <div className="mb-4 flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    ხარისხი
                </span>
                <QualitySwitcher quality={quality} onChange={handleChange} />
                <p className={cn('text-[10px]', meta.color)}>
                    <Icon size={10} weight="fill" className="mr-0.5 inline" />
                    {meta.techName}
                </p>
            </div>

            <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => onBuy(packageId)}
                className={cn(
                    'w-full cursor-pointer transition-colors duration-150',
                    quality === 'pro' && 'border-warning/40 text-warning hover:bg-warning/10',
                    quality === 'mid' && 'border-primary/40 text-primary hover:bg-primary/10',
                )}
            >
                {isPending ? 'მუშავდება...' : `შეძენა — ${formatPrice(price)}`}
            </Button>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CreditsPage(): React.ReactElement {
    const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useCreditsBalance();
    const { data: history, isLoading: historyLoading, refetch: refetchHistory } = useCreditHistory(1, 20);
    const { mutate: purchasePackage, isPending: isPurchasing } = usePurchasePackage(() => {
        refetchBalance();
        refetchHistory();
    });

    // Global quality state — shared across all cards
    const [quality, setQuality] = useState<Quality>('pro');
    const [showQuiz, setShowQuiz] = useState(true);

    function handleQuizSelect(q: Quality): void {
        setQuality(q);
        setShowQuiz(false);
    }

    return (
        <>
            {/* Fullscreen onboarding overlay — rendered outside page flow */}
            {showQuiz && (
                <QualityOnboarding
                    onSelect={handleQuizSelect}
                    onSkip={() => setShowQuiz(false)}
                />
            )}

        <div className="container mx-auto space-y-10 px-4 py-10">

            {/* Balance */}
            <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-card px-6 py-5 shadow-sm">
                <div>
                    <p className="text-sm text-muted-foreground">თქვენი ბალანსი</p>
                    {balanceLoading ? (
                        <Skeleton className="mt-2 h-9 w-28" />
                    ) : (
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-3xl font-bold tabular-nums text-foreground">
                                {balance?.credits ?? 0}
                            </span>
                            <span className="text-sm text-muted-foreground">კრედიტი დარჩა</span>
                        </div>
                    )}
                </div>
                <Coins size={36} weight="fill" className="text-primary/40" />
            </div>

            {/* Onboarding re-launch button */}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => setShowQuiz(true)}
                    className="cursor-pointer text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                    ხარისხის შერჩევის გავლა →
                </button>
            </div>

            {/* Subscription Plans */}
            <section className="space-y-5">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">გამოწერის გეგმები</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        ყოველთვიური გამოწერა — კრედიტები ყოველ თვე განახლდება. გამოუყენებელი კრედიტები არ გადადის.
                    </p>
                </div>
                <div className="grid gap-4 pt-3 sm:grid-cols-3">
                    {PLANS.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            quality={quality}
                            onQualityChange={setQuality}
                        />
                    ))}
                </div>
            </section>

            {/* One-time Credit Packages */}
            <section className="space-y-5">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">კრედიტების ცალკე შეძენა</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        ერთჯერადი შეძენა · 1 კრედიტი = 1 ფოტო + 2 AI ვარიანტი · კრედიტები არ ვადასდება
                    </p>
                </div>
                <div className="grid gap-4 pt-3 sm:grid-cols-3">
                    <PackageCard size="S" quality={quality} onQualityChange={setQuality} onBuy={purchasePackage} isPending={isPurchasing} />
                    <PackageCard size="M" isPopular quality={quality} onQualityChange={setQuality} onBuy={purchasePackage} isPending={isPurchasing} />
                    <PackageCard size="L" quality={quality} onQualityChange={setQuality} onBuy={purchasePackage} isPending={isPurchasing} />
                </div>
            </section>

            {/* Transaction history */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">ტრანზაქციების ისტორია</h2>
                {historyLoading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-14 rounded-xl" />
                        ))}
                    </div>
                ) : !history?.items.length ? (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center">
                        <Coins size={28} className="text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">ტრანზაქციები ჯერ არ არის</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/50 bg-card">
                        {history.items.map((tx) => (
                            <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5">
                                <div className={cn(
                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                    tx.delta > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                                )}>
                                    {tx.delta > 0 ? <ArrowDown size={14} weight="bold" /> : <ArrowUp size={14} weight="bold" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-sm text-foreground">{tx.reason}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Intl.DateTimeFormat('ka-GE', {
                                            year: 'numeric', month: 'short', day: 'numeric',
                                            hour: '2-digit', minute: '2-digit',
                                        }).format(new Date(tx.createdAt))}
                                    </p>
                                </div>
                                <span className={cn('shrink-0 font-semibold tabular-nums text-sm', tx.delta > 0 ? 'text-success' : 'text-destructive')}>
                                    {tx.delta > 0 ? '+' : ''}{tx.delta}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
        </>
    );
}
