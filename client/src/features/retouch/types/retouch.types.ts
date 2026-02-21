export type RetouchType = 'GLUE_SPOT' | 'REDNESS' | 'UNEVENNESS' | 'BLEMISH' | 'CUSTOM';

export interface RetouchPoint {
    id: string;
    x: number;
    y: number;
    type: RetouchType;
}

export type RetouchJobStatus = 'IDLE' | 'PROCESSING' | 'DONE' | 'FAILED';

export interface RetouchJob {
    id: string;
    originalUrl: string;
    retouchedUrl: string | null;
    points: RetouchPoint[];
    status: RetouchJobStatus;
    createdAt: string;
}

export const RETOUCH_TYPE_LABELS: Record<
    RetouchType,
    { label: string; emoji: string }
> = {
    GLUE_SPOT: { label: 'system.sys_hmwggu', emoji: '💧' },
    REDNESS: { label: 'system.sys_1dr2kt', emoji: '🔴' },
    UNEVENNESS: { label: 'system.sys_dr9ajs', emoji: '🔲' },
    BLEMISH: { label: 'system.sys_wjrsq3', emoji: '✖️' },
    CUSTOM: { label: 'system.sys_hgur0c', emoji: '📌' },
};
