import { cn } from '@/lib/utils';
import type { ProductCategory } from '../types/marketplace.types';
import { PRODUCT_CATEGORY_LABELS, PRODUCT_CATEGORY_ICONS } from '../types/marketplace.types';

const CATEGORY_COLORS: Record<ProductCategory, string> = {
    lashes: 'bg-primary/10 text-primary',
    glue: 'bg-info/10 text-info',
    tweezers: 'bg-warning/10 text-warning-foreground',
    decor: 'bg-accent text-accent-foreground border border-border/50',
    tools: 'bg-muted text-muted-foreground',
    accessories: 'bg-secondary text-secondary-foreground',
    cosmetics: 'bg-success/10 text-success',
    other: 'bg-muted text-muted-foreground',
};

interface ProductCategoryBadgeProps {
    category: ProductCategory;
    className?: string;
}

export function ProductCategoryBadge({ category, className }: ProductCategoryBadgeProps): React.ReactElement {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                CATEGORY_COLORS[category],
                className,
            )}
        >
            <span>{PRODUCT_CATEGORY_ICONS[category]}</span>
            {PRODUCT_CATEGORY_LABELS[category]}
        </span>
    );
}
