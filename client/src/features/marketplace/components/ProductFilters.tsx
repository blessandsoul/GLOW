'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Eye, Drop, Scissors, Sparkle, Wrench, Bag, Palette, Package } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { ProductCategory } from '../types/marketplace.types';
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS } from '../types/marketplace.types';

const CATEGORY_ICONS: Record<ProductCategory, React.ElementType> = {
    lashes: Eye,
    glue: Drop,
    tweezers: Scissors,
    decor: Sparkle,
    tools: Wrench,
    accessories: Bag,
    cosmetics: Palette,
    other: Package,
};

export function ProductFilters(): React.ReactElement {
    const router = useRouter();
    const searchParams = useSearchParams();

    const activeCategory = searchParams.get('category') as ProductCategory | null;
    const inStockOnly = searchParams.get('inStock') === 'true';

    const updateParam = useCallback(
        (key: string, value: string | null) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value === null) {
                params.delete(key);
            } else {
                params.set(key, value);
            }
            params.delete('page');
            router.push(`?${params.toString()}`, { scroll: false });
        },
        [router, searchParams],
    );

    function handleCategory(cat: ProductCategory): void {
        updateParam('category', activeCategory === cat ? null : cat);
    }

    function handleInStock(): void {
        updateParam('inStock', inStockOnly ? null : 'true');
    }

    return (
        <div className="space-y-3">
            {/* Category chips */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => updateParam('category', null)}
                    className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium transition-all',
                        !activeCategory
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    )}
                >
                    ყველა
                </button>
                {PRODUCT_CATEGORIES.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat];
                    return (
                        <button
                            key={cat}
                            onClick={() => handleCategory(cat)}
                            className={cn(
                                'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all',
                                activeCategory === cat
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                            )}
                        >
                            <Icon size={11} weight="fill" />
                            {PRODUCT_CATEGORY_LABELS[cat]}
                        </button>
                    );
                })}
            </div>

            {/* In stock toggle */}
            <button
                onClick={handleInStock}
                className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all',
                    inStockOnly
                        ? 'bg-success/10 text-success'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
            >
                <span className={cn('h-1.5 w-1.5 rounded-full', inStockOnly ? 'bg-success' : 'bg-muted-foreground')} />
                მხოლოდ მარაგშია
            </button>
        </div>
    );
}
