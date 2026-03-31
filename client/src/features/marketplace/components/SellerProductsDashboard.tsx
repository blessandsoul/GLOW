'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, PencilSimple, Trash, Package, SpinnerGap } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMyProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../hooks/useMarketplace';
import { ProductForm } from './ProductForm';
import { ProductCategoryBadge } from './ProductCategoryBadge';
import type { IProduct, ICreateProductRequest } from '../types/marketplace.types';

type View = 'list' | 'create' | 'edit';

export function SellerProductsDashboard(): React.ReactElement {
    const { products, isLoading } = useMyProducts();
    const { createProduct, isPending: isCreating } = useCreateProduct();
    const { updateProduct, isPending: isUpdating } = useUpdateProduct();
    const { deleteProduct, isPending: isDeleting } = useDeleteProduct();
    const [view, setView] = useState<View>('list');
    const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);

    function handleCreate(data: ICreateProductRequest): void {
        createProduct(data, {
            onSuccess: () => setView('list'),
        });
    }

    function handleUpdate(data: ICreateProductRequest): void {
        if (!editingProduct) return;
        updateProduct(
            { id: editingProduct.id, data },
            { onSuccess: () => { setView('list'); setEditingProduct(null); } },
        );
    }

    function handleEdit(product: IProduct): void {
        setEditingProduct(product);
        setView('edit');
    }

    function handleDelete(id: string): void {
        if (!confirm('პროდუქტის წაშლა?')) return;
        deleteProduct(id);
    }

    if (view === 'create') {
        return (
            <div className="mx-auto max-w-lg lg:max-w-2xl">
                <div className="mb-4 flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setView('list')}>← უკან</Button>
                    <h2 className="text-base font-semibold">ახალი პროდუქტი</h2>
                </div>
                <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
                    <ProductForm onSubmit={handleCreate} onCancel={() => setView('list')} isPending={isCreating} />
                </div>
            </div>
        );
    }

    if (view === 'edit' && editingProduct) {
        return (
            <div className="mx-auto max-w-lg lg:max-w-2xl">
                <div className="mb-4 flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setView('list'); setEditingProduct(null); }}>← უკან</Button>
                    <h2 className="text-base font-semibold">პროდუქტის რედაქტირება</h2>
                </div>
                <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
                    <ProductForm product={editingProduct} onSubmit={handleUpdate} onCancel={() => { setView('list'); setEditingProduct(null); }} isPending={isUpdating} />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-semibold text-foreground">ჩემი პროდუქტები</h2>
                    <p className="text-xs text-muted-foreground">{products.length} პროდუქტი</p>
                </div>
                <Button size="sm" onClick={() => setView('create')}>
                    <Plus size={14} />
                    პროდუქტის დამატება
                </Button>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <SpinnerGap size={24} className="animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Empty */}
            {!isLoading && products.length === 0 && (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/50 py-16 text-center">
                    <Package size={36} className="mb-3 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-foreground">პროდუქტები არ არის</p>
                    <p className="mt-1 text-xs text-muted-foreground">დაამატე პირველი პროდუქტი გასაყიდად</p>
                    <Button size="sm" className="mt-4" onClick={() => setView('create')}>
                        <Plus size={14} />
                        პროდუქტის დამატება
                    </Button>
                </div>
            )}

            {/* Products list */}
            {!isLoading && products.length > 0 && (
                <div className="space-y-2">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3 shadow-sm"
                        >
                            {/* Thumbnail */}
                            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                                {product.imageUrls[0] ? (
                                    <Image
                                        src={product.imageUrls[0]}
                                        alt={product.title}
                                        fill
                                        className="object-cover"
                                        sizes="56px"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center">
                                        <Package size={18} className="text-muted-foreground/40" />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">{product.title}</p>
                                <div className="mt-0.5 flex items-center gap-2">
                                    <ProductCategoryBadge category={product.category} />
                                    <span className={cn(
                                        'text-xs',
                                        product.inStock ? 'text-success' : 'text-muted-foreground',
                                    )}>
                                        {product.inStock ? 'მარაგშია' : 'არ არის'}
                                    </span>
                                </div>
                            </div>

                            {/* Price */}
                            <p className="flex-shrink-0 text-sm font-semibold tabular-nums text-foreground">
                                {product.price.toLocaleString('ru-RU')} ₾
                            </p>

                            {/* Actions */}
                            <div className="flex flex-shrink-0 items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => handleEdit(product)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    <PencilSimple size={13} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(product.id)}
                                    disabled={isDeleting}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <Trash size={13} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
