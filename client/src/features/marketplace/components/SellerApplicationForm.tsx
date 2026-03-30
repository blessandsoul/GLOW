'use client';

import { useState } from 'react';
import { Storefront, SpinnerGap } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useApplySeller } from '../hooks/useMarketplace';
import type { SellerStatus } from '../types/marketplace.types';

interface SellerApplicationFormProps {
    previousStatus?: SellerStatus;
    rejectedReason?: string | null;
}

export function SellerApplicationForm({ previousStatus, rejectedReason }: SellerApplicationFormProps): React.ReactElement {
    const [reason, setReason] = useState('');
    const { apply, isPending } = useApplySeller();

    function handleSubmit(e: React.FormEvent): void {
        e.preventDefault();
        if (reason.trim().length < 10) return;
        apply(reason.trim());
    }

    return (
        <div className="mx-auto max-w-lg">
            <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                {/* Icon + title */}
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Storefront size={20} className="text-primary" weight="fill" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-foreground">
                            გახდი გამყიდველი
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            განაცხადს განიხილავს ადმინისტრატორი
                        </p>
                    </div>
                </div>

                {/* Rejected notice */}
                {previousStatus === 'REJECTED' && rejectedReason && (
                    <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                        <p className="text-xs font-medium text-destructive">წინა განაცხადი უარყოფილია</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{rejectedReason}</p>
                    </div>
                )}

                {/* Requirements */}
                <div className="mb-5 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">მოთხოვნები</p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                        <li className="flex items-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-primary/60" />
                            ვერიფიცირებული ოსტატი
                        </li>
                        <li className="flex items-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-primary/60" />
                            ადმინისტრატორის დადასტურება
                        </li>
                        <li className="flex items-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-primary/60" />
                            0% საკომისიო — ყველაფერს თავად მართავ
                        </li>
                    </ul>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">
                            რატომ გსურს გაყიდვა Glow.GE-ზე?
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="მოგვიყევი, რის გაყიდვას გეგმავ და რატომ..."
                            rows={4}
                            maxLength={500}
                            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
                        />
                        <p className="text-right text-xs text-muted-foreground">
                            {reason.length}/500
                        </p>
                        {reason.length > 0 && reason.trim().length < 10 && (
                            <p className="text-xs text-destructive">მინიმუმ 10 სიმბოლო</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isPending || reason.trim().length < 10}
                    >
                        {isPending ? (
                            <SpinnerGap size={16} className="animate-spin" />
                        ) : (
                            'განაცხადის გაგზავნა'
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
