export const PRODUCT_CATEGORIES = ['lashes', 'glue', 'tweezers', 'decor', 'tools', 'accessories', 'cosmetics', 'other'] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type SellerStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IProductSeller {
    id: string;
    username: string | null;
    firstName: string;
    lastName: string;
    avatar: string | null;
    masterProfile: {
        whatsapp: string | null;
        telegram: string | null;
        instagram: string | null;
    } | null;
}

export interface IProduct {
    id: string;
    userId: string;
    title: string;
    description: string | null;
    price: number;
    currency: string;
    category: ProductCategory;
    inStock: boolean;
    isActive: boolean;
    imageUrls: string[];
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
    user: IProductSeller;
}

export interface ISellerStatusResponse {
    sellerStatus: SellerStatus;
    sellerRequestedAt: string | null;
    sellerApprovedAt: string | null;
    sellerRejectedReason: string | null;
}

export interface ISellerApplication {
    userId: string;
    sellerStatus: SellerStatus;
    sellerRequestedAt: string | null;
    sellerApprovedAt: string | null;
    sellerRejectedReason: string | null;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        avatar: string | null;
        username: string | null;
        phone: string | null;
    };
}

export interface ICreateProductRequest {
    title: string;
    description?: string;
    price: number;
    currency?: string;
    category: ProductCategory;
    inStock?: boolean;
    imageUrls: string[];
}

export interface IUpdateProductRequest {
    title?: string;
    description?: string;
    price?: number;
    currency?: string;
    category?: ProductCategory;
    inStock?: boolean;
    imageUrls?: string[];
}

export interface IProductFilters {
    page?: number;
    limit?: number;
    category?: ProductCategory;
    inStock?: boolean;
    userId?: string;
}

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
    lashes: 'Ресницы',
    glue: 'Клей',
    tweezers: 'Пинцеты',
    decor: 'Декор',
    tools: 'Инструменты',
    accessories: 'Аксессуары',
    cosmetics: 'Косметика',
    other: 'Другое',
};

export const PRODUCT_CATEGORY_ICONS: Record<ProductCategory, string> = {
    lashes: '👁',
    glue: '🧴',
    tweezers: '✂️',
    decor: '✨',
    tools: '🔧',
    accessories: '💼',
    cosmetics: '💄',
    other: '📦',
};
