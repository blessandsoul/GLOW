import { ShoppingBag } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/utils';
import type { IProduct } from '../types/marketplace.types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
    products: IProduct[];
    isLoading?: boolean;
    className?: string;
}

function ProductSkeleton(): React.ReactElement {
    return (
        <div className="flex flex-col rounded-2xl border border-border/50 bg-card shadow-sm">
            <div className="aspect-square animate-pulse rounded-t-2xl bg-muted" />
            <div className="flex flex-col gap-2 p-3">
                <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted" />
                <div className="h-5 w-1/3 animate-pulse rounded-full bg-muted" />
                <div className="h-5 w-1/4 animate-pulse rounded-md bg-muted" />
                <div className="mt-1 h-8 animate-pulse rounded-xl bg-muted" />
            </div>
        </div>
    );
}

export function ProductGrid({ products, isLoading, className }: ProductGridProps): React.ReactElement {
    if (isLoading) {
        return (
            <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4', className)}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <ProductSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                    <ShoppingBag size={24} className="text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-foreground">პროდუქტები ჯერ არ არის</p>
                <p className="mt-1 text-xs text-muted-foreground">
                    ოსტატებმა ჯერ არ განათავსეს პროდუქტები
                </p>
            </div>
        );
    }

    return (
        <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4', className)}>
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}
