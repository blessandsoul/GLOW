'use client';

import { useState } from 'react';
import { Storefront, Clock, CheckCircle, XCircle, User, CaretLeft, CaretRight, SpinnerGap } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { getServerImageUrl } from '@/lib/utils/image';
import { useAdminSellers, useAdminReviewSeller } from '@/features/marketplace/hooks/useMarketplace';
import type { ISellerApplication, SellerStatus } from '@/features/marketplace/types/marketplace.types';

const LIMIT = 10;

type TabFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

function StatusBadge({ status }: { status: SellerStatus }): React.ReactElement {
    if (status === 'PENDING') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning-foreground">
                <Clock size={11} weight="fill" />
                Pending
            </span>
        );
    }
    if (status === 'APPROVED') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                <CheckCircle size={11} weight="fill" />
                Approved
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

function SellerCard({ seller }: { seller: ISellerApplication }): React.ReactElement {
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    const { reviewSeller, isPending } = useAdminReviewSeller();

    const avatarUrl = seller.user.avatar ? getServerImageUrl(seller.user.avatar) : null;

    function handleApprove(): void {
        reviewSeller({ userId: seller.userId, action: 'approve' });
    }

    function handleReject(): void {
        if (!rejectReason.trim()) return;
        reviewSeller({ userId: seller.userId, action: 'reject', reason: rejectReason.trim() });
        setShowRejectForm(false);
        setRejectReason('');
    }

    return (
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            {/* User row */}
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={seller.user.firstName} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <User size={16} className="text-muted-foreground" />
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                        {seller.user.firstName} {seller.user.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">@{seller.user.username ?? 'no username'}</p>
                </div>
                <StatusBadge status={seller.sellerStatus} />
            </div>

            {/* Meta */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                {seller.sellerRequestedAt && (
                    <span>Подал: {new Date(seller.sellerRequestedAt).toLocaleDateString('ru-RU')}</span>
                )}
                {seller.sellerRejectedReason && (
                    <span className="col-span-2 text-destructive">Причина: {seller.sellerRejectedReason}</span>
                )}
            </div>

            {/* Actions for PENDING */}
            {seller.sellerStatus === 'PENDING' && (
                <div className="mt-4 space-y-2">
                    {!showRejectForm ? (
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                className="flex-1 bg-success/10 text-success hover:bg-success/20"
                                variant="ghost"
                                onClick={handleApprove}
                                disabled={isPending}
                            >
                                {isPending ? <SpinnerGap size={14} className="animate-spin" /> : <CheckCircle size={14} weight="fill" />}
                                Одобрить
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="flex-1 text-destructive hover:bg-destructive/10"
                                onClick={() => setShowRejectForm(true)}
                                disabled={isPending}
                            >
                                <XCircle size={14} weight="fill" />
                                Отклонить
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Причина отклонения..."
                                rows={2}
                                className="w-full resize-none rounded-lg border border-border/50 bg-muted/50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setShowRejectForm(false)}>
                                    Отмена
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="flex-1 text-xs"
                                    onClick={handleReject}
                                    disabled={!rejectReason.trim() || isPending}
                                >
                                    Подтвердить отказ
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function AdminSellerQueue(): React.ReactElement {
    const [activeTab, setActiveTab] = useState<TabFilter>('PENDING');
    const [page, setPage] = useState(1);

    const statusParam = activeTab === 'ALL' ? undefined : activeTab;
    const { sellers, pagination, isLoading } = useAdminSellers(page, LIMIT, statusParam);

    const tabs: { key: TabFilter; label: string }[] = [
        { key: 'PENDING', label: 'Pending' },
        { key: 'ALL', label: 'All' },
        { key: 'APPROVED', label: 'Approved' },
        { key: 'REJECTED', label: 'Rejected' },
    ];

    function handleTabChange(tab: TabFilter): void {
        setActiveTab(tab);
        setPage(1);
    }

    return (
        <section className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
            {/* Header */}
            <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Storefront size={16} className="text-primary" weight="fill" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">Seller Applications</h2>
                {pagination && (
                    <span className="ml-auto text-xs text-muted-foreground">{pagination.totalItems} total</span>
                )}
            </div>

            {/* Tabs */}
            <div className="mb-4 flex gap-1 rounded-xl bg-muted/50 p-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => handleTabChange(tab.key)}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                            activeTab === tab.key
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-10">
                    <SpinnerGap size={20} className="animate-spin text-muted-foreground" />
                </div>
            ) : sellers.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground">
                    Заявок нет
                </div>
            ) : (
                <div className="space-y-3">
                    {sellers.map((seller) => (
                        <SellerCard key={seller.userId} seller={seller} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={!pagination.hasPreviousPage}
                    >
                        <CaretLeft size={14} />
                    </Button>
                    <span className="text-xs text-muted-foreground">
                        {page} / {pagination.totalPages}
                    </span>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={!pagination.hasNextPage}
                    >
                        <CaretRight size={14} />
                    </Button>
                </div>
            )}
        </section>
    );
}
