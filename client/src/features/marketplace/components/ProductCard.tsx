'use client';

import Image from 'next/image';
import { WhatsappLogo, InstagramLogo, TelegramLogo, Package } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { IProduct } from '../types/marketplace.types';
import { ProductCategoryBadge } from './ProductCategoryBadge';

interface ProductCardProps {
    product: IProduct;
    className?: string;
}

function getContactUrl(product: IProduct): { url: string; icon: 'whatsapp' | 'instagram' | 'telegram' } | null {
    const { masterProfile } = product.user;
    if (!masterProfile) return null;

    if (masterProfile.whatsapp) {
        const cleaned = masterProfile.whatsapp.replace(/\D/g, '');
        return { url: `https://wa.me/${cleaned}`, icon: 'whatsapp' };
    }
    if (masterProfile.instagram) {
        const handle = masterProfile.instagram.replace('@', '');
        return { url: `https://instagram.com/${handle}`, icon: 'instagram' };
    }
    if (masterProfile.telegram) {
        const handle = masterProfile.telegram.replace('@', '');
        return { url: `https://t.me/${handle}`, icon: 'telegram' };
    }
    return null;
}

const ICON_MAP = {
    whatsapp: WhatsappLogo,
    instagram: InstagramLogo,
    telegram: TelegramLogo,
};

export function ProductCard({ product, className }: ProductCardProps): React.ReactElement {
    const contact = getContactUrl(product);
    const firstImage = product.imageUrls[0];

    return (
        <article
            className={cn(
                'group flex flex-col rounded-2xl border border-border/50 bg-card shadow-sm',
                'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md',
                className,
            )}
        >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-muted">
                {firstImage ? (
                    <Image
                        src={firstImage}
                        alt={product.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <Package size={40} className="text-muted-foreground/30" />
                    </div>
                )}

                {/* Out of stock overlay */}
                {!product.inStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                            არ არის მარაგში
                        </span>
                    </div>
                )}

                {/* Image count */}
                {product.imageUrls.length > 1 && (
                    <div className="absolute right-2 top-2 flex h-5 items-center rounded-full bg-background/80 px-1.5 text-[10px] font-medium text-foreground backdrop-blur-sm">
                        1/{product.imageUrls.length}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-medium leading-tight text-foreground">
                        {product.title}
                    </h3>
                </div>

                <ProductCategoryBadge category={product.category} />

                {/* Price */}
                <p className="mt-auto text-base font-semibold tabular-nums text-foreground">
                    {product.price.toLocaleString('ru-RU')} {product.currency}
                </p>

                {/* Contact button */}
                {contact ? (
                    <a
                        href={contact.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                            'flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium',
                            'transition-all duration-150 active:scale-[0.98]',
                            contact.icon === 'whatsapp' && 'bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20',
                            contact.icon === 'instagram' && 'bg-primary/10 text-primary hover:bg-primary/20',
                            contact.icon === 'telegram' && 'bg-[#2AABEE]/10 text-[#2AABEE] hover:bg-[#2AABEE]/20',
                        )}
                    >
                        {(() => {
                            const Icon = ICON_MAP[contact.icon];
                            return <Icon size={14} weight="fill" />;
                        })()}
                        ოსტატს დაუკავშირდი
                    </a>
                ) : (
                    <div className="flex items-center justify-center rounded-xl bg-muted py-2 text-xs text-muted-foreground">
                        საკონტაქტო ინფო არ არის
                    </div>
                )}
            </div>
        </article>
    );
}
