'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import {
    Sparkle,
    Compass,
    Headset,
    Images,
} from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import type { QuickAction } from '../types';

const QUICK_ACTIONS: QuickAction[] = [
    {
        id: 'services',
        label: 'Услуги',
        icon: Sparkle,
        category: 'services',
    },
    {
        id: 'navigation',
        label: 'Навигация',
        icon: Compass,
        category: 'navigation',
    },
    {
        id: 'portfolio',
        label: 'Портфолио',
        icon: Images,
        category: 'portfolio',
    },
    {
        id: 'support',
        label: 'Поддержка',
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
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3 flex flex-wrap gap-2"
        >
            {QUICK_ACTIONS.map((action, index) => {
                const Icon = action.icon;
                return (
                    <motion.div
                        key={action.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * index }}
                    >
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAction(action.id, action.label)}
                            className="h-8 gap-1.5 text-xs"
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {action.label}
                        </Button>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}
