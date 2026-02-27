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
                'flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3',
                'text-sm font-semibold text-primary-foreground',
                'transition-all duration-200',
                'hover:brightness-110 active:scale-[0.98]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                'disabled:cursor-not-allowed disabled:opacity-50',
                variant === 'sticky' && 'min-h-[48px]',
            )}
        >
            {isLoading ? (
                <Sparkle
                    size={18}
                    weight="fill"
                    className="animate-pulse"
                    aria-hidden
                />
            ) : (
                <Lightning size={18} weight="fill" aria-hidden />
            )}
            {buttonLabel}
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
