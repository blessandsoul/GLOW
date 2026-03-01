'use client';

import * as React from 'react';

import type {
    ChatMessage,
    ChatState,
    ChatCategory,
    CharacterState,
} from '../types';
import { chatService } from '../services/chat.service';
import {
    MOCK_RESPONSES,
    DEFAULT_RESPONSE,
    TYPING_DELAY,
    WELCOME_MESSAGE,
} from '../data/mock-responses';
import { LanguageContext } from '@/i18n/LanguageProvider';

const SLEEP_TIMEOUT = 30_000;

export function useChatAssistant(): ChatState & {
    toggleChat: () => void;
    closeChat: () => void;
    sendMessage: (content: string) => Promise<void>;
    handleQuickAction: (actionId: string, label: string) => void;
    clearChat: () => void;
    setCharacterState: (state: CharacterState) => void;
    wakeUp: () => void;
} {
    const langContext = React.useContext(LanguageContext);
    if (!langContext) {
        throw new Error('useChatAssistant must be used within a LanguageProvider');
    }
    const { t, language } = langContext;

    const [state, setState] = React.useState<ChatState>({
        isOpen: false,
        messages: [{ ...WELCOME_MESSAGE, content: t(WELCOME_MESSAGE.content), timestamp: new Date() }],
        isTyping: false,
        characterState: 'idle',
    });

    const sleepTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
        null
    );

    const resetSleepTimer = React.useCallback((): void => {
        if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);

        sleepTimerRef.current = setTimeout(() => {
            setState((prev) => {
                if (!prev.isOpen && prev.characterState === 'idle') {
                    return { ...prev, characterState: 'sleeping' };
                }
                return prev;
            });
        }, SLEEP_TIMEOUT);
    }, []);

    const wakeUp = React.useCallback((): void => {
        setState((prev) => {
            if (prev.characterState === 'sleeping') {
                return { ...prev, characterState: 'idle' };
            }
            return prev;
        });
        resetSleepTimer();
    }, [resetSleepTimer]);

    React.useEffect(() => {
        resetSleepTimer();
        return (): void => {
            if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
        };
    }, [resetSleepTimer]);

    const toggleChat = React.useCallback((): void => {
        wakeUp();
        setState((prev) => ({
            ...prev,
            isOpen: !prev.isOpen,
            characterState: !prev.isOpen ? 'happy' : 'idle',
        }));
    }, [wakeUp]);

    const closeChat = React.useCallback((): void => {
        setState((prev) => ({
            ...prev,
            isOpen: false,
            characterState: 'idle',
        }));
        resetSleepTimer();
    }, [resetSleepTimer]);

    const setCharacterState = React.useCallback(
        (characterState: CharacterState): void => {
            setState((prev) => ({ ...prev, characterState }));
            if (characterState === 'idle') resetSleepTimer();
        },
        [resetSleepTimer]
    );

    // Fallback: local mock response
    const findMockResponse = React.useCallback(
        (
            message: string
        ): { content: string; followUpActions?: string[] } => {
            const lowerMessage = message.toLowerCase();

            for (const category of Object.keys(
                MOCK_RESPONSES
            ) as ChatCategory[]) {
                for (const mockResponse of MOCK_RESPONSES[category]) {
                    if (
                        mockResponse.patterns.some((p) =>
                            lowerMessage.includes(p.toLowerCase())
                        )
                    ) {
                        const idx = Math.floor(
                            Math.random() * mockResponse.responses.length
                        );
                        return {
                            content: t(mockResponse.responses[idx]),
                            followUpActions: mockResponse.followUpActions,
                        };
                    }
                }
            }

            const idx = Math.floor(
                Math.random() * DEFAULT_RESPONSE.responses.length
            );
            return {
                content: t(DEFAULT_RESPONSE.responses[idx]),
                followUpActions: DEFAULT_RESPONSE.followUpActions,
            };
        },
        [t]
    );

    const sendMessage = React.useCallback(
        async (content: string): Promise<void> => {
            if (!content.trim()) return;
            wakeUp();

            const userMessage: ChatMessage = {
                id: `user-${Date.now()}`,
                role: 'user',
                content: content.trim(),
                timestamp: new Date(),
            };

            setState((prev) => ({
                ...prev,
                messages: [...prev.messages, userMessage],
                isTyping: true,
                characterState: 'thinking',
            }));

            let responseContent: string;
            let hasFollowUp = false;

            try {
                // Build history from existing messages (skip welcome)
                const history = state.messages
                    .filter((m) => m.id !== 'welcome')
                    .map((m) => ({
                        role: m.role,
                        content: m.content,
                    }));

                const result = await chatService.sendMessage({
                    message: content.trim(),
                    language: language,
                    history,
                });

                responseContent = result.reply;
                hasFollowUp = true;
            } catch {
                // Fallback to mock responses
                const delay =
                    Math.random() * (TYPING_DELAY.max - TYPING_DELAY.min) +
                    TYPING_DELAY.min;
                await new Promise((resolve) => setTimeout(resolve, delay));

                const mock = findMockResponse(content);
                responseContent = mock.content;
                hasFollowUp = !!mock.followUpActions?.length;
            }

            const botMessage: ChatMessage = {
                id: `bot-${Date.now()}`,
                role: 'assistant',
                content: responseContent,
                timestamp: new Date(),
                showQuickActions: hasFollowUp,
            };

            setState((prev) => ({
                ...prev,
                messages: [...prev.messages, botMessage],
                isTyping: false,
                characterState: 'talking',
            }));

            setTimeout(() => setCharacterState('idle'), 2000);
        },
        [
            findMockResponse,
            setCharacterState,
            wakeUp,
            state.messages,
        ]
    );

    const handleQuickAction = React.useCallback(
        (_actionId: string, label: string): void => {
            sendMessage(label);
        },
        [sendMessage]
    );

    const clearChat = React.useCallback((): void => {
        setState((prev) => ({
            ...prev,
            messages: [{ ...WELCOME_MESSAGE, content: t(WELCOME_MESSAGE.content), timestamp: new Date() }],
        }));
    }, [t]);

    return {
        ...state,
        toggleChat,
        closeChat,
        sendMessage,
        handleQuickAction,
        clearChat,
        setCharacterState,
        wakeUp,
    };
}
