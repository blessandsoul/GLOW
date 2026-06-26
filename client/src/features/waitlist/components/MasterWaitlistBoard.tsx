'use client';

import { useMemo } from 'react';
import { SpinnerGap, Phone, Clock, Sparkle } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useMyWaitlist, useUpdateWaitlistStatus } from '../hooks/useMyWaitlist';
import type { WaitlistEntry, WaitlistStatus } from '../types/waitlist.types';

function formatDate(iso: string): string {
    const d = new Date(iso);
    return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}`;
}

const STATUS_VARIANT: Record<WaitlistStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    WAITING: 'secondary',
    NOTIFIED: 'default',
    CONVERTED: 'outline',
    CANCELLED: 'destructive',
    EXPIRED: 'outline',
};

export function MasterWaitlistBoard(): React.ReactElement {
    const { t } = useLanguage();
    const { entries, isLoading } = useMyWaitlist({ page: 1, limit: 50 });
    const { updateStatus, isPending } = useUpdateWaitlistStatus();

    const groups = useMemo(() => {
        const map = new Map<string, WaitlistEntry[]>();
        for (const entry of entries) {
            const key = entry.requestedDate;
            const list = map.get(key) ?? [];
            list.push(entry);
            map.set(key, list);
        }
        return Array.from(map.entries());
    }, [entries]);

    if (isLoading) {
        return (
            <div className="flex min-h-[30vh] items-center justify-center">
                <SpinnerGap size={24} className="animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (entries.length === 0) {
        return <EmptyState title={t('waitlist.empty_title')} description={t('waitlist.empty_desc')} />;
    }

    return (
        <div className="space-y-6">
            {groups.map(([date, list]) => (
                <div key={date} className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground tabular-nums">{formatDate(date)}</h3>
                        <span className="text-xs text-muted-foreground">
                            {t('waitlist.count_waiting').replace('{{count}}', String(list.length))}
                        </span>
                    </div>

                    <div className="space-y-2">
                        {list.map((entry) => (
                            <Card key={entry.id} className="rounded-xl border-border/50">
                                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-foreground">{entry.clientName}</span>
                                            <Badge variant={STATUS_VARIANT[entry.status]} className="text-[10px]">
                                                {t(`waitlist.status_${entry.status.toLowerCase()}`)}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                            <a href={`tel:${entry.clientPhone}`} className="flex items-center gap-1 hover:text-primary">
                                                <Phone size={13} /> <span className="tabular-nums">{entry.clientPhone}</span>
                                            </a>
                                            {entry.preferredTime && (
                                                <span className="flex items-center gap-1">
                                                    <Clock size={13} /> {entry.preferredTime}
                                                </span>
                                            )}
                                            {entry.serviceName && (
                                                <span className="flex items-center gap-1">
                                                    <Sparkle size={13} /> {entry.serviceName}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {(entry.status === 'WAITING' || entry.status === 'NOTIFIED') && (
                                        <div className="flex shrink-0 gap-2">
                                            {entry.status === 'WAITING' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={isPending}
                                                    onClick={() => updateStatus(entry.id, 'NOTIFIED')}
                                                >
                                                    {t('waitlist.action_notify')}
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                disabled={isPending}
                                                onClick={() => updateStatus(entry.id, 'CONVERTED')}
                                            >
                                                {t('waitlist.action_convert')}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                disabled={isPending}
                                                onClick={() => updateStatus(entry.id, 'CANCELLED')}
                                            >
                                                {t('waitlist.action_cancel')}
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
