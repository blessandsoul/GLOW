import type { RetouchJob, RetouchPoint } from '../types/retouch.types';

const delay = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));

const RETOUCHED_IMAGE = 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&h=800&fit=crop';

class RetouchService {
    async submitRetouch(
        originalUrl: string,
        points: RetouchPoint[],
    ): Promise<RetouchJob> {
        await delay(1500);
        const job: RetouchJob = {
            id: `retouch-${Date.now()}`,
            originalUrl,
            retouchedUrl: RETOUCHED_IMAGE,
            points,
            status: 'DONE',
            createdAt: new Date().toISOString(),
        };
        return job;
    }
}

export const retouchService = new RetouchService();
