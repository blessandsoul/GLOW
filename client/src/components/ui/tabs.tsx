'use client';

import { createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

// ─── Context ──────────────────────────────────────────────────────────────────

interface TabsContextValue {
    value: string;
    onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(): TabsContextValue {
    const ctx = useContext(TabsContext);
    if (!ctx) throw new Error('Tabs components must be used within <Tabs>');
    return ctx;
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

interface TabsProps {
    value: string;
    onValueChange: (value: string) => void;
    className?: string;
    children: React.ReactNode;
}

export function Tabs({ value, onValueChange, className, children }: TabsProps): React.ReactElement {
    return (
        <TabsContext.Provider value={{ value, onValueChange }}>
            <div className={cn('w-full', className)}>
                {children}
            </div>
        </TabsContext.Provider>
    );
}

// ─── TabsList ─────────────────────────────────────────────────────────────────

interface TabsListProps {
    className?: string;
    children: React.ReactNode;
}

export function TabsList({ className, children }: TabsListProps): React.ReactElement {
    return (
        <div
            role="tablist"
            className={cn(
                'inline-flex items-center gap-1 rounded-xl border border-border/50 bg-muted/50 p-1',
                className,
            )}
        >
            {children}
        </div>
    );
}

// ─── TabsTrigger ──────────────────────────────────────────────────────────────

interface TabsTriggerProps {
    value: string;
    className?: string;
    children: React.ReactNode;
}

export function TabsTrigger({ value, className, children }: TabsTriggerProps): React.ReactElement {
    const { value: activeValue, onValueChange } = useTabsContext();
    const isActive = activeValue === value;

    return (
        <button
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onValueChange(value)}
            className={cn(
                'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                className,
            )}
        >
            {children}
        </button>
    );
}

// ─── TabsContent ──────────────────────────────────────────────────────────────

interface TabsContentProps {
    value: string;
    className?: string;
    children: React.ReactNode;
}

export function TabsContent({ value, className, children }: TabsContentProps): React.ReactElement | null {
    const { value: activeValue } = useTabsContext();

    if (activeValue !== value) return null;

    return (
        <div
            role="tabpanel"
            className={cn('focus-visible:outline-none', className)}
        >
            {children}
        </div>
    );
}
