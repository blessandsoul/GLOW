'use client';

import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/common/EmptyState';
import type { ProfileServiceItem } from '../types/booking.types';

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 150, 180];

interface ServiceDurationsProps {
    services: ProfileServiceItem[];
    onChange: (services: ProfileServiceItem[]) => void;
    t: (key: string) => string;
}

export function ServiceDurations({ services, onChange, t }: ServiceDurationsProps): React.ReactElement {
    function setDuration(index: number, duration: number): void {
        onChange(services.map((s, i) => (i === index ? { ...s, duration } : s)));
    }

    if (services.length === 0) {
        return <EmptyState title={t('booking.no_services_title')} description={t('booking.no_services_desc')} />;
    }

    return (
        <div className="space-y-3">
            {services.map((service, index) => (
                <div
                    key={`${service.name}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/40 bg-muted/20 px-3 py-2"
                >
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{service.name}</p>
                        {typeof service.price === 'number' && (
                            <p className="text-xs text-muted-foreground tabular-nums">{service.price}₾</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor={`dur-${index}`} className="text-xs text-muted-foreground">
                            {t('booking.duration_label')}
                        </Label>
                        <Select
                            value={String(service.duration ?? 60)}
                            onValueChange={(v) => setDuration(index, Number(v))}
                        >
                            <SelectTrigger id={`dur-${index}`} className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {DURATION_OPTIONS.map((d) => (
                                    <SelectItem key={d} value={String(d)}>
                                        {d} {t('booking.min_suffix')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            ))}
        </div>
    );
}
