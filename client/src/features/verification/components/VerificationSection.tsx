'use client';

import React from 'react';
import {
    Clock,
    CheckCircle,
    Warning,
    Certificate,
    SprayBottle,
    Diamond,
} from '@phosphor-icons/react';
import { useAppSelector } from '@/store/hooks';
import {
    useVerificationState,
    useRequestVerification,
    useUploadIdDocument,
    useUploadCertificate,
    useUploadHygienePics,
    useUploadQualityProductsPics,
} from '../hooks/useVerification';
import { VerificationNoneView } from './VerificationNoneView';
import { BadgeUploadCard } from './BadgeUploadCard';
import { IdUploadArea } from './IdUploadArea';

// ─── Pending View ────────────────────────────────────────────────────────────

function PendingView({ idDocumentUrl }: { idDocumentUrl: string | null }): React.ReactElement {
    return (
        <section className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10">
                    <Clock size={20} className="text-warning" weight="fill" />
                </div>
                <div>
                    <h2 className="text-base font-semibold text-foreground">Verification Under Review</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Your verification request is being reviewed by our team. This usually takes 1–2 business days.
                    </p>
                </div>
            </div>

            {idDocumentUrl && (
                <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Submitted ID document</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={idDocumentUrl}
                        alt="Submitted ID document"
                        className="h-20 w-32 rounded-lg object-cover border border-border/50"
                    />
                </div>
            )}
        </section>
    );
}

// ─── Verified View ───────────────────────────────────────────────────────────

interface VerifiedViewProps {
    verifiedAt: string | null;
    certificateUrl: string | null;
    hygienePicsUrl: string[] | null;
    qualityProductsUrl: string[] | null;
    isCertified: boolean;
    isHygieneVerified: boolean;
    isQualityProducts: boolean;
    uploadCertificate: (file: File) => void;
    isUploadingCert: boolean;
    uploadHygiene: (files: File[]) => void;
    isUploadingHygiene: boolean;
    uploadQuality: (files: File[]) => void;
    isUploadingQuality: boolean;
}

function VerifiedView({
    verifiedAt,
    certificateUrl,
    hygienePicsUrl,
    qualityProductsUrl,
    isCertified,
    isHygieneVerified,
    isQualityProducts,
    uploadCertificate,
    isUploadingCert,
    uploadHygiene,
    isUploadingHygiene,
    uploadQuality,
    isUploadingQuality,
}: VerifiedViewProps): React.ReactElement {
    const verifiedDate = verifiedAt
        ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(
              new Date(verifiedAt),
          )
        : null;

    return (
        <section className="rounded-xl border border-border/50 bg-card p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10">
                    <CheckCircle size={20} className="text-success" weight="fill" />
                </div>
                <div>
                    <h2 className="text-base font-semibold text-foreground">Verified Master</h2>
                    {verifiedDate && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Verified on {verifiedDate}
                        </p>
                    )}
                </div>
            </div>

            {/* Tier 2 badges */}
            <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Trust badges
                </p>
                <div className="space-y-3">
                    <BadgeUploadCard
                        icon={Certificate}
                        title="Certified Professional"
                        description="Upload your professional certificate"
                        isApproved={isCertified}
                        existingUrls={certificateUrl}
                        onUpload={uploadCertificate as (files: File | File[]) => void}
                        isPending={isUploadingCert}
                        multiple={false}
                    />
                    <BadgeUploadCard
                        icon={SprayBottle}
                        title="Hygiene Verified"
                        description="Upload photos of your clean workspace and tools"
                        isApproved={isHygieneVerified}
                        existingUrls={hygienePicsUrl}
                        onUpload={uploadHygiene as (files: File | File[]) => void}
                        isPending={isUploadingHygiene}
                        multiple={true}
                        maxFiles={10}
                    />
                    <BadgeUploadCard
                        icon={Diamond}
                        title="Quality Products"
                        description="Upload photos showing the quality products you use"
                        isApproved={isQualityProducts}
                        existingUrls={qualityProductsUrl}
                        onUpload={uploadQuality as (files: File | File[]) => void}
                        isPending={isUploadingQuality}
                        multiple={true}
                        maxFiles={10}
                    />
                </div>
            </div>
        </section>
    );
}

