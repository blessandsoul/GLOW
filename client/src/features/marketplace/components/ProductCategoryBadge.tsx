import { Eye, Drop, Scissors, Sparkle, Wrench, Bag, Palette, Package } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/utils';
import type { ProductCategory } from '../types/marketplace.types';
import { PRODUCT_CATEGORY_LABELS } from '../types/marketplace.types';

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

const CATEGORY_ICONS: Record<ProductCategory, React.ElementType> = {
    lashes: Eye,
    glue: Drop,
    tweezers: Scissors,
    decor: Sparkle,
    tools: Wrench,
    accessories: Bag,
    cosmetics: Palette,
    other: Package,
};

interface ProductCategoryBadgeProps {
    category: ProductCategory;
    className?: string;
}

export function ProductCategoryBadge({ category, className }: ProductCategoryBadgeProps): React.ReactElement {
    const Icon = CATEGORY_ICONS[category];
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                CATEGORY_COLORS[category],
                className,
            )}
        >
            <Icon size={10} weight="fill" />
            {PRODUCT_CATEGORY_LABELS[category]}
        </span>
    );
}
