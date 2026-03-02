'use client';

import { useRef, useState } from 'react';
import { Trash } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { useServiceCategories } from '../hooks/useCatalog';
import type { ServiceItem } from '../types/profile.types';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { cn } from '@/lib/utils';

interface ServiceRowProps {
    service: ServiceItem;
    index: number;
    showLabels: boolean;
    onRemove: (index: number) => void;
    onChange: (index: number, field: keyof ServiceItem, value: string | number) => void;
}

export function ServiceRow({ service, index, onRemove, onChange }: ServiceRowProps): React.ReactElement {
    const { t } = useLanguage();
    const { categories } = useServiceCategories();
    const category = categories.find((c) => c.id === service.category);
    const [open, setOpen] = useState(false);
    const justSelected = useRef(false);

    const hasSuggestions = Boolean(category && category.suggestions.length > 0);

    return (
        <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-2">
            {category && (
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {category.label}
                    </span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemove(index)}
                        aria-label={t('ui.text_m4suz4')}
                    >
                        <Trash size={14} />
                    </Button>
                </div>
            )}

            <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
                <div className="sm:flex-1">
                    {hasSuggestions ? (
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverAnchor asChild>
                                <Input
                                    value={service.name}
                                    onChange={(e) => onChange(index, 'name', e.target.value)}
                                    onFocus={() => { if (!justSelected.current) setOpen(true); }}
                                    placeholder={t('ui.text_883inc')}
                                />
                            </PopoverAnchor>
                            <PopoverContent
                                className="p-0 w-64"
                                align="start"
                                onOpenAutoFocus={(e) => e.preventDefault()}
                                onInteractOutside={(e) => {
                                    const target = e.target as HTMLElement;
                                    if (target.closest('[data-slot="popover-anchor"]')) {
                                        e.preventDefault();
                                    }
                                }}
                            >
                                <Command shouldFilter={false}>
                                    <CommandList>
                                        <CommandGroup>
                                            {category!.suggestions.map((s) => (
                                                <CommandItem
                                                    key={s}
                                                    value={s}
                                                    onSelect={() => {
                                                        justSelected.current = true;
                                                        onChange(index, 'name', s);
                                                        setOpen(false);
                                                        setTimeout(() => { justSelected.current = false; }, 150);
                                                    }}
                                                >
                                                    {s}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    ) : (
                        <Input
                            value={service.name}
                            onChange={(e) => onChange(index, 'name', e.target.value)}
                            placeholder={t('ui.text_883inc')}
                        />
                    )}
                </div>
                <div className="flex items-stretch gap-1.5">
                    <div className="relative w-20 shrink-0">
                        <Input
                            type="number"
                            value={service.price || ''}
                            onChange={(e) => onChange(index, 'price', Number(e.target.value))}
                            placeholder="80"
                            className="pr-7 h-full"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                            ₾
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => onChange(index, 'priceType', 'fixed')}
                        className={cn(
                            'flex-1 rounded-md border px-3 text-xs font-medium transition-all duration-150 cursor-pointer',
                            (service.priceType ?? 'fixed') === 'fixed'
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-card text-foreground hover:border-primary/50'
                        )}
                    >
                        {t('ui.text_svc_fixed')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange(index, 'priceType', 'hourly')}
                        className={cn(
                            'flex-1 rounded-md border px-3 text-xs font-medium transition-all duration-150 cursor-pointer',
                            service.priceType === 'hourly'
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-card text-foreground hover:border-primary/50'
                        )}
                    >
                        {t('ui.text_svc_hourly')}
                    </button>
                </div>
            </div>
        </div>
    );
}
