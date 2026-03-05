'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/common/Pagination';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useAdminUsers, useAdminUserImages } from '../hooks/useAdmin';
import { IS_LAUNCH_MODE } from '@/lib/launch-mode';
import { getServerImageUrl, getThumbUrl } from '@/lib/utils/image';
import type { AdminUser } from '../types/admin.types';

const LIMIT = 10;
const IMAGES_LIMIT = 12;
const COL_COUNT = 9;

function planVariant(plan: string): 'default' | 'secondary' | 'outline' {
    switch (plan) {
        case 'ULTRA': return 'default';
        case 'PRO': return 'secondary';
        default: return 'outline';
    }
}

function formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(dateString));
}

function UserAvatar({ user }: { user: AdminUser }): React.ReactElement {
    const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();

    return (
        <div className="flex items-center gap-3">
            {user.avatar ? (
                <img
                    src={user.avatar}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                />
            ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {initials}
                </div>
            )}
            <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                    {user.firstName} {user.lastName}
                </p>
                {user.username && (
                    <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                )}
            </div>
        </div>
    );
}

function SkeletonRows(): React.ReactElement {
    return (
        <>
            {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div>
                                <Skeleton className="mb-1 h-4 w-28" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
            ))}
        </>
    );
}

function UserImagesRow({ userId, isOpen }: { userId: string; isOpen: boolean }): React.ReactElement | null {
    const { t } = useLanguage();
    const [page, setPage] = useState(1);
    const { images, pagination, isLoading } = useAdminUserImages(isOpen ? userId : null, page, IMAGES_LIMIT);

    const jobGroups = useMemo(() => {
        const groups = new Map<string, { originalUrl: string; results: typeof images; createdAt: string; captions: { language: string; text: string; hashtags: string }[] }>();
        for (const img of images) {
            if (!groups.has(img.jobId)) {
                groups.set(img.jobId, { originalUrl: img.originalUrl, results: [], createdAt: img.createdAt, captions: [] });
            }
            const group = groups.get(img.jobId)!;
            group.results.push(img);
            for (const cap of img.captions) {
                if (!group.captions.some((c) => c.text === cap.text && c.language === cap.language)) {
                    group.captions.push(cap);
                }
            }
        }
        return Array.from(groups.values());
    }, [images]);

    const contentRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);
    const [shouldRender, setShouldRender] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!contentRef.current) return;
        const observer = new ResizeObserver(() => {
            if (contentRef.current) {
                setHeight(contentRef.current.scrollHeight);
            }
        });
        observer.observe(contentRef.current);
        return () => observer.disconnect();
    }, [shouldRender]);

    const handleTransitionEnd = useCallback(() => {
        if (!isOpen) {
            setShouldRender(false);
            setPage(1);
        }
    }, [isOpen]);

    if (!shouldRender) return null;

    return (
        <TableRow>
            <TableCell colSpan={COL_COUNT} className="!p-0 !whitespace-normal">
                <div
                    className="overflow-hidden transition-[max-height] duration-300 ease-out"
                    style={{ maxHeight: isOpen ? height || 'none' : 0 }}
                    onTransitionEnd={handleTransitionEnd}
                >
                    <div ref={contentRef} className="bg-muted/30 p-4">
                        {isLoading ? (
                            <div className="flex gap-2">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-16 rounded-md" />
                                ))}
                            </div>
                        ) : images.length === 0 ? (
                            <p className="text-sm text-muted-foreground">{t('admin.no_images')}</p>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex flex-col gap-4">
                                    {jobGroups.map((group, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex items-start gap-1.5">
                                                {/* Before */}
                                                <div className="flex flex-col items-center gap-1">
                                                    <a href={getServerImageUrl(group.originalUrl)} target="_blank" rel="noopener noreferrer" className="group relative">
                                                        <img src={getThumbUrl(group.originalUrl, 128)} alt="" className="h-16 w-16 rounded-md object-cover ring-1 ring-border/50 transition-all duration-200 group-hover:ring-2 group-hover:ring-primary/50" loading="lazy" />
                                                    </a>
                                                    <span className="text-[10px] text-muted-foreground">Before</span>
                                                </div>

                                                {/* Arrow */}
                                                <div className="flex h-16 items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                                </div>

                                                {/* After(s) */}
                                                {group.results.map((img) => (
                                                    <div key={img.variantIndex} className="flex flex-col items-center gap-1">
                                                        <a href={getServerImageUrl(img.imageUrl)} target="_blank" rel="noopener noreferrer" className="group relative">
                                                            <img src={getThumbUrl(img.imageUrl, 128)} alt="" className="h-16 w-16 rounded-md object-cover ring-1 ring-border/50 transition-all duration-200 group-hover:ring-2 group-hover:ring-primary/50" loading="lazy" />
                                                        </a>
                                                        <span className="text-[10px] text-muted-foreground">After</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {group.captions.length > 0 && (
                                                <div className="ml-1 max-w-[600px] space-y-1.5 border-l-2 border-border/50 pl-3">
                                                    {group.captions.map((cap, ci) => (
                                                        <div key={ci}>
                                                            <p className="text-sm text-foreground/80 break-words">{cap.text}</p>
                                                            {cap.hashtags && (
                                                                <p className="text-xs text-primary/60 break-words">{cap.hashtags}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {pagination && pagination.hasNextPage && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => { e.stopPropagation(); setPage((p) => p + 1); }}
                                        className="text-xs"
                                    >
                                        {t('admin.load_more')}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </TableCell>
        </TableRow>
    );
}

export function AdminUsersTable(): React.ReactElement {
    const { t } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const page = Number(searchParams.get('page') ?? '1');
    const searchQuery = searchParams.get('search') ?? '';

    const [searchInput, setSearchInput] = useState(searchQuery);
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

    const { users, pagination, isLoading } = useAdminUsers(page, LIMIT, searchQuery || undefined);

    // Debounced search — update URL after 400ms
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (searchInput !== searchQuery) {
                const params = new URLSearchParams(searchParams.toString());
                if (searchInput) {
                    params.set('search', searchInput);
                } else {
                    params.delete('search');
                }
                params.set('page', '1');
                router.push(`${pathname}?${params.toString()}`);
            }
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchInput, searchQuery, pathname, searchParams, router]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value);
    }, []);

    const toggleExpand = useCallback((userId: string) => {
        setExpandedUserId((prev) => (prev === userId ? null : userId));
    }, []);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">{t('admin.users_title')}</h2>
                <Input
                    placeholder={t('admin.search_placeholder')}
                    value={searchInput}
                    onChange={handleSearchChange}
                    className="max-w-xs"
                />
            </div>

            <div className="rounded-xl border border-border/50 bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[200px]">{t('admin.col_name')}</TableHead>
                            <TableHead>{t('admin.col_email')}</TableHead>
                            <TableHead>{t('admin.col_plan')}</TableHead>
                            <TableHead className="text-right">{t('admin.col_jobs')}</TableHead>
                            <TableHead className="text-right">{t('admin.col_captions')}</TableHead>
                            <TableHead className="text-right">{t('admin.col_hd_upscales')}</TableHead>
                            <TableHead className="text-right">
                                {IS_LAUNCH_MODE ? t('admin.col_daily_usage') : t('admin.col_credits')}
                            </TableHead>
                            <TableHead>{t('admin.col_status')}</TableHead>
                            <TableHead>{t('admin.col_joined')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <SkeletonRows />
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={COL_COUNT} className="h-32 text-center text-muted-foreground">
                                    {t('admin.no_users')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <React.Fragment key={user.id}>
                                    <TableRow
                                        className="cursor-pointer transition-colors hover:bg-muted/30"
                                        onClick={() => toggleExpand(user.id)}
                                    >
                                        <TableCell>
                                            <UserAvatar user={user} />
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {user.email}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={planVariant(user.plan)}>
                                                {user.plan}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {user.jobCount}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {user.captionCount}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {user.hdUpscaleCount}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {IS_LAUNCH_MODE && user.dailyUsage
                                                ? `${user.dailyUsage.used}/${user.dailyUsage.limit}`
                                                : user.credits}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.isActive ? 'secondary' : 'outline'}>
                                                {user.isActive ? t('admin.status_active') : t('admin.status_inactive')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(user.createdAt)}
                                        </TableCell>
                                    </TableRow>
                                    <UserImagesRow userId={user.id} isOpen={expandedUserId === user.id} />
                                </React.Fragment>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {pagination && pagination.totalPages > 1 && (
                <Pagination page={page} totalPages={pagination.totalPages} />
            )}
        </div>
    );
}
