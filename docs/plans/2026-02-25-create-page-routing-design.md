# Create Page URL-Based Routing — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace `showResults` boolean state toggle with URL-based routing so `/create` is always the form and `/create/[jobId]` shows results. This fixes the header "Create" button doing nothing when viewing results, and adds a prominent "Create new" button.

**Architecture:** After upload, `router.push('/create/{jobId}')` navigates to a new dynamic route. The `[jobId]/page.tsx` reads the param and renders results with polling. The form page (`/create`) stays clean. Guest demos use `jobId='demo'` with state passed via a lightweight context.

**Tech Stack:** Next.js App Router (dynamic route segment), `useJobPolling` hook, existing `useUpload`/`useBeforeAfter` hooks, `next/navigation` router.

---

### Task 1: Add route constant and create `[jobId]` page shell

**Files:**
- Modify: `client/src/lib/constants/routes.ts`
- Create: `client/src/app/(main)/create/[jobId]/page.tsx`

**Step 1: Add `CREATE_RESULT` route helper to constants**

In `client/src/lib/constants/routes.ts`, add after the `CREATE` line:

```typescript
CREATE_RESULT: (jobId: string) => `/create/${jobId}` as const,
```

So it matches the existing pattern used by `SHOWCASE` and `PORTFOLIO_PUBLIC`.

**Step 2: Create the `[jobId]/page.tsx` page**

Create `client/src/app/(main)/create/[jobId]/page.tsx`:

```tsx
import { ResultsPageClient } from '@/features/upload/components/ResultsPageClient';

interface CreateResultPageProps {
    params: Promise<{ jobId: string }>;
}

export default async function CreateResultPage({ params }: CreateResultPageProps): Promise<React.ReactElement> {
    const { jobId } = await params;
    return <ResultsPageClient jobId={jobId} />;
}
```

This is a Server Component that extracts the param and passes it to a Client Component (which we'll build in Task 2).

**Step 3: Commit**

```bash
git add client/src/lib/constants/routes.ts client/src/app/\(main\)/create/\[jobId\]/page.tsx
git commit -m "feat: add /create/[jobId] dynamic route and route constant"
```

---

### Task 2: Create `ResultsPageClient` component

**Files:**
- Create: `client/src/features/upload/components/ResultsPageClient.tsx`

**Step 1: Build the client component**

Create `client/src/features/upload/components/ResultsPageClient.tsx`:

```tsx
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Plus, Sparkle, WarningCircle, ArrowCounterClockwise } from '@phosphor-icons/react';
import { useJobPolling } from '@/features/jobs/hooks/useJobPolling';
import { useBeforeAfter } from '@/features/before-after/hooks/useBeforeAfter';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useGuestJob } from '@/features/upload/hooks/useGuestJob';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';
import type { Job } from '@/features/jobs/types/job.types';

const ResultsView = dynamic(() => import('./ResultsView').then((m) => m.ResultsView), { ssr: false });
const BeforeAfterResults = dynamic(() => import('@/features/before-after/components/BeforeAfterResults').then((m) => m.BeforeAfterResults), { ssr: false });
const RetouchPanel = dynamic(() => import('@/features/retouch/components/RetouchPanel').then((m) => m.RetouchPanel), { ssr: false });

interface ResultsPageClientProps {
    jobId: string;
}

export function ResultsPageClient({ jobId }: ResultsPageClientProps): React.ReactElement {
    const { t } = useLanguage();
    const { isAuthenticated } = useAuth();
    const isDemo = jobId === 'demo';
    const isBA = jobId.startsWith('ba-');

    // For demo jobs, use guest job context; for real jobs, poll the API
    const { guestJob } = useGuestJob();
    const { job: polledJob, error: pollingError } = useJobPolling(isDemo ? null : jobId);
    const { job: baJob } = useBeforeAfter();

    const [showStories, setShowStories] = useState(false);
    const [retouchUrl, setRetouchUrl] = useState<string | null>(null);

    // Determine the active job
    const currentJob: Job | null = isDemo ? guestJob : polledJob;

    // Download handler
    const handleDownload = async (url: string, id: string, variantIndex: number, branded: boolean = false): Promise<void> => {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';
        const downloadUrl = `${apiBase}/jobs/${id}/download?variant=${variantIndex}&branded=${branded ? 1 : 0}`;
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `glowge-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Before/After results
    if (isBA && baJob) {
        return (
            <ResultsPageShell>
                <BeforeAfterResults job={baJob} isAuthenticated={isAuthenticated} onDownload={handleDownload} />
                {(baJob.status === 'DONE' || baJob.status === 'FAILED') && (
                    <CreateNewBar t={t} />
                )}
            </ResultsPageShell>
        );
    }

    // Retouch panel
    if (currentJob && retouchUrl) {
        return (
            <ResultsPageShell>
                <RetouchPanel jobId={currentJob.id} imageUrl={retouchUrl} onClose={() => setRetouchUrl(null)} />
            </ResultsPageShell>
        );
    }

    // Error state
    if (pollingError) {
        return (
            <ResultsPageShell>
                <div className="flex w-full flex-col items-center gap-4 py-16">
                    <div className="rounded-full bg-destructive/10 p-4">
                        <WarningCircle size={32} className="text-destructive" />
                    </div>
                    <p className="text-sm text-muted-foreground">{pollingError}</p>
                    <CreateNewBar t={t} />
                </div>
            </ResultsPageShell>
        );
    }

    // Loading state (no job yet)
    if (!currentJob) {
        return (
            <ResultsPageShell>
                <div className="flex w-full flex-col items-center justify-center gap-6 py-16 px-6">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Sparkle size={28} weight="fill" className="animate-pulse text-primary" />
                        </div>
                        <div className="absolute -inset-1 rounded-2xl bg-primary/5 animate-ping" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">{t('upload.photo_uploading')}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{t('upload.photo_sending')}</p>
                    </div>
                    <div className="flex w-full max-w-xs justify-center">
                        <div className="aspect-3/4 w-full animate-pulse rounded-xl bg-muted" />
                    </div>
                </div>
            </ResultsPageShell>
        );
    }

    // Results
    return (
        <ResultsPageShell>
            <ResultsView
                t={t}
                currentJob={currentJob}
                isAuthenticated={isAuthenticated}
                isDemoJob={isDemo}
                showStories={showStories}
                setShowStories={setShowStories}
                setRetouchUrl={setRetouchUrl}
                handleDownload={handleDownload}
                handleReset={() => {}}
            />
            {(currentJob.status === 'DONE' || currentJob.status === 'FAILED') && (
                <CreateNewBar t={t} />
            )}
        </ResultsPageShell>
    );
}

