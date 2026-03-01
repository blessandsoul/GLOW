'use client';

import { User, Star, ShieldCheck, Buildings } from '@phosphor-icons/react';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import type { UserRole } from '@/features/auth/types/auth.types';

const ROLE_STYLE: Record<UserRole, { icon: React.ElementType; className: string }> = {
    USER: { icon: User, className: 'bg-muted text-muted-foreground' },
    MASTER: { icon: Star, className: 'bg-primary/10 text-primary' },
    ADMIN: { icon: ShieldCheck, className: 'bg-destructive/10 text-destructive' },
    SALON: { icon: Buildings, className: 'bg-success/10 text-success' },
};

const ROLE_LABEL_KEY: Record<UserRole, string> = {
    USER: 'ui.profile_role_user',
    MASTER: 'ui.profile_role_master',
    ADMIN: 'ui.profile_role_admin',
    SALON: 'ui.profile_role_salon',
};

export function AccountStatus(): React.ReactElement {
    const { t } = useLanguage();
    const user = useAppSelector((s) => s.auth.user);

    if (!user) return <></>;

    const style = ROLE_STYLE[user.role];
    const RoleIcon = style.icon;

    return (
        <section className="space-y-4 rounded-xl border border-border/50 bg-card p-6">
            <p className="text-sm font-semibold text-foreground">{t('ui.profile_account')}</p>

            <div className="flex flex-wrap gap-3">
                {/* Role badge */}
                <div className={cn('flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', style.className)}>
                    <RoleIcon size={13} weight="fill" />
                    {t(ROLE_LABEL_KEY[user.role])}
                </div>
            </div>

            <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t('ui.profile_email')}</p>
                <p className="text-sm font-medium text-foreground">{user.email}</p>
            </div>

            {user.phone && (
                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{t('ui.profile_phone')}</p>
                    <p className="text-sm font-medium text-foreground">{user.phone}</p>
                </div>
            )}

            <div className="pt-1 border-t border-border/40">
                <p className="text-xs text-muted-foreground">
                    {t('ui.profile_member_since')} {new Intl.DateTimeFormat('ka-GE', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(user.createdAt))}
                </p>
            </div>
        </section>
    );
}
