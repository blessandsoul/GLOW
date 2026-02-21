export interface ApiResponse<T> {
    success: true;
    message: string;
    data: T;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface PaginatedApiResponse<T> {
    success: true;
    message: string;
    data: {
        items: T[];
        pagination: PaginationMeta;
    };
}

export interface ApiError {
    success: false;
    error: {
        code: string;
        message: string;
    };
}

export interface PaginationParams {
    page?: number;
    limit?: number;
}