function ResultsPageShell({ children }: { children: React.ReactNode }): React.ReactElement {
    return (
        <div className="flex w-full flex-col overflow-y-auto [scrollbar-width:thin]">
            {children}
        </div>
    );
}

function CreateNewBar({ t }: { t: (key: string) => string }): React.ReactElement {
    return (
        <div className="flex items-center justify-center gap-3 pt-4 pb-6">
            <Link
                href={ROUTES.CREATE}
                className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            >
                <Plus size={13} weight="bold" />
                {t('dashboard.create_new')}
            </Link>
        </div>
    );
}
```

**Step 2: Commit**

```bash
git add client/src/features/upload/components/ResultsPageClient.tsx
git commit -m "feat: add ResultsPageClient component for /create/[jobId] route"
```

---

### Task 3: Create `GuestJobProvider` context for demo jobs

The demo flow creates a mock job in memory. Since the form page creates it and the results page displays it, we need a shared context to pass the guest job across the route transition.

**Files:**
- Create: `client/src/features/upload/hooks/useGuestJob.tsx`

**Step 1: Create the guest job context**

Create `client/src/features/upload/hooks/useGuestJob.tsx`:

```tsx
'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import type { Job } from '@/features/jobs/types/job.types';

interface GuestJobContextValue {
    guestJob: Job | null;
    setGuestJob: (job: Job | null) => void;
    clearGuestJob: () => void;
}

const GuestJobContext = createContext<GuestJobContextValue | null>(null);

export function GuestJobProvider({ children }: { children: React.ReactNode }): React.ReactElement {
    const [guestJob, setGuestJob] = useState<Job | null>(null);

    const clearGuestJob = useCallback(() => setGuestJob(null), []);

    return (
        <GuestJobContext.Provider value={{ guestJob, setGuestJob, clearGuestJob }}>
            {children}
        </GuestJobContext.Provider>
    );
}

