'use client';

import { useState, useCallback } from 'react';
import { At, SpinnerGap, Clock, Link as LinkIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser } from '@/features/auth/store/authSlice';
import { usersService } from '@/features/users/services/users.service';
import { getErrorMessage } from '@/lib/utils/error';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { ROUTES } from '@/lib/constants/routes';

const USERNAME_REGEX = /^[a-z0-9][a-z0-9._]*[a-z0-9]$/;
const NO_CONSECUTIVE_SPECIAL = /^(?!.*[._]{2})/;

function validateUsername(value: string): string | null {
    if (value.length < 3) return 'min_3';
    if (value.length > 30) return 'max_30';
    if (value !== value.toLowerCase()) return 'lowercase';
    if (!USERNAME_REGEX.test(value)) return 'invalid_chars';
    if (!NO_CONSECUTIVE_SPECIAL.test(value)) return 'no_consecutive';
    return null;
}

export function ChangeUsername(): React.ReactElement {
    const { t } = useLanguage();
    const dispatch = useAppDispatch();
    const user = useAppSelector((s) => s.auth.user);

    const currentUsername = user?.username ?? null;

    const [username, setUsername] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
        const val = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '');
        setUsername(val);
        setError(null);
    }, []);

    const handleStartEdit = useCallback((): void => {
        setUsername(currentUsername ?? '');
        setError(null);
        setIsEditing(true);
    }, [currentUsername]);

    const handleCancel = useCallback((): void => {
        setUsername('');
        setError(null);
        setIsEditing(false);
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        const trimmed = username.trim();
        if (trimmed === currentUsername) {
            setIsEditing(false);
            return;
        }

        const validationError = validateUsername(trimmed);
        if (validationError) {
            setError(t(`ui.username_err_${validationError}`));
            return;
        }

        setIsSaving(true);
        try {
            const updatedUser = await usersService.updateMe({ username: trimmed });
            dispatch(setUser(updatedUser));
            toast.success(t('ui.username_updated'));
            setIsEditing(false);
            setUsername('');
        } catch (err) {
            const msg = getErrorMessage(err);
            setError(msg);
        } finally {
            setIsSaving(false);
        }
    }, [username, currentUsername, dispatch, t]);

    const publicUrl = currentUsername ? ROUTES.PORTFOLIO_PUBLIC(currentUsername) : null;

    return (
        <section className="space-y-4 rounded-xl border border-border/50 bg-card p-6">
            <div className="flex items-center gap-2">
                <At size={16} className="text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">
                    {t('ui.username_title')}
                </p>
            </div>

            {!isEditing ? (
                <div className="space-y-3">
                    {currentUsername ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">@{currentUsername}</span>
                            </div>
                            {publicUrl && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <LinkIcon size={12} />
                                    <span className="truncate">glow.ge/specialist/{currentUsername}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            {t('ui.username_not_set')}
                        </p>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleStartEdit}
                    >
                        {currentUsername ? t('ui.username_change') : t('ui.username_set')}
                    </Button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="username" className="text-xs text-muted-foreground">
                            {t('ui.username_label')}
                        </Label>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                @
                            </span>
                            <Input
                                id="username"
                                value={username}
                                onChange={handleChange}
                                className={cn('pl-7', error && 'border-destructive focus-visible:ring-destructive/30')}
                                placeholder="your.username"
                                maxLength={30}
                                autoComplete="off"
                                autoFocus
                            />
                        </div>
                        {error && (
                            <p className="text-xs text-destructive">{error}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                            {t('ui.username_hint')}
                        </p>
                    </div>

                    {currentUsername && (
                        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
                            <Clock size={14} className="mt-0.5 shrink-0 text-warning" />
                            <p className="text-xs text-muted-foreground">
                                {t('ui.username_cooldown_warning')}
                            </p>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <Button type="submit" size="sm" disabled={isSaving || !username.trim()} className="gap-1.5">
                            {isSaving && <SpinnerGap size={14} className="animate-spin" />}
                            {isSaving ? t('ui.profile_saving') : t('ui.username_save')}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                            disabled={isSaving}
                            className="text-muted-foreground"
                        >
                            {t('ui.profile_cancel')}
                        </Button>
                    </div>
                </form>
            )}
        </section>
    );
}
