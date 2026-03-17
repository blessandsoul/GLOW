'use client';

import { useServiceCategories } from '@/features/profile/hooks/useCatalog';
import { cn } from '@/lib/utils';
import { WizardLayout } from '../../WizardLayout';
import type { StepProps } from '../../OnboardingWizard';

export function SalonCategoriesStep({ state, dispatch, goNext, goBack }: StepProps): React.ReactElement {
    const { categories, isLoading } = useServiceCategories();

    const toggleCategory = (id: string): void => {
        const current = state.serviceCategories;
        const next = current.includes(id)
            ? current.filter((c) => c !== id)
            : [...current, id];
        dispatch({ type: 'SET_FIELD', payload: { serviceCategories: next } });
    };

    return (
        <WizardLayout
            title="What services does your salon offer?"
            subtitle="Select all categories that apply"
            onNext={goNext}
            onBack={goBack}
            nextDisabled={state.serviceCategories.length === 0}
        >
            {isLoading ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleCategory(cat.id)}
                            className={cn(
                                'flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-medium transition-all duration-150 cursor-pointer',
                                state.serviceCategories.includes(cat.id)
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border/60 bg-card text-foreground hover:border-primary/40 hover:bg-primary/5',
                            )}
                        >
                            <span className="text-base">{cat.icon}</span>
                            {cat.label}
                        </button>
                    ))}
                </div>
            )}
        </WizardLayout>
    );
}
