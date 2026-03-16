'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, CheckCircle, XCircle, SpinnerGap } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { IdUploadArea } from './IdUploadArea';
import { ROUTES } from '@/lib/constants/routes';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { usePortfolioPreview } from '@/features/profile/hooks/usePortfolioPreview';
import type { IUser } from '@/features/auth/types/auth.types';

const PORTFOLIO_THRESHOLD = 5;

interface VerificationNoneViewProps {
    user: IUser;
    idDocumentUrl: string | null;
    onUploadId: (file: File) => void;
    isUploadingId: boolean;
    onRequest: (experienceYears?: number) => void;
    isRequesting: boolean;
}

export function VerificationNoneView({
    user,
    idDocumentUrl,
    onUploadId,
    isUploadingId,
    onRequest,
    isRequesting,
}: VerificationNoneViewProps): React.ReactElement {
    const [experienceYears, setExperienceYears] = useState<string>('');
    const { profile } = useProfile();
    const { publishedCount } = usePortfolioPreview();

    const isProfileComplete = !!(profile?.city && profile?.niche);
    const hasPortfolio = publishedCount >= PORTFOLIO_THRESHOLD;

    const requirements = [
        {
            label: 'Phone number verified',
            met: user.isPhoneVerified,
            href: !user.isPhoneVerified ? ROUTES.DASHBOARD_PROFILE : undefined,
        },
        {
            label: 'Profile complete (city and niche)',
            met: isProfileComplete,
            href: !isProfileComplete ? ROUTES.DASHBOARD_PROFILE : undefined,
        },
        {
            label: 'ID document uploaded',
            met: !!idDocumentUrl,
            href: undefined,
        },
        {
            label: `${PORTFOLIO_THRESHOLD}+ portfolio items (${publishedCount} uploaded)`,
            met: hasPortfolio,
            href: !hasPortfolio ? ROUTES.DASHBOARD_PORTFOLIO : undefined,
        },
    ];

    const allMet = requirements.every((r) => r.met);

    const handleSubmit = (): void => {
        const years = experienceYears.trim() ? parseInt(experienceYears, 10) : undefined;
        onRequest(years);
    };

    return (
        <section className="rounded-xl border border-border/50 bg-card p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <ShieldCheck size={20} className="text-primary" />
                </div>
                <div>
                    <h2 className="text-base font-semibold text-foreground">Master Verification</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Get verified to appear on the homepage and earn trust badges
                    </p>
                </div>
            </div>

            {/* Requirements checklist */}
            <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Requirements
                </p>
                <ul className="space-y-2">
                    {requirements.map((req) => (
                        <li key={req.label} className="flex items-center gap-2.5">
                            {req.met ? (
                                <CheckCircle size={16} weight="fill" className="shrink-0 text-success" />
                            ) : (
                                <XCircle size={16} weight="fill" className="shrink-0 text-destructive" />
                            )}
                            <span
                                className={cn(
                                    'text-sm flex-1',
                                    req.met ? 'text-foreground' : 'text-muted-foreground',
                                )}
                            >
                                {req.label}
                            </span>
                            {!req.met && req.href && (
                                <Link
                                    href={req.href}
                                    className="text-xs text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded"
                                >
                                    Set up
                                </Link>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            {/* ID upload */}
            <IdUploadArea
                currentUrl={idDocumentUrl}
                onUpload={onUploadId}
                isPending={isUploadingId}
            />

            {/* Experience years (optional) */}
            <div className="space-y-1.5">
                <Label htmlFor="exp-years" className="text-xs font-medium text-muted-foreground">
                    Years of experience (optional)
                </Label>
                <Input
                    id="exp-years"
                    type="number"
                    min={0}
                    max={50}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="e.g. 3"
                    className="h-9 w-32 text-sm"
                />
            </div>

            {/* Submit */}
            <Button
                onClick={handleSubmit}
                disabled={!allMet || isRequesting}
                className="w-full gap-2"
            >
                {isRequesting && <SpinnerGap size={15} className="animate-spin" />}
                Request Verification
            </Button>

            {!allMet && (
                <p className="text-center text-xs text-muted-foreground">
                    Complete all requirements above to request verification
                </p>
            )}
        </section>
    );
}
