'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { Sparkle, Compass, Headset, Images } from '@phosphor-icons/react';

import type { QuickAction } from '../types';
import { LanguageContext } from '@/i18n/LanguageProvider';

const QUICK_ACTIONS: (Omit<QuickAction, 'label'> & { labelKey: string })[] = [
    {
        id: 'services',
        labelKey: 'chat.quick_services',
        icon: Sparkle,
        category: 'services',
    },
    {
        id: 'navigation',
        labelKey: 'chat.quick_navigation',
        icon: Compass,
        category: 'navigation',
    },
    {
        id: 'portfolio',
        labelKey: 'chat.quick_portfolio',
        icon: Images,
        category: 'portfolio',
    },
    {
        id: 'support',
        labelKey: 'chat.quick_support',
        icon: Headset,
        category: 'support',
    },
];

interface QuickActionsProps {
    onAction: (actionId: string, label: string) => void;
}

export function QuickActions({
    onAction,
}: QuickActionsProps): React.ReactElement {
    const langContext = React.useContext(LanguageContext);
    if (!langContext) {
        throw new Error('QuickActions must be used within LanguageProvider');
    }
    const { t } = langContext;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-2 flex flex-wrap gap-1.5"
        >
            {QUICK_ACTIONS.map((action, index) => {
                const Icon = action.icon;
                const label = t(action.labelKey);
                return (
                    <motion.button
                        key={action.id}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.08 * index, duration: 0.2 }}
                        onClick={() => onAction(action.id, label)}
                        className="flex items-center gap-1.5 rounded-full border border-border/50 bg-background px-3 py-1.5 text-xs font-medium text-foreground/80 shadow-sm transition-all duration-150 hover:border-primary/30 hover:bg-primary/5 hover:text-foreground hover:shadow-md active:scale-95"
                    >
                        <Icon className="h-3.5 w-3.5 text-primary/70" />
                        {label}
                    </motion.button>
                );
            })}
        </motion.div>
    );
}
