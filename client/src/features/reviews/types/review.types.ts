export interface ReviewAuthor {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
}

export interface Review {
    id: string;
    masterId: string;
    userId: string | null;
    rating: number;
    text: string | null;
    createdAt: string;
    updatedAt: string;
    user: ReviewAuthor | null;
}

export interface CreateReviewRequest {
    masterId: string;
    rating: number;
    text?: string;
}

export interface UpdateReviewRequest {
    rating?: number;
    text?: string;
}
