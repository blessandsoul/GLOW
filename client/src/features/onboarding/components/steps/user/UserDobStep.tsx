'use client';

import { useState } from 'react';
import { CalendarBlank } from '@phosphor-icons/react';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { WizardLayout } from '../../WizardLayout';
import type { StepProps } from '../../OnboardingWizard';

export function UserDobStep({ state, dispatch, goNext, goBack }: StepProps): React.ReactElement {
    const { t, language } = useLanguage();
    const [open, setOpen] = useState(false);

    const date = state.dateOfBirth ? new Date(state.dateOfBirth + 'T00:00:00') : undefined;

    const handleSelect = (selected: Date | undefined): void => {
        if (selected) {
            const year = selected.getFullYear();
            const month = String(selected.getMonth() + 1).padStart(2, '0');
            const day = String(selected.getDate()).padStart(2, '0');
            dispatch({ type: 'SET_FIELD', payload: { dateOfBirth: `${year}-${month}-${day}` } });
            setOpen(false);
        }
    };

    const locale = language === 'ka' ? 'ka-GE' : language === 'ru' ? 'ru-RU' : 'en-US';
    const formatted = date
        ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(date)
        : null;

    return (
        <WizardLayout
            title={t('onboarding.dob_title')}
            subtitle={t('onboarding.dob_subtitle')}
            onNext={goNext}
            onBack={goBack}
            onSkip={goNext}
            showSkip={true}
            nextLabel={t('onboarding.btn_continue')}
            backLabel={t('onboarding.btn_back')}
            skipLabel={t('onboarding.btn_skip')}
        >
            <div className="space-y-2">
                <Label className="text-sm">{t('onboarding.dob_label')}</Label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                'w-full justify-start text-left font-normal rounded-xl h-10',
                                !date && 'text-muted-foreground',
                            )}
                        >
                            <CalendarBlank size={16} className="mr-2 shrink-0" />
                            {formatted ?? t('onboarding.dob_label')}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleSelect}
                            defaultMonth={date ?? new Date(2000, 0)}
                            captionLayout="dropdown"
                            fromYear={1940}
                            toYear={new Date().getFullYear() - 10}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </WizardLayout>
    );
}
