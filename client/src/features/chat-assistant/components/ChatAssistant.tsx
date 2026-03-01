'use client';

import * as React from 'react';
import { AnimatePresence } from 'motion/react';
import { usePathname } from 'next/navigation';

import { ChatButton } from './ChatButton';
import { ChatWindow } from './ChatWindow';
import { useChatAssistant } from '../hooks';

export function ChatAssistant(): React.ReactElement {
    const pathname = usePathname();

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

    return (
        <div className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6">
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
            <ChatButton
                onClick={toggleChat}
                characterState={isOpen ? 'happy' : characterState}
                onWakeUp={wakeUp}
                unreadCount={isOpen ? 0 : unreadCount}
            />
        </div>
    );
}
