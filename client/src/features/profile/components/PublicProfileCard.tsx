'use client';

import Link from 'next/link';
import { ArrowSquareOut, Eye } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store/hooks';
import { ROUTES } from '@/lib/constants/routes';

export function PublicProfileCard(): React.ReactElement {
    const user = useAppSelector((s) => s.auth.user);

    if (!user) return <></>;

    // Username derived from firstName + lastName, lowercased, joined
    const username = `${user.firstName}${user.lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    const publicUrl = ROUTES.PORTFOLIO_PUBLIC(username);

    return (
        <section className="space-y-4 rounded-xl border border-border/50 bg-card p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Eye size={16} className="text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">Public profile</p>
                </div>
                <Button variant="outline" size="sm" asChild className="gap-1.5 cursor-pointer">
                    <Link href={publicUrl} target="_blank" rel="noopener noreferrer">
                        <ArrowSquareOut size={14} />
                        View
                    </Link>
                </Button>
            </div>

            <div className="rounded-lg border border-border/40 bg-muted/30 px-4 py-3 flex items-center gap-2">
                <p className="text-xs text-muted-foreground truncate flex-1">
                    glow.ge{publicUrl}
                </p>
                <button
                    type="button"
                    className="text-xs text-primary hover:underline shrink-0 cursor-pointer"
                    onClick={() => {
                        void navigator.clipboard.writeText(`https://glow.ge${publicUrl}`);
                    }}
                >
                    Copy
                </button>
            </div>

            <p className="text-xs text-muted-foreground">
                This is the page clients see when they visit your profile. Keep your portfolio, services, and bio up to date.
            </p>
        </section>
    );
}
