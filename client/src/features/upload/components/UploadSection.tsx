'use client';

import { useStudioState } from '../hooks/useStudioState';
import { EditorView } from './EditorView';

export function UploadSection(): React.ReactElement {
    const state = useStudioState();

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
