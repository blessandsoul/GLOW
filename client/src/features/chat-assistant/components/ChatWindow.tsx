'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowCounterClockwise } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { QuickActions } from './QuickActions';
import { TypingIndicator } from './TypingIndicator';
import { Character } from './Character';
import type {
    ChatMessage as ChatMessageType,
    CharacterState,
} from '../types';
import { LanguageContext } from '@/i18n/LanguageProvider';

interface ChatWindowProps {
    messages: ChatMessageType[];
    isTyping: boolean;
    characterState: CharacterState;
    onSendMessage: (message: string) => void;
    onQuickAction: (actionId: string, label: string) => void;
    onClose: () => void;
    onClear: () => void;
    onInputFocus?: () => void;
    onInputBlur?: () => void;
}

export function ChatWindow({
    messages,
    isTyping,
    characterState,
    onSendMessage,
    onQuickAction,
    onClose,
    onClear,
    onInputFocus,
    onInputBlur,
}: ChatWindowProps): React.ReactElement {
    const langContext = React.useContext(LanguageContext);
    if (!langContext) {
        throw new Error('ChatWindow must be used within LanguageProvider');
    }
    const { t } = langContext;

    const scrollRef = React.useRef<HTMLDivElement>(null);
    const lastMessage = messages[messages.length - 1];
    const showQuickActions = lastMessage?.showQuickActions && !isTyping;

    React.useEffect(() => {
        if (scrollRef.current) {
            const container = scrollRef.current.querySelector(
                '[data-radix-scroll-area-viewport]'
            );
            if (container) container.scrollTop = container.scrollHeight;
        }
    }, [messages, isTyping]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute bottom-20 right-0 flex h-[520px] max-h-[70vh] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl"
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-primary/10 bg-gradient-to-r from-primary to-primary/80 px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                        <Character state={characterState} size={30} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-primary-foreground">
                            {t('chat.title')}
                        </h3>
                        <p className="text-[10px] text-primary-foreground/70">
                            {t('chat.online')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClear}
                        className="h-8 w-8 text-primary-foreground/70 hover:bg-white/10 hover:text-primary-foreground"
                        title={t('chat.clear_chat')}
                    >
                        <ArrowCounterClockwise
                            className="h-4 w-4"
                            weight="bold"
                        />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 text-primary-foreground/70 hover:bg-white/10 hover:text-primary-foreground"
                    >
                        <X className="h-4 w-4" weight="bold" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <ChatMessage key={msg.id} message={msg} />
                    ))}
                    <AnimatePresence>
                        {isTyping && <TypingIndicator />}
                    </AnimatePresence>
                    {showQuickActions && (
                        <QuickActions onAction={onQuickAction} />
                    )}
                </div>
            </ScrollArea>

            {/* Input */}
            <ChatInput
                onSend={onSendMessage}
                disabled={isTyping}
                onFocus={onInputFocus}
                onBlur={onInputBlur}
            />
        </motion.div>
    );
}
