'use client';

import * as React from 'react';
import { AnimatePresence } from 'motion/react';

import { ChatButton } from './ChatButton';
import { ChatWindow } from './ChatWindow';
import { useChatAssistant } from '../hooks';

export function ChatAssistant(): React.ReactElement {
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
    } = useChatAssistant();

    const handleInputFocus = React.useCallback(
        (): void => setCharacterState('listening'),
        [setCharacterState]
    );

    const handleInputBlur = React.useCallback((): void => {
        if (!isTyping) setCharacterState('idle');
    }, [isTyping, setCharacterState]);

    return (
        <div className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6">
            <AnimatePresence mode="wait">
                {isOpen && (
                    <ChatWindow
                        messages={messages}
                        isTyping={isTyping}
                        characterState={characterState}
                        onSendMessage={sendMessage}
                        onQuickAction={handleQuickAction}
                        onClose={closeChat}
                        onClear={clearChat}
                        onInputFocus={handleInputFocus}
                        onInputBlur={handleInputBlur}
                    />
                )}
            </AnimatePresence>
            <ChatButton
                onClick={toggleChat}
                characterState={isOpen ? 'happy' : characterState}
                onWakeUp={wakeUp}
            />
        </div>
    );
}