export function useGuestJob(): GuestJobContextValue {
    const ctx = useContext(GuestJobContext);
    if (!ctx) {
        throw new Error('useGuestJob must be used within GuestJobProvider');
    }
    return ctx;
}
```

**Step 2: Wrap the create layout with the provider**

We need to check if there's a layout file at `client/src/app/(main)/create/layout.tsx`. If not, create one. If `(main)/layout.tsx` exists, we can add it there too, but a create-specific layout is better scoped.

Create `client/src/app/(main)/create/layout.tsx`:

```tsx
import { GuestJobProvider } from '@/features/upload/hooks/useGuestJob';

export default function CreateLayout({ children }: { children: React.ReactNode }): React.ReactElement {
    return <GuestJobProvider>{children}</GuestJobProvider>;
}
```

**Step 3: Commit**

```bash
git add client/src/features/upload/hooks/useGuestJob.tsx client/src/app/\(main\)/create/layout.tsx
git commit -m "feat: add GuestJobProvider context for demo job state across routes"
```

---

### Task 4: Modify `useUpload` to return the job via a callback

Currently `uploadFile` is async internally but doesn't let the caller know the job ID. We need the caller to get the ID so it can `router.push('/create/{id}')`.

**Files:**
- Modify: `client/src/features/upload/hooks/useUpload.ts`

**Step 1: Add `onJobCreated` callback to the upload hook**

Change `useUpload` to accept an optional callback:

```typescript
interface UseUploadOptions {
    onJobCreated?: (job: Job) => void;
}