// ─── Rejected View ───────────────────────────────────────────────────────────

interface RejectedViewProps {
    rejectionReason: string | null;
    idDocumentUrl: string | null;
    onUploadId: (file: File) => void;
    isUploadingId: boolean;
    onRequest: (experienceYears?: number) => void;
    isRequesting: boolean;
}

function RejectedView({
    rejectionReason,
    idDocumentUrl,
    onUploadId,
    isUploadingId,
    onRequest,
    isRequesting,
}: RejectedViewProps): React.ReactElement {
    return (
        <section className="rounded-xl border border-destructive/30 bg-card p-6 space-y-4">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                    <Warning size={20} className="text-destructive" weight="fill" />
                </div>
                <div>
                    <h2 className="text-base font-semibold text-foreground">Verification Rejected</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        You can re-upload your ID and resubmit your request.
                    </p>
                </div>
            </div>

            {rejectionReason && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-xs font-semibold text-destructive mb-0.5">Rejection reason</p>
                    <p className="text-sm text-destructive/80">{rejectionReason}</p>
                </div>
            )}

            <IdUploadArea
                currentUrl={idDocumentUrl}
                onUpload={onUploadId}
                isPending={isUploadingId}
            />

            <button
                type="button"
                onClick={() => onRequest()}
                disabled={!idDocumentUrl || isRequesting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
                Resubmit Verification Request
            </button>
        </section>
    );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function VerificationSkeleton(): React.ReactElement {
    return (
        <section className="rounded-xl border border-border/50 bg-card p-6 space-y-4 animate-pulse">
            <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted/60" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 rounded bg-muted/60" />
                    <div className="h-3 w-64 rounded bg-muted/40" />
                </div>
            </div>
            <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-4 w-full rounded bg-muted/40" />
                ))}
            </div>
        </section>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function VerificationSection(): React.ReactElement {
    const user = useAppSelector((s) => s.auth.user);
    const { state, isLoading } = useVerificationState();
    const { request, isPending: isRequesting } = useRequestVerification();
    const { upload: uploadId, isPending: isUploadingId } = useUploadIdDocument();
    const { upload: uploadCert, isPending: isUploadingCert } = useUploadCertificate();
    const { upload: uploadHygiene, isPending: isUploadingHygiene } = useUploadHygienePics();
    const { upload: uploadQuality, isPending: isUploadingQuality } = useUploadQualityProductsPics();

    // Only show for MASTER role
    if (!user || user.role !== 'MASTER') return <></>;

    if (isLoading || !state) return <VerificationSkeleton />;

    const { verificationStatus } = state;

    if (verificationStatus === 'NONE') {
        return (
            <VerificationNoneView
                user={user}
                idDocumentUrl={state.idDocumentUrl}
                onUploadId={uploadId}
                isUploadingId={isUploadingId}
                onRequest={request}
                isRequesting={isRequesting}
            />
        );
    }

    if (verificationStatus === 'PENDING') {
        return <PendingView idDocumentUrl={state.idDocumentUrl} />;
    }

    if (verificationStatus === 'VERIFIED') {
        return (
            <VerifiedView
                verifiedAt={state.verifiedAt}
                certificateUrl={state.certificateUrl}
                hygienePicsUrl={state.hygienePicsUrl}
                qualityProductsUrl={state.qualityProductsUrl}
                isCertified={state.isCertified}
                isHygieneVerified={state.isHygieneVerified}
                isQualityProducts={state.isQualityProducts}
                uploadCertificate={uploadCert}
                isUploadingCert={isUploadingCert}
                uploadHygiene={uploadHygiene}
                isUploadingHygiene={isUploadingHygiene}
                uploadQuality={uploadQuality}
                isUploadingQuality={isUploadingQuality}
            />
        );
    }

    if (verificationStatus === 'REJECTED') {
        return (
            <RejectedView
                rejectionReason={state.rejectionReason}
                idDocumentUrl={state.idDocumentUrl}
                onUploadId={uploadId}
                isUploadingId={isUploadingId}
                onRequest={request}
                isRequesting={isRequesting}
            />
        );
    }

    return <></>;
}
