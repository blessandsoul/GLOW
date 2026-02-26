'use client';

import { useState } from 'react';
import { Trash } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SERVICE_CATEGORIES } from '../types/profile.types';
import type { ServiceItem } from '../types/profile.types';
import { useLanguage } from '@/i18n/hooks/useLanguage';

interface ServiceRowProps {
    service: ServiceItem;
    index: number;
    showLabels: boolean;
    onRemove: (index: number) => void;
    onChange: (index: number, field: keyof ServiceItem, value: string | number) => void;
}

export function ServiceRow({ service, index, onRemove, onChange }: ServiceRowProps): React.ReactElement {
    const { t } = useLanguage();
    const category = SERVICE_CATEGORIES.find((c) => c.id === service.category);
    const [open, setOpen] = useState(false);

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
                            <PopoverTrigger asChild>
                                <Input
                                    value={service.name}
                                    onChange={(e) => onChange(index, 'name', e.target.value)}
                                    onFocus={() => setOpen(true)}
                                    placeholder={t('ui.text_883inc')}
                                />
                            </PopoverTrigger>
                            <PopoverContent className="p-0 w-64" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                                <Command>
                                    <CommandList>
                                        <CommandGroup>
                                            {category!.suggestions.map((s) => (
                                                <CommandItem
                                                    key={s}
                                                    value={s}
                                                    onSelect={() => {
                                                        onChange(index, 'name', s);
                                                        setOpen(false);
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
                <div className="flex items-center gap-2">
                    <div className="flex-1 sm:flex-none sm:w-24">
                        <Input
                            type="number"
                            value={service.price || ''}
                            onChange={(e) => onChange(index, 'price', Number(e.target.value))}
                            placeholder="80"
                        />
                    </div>
                    <div className="w-24 sm:w-20">
                        <Select
                            value={service.currency}
                            onValueChange={(v) => onChange(index, 'currency', v)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GEL">GEL</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="RUB">RUB</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
}
