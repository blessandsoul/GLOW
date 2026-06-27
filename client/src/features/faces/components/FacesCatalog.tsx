'use client';

import { useState, useEffect, useMemo } from 'react';
import { MagnifyingGlass, SpinnerGap, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useFacesCatalog } from '../hooks/useFacesCatalog';
import { useInterestStatus } from '../hooks/useFaceInterest';
import { FaceGrid } from './FaceGrid';

export function FacesCatalog(): React.ReactElement {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        const id = setTimeout(() => {
            setDebounced(search.trim());
            setPage(1);
        }, 350);
        return (): void => clearTimeout(id);
    }, [search]);

    const filters = useMemo(
        () => ({ page, limit: 24, ...(debounced ? { search: debounced } : {}) }),
        [page, debounced],
    );

    const { models, pagination, isLoading, isFetching, isError } = useFacesCatalog(filters);
    const modelIds = useMemo(() => models.map((m) => m.id), [models]);
    const likedMap = useInterestStatus(modelIds);

    return (
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">{t('faces.title')}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t('faces.subtitle')}</p>
            </div>

            <div className="relative mb-6 max-w-md">
                <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('faces.search_placeholder')}
                    className="pl-9"
                />
            </div>

            {isLoading ? (
                <div className="flex min-h-[30vh] items-center justify-center">
                    <SpinnerGap size={24} className="animate-spin text-muted-foreground" />
                </div>
            ) : isError ? (
                <EmptyState title={t('faces.error_title')} description={t('faces.error_desc')} />
            ) : models.length === 0 ? (
                <EmptyState title={t('faces.empty_title')} description={t('faces.empty_desc')} />
            ) : (
                <>
                    <div className={isFetching ? 'opacity-70 transition-opacity' : ''}>
                        <FaceGrid models={models} likedMap={likedMap} />
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!pagination.hasPreviousPage}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                <CaretLeft size={16} />
                            </Button>
                            <span className="text-sm text-muted-foreground tabular-nums">
                                {pagination.page} / {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!pagination.hasNextPage}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                <CaretRight size={16} />
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
