'use client';

import React, { useState, useCallback } from 'react';
import {
    ShieldCheck,
    Clock,
    CheckCircle,
    XCircle,
    User,
    CaretLeft,
    CaretRight,
    SpinnerGap,
    Warning,
    Eye,
    Certificate,
    SprayBottle,
    Diamond,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    useAdminPendingVerifications,
    useAdminAllVerifications,
    useAdminReviewVerification,
    useAdminSetBadge,
} from '@/features/verification/hooks/useVerification';
import type { VerificationRequest, VerificationStatus } from '@/features/verification/types/verification.types';

const LIMIT = 10;

type TabFilter = 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED';

function getImageUrl(path: string): string {
    if (path.startsWith('http')) return path;
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    return `${base}${path}`;
}

function StatusBadge({ status }: { status: VerificationStatus }): React.ReactElement {
    if (status === 'PENDING') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                <Clock size={11} weight="fill" />
                Pending
            </span>
        );
    }
    if (status === 'VERIFIED') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                <CheckCircle size={11} weight="fill" />
                Verified
            </span>
        );
    }
    if (status === 'REJECTED') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                <XCircle size={11} weight="fill" />
                Rejected
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            None
        </span>
    );
}

function ImageThumb({ url, label }: { url: string; label: string }): React.ReactElement {
    return (
        <a
            href={getImageUrl(url)}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-block overflow-hidden rounded-lg border border-border/50 transition-all duration-200 hover:border-primary/50 hover:shadow-md"
            title={`View ${label}`}
        >
            <img
                src={getImageUrl(url)}
                alt={label}
                className="h-16 w-16 object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 group-hover:bg-black/30">
                <Eye size={16} className="text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </div>
        </a>
    );
}

interface BadgeToggleProps {
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    isDisabled: boolean;
    isPending: boolean;
    onToggle: () => void;
}

function BadgeToggle({ label, icon, isActive, isDisabled, isPending, onToggle }: BadgeToggleProps): React.ReactElement {
    return (
        <button
            onClick={onToggle}
            disabled={isDisabled || isPending}
            className={[
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-200',
                isActive
                    ? 'border-success/40 bg-success/10 text-success hover:bg-success/20'
                    : 'border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/60',
                isDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
            ].join(' ')}
            title={isDisabled ? 'Upload required to enable this badge' : isActive ? `Revoke ${label}` : `Grant ${label}`}
        >
            {isPending ? <SpinnerGap size={12} className="animate-spin" /> : icon}
            {label}
            {isActive ? (
                <CheckCircle size={11} weight="fill" className="text-success" />
            ) : (
                <XCircle size={11} className="text-muted-foreground/50" />
            )}
        </button>
    );
}

interface RequestCardProps {
    request: VerificationRequest;
}

