'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SpinnerGap } from '@phosphor-icons/react';
import { useAppSelector } from '@/store/hooks';
import { ROUTES } from '@/lib/constants/routes';
import { useProducts } from '@/features/marketplace/hooks/useMarketplace';
import { ProductGrid } from '@/features/marketplace/components/ProductGrid';
import { ProductFilters } from '@/features/marketplace/components/ProductFilters';
import type { ProductCategory } from '@/features/marketplace/types/marketplace.types';

function MarketplaceContent(): React.ReactElement {
    const router = useRouter();
    const { isAuthenticated, isInitializing } = useAppSelector((s) => s.auth);
    const searchParams = useSearchParams();

    const category = searchParams.get('category') as ProductCategory | null;
    const inStockParam = searchParams.get('inStock');
    const page = Number(searchParams.get('page') ?? '1');

    const { products, pagination, isLoading } = useProducts({
        page,
        limit: 20,
        category: category ?? undefined,
        inStock: inStockParam === 'true' ? true : undefined,
    });

    useEffect(() => {
        if (!isInitializing && !isAuthenticated) {
            router.replace(ROUTES.LOGIN);
        }
    }, [isAuthenticated, isInitializing, router]);

    function handlePageChange(newPage: number): void {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(newPage));
        router.push(`?${params.toString()}`, { scroll: true });
    }

    if (isInitializing) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <SpinnerGap size={24} className="animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">მარკეტპლეისი</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    პროფესიული მასალები ოსტატებისგან ოსტატებისთვის
                </p>
            </div>

            {/* Filters */}
            <div className="mb-6">
                <ProductFilters />
            </div>

            {/* Results count */}
            {!isLoading && pagination && (
                <p className="mb-4 text-xs text-muted-foreground">
                    {pagination.totalItems} პროდუქტი
                </p>
            )}

            {/* Grid */}
            <ProductGrid products={products} isLoading={isLoading} />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={!pagination.hasPreviousPage}
                        className="rounded-lg border border-border/50 bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        ← უკან
                    </button>
                    <span className="text-xs text-muted-foreground">
                        {page} / {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={!pagination.hasNextPage}
                        className="rounded-lg border border-border/50 bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        წინ →
                    </button>
                </div>
            )}
        </div>
    );
}

export default function MarketplacePage(): React.ReactElement {
    return (
        <Suspense>
            <MarketplaceContent />
        </Suspense>
    );
}
