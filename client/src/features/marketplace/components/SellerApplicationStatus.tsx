import { Clock, CheckCircle, XCircle } from '@phosphor-icons/react';
import type { SellerStatus } from '../types/marketplace.types';

interface SellerApplicationStatusProps {
    status: SellerStatus;
    rejectedReason?: string | null;
}

const STATUS_CONFIG = {
    PENDING: {
        icon: Clock,
        iconClass: 'text-warning-foreground',
        bgClass: 'bg-warning/10',
        title: 'განაცხადი განხილვაშია',
        description: 'ვიხილავთ შენს განაცხადს. ჩვეულებრივ 1–2 სამუშაო დღე სჭირდება.',
    },
    APPROVED: {
        icon: CheckCircle,
        iconClass: 'text-success',
        bgClass: 'bg-success/10',
        title: 'შენ დამტკიცებული გამყიდველი ხარ!',
        description: 'ახლა შეგიძლია პროდუქტები დაამატო და გაყიდო Glow.GE-ზე.',
    },
    REJECTED: {
        icon: XCircle,
        iconClass: 'text-destructive',
        bgClass: 'bg-destructive/10',
        title: 'განაცხადი უარყოფილია',
        description: 'შეგიძლია ხელახლა შეიტანო განაცხადი.',
    },
};

export function SellerApplicationStatus({ status, rejectedReason }: SellerApplicationStatusProps): React.ReactElement | null {
    if (status === 'NONE') return null;

    const config = STATUS_CONFIG[status];
    const Icon = config.icon;

    return (
        <div className="mx-auto max-w-lg">
            <div className="flex flex-col items-center rounded-2xl border border-border/50 bg-card p-8 text-center shadow-sm">
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${config.bgClass}`}>
                    <Icon size={28} className={config.iconClass} weight="fill" />
                </div>
                <h2 className="text-base font-semibold text-foreground">{config.title}</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{config.description}</p>
                {status === 'REJECTED' && rejectedReason && (
                    <div className="mt-4 w-full rounded-xl bg-muted/60 p-3 text-left">
                        <p className="text-xs font-medium text-muted-foreground">უარყოფის მიზეზი:</p>
                        <p className="mt-0.5 text-xs text-foreground">{rejectedReason}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
