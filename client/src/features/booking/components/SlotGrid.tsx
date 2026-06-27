'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SlotGridProps {
    slots: string[];
    selected: string | null;
    onSelect: (slot: string) => void;
    isLoading: boolean;
    emptyLabel: string;
}

export function SlotGrid({ slots, selected, onSelect, isLoading, emptyLabel }: SlotGridProps): React.ReactElement {
    if (isLoading) {
        return (
            <div className="flex flex-wrap gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-20 rounded-xl" />
                ))}
            </div>
        );
    }

    if (slots.length === 0) {
        return (
            <p className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                {emptyLabel}
            </p>
        );
    }

    return (
        <div className="flex flex-wrap gap-2" role="listbox" aria-label="time slots">
            {slots.map((slot) => {
                const isActive = slot === selected;
                return (
                    <Button
                        key={slot}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onSelect(slot)}
                        className={cn(
                            'h-10 min-w-20 rounded-xl tabular-nums transition-all active:scale-[0.97]',
                            isActive && 'shadow-sm',
                        )}
                    >
                        {slot}
                    </Button>
                );
            })}
        </div>
    );
}
