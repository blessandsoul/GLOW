'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Star, PencilSimple, Trash, SignIn } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store/hooks';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useMyReview, useCreateReview, useUpdateReview, useDeleteReview } from '../hooks/useReview';

interface ReviewFormProps {
    masterId: string;
}

function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }): React.ReactElement {
    const [hovered, setHovered] = useState(0);

    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
                const starValue = i + 1;
                const isFilled = starValue <= (hovered || value);
                return (
                    <button
                        key={i}
                        type="button"
                        className="cursor-pointer p-0.5 transition-transform duration-150 hover:scale-110 active:scale-95"
                        onClick={() => onChange(starValue)}
                        onMouseEnter={() => setHovered(starValue)}
                        onMouseLeave={() => setHovered(0)}
                        aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
                    >
                        <Star
                            size={24}
                            weight={isFilled ? 'fill' : 'regular'}
                            className={isFilled ? 'text-warning' : 'text-muted-foreground/40'}
                        />
                    </button>
                );
            })}
        </div>
    );
}

export function ReviewForm({ masterId }: ReviewFormProps): React.ReactElement | null {
    const { t } = useLanguage();
    const user = useAppSelector((s) => s.auth.user);
    const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
    const isOwnProfile = user?.id === masterId;

    const { myReview, isLoading } = useMyReview(masterId, isAuthenticated);
    const { createReview, isCreating } = useCreateReview(masterId);
    const { updateReview, isUpdating } = useUpdateReview(masterId);
    const { deleteReview, isDeleting } = useDeleteReview(masterId);

    const [rating, setRating] = useState(0);
    const [text, setText] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleStartEdit = useCallback((): void => {
        if (myReview) {
            setRating(myReview.rating);
            setText(myReview.text ?? '');
            setIsEditing(true);
        }
    }, [myReview]);

    const handleCancelEdit = useCallback((): void => {
        setIsEditing(false);
        setRating(0);
        setText('');
    }, []);

    const handleSubmit = useCallback((): void => {
        if (rating === 0) return;

        if (isEditing && myReview) {
            updateReview({
                reviewId: myReview.id,
                data: { rating, text: text.trim() || undefined },
            });
            setIsEditing(false);
        } else {
            createReview({
                masterId,
                rating,
                text: text.trim() || undefined,
            });
        }
        setRating(0);
        setText('');
    }, [rating, text, isEditing, myReview, masterId, createReview, updateReview]);

    const handleDelete = useCallback((): void => {
        if (myReview) {
            deleteReview(myReview.id);
            setShowDeleteConfirm(false);
            setIsEditing(false);
        }
    }, [myReview, deleteReview]);

    // Not authenticated — show login prompt
    if (!isAuthenticated) {
        return (
            <div className="rounded-xl border border-border/50 bg-card px-4 py-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{t('portfolio.review_login_prompt')}</p>
                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                        <Link href="/login">
                            <SignIn size={14} />
                            {t('portfolio.review_login_prompt')}
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    // Own profile — don't show form
    if (isOwnProfile) return null;

    // Loading state
    if (isLoading) return null;

    // Already reviewed — show existing review with edit/delete options
    if (myReview && !isEditing) {
        return (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{t('portfolio.review_your_rating')}</p>
                        <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    size={14}
                                    weight={i < myReview.rating ? 'fill' : 'regular'}
                                    className={i < myReview.rating ? 'text-warning' : 'text-muted-foreground/30'}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs cursor-pointer"
                            onClick={handleStartEdit}
                        >
                            <PencilSimple size={12} />
                            {t('portfolio.review_edit')}
                        </Button>
                        {showDeleteConfirm ? (
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-7 px-2 text-xs cursor-pointer"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                >
                                    {t('portfolio.review_delete')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs cursor-pointer"
                                    onClick={() => setShowDeleteConfirm(false)}
                                >
                                    ✕
                                </Button>
                            </div>
                        ) : (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-destructive hover:text-destructive cursor-pointer"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <Trash size={12} />
                            </Button>
                        )}
                    </div>
                </div>
                {myReview.text && (
                    <p className="mt-2 text-sm text-muted-foreground">{myReview.text}</p>
                )}
            </div>
        );
    }

    // New review or editing existing
    const isSubmitting = isCreating || isUpdating;

    return (
        <div className="rounded-xl border border-border/50 bg-card px-4 py-4 space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{t('portfolio.review_your_rating')}</p>
                {isEditing && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs cursor-pointer"
                        onClick={handleCancelEdit}
                    >
                        ✕
                    </Button>
                )}
            </div>
            <StarRatingInput value={rating} onChange={setRating} />
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('portfolio.review_placeholder')}
                maxLength={1000}
                rows={3}
                className="w-full resize-none rounded-lg border border-border/50 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <Button
                size="sm"
                className="cursor-pointer"
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
            >
                {isSubmitting
                    ? t('portfolio.review_submitting')
                    : isEditing
                        ? t('portfolio.review_update')
                        : t('portfolio.review_submit')
                }
            </Button>
        </div>
    );
}
