'use client';

import { useState, useCallback } from 'react';
import { SpinnerGap } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { marketplaceService } from '../services/marketplace.service';
import { ProductImageUploader } from './ProductImageUploader';
import type { IProduct, ICreateProductRequest, ProductCategory } from '../types/marketplace.types';
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS, PRODUCT_CATEGORY_ICONS } from '../types/marketplace.types';

interface ProductFormProps {
    product?: IProduct;
    onSubmit: (data: ICreateProductRequest) => void;
    onCancel?: () => void;
    isPending?: boolean;
}

export function ProductForm({ product, onSubmit, onCancel, isPending }: ProductFormProps): React.ReactElement {
    const [title, setTitle] = useState(product?.title ?? '');
    const [description, setDescription] = useState(product?.description ?? '');
    const [price, setPrice] = useState(product ? String(product.price) : '');
    const [category, setCategory] = useState<ProductCategory>(product?.category ?? 'other');
    const [inStock, setInStock] = useState(product?.inStock ?? true);
    const [imageUrls, setImageUrls] = useState<string[]>(product?.imageUrls ?? []);
    const [isUploading, setIsUploading] = useState(false);
    const [tempProductId] = useState<string | null>(product?.id ?? null);

    const handleAddImage = useCallback(async (file: File) => {
        if (!tempProductId) {
            // For new products: upload will happen after create
            // We store locally as object URL for preview only
            const localUrl = URL.createObjectURL(file);
            setImageUrls((prev) => [...prev, `__local__${localUrl}`]);
            return;
        }
        setIsUploading(true);
        try {
            const updated = await marketplaceService.uploadProductImage(tempProductId, file);
            setImageUrls(updated.imageUrls);
        } catch {
            // Error is handled by axios interceptor toast
        } finally {
            setIsUploading(false);
        }
    }, [tempProductId]);

    function handleRemoveImage(index: number): void {
        setImageUrls((prev) => prev.filter((_, i) => i !== index));
    }

    function handleSubmit(e: React.FormEvent): void {
        e.preventDefault();
        const numPrice = parseFloat(price);
        if (!title.trim() || isNaN(numPrice) || numPrice <= 0 || imageUrls.length === 0) return;

        onSubmit({
            title: title.trim(),
            description: description.trim() || undefined,
            price: numPrice,
            currency: 'GEL',
            category,
            inStock,
            imageUrls: imageUrls.filter((u) => !u.startsWith('__local__')),
        });
    }

    const isValid = title.trim().length > 0 && parseFloat(price) > 0 && imageUrls.length > 0;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <ProductImageUploader
                images={imageUrls.map((u) => u.startsWith('__local__') ? u.replace('__local__', '') : u)}
                onAdd={handleAddImage}
                onRemove={handleRemoveImage}
                isUploading={isUploading}
            />

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Название товара *</label>
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Клей для ресниц, пинцет..."
                    maxLength={200}
                    className="text-sm"
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Описание</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Объём, бренд, особенности..."
                    rows={3}
                    maxLength={2000}
                    className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Цена (GEL) *</label>
                    <Input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0"
                        min={0}
                        max={99999}
                        step={0.01}
                        className="text-sm tabular-nums"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">В наличии</label>
                    <button
                        type="button"
                        onClick={() => setInStock((v) => !v)}
                        className={cn(
                            'flex h-9 w-full items-center justify-center rounded-md border text-xs font-medium transition-colors',
                            inStock
                                ? 'border-success/30 bg-success/10 text-success'
                                : 'border-border/50 bg-muted text-muted-foreground',
                        )}
                    >
                        {inStock ? '✓ Есть в наличии' : '✗ Нет в наличии'}
                    </button>
                </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Категория *</label>
                <div className="flex flex-wrap gap-1.5">
                    {PRODUCT_CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setCategory(cat)}
                            className={cn(
                                'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all',
                                category === cat
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                            )}
                        >
                            <span>{PRODUCT_CATEGORY_ICONS[cat]}</span>
                            {PRODUCT_CATEGORY_LABELS[cat]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-2 pt-1">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                        Отмена
                    </Button>
                )}
                <Button type="submit" className="flex-1" disabled={isPending || !isValid || isUploading}>
                    {isPending ? (
                        <SpinnerGap size={16} className="animate-spin" />
                    ) : product ? (
                        'Сохранить'
                    ) : (
                        'Создать товар'
                    )}
                </Button>
            </div>
        </form>
    );
}
