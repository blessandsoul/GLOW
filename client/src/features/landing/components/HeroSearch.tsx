'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlass, MapPin, CaretDown, Check, X } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useSpecialities } from '@/features/profile/hooks/useCatalog';
import { ROUTES } from '@/lib/constants/routes';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface CityOption {
    value: string;
    label: string;
}

const GEORGIAN_CITIES: CityOption[] = [
    { value: 'Tbilisi', label: 'Tbilisi' },
    { value: 'Batumi', label: 'Batumi' },
    { value: 'Kutaisi', label: 'Kutaisi' },
    { value: 'Rustavi', label: 'Rustavi' },
    { value: 'Zugdidi', label: 'Zugdidi' },
    { value: 'Gori', label: 'Gori' },
    { value: 'Poti', label: 'Poti' },
    { value: 'Telavi', label: 'Telavi' },
    { value: 'Kobuleti', label: 'Kobuleti' },
];

export function HeroSearch(): React.ReactElement {
    const { t } = useLanguage();
    const router = useRouter();
    const { specialities } = useSpecialities();
    const [niche, setNiche] = useState('');
    const [nicheOpen, setNicheOpen] = useState(false);
    const [cities, setCities] = useState<string[]>([]);
    const [cityOpen, setCityOpen] = useState(false);

    const toggleCity = useCallback((city: string): void => {
        setCities((prev) =>
            prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
        );
    }, []);

    const removeCity = useCallback((city: string): void => {
        setCities((prev) => prev.filter((c) => c !== city));
    }, []);

    const handleSearch = useCallback((): void => {
        const params = new URLSearchParams();
        if (niche) params.set('niche', niche);
        if (cities.length > 0) params.set('city', cities.join(','));
        const query = params.toString();
        router.push(`${ROUTES.MASTERS}${query ? `?${query}` : ''}`);
    }, [niche, cities, router]);

    const selectedNicheLabel = specialities.find((s) => s.slug === niche)?.label;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="w-full max-w-2xl"
        >
            <div className="flex flex-col sm:flex-row items-stretch gap-2 rounded-2xl border border-border/60 bg-card/80 p-2 shadow-lg backdrop-blur-sm">
                {/* Niche select */}
                <Popover open={nicheOpen} onOpenChange={setNicheOpen}>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            className="relative flex h-11 flex-1 min-w-0 items-center gap-2 rounded-xl bg-muted/50 pl-10 pr-9 text-sm font-medium text-left outline-none transition-colors hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-primary/30"
                        >
                            <MagnifyingGlass size={16} weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <span className={cn('truncate', !selectedNicheLabel && 'text-muted-foreground')}>
                                {selectedNicheLabel ?? t('landing.search_placeholder_niche')}
                            </span>
                            <CaretDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-55 p-0" align="start">
                        <Command>
                            <CommandList>
                                <CommandGroup>
                                    <CommandItem
                                        value=""
                                        onSelect={() => { setNiche(''); setNicheOpen(false); }}
                                        className="text-muted-foreground"
                                    >
                                        {t('landing.search_placeholder_niche')}
                                    </CommandItem>
                                    {specialities.map((s) => (
                                        <CommandItem
                                            key={s.slug}
                                            value={s.slug}
                                            onSelect={() => { setNiche(s.slug); setNicheOpen(false); }}
                                        >
                                            <Check size={14} className={cn('mr-1', niche === s.slug ? 'opacity-100' : 'opacity-0')} />
                                            {s.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                {/* City multi-select */}
                <Popover open={cityOpen} onOpenChange={setCityOpen}>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            className="relative flex h-11 flex-1 min-w-0 items-center gap-1.5 rounded-xl bg-muted/50 pl-10 pr-9 text-sm font-medium text-left outline-none transition-colors hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-primary/30"
                        >
                            <MapPin size={16} weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            {cities.length === 0 ? (
                                <span className="text-muted-foreground truncate">
                                    {t('landing.search_placeholder_city')}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 truncate">
                                    {cities.slice(0, 2).map((c) => (
                                        <span
                                            key={c}
                                            className="inline-flex items-center gap-0.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary"
                                        >
                                            {c}
                                            <X
                                                size={10}
                                                weight="bold"
                                                className="cursor-pointer hover:text-destructive"
                                                onClick={(e) => { e.stopPropagation(); removeCity(c); }}
                                            />
                                        </span>
                                    ))}
                                    {cities.length > 2 && (
                                        <span className="text-xs text-muted-foreground">+{cities.length - 2}</span>
                                    )}
                                </span>
                            )}
                            <CaretDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-55 p-0" align="start">
                        <Command>
                            <CommandInput placeholder={t('landing.search_placeholder_city')} />
                            <CommandList>
                                <CommandEmpty>—</CommandEmpty>
                                <CommandGroup>
                                    {GEORGIAN_CITIES.map((c) => {
                                        const selected = cities.includes(c.value);
                                        return (
                                            <CommandItem
                                                key={c.value}
                                                value={c.value}
                                                onSelect={() => toggleCity(c.value)}
                                            >
                                                <div className={cn(
                                                    'mr-1 flex h-4 w-4 items-center justify-center rounded border border-primary/40',
                                                    selected ? 'bg-primary border-primary' : 'bg-transparent'
                                                )}>
                                                    {selected && <Check size={10} weight="bold" className="text-primary-foreground" />}
                                                </div>
                                                {c.label}
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                {/* Search button */}
                <button
                    type="button"
                    onClick={handleSearch}
                    className="h-11 shrink-0 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:-translate-y-px active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
                >
                    {t('landing.search_btn')}
                </button>
            </div>
        </motion.div>
    );
}
