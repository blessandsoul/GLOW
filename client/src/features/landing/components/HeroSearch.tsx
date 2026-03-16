'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlass, MapPin, CaretDown } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useSpecialities } from '@/features/profile/hooks/useCatalog';
import { ROUTES } from '@/lib/constants/routes';

export function HeroSearch(): React.ReactElement {
    const { t } = useLanguage();
    const router = useRouter();
    const { specialities } = useSpecialities();
    const [niche, setNiche] = useState('');
    const [city, setCity] = useState('');

    const handleSearch = useCallback((): void => {
        const params = new URLSearchParams();
        if (niche) params.set('niche', niche);
        if (city.trim()) params.set('city', city.trim());
        const query = params.toString();
        router.push(`${ROUTES.MASTERS}${query ? `?${query}` : ''}`);
    }, [niche, city, router]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="w-full max-w-2xl"
        >
            <div className="flex flex-col sm:flex-row items-stretch gap-2 rounded-2xl border border-border/60 bg-card/80 p-2 shadow-lg backdrop-blur-sm">
                {/* Niche select */}
                <div className="relative flex-1 min-w-0">
                    <MagnifyingGlass size={16} weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <select
                        value={niche}
                        onChange={(e) => setNiche(e.target.value)}
                        className="h-11 w-full appearance-none rounded-xl bg-muted/50 pl-10 pr-9 text-sm font-medium text-foreground outline-none transition-colors focus:bg-muted/80 focus:ring-2 focus:ring-primary/30"
                    >
                        <option value="">{t('landing.search_placeholder_niche')}</option>
                        {specialities.map((s) => (
                            <option key={s.slug} value={s.slug}>{s.label}</option>
                        ))}
                    </select>
                    <CaretDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>

                {/* City input */}
                <div className="relative flex-1 min-w-0">
                    <MapPin size={16} weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={t('landing.search_placeholder_city')}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                        className="h-11 w-full rounded-xl bg-muted/50 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:bg-muted/80 focus:ring-2 focus:ring-primary/30"
                    />
                </div>

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
