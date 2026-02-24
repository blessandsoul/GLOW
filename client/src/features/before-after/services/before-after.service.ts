import type { BeforeAfterJob, BeforeAfterSettings } from '../types/before-after.types';

const delay = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));

const SAMPLE_CAROUSEL = [
    'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=540&h=540&fit=crop',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=540&h=540&fit=crop',
    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=540&h=540&fit=crop',
    'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=540&h=540&fit=crop',
];

const SAMPLE_STORIES = [
    'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=540&h=960&fit=crop',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=540&h=960&fit=crop',
];

const jobStore = new Map<string, BeforeAfterJob & { _createdMs: number }>();
const MAX_STORE_SIZE = 10;
const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

function revokeJobUrls(job: BeforeAfterJob): void {
    if (job.beforeUrl) URL.revokeObjectURL(job.beforeUrl);
    if (job.afterUrl) URL.revokeObjectURL(job.afterUrl);
}

function evictStale(): void {
    const now = Date.now();
    for (const [key, job] of jobStore) {
        if (now - job._createdMs > MAX_AGE_MS || jobStore.size > MAX_STORE_SIZE) {
            revokeJobUrls(job);
            jobStore.delete(key);
        }
    }
}

function simulateProcessing(jobId: string): void {
    setTimeout(() => {
        const job = jobStore.get(jobId);
        if (job) {
            // Revoke blob URLs once processing is done — results use server URLs
            revokeJobUrls(job);
            jobStore.set(jobId, {
                ...job,
                beforeUrl: '',
                afterUrl: '',
                status: 'DONE',
                results: {
                    carousel: SAMPLE_CAROUSEL,
                    stories: SAMPLE_STORIES,
                },
            });
        }
    }, 5000);
}

class BeforeAfterService {
    async upload(
        beforeFile: File,
        afterFile: File,
        settings?: BeforeAfterSettings,
    ): Promise<BeforeAfterJob> {
        await delay(800);
        const id = `ba-${Date.now()}`;
        const beforeUrl = URL.createObjectURL(beforeFile);
        const afterUrl = URL.createObjectURL(afterFile);

        const job: BeforeAfterJob = {
            id,
            userId: 'mock-user-id',
            status: 'PENDING',
            mode: 'BEFORE_AFTER',
            beforeUrl,
            afterUrl,
            results: null,
            settings,
            createdAt: new Date().toISOString(),
        };

        evictStale();
        jobStore.set(id, { ...job, _createdMs: Date.now() });
        simulateProcessing(id);
        return job;
    }

    async getJob(id: string): Promise<BeforeAfterJob> {
        await delay(150);
        const job = jobStore.get(id);
        if (!job) throw new Error(`BeforeAfter job ${id} not found`);
        return job;
    }
}

export const beforeAfterService = new BeforeAfterService();
