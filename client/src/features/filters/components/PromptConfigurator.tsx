'use client';

import { memo, useCallback, useMemo } from 'react';
import { Sparkle, ArrowLeft, Lightning } from '@phosphor-icons/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { localized } from '@/i18n/config';
import type { SupportedLanguage } from '@/i18n/config';
import type { MasterPrompt, PromptVariable, PromptVariableValues } from '../types/styles.types';

interface PromptConfiguratorProps {
    masterPrompt: MasterPrompt;
    variables: PromptVariableValues;
    onVariablesChange: (vars: PromptVariableValues) => void;
    onBack: () => void;
    onQuickGenerate?: () => void;
    language: SupportedLanguage;
    t: (key: string) => string;
    isCustomized?: boolean;
    cost?: number;
}

function PromptConfiguratorInner({
    masterPrompt,
    variables,
    onVariablesChange,
    onBack,
    onQuickGenerate,
    language,
    t,
    isCustomized = false,
    cost = 1,
}: PromptConfiguratorProps): React.ReactElement {

    const handleSelectChange = useCallback((variableId: string, optionId: string) => {
        onVariablesChange({ ...variables, [variableId]: optionId });
    }, [variables, onVariablesChange]);

    const handleMultiSelectToggle = useCallback((variableId: string, optionId: string) => {
        const current = (variables[variableId] as string[] | undefined) ?? [];
        const next = current.includes(optionId)
            ? current.filter(id => id !== optionId)
            : [...current, optionId];
        onVariablesChange({ ...variables, [variableId]: next });
    }, [variables, onVariablesChange]);

    const handleQuickRetouch = useCallback(() => {
        const defaults: PromptVariableValues = {};
        for (const v of masterPrompt.variables) {
            defaults[v.id] = v.default;
        }
        onVariablesChange(defaults);
        onQuickGenerate?.();
    }, [masterPrompt, onVariablesChange, onQuickGenerate]);

    // Resolve current value for each variable (use default if not set)
    const resolvedVariables = useMemo(() => {
        const resolved: Record<string, string | string[]> = {};
        for (const v of masterPrompt.variables) {
            resolved[v.id] = variables[v.id] ?? v.default;
        }
        return resolved;
    }, [masterPrompt.variables, variables]);

    return (
        <div className="flex flex-col gap-3">
            {/* Header with back button */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onBack}
                    className={cn(
                        'flex items-center gap-1 rounded-full px-2.5 py-1',
                        'text-[10px] font-medium text-primary',
                        'bg-primary/8 hover:bg-primary/12',
                        'transition-all duration-150 active:scale-[0.96]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                    )}
                >
                    <ArrowLeft size={11} weight="bold" />
                    {t('upload.filter_all') || 'Back'}
                </button>
                <span className="text-[11px] font-semibold text-foreground">
                    {localized(masterPrompt, 'name', language)}
                </span>
            </div>

            {/* Master prompt preview card */}
            <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-muted/20 p-2.5">
                <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg border border-border/30">
                    {masterPrompt.previewUrl ? (
                        <Image
                            src={masterPrompt.previewUrl}
                            alt={localized(masterPrompt, 'name', language)}
                            fill
                            sizes="44px"
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/5">
                            <Sparkle size={14} className="text-primary/30" weight="fill" />
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                    <p className="text-[11px] font-semibold text-foreground truncate">
                        {localized(masterPrompt, 'name', language)}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        {localized(masterPrompt, 'description', language)}
                    </p>
                </div>
            </div>

            {/* Quick retouch button — always 1 credit */}
            <button
                type="button"
                onClick={handleQuickRetouch}
                className={cn(
                    'flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5',
                    'bg-primary/10 text-primary',
                    'text-[11px] font-semibold',
                    'transition-all duration-200 hover:bg-primary/15 active:scale-[0.98]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                )}
            >
                <Lightning size={14} weight="fill" />
                {t('upload.quick_retouch')}
                <span className="flex items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold">
                    <Sparkle size={8} weight="fill" />
                    1
                </span>
            </button>

            {/* Separator */}
            <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                    {t('upload.or_customize')}
                </span>
                <div className="h-px flex-1 bg-border/40" />
            </div>

            {/* Variable selectors */}
            <div className="flex flex-col gap-3">
                {masterPrompt.variables.map((variable) => (
                    <VariableSelector
                        key={variable.id}
                        variable={variable}
                        value={resolvedVariables[variable.id]}
                        onSelectChange={handleSelectChange}
                        onMultiSelectToggle={handleMultiSelectToggle}
                        language={language}
                    />
                ))}
            </div>

            {/* Cost indicator — shows when customized */}
            {isCustomized && (
                <div className={cn(
                    'flex items-center justify-between rounded-xl px-3 py-2',
                    'bg-warning/10 border border-warning/20',
                    'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200',
                )}>
                    <span className="text-[10px] font-medium text-warning-foreground">
                        {t('upload.custom_cost_label')}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-warning-foreground">
                        <Sparkle size={10} weight="fill" className="text-warning" />
                        {cost}
                    </span>
                </div>
            )}
        </div>
    );
}

/* ── Variable Selector (single row) ── */

interface VariableSelectorProps {
    variable: PromptVariable;
    value: string | string[];
    onSelectChange: (variableId: string, optionId: string) => void;
    onMultiSelectToggle: (variableId: string, optionId: string) => void;
    language: SupportedLanguage;
}

function VariableSelector({
    variable,
    value,
    onSelectChange,
    onMultiSelectToggle,
    language,
}: VariableSelectorProps): React.ReactElement {
    const isMulti = variable.type === 'multi-select';
    const selectedIds = isMulti ? (Array.isArray(value) ? value : []) : [];
    const selectedId = isMulti ? '' : (typeof value === 'string' ? value : '');

    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold text-foreground/80">
                {localized(variable, 'label', language)}
            </span>
            <div className="flex flex-wrap gap-1.5">
                {variable.options.map((option) => {
                    const isSelected = isMulti
                        ? selectedIds.includes(option.id)
                        : selectedId === option.id;
                    const label = localized(option, 'label', language);
                    // Skip "none" options that are empty/no-effect
                    const isNone = option.id === 'none';

                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                                if (isMulti) {
                                    onMultiSelectToggle(variable.id, option.id);
                                } else {
                                    onSelectChange(variable.id, option.id);
                                }
                            }}
                            className={cn(
                                'shrink-0 rounded-full px-3 py-1.5',
                                'text-[10px] font-medium',
                                'transition-all duration-150 active:scale-[0.96]',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                isSelected
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : isNone
                                        ? 'bg-muted/30 text-muted-foreground/70 hover:bg-muted/50 border border-border/30'
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/40',
                            )}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export const PromptConfigurator = memo(PromptConfiguratorInner);
