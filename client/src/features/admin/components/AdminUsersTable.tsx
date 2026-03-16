'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/common/Pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ShieldCheck, CheckCircle, XCircle, SpinnerGap, Certificate, FirstAid, Diamond } from '@phosphor-icons/react';
import { useAdminUsers, useAdminUserImages } from '../hooks/useAdmin';
import { useAdminReviewVerification, useAdminSetBadge } from '@/features/verification/hooks/useVerification';
import { IS_LAUNCH_MODE } from '@/lib/launch-mode';
import { cn } from '@/lib/utils';
import { getServerImageUrl, getThumbUrl } from '@/lib/utils/image';
import type { AdminUser } from '../types/admin.types';

const DEFAULT_LIMIT = 50;
const LIMIT_OPTIONS = [50, 250, 500, 1000] as const;
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
    const [imgError, setImgError] = useState(false);
    const avatarUrl = user.avatar ? getServerImageUrl(user.avatar) : null;

    return (
        <div className="flex items-center gap-3">
            {avatarUrl && !imgError ? (
                <img
                    src={avatarUrl}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                    onError={() => setImgError(true)}
                />
            ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
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

function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }): React.ReactElement {
    useEffect(() => {
        const handleKey = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                aria-label="Close"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <img
                src={src}
                alt=""
                className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}

function UserVerificationActions({ user }: { user: AdminUser }): React.ReactElement {
    const { review, isPending: isReviewing } = useAdminReviewVerification();
    const { setBadge, isPending: isUpdatingBadge } = useAdminSetBadge();
    const [rejectReason, setRejectReason] = useState('');
    const [showReject, setShowReject] = useState(false);
    const isVerified = user.verificationStatus === 'VERIFIED';

    return (
        <div className="space-y-3 rounded-lg border border-border/50 bg-card p-3">
            <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-primary" />
                <span className="text-xs font-semibold text-foreground">Verification</span>
                <span className={cn(
                    'ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium',
                    isVerified && 'bg-success/15 text-success',
                    user.verificationStatus === 'PENDING' && 'bg-warning/15 text-warning',
                    user.verificationStatus === 'REJECTED' && 'bg-destructive/15 text-destructive',
                    user.verificationStatus === 'NONE' && 'bg-muted text-muted-foreground',
                )}>
                    {user.verificationStatus}
                </span>
            </div>

            {!isVerified && (
                <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5 border-success/30 text-success hover:bg-success/10" disabled={isReviewing}
                        onClick={(e) => { e.stopPropagation(); review({ userId: user.id, approved: true }); }}>
                        {isReviewing ? <SpinnerGap size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                        Verify
                    </Button>
                    {!showReject ? (
                        <Button size="sm" variant="outline" className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
                            onClick={(e) => { e.stopPropagation(); setShowReject(true); }}>
                            <XCircle size={12} /> Reject
                        </Button>
                    ) : (
                        <div className="flex w-full items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Rejection reason..."
                                className="flex-1 rounded-md border border-input bg-transparent px-2 py-1 text-xs" />
                            <Button size="sm" variant="destructive" disabled={!rejectReason.trim() || isReviewing}
                                onClick={() => review({ userId: user.id, approved: false, rejectionReason: rejectReason })}>
                                {isReviewing ? <SpinnerGap size={12} className="animate-spin" /> : 'Confirm'}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {isVerified && (
                <Button size="sm" variant="outline" className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10" disabled={isReviewing}
                    onClick={(e) => { e.stopPropagation(); review({ userId: user.id, approved: false, rejectionReason: 'Revoked by admin' }); }}>
                    {isReviewing ? <SpinnerGap size={12} className="animate-spin" /> : <XCircle size={12} />}
                    Revoke Verification
                </Button>
            )}

            <div className="flex flex-wrap gap-2">
                {[
                    { badge: 'isCertified' as const, icon: Certificate, label: 'Certified', active: user.isCertified },
                    { badge: 'isHygieneVerified' as const, icon: FirstAid, label: 'Hygiene', active: user.isHygieneVerified },
                    { badge: 'isQualityProducts' as const, icon: Diamond, label: 'Quality Products', active: user.isQualityProducts },
                ].map(({ badge, icon: Icon, label, active }) => (
                    <button key={badge} type="button" disabled={isUpdatingBadge}
                        onClick={(e) => { e.stopPropagation(); setBadge({ userId: user.id, badge, value: !active }); }}
                        className={cn(
                            'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors duration-150',
                            active ? 'bg-primary/15 text-primary ring-1 ring-primary/30' : 'bg-muted text-muted-foreground hover:bg-muted/80',
                            isUpdatingBadge && 'opacity-50 cursor-not-allowed',
                        )}>
                        <Icon size={12} weight={active ? 'fill' : 'regular'} />
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function UserImagesRow({ userId, phone, user, isOpen }: { userId: string; phone: string | null; user: AdminUser; isOpen: boolean }): React.ReactElement | null {
    const { t } = useLanguage();
    const [page, setPage] = useState(1);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
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
                    <div ref={contentRef} className="bg-muted/30 p-4 space-y-4">
                        <UserVerificationActions user={user} />
                        {phone && (
                            <div className="mb-3 flex items-center gap-2 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                <span className="font-medium text-foreground">{phone}</span>
                            </div>
                        )}
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
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); setLightboxSrc(getServerImageUrl(group.originalUrl)); }} className="group relative cursor-zoom-in">
                                                        <img src={getThumbUrl(group.originalUrl, 128)} alt="" className="h-16 w-16 rounded-md object-cover ring-1 ring-border/50 transition-all duration-200 group-hover:ring-2 group-hover:ring-primary/50" loading="lazy" />
                                                    </button>
                                                    <span className="text-[10px] text-muted-foreground">Before</span>
                                                </div>

                                                {/* Arrow */}
                                                <div className="flex h-16 items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                                </div>

                                                {/* After(s) */}
                                                {group.results.map((img) => (
                                                    <div key={img.variantIndex} className="flex flex-col items-center gap-1">
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); setLightboxSrc(getServerImageUrl(img.imageUrl)); }} className="group relative cursor-zoom-in">
                                                            <img src={getThumbUrl(img.imageUrl, 128)} alt="" className="h-16 w-16 rounded-md object-cover ring-1 ring-border/50 transition-all duration-200 group-hover:ring-2 group-hover:ring-primary/50" loading="lazy" />
                                                        </button>
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
            {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
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
    const limitParam = Number(searchParams.get('limit')) || DEFAULT_LIMIT;
    const limit = LIMIT_OPTIONS.includes(limitParam as typeof LIMIT_OPTIONS[number]) ? limitParam : DEFAULT_LIMIT;

    const [searchInput, setSearchInput] = useState(searchQuery);
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

    const { users, pagination, isLoading } = useAdminUsers(page, limit, searchQuery || undefined);

    const handleLimitChange = useCallback((value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('limit', value);
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
    }, [searchParams, pathname, router]);

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
                <div className="flex items-center gap-3">
                    <Select value={String(limit)} onValueChange={handleLimitChange}>
                        <SelectTrigger className="w-25">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {LIMIT_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={String(opt)}>
                                    {opt === 1000 ? t('admin.all') : opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        placeholder={t('admin.search_placeholder')}
                        value={searchInput}
                        onChange={handleSearchChange}
                        className="max-w-xs"
                    />
                </div>
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
                                    <UserImagesRow userId={user.id} phone={user.phone} user={user} isOpen={expandedUserId === user.id} />
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
