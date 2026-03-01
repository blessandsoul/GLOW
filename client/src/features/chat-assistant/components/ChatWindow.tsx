'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowCounterClockwise, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react';

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

interface ChatCallbacks {
    onSendMessage: (message: string) => void;
    onQuickAction: (actionId: string, label: string) => void;
    onClose: () => void;
    onClear: () => void;
    onRetry: (messageId: string, originalContent: string) => void;
    onFeedback: (messageId: string, feedback: 'liked' | 'disliked') => void;
    onToggleMute: () => void;
    onInputFocus?: () => void;
    onInputBlur?: () => void;
}

interface ChatWindowProps {
    messages: ChatMessageType[];
    isTyping: boolean;
    characterState: CharacterState;
    isMuted: boolean;
    callbacks: ChatCallbacks;
}

export function ChatWindow({
    messages,
    isTyping,
    characterState,
    isMuted,
    callbacks,
}: ChatWindowProps): React.ReactElement {
    const langContext = React.useContext(LanguageContext);
    if (!langContext) {
        throw new Error('ChatWindow must be used within LanguageProvider');
    }
    const { t } = langContext;

    const scrollRef = React.useRef<HTMLDivElement>(null);
    const isNearBottomRef = React.useRef(true);
    const viewportRef = React.useRef<Element | null>(null);
    const lastMessage = messages[messages.length - 1];
    const showQuickActions = lastMessage?.showQuickActions && !isTyping;

    // Cache viewport ref and track scroll position
    React.useEffect(() => {
        if (!scrollRef.current) return;
        const viewport = scrollRef.current.querySelector(
            '[data-radix-scroll-area-viewport]'
        );
        if (!viewport) return;
        viewportRef.current = viewport;

        const handleScroll = (): void => {
            const { scrollTop, scrollHeight, clientHeight } = viewport;
            isNearBottomRef.current =
                scrollHeight - scrollTop - clientHeight < 80;
        };

        viewport.addEventListener('scroll', handleScroll, { passive: true });
        return (): void =>
            viewport.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto-scroll only the viewport — never scrollIntoView which bubbles up
    React.useEffect(() => {
        const viewport = viewportRef.current;
        if (isNearBottomRef.current && viewport) {
            viewport.scrollTo({
                top: viewport.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [messages, isTyping]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="absolute bottom-20 right-0 flex h-[520px] max-h-[70vh] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border/50 bg-background shadow-2xl shadow-primary/5"
        >
            {/* Header — gradient mesh with glassmorphism */}
            <div className="relative shrink-0 overflow-hidden border-b border-primary/10">
                {/* Gradient background */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'linear-gradient(135deg, oklch(0.58 0.15 340) 0%, oklch(0.55 0.12 350) 50%, oklch(0.50 0.13 330) 100%)',
                    }}
                />
                {/* Glass overlay */}
                <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />

                {/* Decorative orbs — pointer-events-none so they don't block buttons */}
                <div
                    className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20"
                    style={{
                        background:
                            'radial-gradient(circle, oklch(0.85 0.10 340), transparent)',
                    }}
                />
                <div
                    className="pointer-events-none absolute -bottom-4 -left-4 h-16 w-16 rounded-full opacity-15"
                    style={{
                        background:
                            'radial-gradient(circle, oklch(0.75 0.12 20), transparent)',
                    }}
                />

                <div className="relative z-10 flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        {/* Avatar container */}
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 shadow-sm backdrop-blur-sm">
                            <Character state={characterState} size={28} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold tracking-tight text-primary-foreground">
                                {t('chat.title')}
                            </h3>
                            <div className="flex items-center gap-1.5">
                                <div
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{
                                        background: 'oklch(0.75 0.2 155)',
                                    }}
                                />
                                <p className="text-[10px] font-medium text-primary-foreground/70">
                                    {t('chat.online')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={callbacks.onToggleMute}
                            className="h-8 w-8 text-primary-foreground/60 hover:bg-white/10 hover:text-primary-foreground"
                            title={isMuted ? t('chat.unmute') : t('chat.mute')}
                            aria-label={isMuted ? t('chat.unmute') : t('chat.mute')}
                        >
                            {isMuted ? (
                                <SpeakerSlash className="h-4 w-4" weight="bold" />
                            ) : (
                                <SpeakerHigh className="h-4 w-4" weight="bold" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={callbacks.onClear}
                            className="h-8 w-8 text-primary-foreground/60 hover:bg-white/10 hover:text-primary-foreground"
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
                            onClick={callbacks.onClose}
                            className="h-8 w-8 text-primary-foreground/60 hover:bg-white/10 hover:text-primary-foreground"
                        >
                            <X className="h-4 w-4" weight="bold" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollRef} className="min-h-0 flex-1 px-4 py-3">
                <div className="space-y-3">
                    {messages.map((msg) => (
                        <ChatMessage
                            key={msg.id}
                            message={msg}
                            onFeedback={callbacks.onFeedback}
                            onRetry={callbacks.onRetry}
                        />
                    ))}
                    <AnimatePresence>
                        {isTyping && <TypingIndicator />}
                    </AnimatePresence>
                    {showQuickActions && (
                        <QuickActions onAction={callbacks.onQuickAction} />
                    )}
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="shrink-0">
                <ChatInput
                    onSend={callbacks.onSendMessage}
                    disabled={isTyping}
                    onFocus={callbacks.onInputFocus}
                    onBlur={callbacks.onInputBlur}
                />
            </div>
        </motion.div>
    );
}
