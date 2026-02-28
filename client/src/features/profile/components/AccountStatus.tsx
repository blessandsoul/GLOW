'use client';

import { User, Star, ShieldCheck, Buildings } from '@phosphor-icons/react';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/features/auth/types/auth.types';

const ROLE_CONFIG: Record<UserRole, { label: string; icon: React.ElementType; className: string }> = {
    USER: { label: 'User', icon: User, className: 'bg-muted text-muted-foreground' },
    MASTER: { label: 'Master', icon: Star, className: 'bg-primary/10 text-primary' },
    ADMIN: { label: 'Admin', icon: ShieldCheck, className: 'bg-destructive/10 text-destructive' },
    SALON: { label: 'Salon', icon: Buildings, className: 'bg-success/10 text-success' },
};

export function AccountStatus(): React.ReactElement {
    const user = useAppSelector((s) => s.auth.user);

    if (!user) return <></>;

    const role = ROLE_CONFIG[user.role];
    const RoleIcon = role.icon;

    return (
        <section className="space-y-4 rounded-xl border border-border/50 bg-card p-6">
            <p className="text-sm font-semibold text-foreground">Account</p>

            <div className="flex flex-wrap gap-3">
                {/* Role badge */}
                <div className={cn('flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', role.className)}>
                    <RoleIcon size={13} weight="fill" />
                    {role.label}
                </div>
            </div>

            <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">{user.email}</p>
            </div>

            {user.phone && (
                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium text-foreground">{user.phone}</p>
                </div>
            )}

            <div className="pt-1 border-t border-border/40">
                <p className="text-xs text-muted-foreground">
                    Member since {new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(user.createdAt))}
                </p>
            </div>
        </section>
    );
}
