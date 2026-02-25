import type { GeneratedStory, StoryLayout } from '../types/story.types';

const delay = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));

const storyStore = new Map<string, { data: GeneratedStory[]; createdMs: number }>();
const MAX_STORE_SIZE = 10;
const MAX_AGE_MS = 5 * 60 * 1000;

function evictStale(): void {
    const now = Date.now();
    for (const [key, entry] of storyStore) {
        if (now - entry.createdMs > MAX_AGE_MS || storyStore.size > MAX_STORE_SIZE) {
            storyStore.delete(key);
        }
    }
}

const STORY_IMAGES: Record<StoryLayout, string> = {
    MINIMAL: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=540&h=960&fit=crop',
    GRADIENT: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=540&h=960&fit=crop',
    BOLD: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=540&h=960&fit=crop',
};

const OVERLAY_TEXTS: Record<StoryLayout, string | null> = {
    MINIMAL: null,
    GRADIENT: 'system.sys_mwtoxa',
    BOLD: 'system.sys_2jxk3g',
};

class StoryService {
    async generateStories(jobId: string): Promise<GeneratedStory[]> {
        await delay(1500);
        const layouts: StoryLayout[] = ['MINIMAL', 'GRADIENT', 'BOLD'];
        const stories: GeneratedStory[] = layouts.map((layout) => ({
            id: `story-${jobId}-${layout}-${Date.now()}`,
            jobId,
            layout,
            imageUrl: STORY_IMAGES[layout],
            overlayText: OVERLAY_TEXTS[layout],
            createdAt: new Date().toISOString(),
        }));
        evictStale();
        storyStore.set(jobId, { data: stories, createdMs: Date.now() });
        return stories;
    }

    async getStories(jobId: string): Promise<GeneratedStory[]> {
        await delay(200);
        return storyStore.get(jobId)?.data ?? [];
    }
}

export const storyService = new StoryService();
