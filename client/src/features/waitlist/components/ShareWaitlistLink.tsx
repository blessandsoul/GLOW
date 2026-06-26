'use client';

import { useState } from 'react';
import { Copy, Check, ShareNetwork } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { ROUTES } from '@/lib/constants/routes';

export function ShareWaitlistLink({ username }: { username: string }): React.ReactElement {
    const { t } = useLanguage();
    const [copied, setCopied] = useState(false);

    const link =
        typeof window !== 'undefined'
            ? `${window.location.origin}${ROUTES.WAITLIST_JOIN(username)}`
            : ROUTES.WAITLIST_JOIN(username);

    async function handleCopy(): Promise<void> {
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            toast.success(t('waitlist.link_copied'));
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error(t('waitlist.link_copy_failed'));
        }
    }

    async function handleShare(): Promise<void> {
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({ title: t('waitlist.share_title'), url: link });
            } catch {
                // user dismissed the share sheet, no action needed
            }
        } else {
            await handleCopy();
        }
    }

    return (
        <Card className="rounded-xl border-border/50 bg-muted/30">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{t('waitlist.share_title')}</p>
                    <p className="truncate text-xs text-muted-foreground">{link}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="outline" onClick={handleCopy}>
                        {copied ? <Check size={15} className="mr-1.5" /> : <Copy size={15} className="mr-1.5" />}
                        {t('waitlist.copy_link')}
                    </Button>
                    <Button size="sm" onClick={handleShare}>
                        <ShareNetwork size={15} className="mr-1.5" />
                        {t('waitlist.share')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
