'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

import type { ChatMessage as ChatMessageType } from '../types';
import { Character } from './Character';

interface ChatMessageProps {
    message: ChatMessageType;
}

export function ChatMessage({
    message,
}: ChatMessageProps): React.ReactElement {
    const isUser = message.role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            className={cn(
                'flex max-w-[85%] gap-2',
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}
        >
            {!isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Character state="idle" size={28} />
                </div>
            )}

            <div
                className={cn(
                    'rounded-2xl px-3 py-2 text-sm',
                    isUser
                        ? 'rounded-br-md bg-primary text-primary-foreground'
                        : 'rounded-bl-md bg-muted text-foreground'
                )}
            >
                <p className="whitespace-pre-wrap break-words">
                    {message.content}
                </p>
                <span
                    className={cn(
                        'mt-1 block text-[10px]',
                        isUser
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                    )}
                >
                    {message.timestamp.toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </span>
            </div>
        </motion.div>
    );
}
