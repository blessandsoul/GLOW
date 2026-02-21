'use client';

import { useState, useCallback } from 'react';
import { Eye, EyeSlash, SpinnerGap, LockKey } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

function validate(fields: PasswordField): FieldErrors {
    const errors: FieldErrors = {};
    if (!fields.current) errors.current = 'Enter your current password';
    if (fields.next.length < 8) errors.next = 'Min 8 characters';
    else if (!/[A-Z]/.test(fields.next)) errors.next = 'Must contain uppercase letter';
    else if (!/[a-z]/.test(fields.next)) errors.next = 'Must contain lowercase letter';
    else if (!/[0-9]/.test(fields.next)) errors.next = 'Must contain a number';
    if (fields.next && fields.confirm && fields.next !== fields.confirm) {
        errors.confirm = 'Passwords do not match';
    }
    return errors;
}

export function ChangePassword(): React.ReactElement {
    const [fields, setFields] = useState<PasswordField>({ current: '', next: '', confirm: '' });
    const [errors, setErrors] = useState<FieldErrors>({});
    const [show, setShow] = useState({ current: false, next: false, confirm: false });
    const [isSaving, setIsSaving] = useState(false);

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
            // TODO: wire to real auth service — authService.changePassword(fields.current, fields.next)
            await new Promise((r) => setTimeout(r, 800));
            toast.success('Password changed');
            setFields({ current: '', next: '', confirm: '' });
        } catch {
            toast.error('Failed to change password');
        } finally {
            setIsSaving(false);
        }
    }, [fields]);

    const toggleShow = useCallback((field: keyof typeof show): void => {
        setShow((prev) => ({ ...prev, [field]: !prev[field] }));
    }, []);

    return (
        <section className="space-y-4 rounded-xl border border-border/50 bg-card p-6">
            <div className="flex items-center gap-2">
                <LockKey size={16} className="text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Change password</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {(
                    [
                        { id: 'current', label: 'Current password', field: 'current' },
                        { id: 'next', label: 'New password', field: 'next' },
                        { id: 'confirm', label: 'Confirm new password', field: 'confirm' },
                    ] as const
                ).map(({ id, label, field }) => (
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
                    {isSaving ? 'Saving...' : 'Update password'}
                </Button>
            </form>
        </section>
    );
}
