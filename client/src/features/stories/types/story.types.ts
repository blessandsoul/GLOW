export type StoryLayout = 'MINIMAL' | 'GRADIENT' | 'BOLD';

export interface GeneratedStory {
    id: string;
    jobId: string;
    layout: StoryLayout;
    imageUrl: string;
    overlayText: string | null;
    createdAt: string;
}

export const STORY_LAYOUT_LABELS: Record<
    StoryLayout,
    { label: string; description: string; emoji: string }
> = {
    MINIMAL: {
        label: 'system.sys_l2o7eg',
        description: 'system.sys_jc1ffk',
        emoji: '✨',
    },
    GRADIENT: {
        label: 'system.sys_ejfr7x',
        description: 'system.sys_k20b20',
        emoji: '🎨',
    },
    BOLD: {
        label: 'system.sys_6ypxgc',
        description: 'system.sys_lmx4ll',
        emoji: '🔥',
    },
};
