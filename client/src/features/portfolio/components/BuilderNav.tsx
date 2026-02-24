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
            {/* Mobile: Sticky horizontal pill tabs */}
            <nav className="sticky top-16 z-30 -mx-4 border-b border-border/30 bg-background/95 px-4 py-2.5 backdrop-blur-sm md:hidden">
                <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
                    {SECTIONS.map((s) => (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => onSectionClick(s.id)}
                            className={cn(
                                'flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                                activeSection === s.id
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                            )}
                        >
                            {s.label}
                            {isComplete(s.criteriaKey) && (
                                <CheckCircle size={14} weight="fill" className="opacity-80" />
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
