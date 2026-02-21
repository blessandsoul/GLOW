'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileMagnifyingGlass } from '@phosphor-icons/react';

export default function NotFound(): React.ReactElement {
    return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
            <FileMagnifyingGlass size={64} className="text-muted-foreground" />
            <h2 className="text-2xl font-bold">Page Not Found</h2>
            <p className="text-muted-foreground">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <Button asChild>
                <Link href="/">Go Home</Link>
            </Button>
        </div>
    );
}
