'use client';

import { useStudioState } from '../hooks/useStudioState';
import { EditorView } from './EditorView';
import { DailyLimitReached } from './DailyLimitReached';

export function UploadSection(): React.ReactElement {
    const state = useStudioState();

    // Show daily limit overlay when user has exhausted their free generations
    if (state.isLimitReached) {
        return <DailyLimitReached countdown={state.countdown} />;
    }

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
