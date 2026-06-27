'use client';

import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { WorkingHours, WeekdayKey, WorkingInterval } from '../types/booking.types';

const ORDER: WeekdayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DEFAULT_INTERVAL: WorkingInterval = { open: '10:00', close: '19:00' };

interface WorkingHoursEditorProps {
    value: WorkingHours;
    onChange: (value: WorkingHours) => void;
    t: (key: string) => string;
}

export function WorkingHoursEditor({ value, onChange, t }: WorkingHoursEditorProps): React.ReactElement {
    function setDay(day: WeekdayKey, interval: WorkingInterval | null): void {
        onChange({ ...value, [day]: interval ? [interval] : null });
    }

    return (
        <div className="space-y-2">
            {ORDER.map((day) => {
                const intervals = value[day];
                const isOpen = Array.isArray(intervals) && intervals.length > 0;
                const interval = isOpen ? intervals[0] : DEFAULT_INTERVAL;
                return (
                    <div
                        key={day}
                        className="flex flex-wrap items-center gap-3 rounded-lg border border-border/40 bg-muted/20 px-3 py-2"
                    >
                        <label className="flex w-28 shrink-0 items-center gap-2 text-sm font-medium text-foreground">
                            <Checkbox
                                checked={isOpen}
                                onCheckedChange={(v) => setDay(day, v === true ? interval : null)}
                            />
                            {t(`booking.day_${day}`)}
                        </label>
                        {isOpen ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="time"
                                    value={interval.open}
                                    onChange={(e) => setDay(day, { ...interval, open: e.target.value })}
                                    className="w-32 tabular-nums"
                                />
                                <span className="text-muted-foreground">-</span>
                                <Input
                                    type="time"
                                    value={interval.close}
                                    onChange={(e) => setDay(day, { ...interval, close: e.target.value })}
                                    className="w-32 tabular-nums"
                                />
                            </div>
                        ) : (
                            <span className="text-sm text-muted-foreground">{t('booking.day_off')}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