export function useUpload(options?: UseUploadOptions): UseUploadReturn {
```

In the `uploadFile` callback, after `setJob(data)`, add:

```typescript
setJob(data);
options?.onJobCreated?.(data);
```

This is the minimal change — callers who don't pass the option see no difference.

**Step 2: Commit**

```bash
git add client/src/features/upload/hooks/useUpload.ts
git commit -m "feat: add onJobCreated callback to useUpload hook"
```

---

### Task 5: Modify `useStudioState` to navigate on upload instead of toggling booleans

This is the core change. After upload, push to `/create/{jobId}` instead of `setShowResults(true)`.

**Files:**
- Modify: `client/src/features/upload/hooks/useStudioState.ts`

**Step 1: Add router and guest job imports**

Add at the top:

```typescript
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';
import { useGuestJob } from './useGuestJob';
```

**Step 2: Initialize router and guest job context inside the hook**

Inside `useStudioState()`, add:

```typescript
const router = useRouter();
const { setGuestJob: setContextGuestJob } = useGuestJob();
```

**Step 3: Modify `handleFileSelect` to navigate**

Replace `setShowResults(true)` with navigation. The trick: for authenticated users, we need the job ID from the upload response. Use the `onJobCreated` callback from Task 4.

Pass `onJobCreated` to `useUpload`:

```typescript
const { job: uploadedJob, isUploading: isAuthUploading, error: uploadError, uploadFile } = useUpload({
    onJobCreated: (job) => {
        router.push(ROUTES.CREATE_RESULT(job.id));
    },
});
```

Update `handleFileSelect`:

```typescript
const handleFileSelect = useCallback(
    (file: File) => {
        const settings = selectedStyle?.kind === 'filter'
            ? { ...customSettings, processingType, filterId: selectedStyle.id }
            : selectedStyle?.kind === 'preset'
                ? { ...selectedStyle.settings, processingType }
                : { ...customSettings, processingType } as PhotoSettings;

        if (isAuthenticated) {
            // Set a temporary demo job for instant feedback while upload happens
            const previewImages = ['/presets/beauty/1.png'];
            const mockJob: Job = {
                id: 'demo',
                userId: 'mock-user',
                status: 'DONE',
                originalUrl: '',
                results: previewImages,
                createdAt: new Date().toISOString(),
            };
            setGuestJob(mockJob);
            setContextGuestJob(mockJob);
            setIsDemoJob(true);
            // Upload — onJobCreated callback will router.push when server responds
            uploadFile({ file, settings });
            // Navigate to demo immediately for instant feedback
            router.push(ROUTES.CREATE_RESULT('demo'));
        } else {
            // Guest: mock job only
            const previewImages = ['/presets/beauty/1.png'];
            const mockJob: Job = {
                id: 'demo',
                userId: null,
                status: 'DONE',
                originalUrl: '',
                results: previewImages,
                createdAt: new Date().toISOString(),
            };
            setGuestJob(mockJob);
            setContextGuestJob(mockJob);
            setIsDemoJob(true);
            router.push(ROUTES.CREATE_RESULT('demo'));
        }
    },
    [uploadFile, customSettings, processingType, isAuthenticated, selectedStyle, router, setContextGuestJob],
);
```

**Step 4: Modify `handleBASubmit` to navigate**

```typescript
const handleBASubmit = useCallback(
    (beforeFile: File, afterFile: File) => {
        const baId = `ba-${Date.now()}`;
        uploadBA({ beforeFile, afterFile });
        router.push(ROUTES.CREATE_RESULT(baId));
    },
    [uploadBA, router],
);
```

**Step 5: Remove `showResults`/`showBAResults` state and simplify `handleReset`**

Remove:
- `const [showResults, setShowResults] = useState(false);`
- `const [showBAResults, setShowBAResults] = useState(false);`

Keep them in the return object but hardcode to `false` (so UploadSection always shows EditorView):

```typescript
showResults: false,
showBAResults: false,
```

Simplify `handleReset` — it now only clears local state (navigation handles the view switch):

```typescript
const handleReset = useCallback(() => {
    setShowStories(false);
    setRetouchUrl(null);
    setGuestJob(null);
    setContextGuestJob(null);
    setBatchResult(null);
    setIsDemoJob(false);
    setSelectedStyle(null);
    resetBA();
    router.push(ROUTES.CREATE);
}, [resetBA, router, setContextGuestJob]);
```

**Step 6: Remove the `uploadError` effect that sets `showResults`**

Delete or update:
```typescript
useEffect(() => {
    if (uploadError) {
        setShowResults(false); // remove this line
        setGuestJob(null);
        setIsDemoJob(false);
    }
}, [uploadError]);
```

Change to:
```typescript
useEffect(() => {
    if (uploadError) {
        setGuestJob(null);
        setContextGuestJob(null);
        setIsDemoJob(false);
    }
}, [uploadError, setContextGuestJob]);
```

**Step 7: Commit**

```bash
git add client/src/features/upload/hooks/useStudioState.ts
git commit -m "feat: replace showResults boolean with router.push navigation"
```

---

### Task 6: Simplify `UploadSection` — remove result rendering branches

Since `/create` now always shows the form, `UploadSection` no longer needs the conditional result/retouch/loading branches.

**Files:**
- Modify: `client/src/features/upload/components/UploadSection.tsx`

**Step 1: Remove all result-rendering branches**

The component becomes just the EditorView:

```tsx
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
```

Remove unused imports: `dynamic`, `Sparkle`, `ArrowLeft`, `ArrowCounterClockwise`, `ResultsView`, `BeforeAfterResults`, `RetouchPanel`, and the `ResetBar` function.

**Step 2: Commit**

```bash
git add client/src/features/upload/components/UploadSection.tsx
git commit -m "refactor: simplify UploadSection to only render EditorView"
```

---

### Task 7: Update `ResultsView` — replace reset buttons with "Create new" link

**Files:**
- Modify: `client/src/features/upload/components/ResultsView.tsx`

**Step 1: Replace the bottom buttons**

The `handleReset` prop becomes optional/unused. Replace the button bar at the bottom with a `Link` to `/create`:

```tsx
// Replace the existing button bar (lines 50-68) with:
{(currentJob.status === 'DONE' || currentJob.status === 'FAILED') && (
    <div className="flex items-center justify-center gap-3 pt-4 pb-2">
        <Link
            href={ROUTES.CREATE}
            className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
        >
            <Plus size={13} weight="bold" />
            {t('dashboard.create_new')}
        </Link>
    </div>
)}
```

Add imports:
```typescript
import Link from 'next/link';
import { Plus } from '@phosphor-icons/react';
import { ROUTES } from '@/lib/constants/routes';
```

Remove unused imports: `ArrowLeft`, `ArrowCounterClockwise`.

Remove `handleReset` from `ResultsViewProps` interface (or make it optional for backward compat).

**Step 2: Commit**

```bash
git add client/src/features/upload/components/ResultsView.tsx
git commit -m "feat: replace reset buttons with 'Create new' link in ResultsView"
```

---

### Task 8: Wrap `ResultsPageClient` in `StudioWorkspace` layout

The results page should share the same visual wrapper (page header, credits pill, workspace card) as the form page.

**Files:**
- Modify: `client/src/app/(main)/create/[jobId]/page.tsx`
- Modify: `client/src/features/upload/components/StudioWorkspace.tsx`

**Step 1: Make `StudioWorkspace` accept children**

Currently `StudioWorkspace` hardcodes `<UploadSection />` inside. Change it to accept children optionally:

In `StudioWorkspace.tsx`, update the component to accept children:

```tsx
interface StudioWorkspaceProps {
    children?: React.ReactNode;
}

export function StudioWorkspace({ children }: StudioWorkspaceProps): React.ReactElement {
```

Replace the content inside the workspace card:

```tsx
{mounted ? (
    children ?? <UploadSection />
) : (
    <div className="flex min-h-130 w-full items-center justify-center">
        <Sparkle size={28} weight="fill" className="animate-pulse text-primary/30" />
    </div>
)}
```

**Step 2: Update the `[jobId]/page.tsx` to use StudioWorkspace**

```tsx
import { StudioWorkspace } from '@/features/upload/components/StudioWorkspace';
import { ResultsPageClient } from '@/features/upload/components/ResultsPageClient';

interface CreateResultPageProps {
    params: Promise<{ jobId: string }>;
}

export default async function CreateResultPage({ params }: CreateResultPageProps): Promise<React.ReactElement> {
    const { jobId } = await params;
    return (
        <StudioWorkspace>
            <ResultsPageClient jobId={jobId} />
        </StudioWorkspace>
    );
}
```

**Step 3: Commit**

```bash
git add client/src/features/upload/components/StudioWorkspace.tsx client/src/app/\(main\)/create/\[jobId\]/page.tsx
git commit -m "feat: wrap results page in StudioWorkspace layout"
```

---

### Task 9: Handle auth redirect — when `onJobCreated` fires, replace `/create/demo` with `/create/{realId}`

When the user uploads, we navigate to `/create/demo` immediately for instant feedback. When the server responds with a real job ID, we need to replace the URL.

**Files:**
- Modify: `client/src/features/upload/hooks/useStudioState.ts`

**Step 1: Use `router.replace` instead of `router.push` in the `onJobCreated` callback**

This replaces the `/create/demo` history entry with `/create/{realId}` so the user doesn't get stuck on `/create/demo` when pressing back:

```typescript
const { job: uploadedJob, isUploading: isAuthUploading, error: uploadError, uploadFile } = useUpload({
    onJobCreated: (job) => {
        router.replace(ROUTES.CREATE_RESULT(job.id));
    },
});
```

Note: `router.replace` not `router.push`.

**Step 2: Commit**

```bash
git add client/src/features/upload/hooks/useStudioState.ts
git commit -m "fix: use router.replace for real job ID to avoid stale demo URL in history"
```

---

### Task 10: Smoke test the full flow

**Step 1: Start the dev server**

```bash
cd client && npm run dev
```

**Step 2: Test these flows manually**

1. **Authenticated upload flow:**
   - Navigate to `/create`
   - Select a style, upload a photo
   - Verify URL changes to `/create/demo` immediately, then to `/create/{realJobId}`
   - Verify results render correctly
   - Click "Create new" button → verify navigates to `/create` with clean form
   - Click "Create" in header → verify same behavior

2. **Guest demo flow:**
   - Log out, navigate to `/create`
   - Upload a photo
   - Verify URL changes to `/create/demo`
   - Verify demo results render
   - Click "Create new" → back to clean form

3. **Header "Create" button while on results:**
   - While viewing results at `/create/{jobId}`, click "Create" in header
   - Verify it navigates to `/create` (different route = real navigation)
   - Verify form is in clean/reset state

4. **Browser back button:**
   - From results, press browser back
   - Should go to `/create` form (not get stuck)

5. **Before/After flow:**
   - Select B/A mode, upload before/after photos
   - Verify URL changes to `/create/ba-{timestamp}`
   - Verify results render with "Create new" button

**Step 3: Commit if any fixes needed**

---

### Task 11: Clean up unused code

**Files:**
- Modify: `client/src/features/upload/hooks/useStudioState.ts`
- Modify: `client/src/features/upload/components/UploadSection.tsx`

**Step 1: Remove `showResults` and `showBAResults` from `StudioState` interface**

In `useStudioState.ts`, remove these from the `StudioState` interface:
```typescript
showResults: boolean;
showBAResults: boolean;
```

And remove them from the return object.

**Step 2: Update any components that read `showResults` or `showBAResults`**

Search the codebase for any remaining references to `state.showResults` or `state.showBAResults` and remove them.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove unused showResults/showBAResults state"
```
