'use client';

import Image from 'next/image';
import { SpinnerGap, Check, X, UserFocus } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getThumbUrl } from '@/lib/utils/image';
import { useFacesAdminPending, useFacesAdminReview } from '@/features/faces/hooks/useFacesAdmin';

function ageFrom(birthDate: string | null): number | null {
    if (!birthDate) return null;
    const dob = new Date(birthDate);
    if (Number.isNaN(dob.getTime())) return null;
    const now = new Date();
    let age = now.getUTCFullYear() - dob.getUTCFullYear();
    const m = now.getUTCMonth() - dob.getUTCMonth();
    if (m < 0 || (m === 0 && now.getUTCDate() < dob.getUTCDate())) age--;
    return age;
}

export function AdminModelsQueue(): React.ReactElement {
    const { pending, isLoading, isError } = useFacesAdminPending();
    const { approve, reject, isPending } = useFacesAdminReview();

    function handleReject(userId: string): void {
        const reason = window.prompt('უარყოფის მიზეზი:');
        if (reason && reason.trim().length > 0) reject(userId, reason.trim());
    }

    return (
        <Card className="rounded-2xl border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <UserFocus size={20} weight="fill" className="text-primary" />
                    მოდელების მოდერაცია
                    {pending.length > 0 && <Badge variant="secondary">{pending.length}</Badge>}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <SpinnerGap size={22} className="animate-spin text-muted-foreground" />
                    </div>
                ) : isError ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">ჩატვირთვა ვერ მოხერხდა.</p>
                ) : pending.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">მოლოდინში მოდელი არ არის.</p>
                ) : (
                    <div className="space-y-4">
                        {pending.map((model) => {
                            const age = ageFrom(model.birthDate);
                            return (
                                <div key={model.id} className="rounded-xl border border-border/50 p-4">
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-foreground">{model.displayName ?? ''}</p>
                                            <p className="text-xs text-muted-foreground tabular-nums">
                                                {[age, model.city].filter(Boolean).join(' · ')}
                                                {model.consentAt ? ' · თანხმობა ✓' : ' · თანხმობის გარეშე'}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 gap-2">
                                            <Button
                                                size="sm"
                                                disabled={isPending}
                                                onClick={() => approve(model.userId)}
                                            >
                                                <Check size={15} className="mr-1.5" /> დამტკიცება
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-destructive hover:text-destructive"
                                                disabled={isPending}
                                                onClick={() => handleReject(model.userId)}
                                            >
                                                <X size={15} className="mr-1.5" /> უარყოფა
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                                        {model.photos.map((photo) => (
                                            <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                                                <Image
                                                    src={getThumbUrl(photo.imageUrl, 256)}
                                                    alt=""
                                                    fill
                                                    unoptimized
                                                    sizes="20vw"
                                                    className="object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
