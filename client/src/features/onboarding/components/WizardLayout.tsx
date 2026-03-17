'use client';

import { ArrowLeft, ArrowRight, SkipForward } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WizardLayoutProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    onNext?: () => void;
    onBack?: () => void;
    onSkip?: () => void;
    nextLabel?: string;
    nextDisabled?: boolean;
    nextLoading?: boolean;
    showBack?: boolean;
    showSkip?: boolean;
    showNext?: boolean;
}

export function WizardLayout({
    title,
    subtitle,
    children,
    onNext,
    onBack,
    onSkip,
    nextLabel = 'Continue',
    nextDisabled = false,
    nextLoading = false,
    showBack = true,
    showSkip = false,
    showNext = true,
}: WizardLayoutProps): React.ReactElement {
    return (
        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
            <div className="space-y-2 text-center mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-foreground text-wrap-balance">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
            </div>

            <div className="space-y-6">
                {children}
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
                <div>
                    {showBack && onBack && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onBack}
                            className="gap-1.5 text-muted-foreground"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {showSkip && onSkip && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onSkip}
                            className="gap-1.5 text-muted-foreground"
                        >
                            Skip
                            <SkipForward size={14} />
                        </Button>
                    )}
                    {showNext && onNext && (
                        <Button
                            type="button"
                            onClick={onNext}
                            disabled={nextDisabled || nextLoading}
                            className="gap-1.5 min-w-[120px]"
                        >
                            {nextLoading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                            ) : (
                                <>
                                    {nextLabel}
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
