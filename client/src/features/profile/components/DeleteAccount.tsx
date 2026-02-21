'use client';

import { useState, useCallback } from 'react';
import { Trash, Warning, SpinnerGap } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/features/auth/store/authSlice';

export function DeleteAccount(): React.ReactElement {
    const dispatch = useAppDispatch();
    const [open, setOpen] = useState(false);
    const [confirm, setConfirm] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const CONFIRM_WORD = 'DELETE';

    const handleDelete = useCallback(async (): Promise<void> => {
        if (confirm !== CONFIRM_WORD) return;
        setIsDeleting(true);
        try {
            // TODO: wire to real auth service — authService.deleteAccount()
            await new Promise((r) => setTimeout(r, 1000));
            dispatch(logout());
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth');
                window.location.href = '/';
            }
        } catch {
            toast.error('Failed to delete account. Try again later.');
            setIsDeleting(false);
        }
    }, [confirm, dispatch]);

    return (
        <section className="space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6">
            <div className="flex items-center gap-2">
                <Warning size={16} className="text-destructive" weight="fill" />
                <p className="text-sm font-semibold text-destructive">Delete account</p>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
                This will permanently delete your account, portfolio, services, and all associated data.
                This action cannot be undone.
            </p>

            {!open ? (
                <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground gap-1.5 cursor-pointer"
                    onClick={() => setOpen(true)}
                >
                    <Trash size={14} />
                    Delete my account
                </Button>
            ) : (
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                            Type <span className="font-mono font-bold text-destructive">{CONFIRM_WORD}</span> to confirm
                        </Label>
                        <Input
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder={CONFIRM_WORD}
                            className="border-destructive/40 focus-visible:ring-destructive/30 font-mono"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={confirm !== CONFIRM_WORD || isDeleting}
                            onClick={handleDelete}
                            className="gap-1.5 cursor-pointer"
                        >
                            {isDeleting && <SpinnerGap size={14} className="animate-spin" />}
                            {isDeleting ? 'Deleting...' : 'Delete permanently'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => { setOpen(false); setConfirm(''); }}
                            className="cursor-pointer"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
        </section>
    );
}
