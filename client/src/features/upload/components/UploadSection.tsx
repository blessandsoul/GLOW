'use client';

import dynamic from 'next/dynamic';
import { Sparkle, ArrowLeft, ArrowCounterClockwise } from '@phosphor-icons/react';
import { useStudioState } from '../hooks/useStudioState';
import { EditorView } from './EditorView';

const ResultsView = dynamic(() => import('./ResultsView').then((m) => m.ResultsView), { ssr: false });
const BeforeAfterResults = dynamic(() => import('@/features/before-after/components/BeforeAfterResults').then((m) => m.BeforeAfterResults), { ssr: false });
const RetouchPanel = dynamic(() => import('@/features/retouch/components/RetouchPanel').then((m) => m.RetouchPanel), { ssr: false });

export function UploadSection(): React.ReactElement {
    const state = useStudioState();

    // Before/After results
    if (state.showBAResults && state.baJob) {
        return (
            <div className="flex w-full flex-col overflow-y-auto p-5 md:p-6 [scrollbar-width:thin]">
                <BeforeAfterResults job={state.baJob} isAuthenticated={state.isAuthenticated} onDownload={state.handleDownload} />
                {(state.baJob.status === 'DONE' || state.baJob.status === 'FAILED') && (
                    <ResetBar t={state.t} onReset={state.handleReset} />
                )}
            </div>
        );
    }

    // Retouch
    if (state.showResults && state.currentJob && state.retouchUrl) {
        return (
            <div className="flex w-full flex-col overflow-y-auto p-5 md:p-6 [scrollbar-width:thin]">
                <RetouchPanel jobId={state.currentJob.id} imageUrl={state.retouchUrl} onClose={() => state.setRetouchUrl(null)} />
            </div>
        );
    }

    // Loading skeleton
    if (state.showResults && !state.currentJob) {
        return (
            <div className="flex w-full flex-col items-center justify-center gap-6 py-16 px-6">
                <div className="relative">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Sparkle size={28} weight="fill" className="animate-pulse text-primary" />
                    </div>
                    <div className="absolute -inset-1 rounded-2xl bg-primary/5 animate-ping" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">{state.t('upload.photo_uploading')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{state.t('upload.photo_sending')}</p>
                </div>
                <div className="flex w-full max-w-xs justify-center">
                    <div className="aspect-3/4 w-full animate-pulse rounded-xl bg-muted" />
                </div>
            </div>
        );
    }

    // Results
    if (state.showResults && state.currentJob) {
        return (
            <ResultsView
                t={state.t}
                currentJob={state.currentJob}
                isAuthenticated={state.isAuthenticated}
                isDemoJob={state.isDemoJob}
                showStories={state.showStories}
                setShowStories={state.setShowStories}
                setRetouchUrl={state.setRetouchUrl}
                handleDownload={state.handleDownload}
                handleReset={state.handleReset}
            />
        );
    }

    // Editor
    return (
        <EditorView
            t={state.t}
            language={state.language}
            mode={state.mode}
            setMode={state.setMode}
            selectedStyle={state.selectedStyle}
            setSelectedStyle={state.setSelectedStyle}
            productSettings={state.productSettings}
            setProductSettings={state.setProductSettings}
            trendStyles={state.trendStyles}
            isLoadingTrends={state.isLoadingTrends}
            batchResult={state.batchResult}
            isUploading={state.isUploading}
            isAuthenticated={state.isAuthenticated}
            isProUser={state.isProUser}
            userCredits={state.userCredits}
            handleFileSelect={state.handleFileSelect}
            handleBASubmit={state.handleBASubmit}
            handleBatchComplete={state.handleBatchComplete}
            isBAUploading={state.isBAUploading}
        />
    );
}

function ResetBar({ t, onReset }: { t: (key: string) => string; onReset: () => void }): React.ReactElement {
    return (
        <div className="flex items-center justify-center gap-2 pt-4 pb-2">
            <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-1.5 rounded-full border border-border/50 bg-background px-4 py-1.5 text-xs font-medium text-foreground transition-all duration-150 hover:border-border hover:shadow-sm"
            >
                <ArrowLeft size={12} />
                {t('ui.text_8kq3qa')}
            </button>
            <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
                <ArrowCounterClockwise size={12} />
                {t('ui.text_84crcz')}
            </button>
        </div>
    );
}
