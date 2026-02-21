'use client';
import React from 'react';
import Link from 'next/link';
import { Sparkle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useLanguage } from "@/i18n/hooks/useLanguage";

interface GuestResultBannerProps {
    jobId: string;
}

export function GuestResultBanner({ jobId }: GuestResultBannerProps): React.ReactElement {
    const { t } = useLanguage();
    const handleSignUp = (): void => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('glowge_demo_job_id', jobId);
        }
    };

    return (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 mb-4">
            <div className="flex items-start gap-3">
                <Sparkle size={20} className="text-primary mt-0.5 shrink-0" weight="fill" />
                <div className="flex-1">
                    <p className="font-semibold text-foreground mb-1">{t('ui.text_z2ra5m')}</p>
                    <p className="text-sm text-muted-foreground mb-3">
                        {t('ui.text_qrf3rk')}</p>
                    <Button asChild size="sm" onClick={handleSignUp}>
                        <Link href="/register">{t('ui.text_u64ui0')}</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
