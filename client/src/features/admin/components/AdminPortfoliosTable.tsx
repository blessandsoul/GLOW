'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CaretLeft, CaretRight, ShieldCheck, Certificate, FirstAid, Diamond, CheckCircle, XCircle, SpinnerGap } from '@phosphor-icons/react';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useAdminPortfolioUsers, useAdminPortfolioItems } from '../hooks/useAdmin';
import { useAdminReviewVerification, useAdminSetBadge } from '@/features/verification/hooks/useVerification';
import { getServerImageUrl, getThumbUrl } from '@/lib/utils/image';
import type { AdminPortfolioUser } from '../types/admin.types';

const LIMIT = 10;
const ITEMS_LIMIT = 12;
const COL_COUNT = 4;

function formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(dateString));
}

function UserAvatar({ user }: { user: AdminPortfolioUser }): React.ReactElement {
    const initials = `${(user.firstName ?? '')[0] ?? ''}${(user.lastName ?? '')[0] ?? ''}`.toUpperCase();

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
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
            ))}
        </>
    );
}

function VerificationActions({ user }: { user: AdminPortfolioUser }): React.ReactElement {
    const { review, isPending: isReviewing } = useAdminReviewVerification();
    const { setBadge, isPending: isUpdatingBadge } = useAdminSetBadge();
    const [rejectReason, setRejectReason] = useState('');
    const [showReject, setShowReject] = useState(false);

    const isVerified = user.verificationStatus === 'VERIFIED';
    const isPending = user.verificationStatus === 'PENDING';

    return (
        <div className="space-y-3 rounded-lg border border-border/50 bg-card p-3">
            <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-primary" />
                <span className="text-xs font-semibold text-foreground">Verification</span>
                <span className={cn(
                    'ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium',
                    isVerified && 'bg-success/15 text-success',
                    isPending && 'bg-warning/15 text-warning',
                    user.verificationStatus === 'REJECTED' && 'bg-destructive/15 text-destructive',
                    user.verificationStatus === 'NONE' && 'bg-muted text-muted-foreground',
                )}>
                    {user.verificationStatus}
                </span>
            </div>

            {/* Verify / Reject actions */}
            {!isVerified && (
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 border-success/30 text-success hover:bg-success/10"
                        disabled={isReviewing}
                        onClick={(e) => { e.stopPropagation(); review({ userId: user.userId, approved: true }); }}
                    >
                        {isReviewing ? <SpinnerGap size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                        Verify
                    </Button>
                    {!showReject ? (
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
                            onClick={(e) => { e.stopPropagation(); setShowReject(true); }}
                        >
                            <XCircle size={12} />
                            Reject
                        </Button>
                    ) : (
                        <div className="flex w-full items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <input
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Rejection reason..."
                                className="flex-1 rounded-md border border-input bg-transparent px-2 py-1 text-xs"
                            />
                            <Button
                                size="sm"
                                variant="destructive"
                                disabled={!rejectReason.trim() || isReviewing}
                                onClick={() => review({ userId: user.userId, approved: false, rejectionReason: rejectReason })}
                            >
                                {isReviewing ? <SpinnerGap size={12} className="animate-spin" /> : 'Confirm'}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Revoke for verified */}
            {isVerified && (
                <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
                    disabled={isReviewing}
                    onClick={(e) => { e.stopPropagation(); review({ userId: user.userId, approved: false, rejectionReason: 'Revoked by admin' }); }}
                >
                    {isReviewing ? <SpinnerGap size={12} className="animate-spin" /> : <XCircle size={12} />}
                    Revoke Verification
                </Button>
            )}

            {/* Badge toggles */}
            <div className="flex flex-wrap gap-2">
                <BadgeToggleBtn
                    icon={Certificate}
                    label="Certified"
                    hint="Professional certificate"
                    active={user.isCertified}
                    disabled={isUpdatingBadge}
                    onClick={(e) => { e.stopPropagation(); setBadge({ userId: user.userId, badge: 'isCertified', value: !user.isCertified }); }}
                />
                <BadgeToggleBtn
                    icon={FirstAid}
                    label="Hygiene"
                    hint="Workspace hygiene verified"
                    active={user.isHygieneVerified}
                    disabled={isUpdatingBadge}
                    onClick={(e) => { e.stopPropagation(); setBadge({ userId: user.userId, badge: 'isHygieneVerified', value: !user.isHygieneVerified }); }}
                />
                <BadgeToggleBtn
                    icon={Diamond}
                    label="Quality Products"
                    hint="Uses quality products"
                    active={user.isQualityProducts}
                    disabled={isUpdatingBadge}
                    onClick={(e) => { e.stopPropagation(); setBadge({ userId: user.userId, badge: 'isQualityProducts', value: !user.isQualityProducts }); }}
                />
            </div>
        </div>
    );
}

function BadgeToggleBtn({ icon: Icon, label, hint, active, disabled, onClick }: {
    icon: React.ElementType;
    label: string;
    hint: string;
    active: boolean;
    disabled: boolean;
    onClick: (e: React.MouseEvent) => void;
}): React.ReactElement {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            title={hint}
            className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors duration-150',
                active
                    ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                disabled && 'opacity-50 cursor-not-allowed',
            )}
        >
            <Icon size={12} weight={active ? 'fill' : 'regular'} />
            {label}
        </button>
    );
}

function PortfolioItemsRow({ userId, user, isOpen }: { userId: string; user: AdminPortfolioUser; isOpen: boolean }): React.ReactElement | null {
    const { t } = useLanguage();
    const [page, setPage] = useState(1);
    const { items, pagination, isLoading } = useAdminPortfolioItems(isOpen ? userId : null, page, ITEMS_LIMIT);

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
        return (): void => { observer.disconnect(); };
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
            <TableCell colSpan={COL_COUNT} className="!p-0">
                <div
                    className="overflow-hidden transition-[max-height] duration-300 ease-out"
                    style={{ maxHeight: isOpen ? height || 'none' : 0 }}
                    onTransitionEnd={handleTransitionEnd}
                >
                    <div ref={contentRef} className="bg-muted/30 p-4 space-y-4">
                        <VerificationActions user={user} />
                        {isLoading ? (
                            <div className="flex gap-2">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <Skeleton key={i} className="h-24 w-24 rounded-md" />
                                ))}
                            </div>
                        ) : items.length === 0 ? (
                            <p className="text-sm text-muted-foreground">{t('admin.no_portfolio_items')}</p>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-3">
                                    {items.map((item) => (
                                        <div key={item.id} className="relative">
                                            <a
                                                href={getServerImageUrl(item.imageUrl)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group relative block"
                                            >
                                                <img
                                                    src={getThumbUrl(item.imageUrl, 192)}
                                                    alt={item.title ?? ''}
                                                    className="h-24 w-24 rounded-md object-cover ring-1 ring-border/50 transition-all duration-200 group-hover:ring-2 group-hover:ring-primary/50"
                                                    loading="lazy"
                                                />
                                            </a>
                                            {!item.isPublished && (
                                                <Badge
                                                    variant="outline"
                                                    className="absolute -right-1 -top-1 bg-background text-[10px] px-1 py-0"
                                                >
                                                    {t('admin.unpublished')}
                                                </Badge>
                                            )}
                                            {item.title && (
                                                <p className="mt-1 max-w-[96px] truncate text-[10px] text-muted-foreground">
                                                    {item.title}
                                                </p>
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

export function AdminPortfoliosTable(): React.ReactElement {
    const { t } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const page = Number(searchParams.get('pPage') ?? '1');
    const searchQuery = searchParams.get('pSearch') ?? '';

    const [searchInput, setSearchInput] = useState(searchQuery);
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

    const { users, pagination, isLoading } = useAdminPortfolioUsers(page, LIMIT, searchQuery || undefined);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (searchInput !== searchQuery) {
                const params = new URLSearchParams(searchParams.toString());
                if (searchInput) {
                    params.set('pSearch', searchInput);
                } else {
                    params.delete('pSearch');
                }
                params.set('pPage', '1');
                router.push(`${pathname}?${params.toString()}`);
            }
        }, 400);

        return (): void => { clearTimeout(timeout); };
    }, [searchInput, searchQuery, pathname, searchParams, router]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value);
    }, []);

    const toggleExpand = useCallback((userId: string) => {
        setExpandedUserId((prev) => (prev === userId ? null : userId));
    }, []);

    const goToPage = useCallback((newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('pPage', String(newPage));
        router.push(`${pathname}?${params.toString()}`);
    }, [searchParams, pathname, router]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">{t('admin.portfolios_title')}</h2>
                <Input
                    placeholder={t('admin.portfolios_search_placeholder')}
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
                            <TableHead>{t('admin.col_niche')}</TableHead>
                            <TableHead className="text-right">{t('admin.col_items')}</TableHead>
                            <TableHead>{t('admin.col_latest_upload')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <SkeletonRows />
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={COL_COUNT} className="h-32 text-center text-muted-foreground">
                                    {t('admin.no_portfolios')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <React.Fragment key={user.userId}>
                                    <TableRow
                                        className="cursor-pointer transition-colors hover:bg-muted/30"
                                        onClick={() => toggleExpand(user.userId)}
                                    >
                                        <TableCell>
                                            <UserAvatar user={user} />
                                        </TableCell>
                                        <TableCell>
                                            {user.niche ? (
                                                <Badge variant="secondary">{user.niche}</Badge>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {user.publishedItems}/{user.totalItems}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {user.latestItemDate ? formatDate(user.latestItemDate) : '—'}
                                        </TableCell>
                                    </TableRow>
                                    <PortfolioItemsRow userId={user.userId} user={user} isOpen={expandedUserId === user.userId} />
                                </React.Fragment>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(page - 1)}
                        disabled={page <= 1}
                        aria-label="Previous page"
                    >
                        <CaretLeft size={16} />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {pagination.totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(page + 1)}
                        disabled={page >= pagination.totalPages}
                        aria-label="Next page"
                    >
                        <CaretRight size={16} />
                    </Button>
                </div>
            )}
        </div>
    );
}
