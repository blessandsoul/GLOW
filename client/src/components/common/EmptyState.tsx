'use client';

import { FileMagnifyingGlass } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EmptyStateProps {
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
}

export function EmptyState({
    title,
    description,
    actionLabel,
    actionHref,
}: EmptyStateProps): React.ReactElement {
    return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
            <FileMagnifyingGlass size={64} className="mb-4 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">{title}</h3>
            <p className="mb-4 text-muted-foreground">{description}</p>
            {actionLabel && actionHref && (
                <Button asChild>
                    <Link href={actionHref}>{actionLabel}</Link>
                </Button>
            )}
        </div>
    );
}
