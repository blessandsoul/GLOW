'use client';

import { useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { SERVICE_CATEGORIES } from '../types/profile.types';
import type { PriceType, ServiceItem } from '../types/profile.types';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { cn } from '@/lib/utils';

interface AddServicePanelProps {
    onAdd: (service: ServiceItem) => void;
    onCancel: () => void;
}

export function AddServicePanel({ onAdd, onCancel }: AddServicePanelProps): React.ReactElement {
    const { t } = useLanguage();
    const [selectedCategory, setSelectedCategory] = useState('');
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [priceType, setPriceType] = useState<PriceType>('fixed');
    const [open, setOpen] = useState(false);

    const category = SERVICE_CATEGORIES.find((c) => c.id === selectedCategory);

    const handleSubmit = (): void => {
        if (!selectedCategory || !name.trim()) return;
        onAdd({ category: selectedCategory, name: name.trim(), price: Number(price) || 0, priceType });
    };

    return (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
            <p className="text-sm font-semibold text-foreground">{t('ui.text_svc_new')}</p>

            <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('ui.text_svc_cat')}</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {SERVICE_CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => { setSelectedCategory(cat.id); setName(''); setOpen(true); }}
                            className={cn(
                                'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all duration-150 cursor-pointer',
                                selectedCategory === cat.id
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5'
                            )}
                        >
                            <span className="text-[10px] opacity-70">{cat.icon}</span>
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {selectedCategory && (
                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{t('ui.text_svc_sname')}</Label>
                    {category && category.suggestions.length > 0 ? (
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverAnchor asChild>
                                <Input
                                    value={name}
                                    onChange={(e) => { setName(e.target.value); setOpen(true); }}
                                    onFocus={() => setOpen(true)}
                                    placeholder={t('ui.text_svc_placeholder')}
                                    autoFocus
                                />
                            </PopoverAnchor>
                            <PopoverContent
                                className="p-0 w-[--radix-popover-anchor-width]"
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
                                        <CommandEmpty>{t('ui.text_svc_notfound')}</CommandEmpty>
                                        <CommandGroup>
                                            {category.suggestions
                                                .filter((s) => !name || s.toLowerCase().includes(name.toLowerCase()))
                                                .map((s) => (
                                                    <CommandItem
                                                        key={s}
                                                        value={s}
                                                        onSelect={() => {
                                                            setName(s);
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
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('ui.text_svc_enter')}
                            autoFocus
                        />
                    )}
                </div>
            )}

            {selectedCategory && (
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t('ui.text_svc_price')}</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0"
                                className="pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                                ₾
                            </span>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t('ui.text_svc_price_type')}</Label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setPriceType('fixed')}
                                className={cn(
                                    'flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-150 cursor-pointer',
                                    priceType === 'fixed'
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5'
                                )}
                            >
                                {t('ui.text_svc_fixed')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setPriceType('hourly')}
                                className={cn(
                                    'flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-150 cursor-pointer',
                                    priceType === 'hourly'
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5'
                                )}
                            >
                                {t('ui.text_svc_hourly')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2 pt-1">
                <Button
                    type="button"
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!selectedCategory || !name.trim()}
                    className="gap-1.5"
                >
                    <Plus size={14} />
                    {t('ui.text_svc_add')}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                    {t('ui.text_svc_cancel')}
                </Button>
            </div>
        </div>
    );
}
