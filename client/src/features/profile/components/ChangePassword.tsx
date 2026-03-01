'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeSlash, SpinnerGap, LockKey } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { authService } from '@/features/auth/services/auth.service';
import { useAppDispatch } from '@/store/hooks';
import { logout as logoutAction } from '@/features/auth/store/authSlice';
import { getErrorMessage } from '@/lib/utils/error';
import { useLanguage } from '@/i18n/hooks/useLanguage';

interface PasswordField {
    current: string;
    next: string;
    confirm: string;
}

interface FieldErrors {
    current?: string;
    next?: string;
    confirm?: string;
}

export function ChangePassword(): React.ReactElement {
    const { t } = useLanguage();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [fields, setFields] = useState<PasswordField>({ current: '', next: '', confirm: '' });
    const [errors, setErrors] = useState<FieldErrors>({});
    const [show, setShow] = useState({ current: false, next: false, confirm: false });
    const [isSaving, setIsSaving] = useState(false);

    const validate = useCallback((f: PasswordField): FieldErrors => {
        const errs: FieldErrors = {};
        if (!f.current) errs.current = t('ui.profile_err_current_required');
        if (f.next.length < 8) errs.next = t('ui.profile_err_min_8');
        else if (!/[A-Z]/.test(f.next)) errs.next = t('ui.profile_err_uppercase');
        else if (!/[a-z]/.test(f.next)) errs.next = t('ui.profile_err_lowercase');
        else if (!/[0-9]/.test(f.next)) errs.next = t('ui.profile_err_number');
        if (f.next && f.confirm && f.next !== f.confirm) {
            errs.confirm = t('ui.profile_err_mismatch');
        }
        return errs;
    }, [t]);

    const handleChange = useCallback((field: keyof PasswordField, value: string): void => {
        setFields((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        const errs = validate(fields);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        setIsSaving(true);
        try {
            await authService.changePassword(fields.current, fields.next);
            toast.success(t('ui.profile_password_success'));
            dispatch(logoutAction());
            router.push('/login');
        } catch (error) {
            toast.error(getErrorMessage(error));
            setIsSaving(false);
        }
    }, [fields, dispatch, router, validate, t]);

    const toggleShow = useCallback((field: keyof typeof show): void => {
        setShow((prev) => ({ ...prev, [field]: !prev[field] }));
    }, []);

    const fieldConfig = [
        { id: 'current', label: t('ui.profile_current_password'), field: 'current' },
        { id: 'next', label: t('ui.profile_new_password'), field: 'next' },
        { id: 'confirm', label: t('ui.profile_confirm_password'), field: 'confirm' },
    ] as const;

    return (
        <section className="space-y-4 rounded-xl border border-border/50 bg-card p-6">
            <div className="flex items-center gap-2">
                <LockKey size={16} className="text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">{t('ui.profile_change_password')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Hidden username field for password manager accessibility */}
                <input type="text" name="username" autoComplete="username" className="sr-only" tabIndex={-1} aria-hidden="true" />
                {fieldConfig.map(({ id, label, field }) => (
                    <div key={id} className="space-y-1.5">
                        <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
                        <div className="relative">
                            <Input
                                id={id}
                                type={show[field] ? 'text' : 'password'}
                                value={fields[field]}
                                onChange={(e) => handleChange(field, e.target.value)}
                                className={cn('pr-10', errors[field] && 'border-destructive focus-visible:ring-destructive/30')}
                                autoComplete={field === 'current' ? 'current-password' : 'new-password'}
                            />
                            <button
                                type="button"
                                onClick={() => toggleShow(field)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                aria-label={show[field] ? 'Hide password' : 'Show password'}
                            >
                                {show[field] ? <EyeSlash size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                        {errors[field] && (
                            <p className="text-xs text-destructive">{errors[field]}</p>
                        )}
                    </div>
                ))}

                <Button type="submit" size="sm" disabled={isSaving} className="gap-1.5">
                    {isSaving && <SpinnerGap size={14} className="animate-spin" />}
                    {isSaving ? t('ui.profile_saving') : t('ui.profile_update_password')}
                </Button>
            </form>
        </section>
    );
}
