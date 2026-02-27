'use client';

import Link from 'next/link';
import { Lightning, Sparkle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/hooks/useLanguage';

interface GenerateBarProps {
    onGenerate: () => void;
    isLoading: boolean;
    disabled: boolean;
    isAuthenticated: boolean;
    variant: 'inline' | 'sticky';
}

export function GenerateBar({
    onGenerate,
    isLoading,
    disabled,
    isAuthenticated,
    variant,
}: GenerateBarProps): React.ReactElement {
    const { t } = useLanguage();

    const buttonLabel = isLoading
        ? t('upload.generating_btn')
        : t('upload.generate_btn');

    const button = (
        <button
            type="button"
            onClick={onGenerate}
            disabled={disabled || isLoading}
            className={cn(
                'group relative flex w-full items-center justify-center gap-2.5 rounded-2xl px-5 py-3.5',
                'text-base font-extrabold tracking-wide',
                'transition-all duration-300 ease-out',
                'active:scale-[0.97]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B490F5]/60 focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-35',
                variant === 'sticky' && 'min-h-[52px]',
                'bg-transparent',
            )}
            style={{
                background: disabled
                    ? undefined
                    : 'linear-gradient(var(--background), var(--background)) padding-box, linear-gradient(135deg, #A47CF3 0%, #D7A4CC 40%, #F0C060 100%) border-box',
                border: disabled ? '2.5px solid oklch(0.85 0 0)' : '2.5px solid transparent',
                boxShadow: disabled
                    ? 'none'
                    : '0 0 20px rgba(164, 124, 243, 0.2), 0 0 40px rgba(215, 164, 204, 0.1), inset 0 0 20px rgba(164, 124, 243, 0.03)',
            }}
        >
            {/* Shimmer sweep on hover */}
            <span
                aria-hidden
                className={cn(
                    'pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] rounded-2xl',
                    'transition-transform duration-700 ease-out',
                    !disabled && 'group-hover:translate-x-full',
                )}
                style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(164,124,243,0.06) 40%, rgba(240,192,96,0.08) 60%, transparent 100%)',
                }}
            />

            {/* Icon */}
            <span
                className={cn(
                    'relative z-10 flex items-center justify-center',
                    isLoading && 'animate-spin',
                )}
                style={disabled ? undefined : {
                    filter: 'drop-shadow(0 0 6px rgba(164, 124, 243, 0.5))',
                }}
            >
                {isLoading ? (
                    <Sparkle size={20} weight="fill" className={disabled ? 'text-muted-foreground' : 'text-[#A47CF3]'} aria-hidden />
                ) : (
                    <Lightning
                        size={20}
                        weight="fill"
                        aria-hidden
                        className={cn(
                            'transition-all duration-300',
                            disabled ? 'text-muted-foreground' : 'text-[#A47CF3]',
                            !disabled && 'motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-6',
                        )}
                    />
                )}
            </span>

            {/* Gradient text label — animated shimmer */}
            <span
                className={cn(
                    'relative z-10',
                    disabled && 'text-muted-foreground',
                )}
                style={disabled ? undefined : {
                    background: 'linear-gradient(90deg, #9B6FEF 0%, #C490E0 20%, #F0C060 40%, #C490E0 60%, #9B6FEF 80%, #C490E0 100%)',
                    backgroundSize: '200% 100%',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'generate-shimmer 3s ease-in-out infinite',
                }}
            >
                {buttonLabel}
            </span>

            {/* Keyframes injected via style tag */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes generate-shimmer {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
            ` }} />
        </button>
    );

    if (variant === 'inline') {
        return button;
    }

    return (
        <div
            className={cn(
                'fixed inset-x-0 z-40',
                'bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] md:bottom-0',
                'border-t border-border/30',
                'backdrop-blur-xl bg-background/80',
                'pb-3 md:pb-[max(16px,env(safe-area-inset-bottom))]',
                'px-4 pt-3',
            )}
        >
            {button}

            {!isLoading && !isAuthenticated && (
                <div className="mt-1.5 flex items-center justify-center">
                    <Link
                        href="/register"
                        className={cn(
                            'text-[11px] text-primary underline-offset-2',
                            'transition-colors duration-150 hover:text-primary/80 hover:underline',
                        )}
                    >
                        {t('upload.sign_up_for_more')}
                    </Link>
                </div>
            )}
        </div>
    );
}