function RequestCard({ request }: RequestCardProps): React.ReactElement {
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const { review, isPending: isReviewing } = useAdminReviewVerification();
    const { setBadge, isPending: isBadging } = useAdminSetBadge();

    const initials = `${(request.firstName ?? '')[0] ?? ''}${(request.lastName ?? '')[0] ?? ''}`.toUpperCase();

    const handleApprove = useCallback(() => {
        review({ userId: request.userId, approved: true });
    }, [review, request.userId]);

    const handleReject = useCallback(() => {
        if (!rejectionReason.trim()) return;
        review({ userId: request.userId, approved: false, rejectionReason: rejectionReason.trim() });
        setShowRejectForm(false);
        setRejectionReason('');
    }, [review, request.userId, rejectionReason]);

    const handleToggleBadge = useCallback((badge: string, currentValue: boolean) => {
        setBadge({ userId: request.userId, badge, value: !currentValue });
    }, [setBadge, request.userId]);

    const hasCertificate = !!request.certificateUrl;
    const hasHygiene = (request.hygienePicsUrl?.length ?? 0) > 0;
    const hasQualityProducts = (request.qualityProductsUrl?.length ?? 0) > 0;

    return (
        <div className="rounded-xl border border-border/50 bg-card p-5 transition-all duration-300 hover:shadow-md">
            {/* Header row */}
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="shrink-0">
                    {request.avatar ? (
                        <img
                            src={getImageUrl(request.avatar)}
                            alt=""
                            className="h-12 w-12 rounded-xl object-cover"
                        />
                    ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                            {initials || <User size={20} />}
                        </div>
                    )}
                </div>

                {/* Master info */}
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">
                            {request.firstName} {request.lastName}
                        </span>
                        <StatusBadge status={request.verificationStatus} />
                        {request.phoneVerified ? (
                            <span className="inline-flex items-center gap-1 text-xs text-success">
                                <CheckCircle size={12} weight="fill" />
                                Phone verified
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <XCircle size={12} />
                                Phone not verified
                            </span>
                        )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {request.niche && <span>{request.niche}</span>}
                        {request.city && <span>{request.city}</span>}
                        {request.experienceYears != null && (
                            <span>{request.experienceYears} yr{request.experienceYears !== 1 ? 's' : ''} exp</span>
                        )}
                        <span>{request.portfolioCount} portfolio item{request.portfolioCount !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>

            {/* Documents row */}
            <div className="mt-4 flex flex-wrap gap-4">
                {request.idDocumentUrl && (
                    <div>
                        <p className="mb-1.5 text-xs font-medium text-muted-foreground">ID Document</p>
                        <ImageThumb url={request.idDocumentUrl} label="ID Document" />
                    </div>
                )}
                {request.certificateUrl && (
                    <div>
                        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Certificate</p>
                        <ImageThumb url={request.certificateUrl} label="Certificate" />
                    </div>
                )}
                {hasHygiene && (
                    <div>
                        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Hygiene Photos</p>
                        <div className="flex flex-wrap gap-1.5">
                            {request.hygienePicsUrl!.map((url, i) => (
                                <ImageThumb key={i} url={url} label={`Hygiene photo ${i + 1}`} />
                            ))}
                        </div>
                    </div>
                )}
                {hasQualityProducts && (
                    <div>
                        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Quality Products</p>
                        <div className="flex flex-wrap gap-1.5">
                            {request.qualityProductsUrl!.map((url, i) => (
                                <ImageThumb key={i} url={url} label={`Quality product ${i + 1}`} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Badge toggles */}
            <div className="mt-4 flex flex-wrap gap-2">
                <BadgeToggle
                    label="Certified"
                    icon={<Certificate size={12} />}
                    isActive={request.isCertified}
                    isDisabled={!hasCertificate}
                    isPending={isBadging}
                    onToggle={() => handleToggleBadge('isCertified', request.isCertified)}
                />
                <BadgeToggle
                    label="Hygiene"
                    icon={<SprayBottle size={12} />}
                    isActive={request.isHygieneVerified}
                    isDisabled={!hasHygiene}
                    isPending={isBadging}
                    onToggle={() => handleToggleBadge('isHygieneVerified', request.isHygieneVerified)}
                />
                <BadgeToggle
                    label="Quality Products"
                    icon={<Diamond size={12} />}
                    isActive={request.isQualityProducts}
                    isDisabled={!hasQualityProducts}
                    isPending={isBadging}
                    onToggle={() => handleToggleBadge('isQualityProducts', request.isQualityProducts)}
                />
            </div>

            {/* Action buttons for PENDING */}
            {request.verificationStatus === 'PENDING' && (
                <div className="mt-4 border-t border-border/40 pt-4">
                    {!showRejectForm ? (
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={handleApprove}
                                disabled={isReviewing}
                                className="bg-success text-success-foreground hover:bg-success/90"
                            >
                                {isReviewing ? (
                                    <SpinnerGap size={14} className="animate-spin" />
                                ) : (
                                    <CheckCircle size={14} weight="fill" />
                                )}
                                Approve
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setShowRejectForm(true)}
                                disabled={isReviewing}
                            >
                                <XCircle size={14} weight="fill" />
                                Reject
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <textarea
                                value={rejectionReason}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
                                placeholder="Explain why the verification was rejected..."
                                className="min-h-18 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={handleReject}
                                    disabled={!rejectionReason.trim() || isReviewing}
                                >
                                    {isReviewing ? (
                                        <SpinnerGap size={14} className="animate-spin" />
                                    ) : (
                                        <Warning size={14} weight="fill" />
                                    )}
                                    Confirm Reject
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setShowRejectForm(false);
                                        setRejectionReason('');
                                    }}
                                    disabled={isReviewing}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function RequestsSkeleton(): React.ReactElement {
    return (
        <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-card p-5">
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-muted" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

interface VerificationListProps {
    activeTab: TabFilter;
    page: number;
    onPageChange: (p: number) => void;
}

function VerificationList({ activeTab, page, onPageChange }: VerificationListProps): React.ReactElement {
    const statusFilter = activeTab === 'ALL' ? undefined : activeTab;
    const isPendingTab = activeTab === 'PENDING';

    const pendingResult = useAdminPendingVerifications(page, LIMIT);
    const allResult = useAdminAllVerifications(page, LIMIT, statusFilter);

    const { requests, pagination, isLoading } = isPendingTab ? pendingResult : allResult;

    if (isLoading) return <RequestsSkeleton />;

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <ShieldCheck size={40} className="mb-3 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">No verification requests found</p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                    {activeTab === 'PENDING' ? 'All requests have been reviewed.' : 'No requests match this filter.'}
                </p>
            </div>
        );
    }

    const totalPages = pagination?.totalPages ?? 1;

    return (
        <div className="space-y-3">
            {requests.map((req) => (
                <RequestCard key={req.userId} request={req} />
            ))}

            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-muted-foreground">
                        Page {page} of {totalPages}
                        {pagination && (
                            <span className="ml-1">
                                &middot; {pagination.totalItems} total
                            </span>
                        )}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onPageChange(page - 1)}
                            disabled={page <= 1}
                            className="h-8 w-8 p-0"
                            aria-label="Previous page"
                        >
                            <CaretLeft size={14} />
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onPageChange(page + 1)}
                            disabled={page >= totalPages}
                            className="h-8 w-8 p-0"
                            aria-label="Next page"
                        >
                            <CaretRight size={14} />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

const TABS: { key: TabFilter; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'VERIFIED', label: 'Verified' },
    { key: 'REJECTED', label: 'Rejected' },
];

export function AdminVerificationQueue(): React.ReactElement {
    const [activeTab, setActiveTab] = useState<TabFilter>('PENDING');
    const [page, setPage] = useState(1);

    const { requests: pendingRequests } = useAdminPendingVerifications(1, 1);
    const pendingCount = pendingRequests.length > 0 ? undefined : undefined;

    // We fetch a small query just to get the pending count for the badge
    const { pagination: pendingPagination } = useAdminPendingVerifications(1, LIMIT);
    const totalPending = pendingPagination?.totalItems ?? 0;

    const handleTabChange = useCallback((tab: TabFilter) => {
        setActiveTab(tab);
        setPage(1);
    }, []);

    return (
        <section className="rounded-xl border border-border/50 bg-card shadow-sm">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 px-5 py-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <ShieldCheck size={16} className="text-primary" />
                    </div>
                    <h2 className="text-base font-semibold tracking-tight text-foreground">
                        Verification Requests
                    </h2>
                    {totalPending > 0 && (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-warning/20 px-1.5 text-xs font-semibold tabular-nums text-warning">
                            {totalPending}
                        </span>
                    )}
                </div>
            </div>

            {/* Tab filters */}
            <div className="flex items-center gap-1 border-b border-border/50 px-5 py-3">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => handleTabChange(tab.key)}
                        className={[
                            'rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150',
                            activeTab === tab.key
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                        ].join(' ')}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="p-5">
                <VerificationList
                    activeTab={activeTab}
                    page={page}
                    onPageChange={setPage}
                />
            </div>
        </section>
    );
}
