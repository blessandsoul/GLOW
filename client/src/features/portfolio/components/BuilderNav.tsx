'use client';

import React from 'react';
import { CheckCircle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import type { BuilderSection, CompletionCriteria } from '../types/builder.types';

interface BuilderNavProps {
    activeSection: BuilderSection;
    onSectionClick: (id: BuilderSection) => void;
    criteria: CompletionCriteria;
}

export function BuilderNav({ activeSection, onSectionClick, criteria }: BuilderNavProps): React.ReactElement {
    const { t } = useLanguage();

    const SECTIONS: { id: BuilderSection; label: string; criteriaKey: keyof CompletionCriteria | null }[] = [
        { id: 'about', label: t('portfolio.nav_about'), criteriaKey: 'hasCity' },
        { id: 'services', label: t('portfolio.nav_services'), criteriaKey: 'hasService' },
        { id: 'gallery', label: t('portfolio.nav_gallery'), criteriaKey: 'hasMinImages' },
        { id: 'preview', label: t('portfolio.nav_preview'), criteriaKey: null },
    ];
    const isComplete = (key: keyof CompletionCriteria | null): boolean => {
        if (!key) return false;
        return criteria[key];
    };

    return (
        <>
            {/* Mobile: Sticky 2x2 segmented tabs — full text visible */}
            <nav className="sticky top-14 z-30 -mx-4 border-b border-border/30 bg-background px-4 py-2 md:hidden">
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted/50 p-1">
                    {SECTIONS.map((s) => (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => onSectionClick(s.id)}
                            className={cn(
                                'flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium transition-all duration-200',
                                activeSection === s.id
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground'
                            )}
                        >
                            {s.label}
                            {isComplete(s.criteriaKey) && (
                                <CheckCircle size={12} weight="fill" className={cn(
                                    'shrink-0',
                                    activeSection === s.id ? 'text-success' : 'text-success/60'
                                )} />
                            )}
                        </button>
                    ))}
                </div>
            </nav>

            {/* Desktop: Sidebar nav */}
            <aside className="hidden md:block md:w-52 shrink-0">
                <nav className="sticky top-24 space-y-1">
                    {SECTIONS.map((s) => (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => onSectionClick(s.id)}
                            className={cn(
                                'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                                activeSection === s.id
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            )}
                        >
                            {s.label}
                            {isComplete(s.criteriaKey) && (
                                <CheckCircle size={16} weight="fill" className="text-success" />
                            )}
                        </button>
                    ))}
                </nav>
            </aside>
        </>
    );
}
