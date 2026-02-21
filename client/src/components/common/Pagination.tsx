'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { useCallback } from 'react';

interface PaginationProps {
    page: number;
    totalPages: number;
}

export function Pagination({
    page,
    totalPages,
}: PaginationProps): React.ReactElement {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const createPageUrl = useCallback(
        (pageNumber: number): string => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', pageNumber.toString());
            return `${pathname}?${params.toString()}`;
        },
        [pathname, searchParams]
    );

    return (
        <div className="flex items-center justify-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(createPageUrl(page - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
            >
                <CaretLeft size={16} />
            </Button>
            <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
            </span>
            <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(createPageUrl(page + 1))}
                disabled={page >= totalPages}
                aria-label="Next page"
            >
                <CaretRight size={16} />
            </Button>
        </div>
    );
}
