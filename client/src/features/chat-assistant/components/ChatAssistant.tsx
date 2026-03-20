'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { X } from '@phosphor-icons/react';

import { ChatButton } from './ChatButton';
import { ChatWindow } from './ChatWindow';
import { useChatAssistant } from '../hooks';
import { LanguageContext } from '@/i18n/LanguageProvider';

const DISMISS_STORAGE_KEY = 'glow_chat_dismissed_until';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000;

function isDismissed(): boolean {
    try {
        const until = localStorage.getItem(DISMISS_STORAGE_KEY);
        if (!until) return false;
        return Date.now() < Number(until);
    } catch {
        return false;
    }
}

function dismissFor24h(): void {
    try {
        localStorage.setItem(
            DISMISS_STORAGE_KEY,
            String(Date.now() + DISMISS_DURATION_MS)
        );
    } catch {
        // Ignore write errors
    }
}

export function ChatAssistant(): React.ReactElement | null {
    const pathname = usePathname();
    const langContext = React.useContext(LanguageContext);
    const t = langContext?.t ?? ((k: string): string => k);

    const [hidden, setHidden] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const constraintsRef = React.useRef<HTMLDivElement>(null);

    // Check dismiss state after mount (localStorage not available during SSR)
    React.useEffect(() => {
        setHidden(isDismissed());
    }, []);

    const {
        isOpen,
        messages,
        isTyping,
        characterState,
        toggleChat,
        closeChat,
        sendMessage,
        handleQuickAction,
        clearChat,
        setCharacterState,
        wakeUp,
        retryMessage,
        giveFeedback,
        toggleMute,
        isMuted,
        unreadCount,
    } = useChatAssistant(pathname);

    const handleInputFocus = React.useCallback(
        (): void => setCharacterState('listening'),
        [setCharacterState]
    );

    const handleInputBlur = React.useCallback((): void => {
        if (!isTyping) setCharacterState('idle');
    }, [isTyping, setCharacterState]);

    const callbacks = React.useMemo(() => ({
        onSendMessage: sendMessage,
        onQuickAction: handleQuickAction,
        onClose: closeChat,
        onClear: clearChat,
        onRetry: retryMessage,
        onFeedback: giveFeedback,
        onToggleMute: toggleMute,
        onInputFocus: handleInputFocus,
        onInputBlur: handleInputBlur,
    }), [sendMessage, handleQuickAction, closeChat, clearChat, retryMessage, giveFeedback, toggleMute, handleInputFocus, handleInputBlur]);

    const handleDismiss = React.useCallback((e: React.MouseEvent): void => {
        e.stopPropagation();
        dismissFor24h();
        setHidden(true);
    }, []);

    if (hidden) return null;

    return (
        <>
            {/* Drag constraints — full viewport */}
            <div ref={constraintsRef} className="pointer-events-none fixed inset-0 z-40" />

            <motion.div
                drag
                dragConstraints={constraintsRef}
                dragElastic={0.08}
                dragMomentum={false}
                className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6"
                style={{ touchAction: 'none' }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <AnimatePresence mode="wait">
                    {isOpen && (
                        <ChatWindow
                            messages={messages}
                            isTyping={isTyping}
                            characterState={characterState}
                            isMuted={isMuted}
                            callbacks={callbacks}
                        />
                    )}
                </AnimatePresence>

                {/* Dismiss for 24h button — appears on hover */}
                <AnimatePresence>
                    {isHovered && !isOpen && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.15 }}
                            onClick={handleDismiss}
                            className="absolute -left-2 -top-2 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border/60 bg-background shadow-md transition-colors hover:bg-destructive hover:text-white"
                            title={t('chat.dismiss_24h')}
                            aria-label={t('chat.dismiss_24h')}
                        >
                            <X size={12} weight="bold" />
                        </motion.button>
                    )}
                </AnimatePresence>

                <ChatButton
                    onClick={toggleChat}
                    characterState={isOpen ? 'happy' : characterState}
                    onWakeUp={wakeUp}
                    unreadCount={isOpen ? 0 : unreadCount}
                />
            </motion.div>
        </>
    );
}
