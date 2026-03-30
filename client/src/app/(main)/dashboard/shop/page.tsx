'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SpinnerGap } from '@phosphor-icons/react';
import { useAppSelector } from '@/store/hooks';
import { ROUTES } from '@/lib/constants/routes';
import { useSellerStatus } from '@/features/marketplace/hooks/useMarketplace';
import { SellerApplicationForm } from '@/features/marketplace/components/SellerApplicationForm';
import { SellerApplicationStatus } from '@/features/marketplace/components/SellerApplicationStatus';
import { SellerProductsDashboard } from '@/features/marketplace/components/SellerProductsDashboard';

export default function DashboardShopPage(): React.ReactElement {
    const router = useRouter();
    const { isAuthenticated, user, isInitializing } = useAppSelector((s) => s.auth);
    const { sellerStatus, isLoading } = useSellerStatus();

    useEffect(() => {
        if (!isInitializing && !isAuthenticated) {
            router.replace(ROUTES.LOGIN);
        }
    }, [isAuthenticated, isInitializing, router]);

    useEffect(() => {
        if (!isInitializing && isAuthenticated && user?.role !== 'MASTER') {
            router.replace(ROUTES.DASHBOARD);
        }
    }, [isAuthenticated, isInitializing, user, router]);

    if (isInitializing || isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <SpinnerGap size={24} className="animate-spin text-muted-foreground" />
            </div>
        );
    }

    const status = sellerStatus?.sellerStatus ?? 'NONE';

    return (
        <div className="container mx-auto px-4 py-8 md:px-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">Мой магазин</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Управляйте своими товарами на Glow.GE Marketplace
                </p>
            </div>

            {/* NONE or REJECTED → show application form */}
            {(status === 'NONE' || status === 'REJECTED') && (
                <SellerApplicationForm
                    previousStatus={status === 'REJECTED' ? 'REJECTED' : undefined}
                    rejectedReason={sellerStatus?.sellerRejectedReason}
                />
            )}

            {/* PENDING → show status */}
            {status === 'PENDING' && (
                <SellerApplicationStatus status="PENDING" />
            )}

            {/* APPROVED → show product dashboard */}
            {status === 'APPROVED' && (
                <SellerProductsDashboard />
            )}
        </div>
    );
}
