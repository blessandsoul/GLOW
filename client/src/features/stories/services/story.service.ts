import type { GeneratedStory, StoryLayout } from '../types/story.types';

const delay = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));

const storyStore = new Map<string, GeneratedStory[]>();

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
        storyStore.set(jobId, stories);
        return stories;
    }

    async getStories(jobId: string): Promise<GeneratedStory[]> {
        await delay(200);
        return storyStore.get(jobId) ?? [];
    }
}

export const storyService = new StoryService();
