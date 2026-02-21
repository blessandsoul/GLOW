'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { WarningCircle } from '@phosphor-icons/react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}): React.ReactElement {
    useEffect(() => {
        // Log to error reporting service in production
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
            <WarningCircle size={48} className="mb-4 text-destructive" />
            <h2 className="mb-2 text-2xl font-bold">Something went wrong</h2>
            <p className="mb-4 text-muted-foreground">{error.message}</p>
            <Button onClick={reset}>Try again</Button>
        </div>
    );
}
