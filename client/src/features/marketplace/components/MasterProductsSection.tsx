'use client';

import { useSellerProducts } from '../hooks/useMarketplace';
import { ProductCard } from './ProductCard';

interface MasterProductsSectionProps {
    username: string;
}

export function MasterProductsSection({ username }: MasterProductsSectionProps): React.ReactElement | null {
    const { products, isLoading } = useSellerProducts(username);

    if (isLoading) {
        return (
            <section className="px-4 py-8">
                <div className="mb-4 h-5 w-32 animate-pulse rounded-md bg-muted" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-2xl border border-border/50 bg-card">
                            <div className="aspect-square animate-pulse rounded-t-2xl bg-muted" />
                            <div className="space-y-2 p-3">
                                <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted" />
                                <div className="h-5 w-1/3 animate-pulse rounded-full bg-muted" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (products.length === 0) return null;

    return (
        <section className="px-4 py-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Товары мастера
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </section>
    );
}
