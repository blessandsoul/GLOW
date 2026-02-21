'use client';

import { SpinnerGap } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    size?: number;
    className?: string;
}

export function LoadingSpinner({
    size = 24,
    className,
}: LoadingSpinnerProps): React.ReactElement {
    return (
        <SpinnerGap
            size={size}
            className={cn('animate-spin text-muted-foreground', className)}
        />
    );
}
