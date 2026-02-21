export interface ShowcaseData {
    jobId: string;
    masterName: string;
    instagramHandle: string | null;
    results: string[];
    createdAt: string;
}

export interface ReviewFormData {
    rating: number;
    text: string;
    clientName: string;
}

export interface Review {
    id: string;
    jobId: string;
    masterId: string;
    rating: number;
    text: string | null;
    clientName: string | null;
    createdAt: string;
}
