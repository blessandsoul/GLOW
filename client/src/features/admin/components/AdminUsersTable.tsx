'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { useAdminUsers } from '../hooks/useAdmin';
import { IS_LAUNCH_MODE } from '@/lib/launch-mode';
import type { AdminUser } from '../types/admin.types';

const LIMIT = 10;

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
                    <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
            ))}
        </>
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
                                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                                    {t('admin.no_users')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
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
