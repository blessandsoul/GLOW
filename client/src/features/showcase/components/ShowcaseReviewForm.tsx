'use client';

import { useCallback, useState } from 'react';
import { Star, CheckCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useSubmitReview } from '../hooks/useShowcase';
import { useLanguage } from "@/i18n/hooks/useLanguage";

interface ShowcaseReviewFormProps {
    jobId: string;
}

export function ShowcaseReviewForm({ jobId }: ShowcaseReviewFormProps): React.ReactElement {
    const { t } = useLanguage();
    const { submitReview, isPending, isSuccess } = useSubmitReview(jobId);
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [text, setText] = useState('');
    const [clientName, setClientName] = useState('');

    const handleSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>): void => {
            e.preventDefault();
            if (rating === 0) return;
            submitReview({ rating, text, clientName });
        },
        [rating, text, clientName, submitReview]
    );

    const handleStarClick = useCallback((value: number): void => {
        setRating(value);
    }, []);

    const handleStarHover = useCallback((value: number): void => {
        setHoveredRating(value);
    }, []);

    const handleStarLeave = useCallback((): void => {
        setHoveredRating(0);
    }, []);

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card p-6 text-center">
                <div className="rounded-full bg-success/10 p-3">
                    <CheckCircle size={24} className="text-success" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                    {t('ui.text_teqmos')}</p>
                <p className="text-xs text-muted-foreground">
                    {t('ui.text_g1po6d')}</p>
            </div>
        );
    }

    const displayRating = hoveredRating || rating;

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-border/50 bg-card p-6"
        >
            <p className="text-sm font-medium text-foreground">{t('ui.text_exdv97')}</p>

            {/* Star rating */}
            <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('ui.text_j2yz0m')}</Label>
                <div
                    className="flex gap-1"
                    onMouseLeave={handleStarLeave}
                    role="radiogroup"
                    aria-label={t('ui.text_j2yz0m')}
                >
                    {Array.from({ length: 5 }).map((_, i) => {
                        const value = i + 1;
                        return (
                            <button
                                key={value}
                                type="button"
                                onClick={() => handleStarClick(value)}
                                onMouseEnter={() => handleStarHover(value)}
                                className="rounded-sm p-0.5 transition-transform duration-150 hover:scale-110 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
                                role="radio"
                                aria-checked={rating === value}
                                aria-label={`${value} из 5`}
                            >
                                <Star
                                    size={28}
                                    weight={value <= displayRating ? 'fill' : 'regular'}
                                    className={cn(
                                        'transition-colors duration-150',
                                        value <= displayRating
                                            ? 'text-warning'
                                            : 'text-muted-foreground/30'
                                    )}
                                />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Client name */}
            <div className="space-y-1.5">
                <Label htmlFor="clientName" className="text-xs text-muted-foreground">
                    {t('ui.text_qvchp7')}</Label>
                <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder={t('ui.text_1x2r82')}
                    disabled={isPending}
                />
            </div>

            {/* Review text */}
            <div className="space-y-1.5">
                <Label htmlFor="reviewText" className="text-xs text-muted-foreground">
                    {t('ui.text_qfkbli')}</Label>
                <Input
                    id="reviewText"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t('ui.text_ltjsfm')}
                    disabled={isPending}
                />
            </div>

            {/* Submit */}
            <Button
                type="submit"
                className="w-full"
                disabled={rating === 0 || isPending}
            >
                {isPending ? t('ui.text_7t09ch') : t('ui.text_jh12t')}
            </Button>
        </form>
    );
}
