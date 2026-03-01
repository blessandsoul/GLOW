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
import { useLocalStorage } from '@/hooks/useLocalStorage';

const SLEEP_TIMEOUT = 30_000;
const MAX_STORED_MESSAGES = 50;
const NOTIFICATION_SOUND_URL = '/sounds/chat-notification.wav';

interface StoredMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    category?: ChatCategory;
    showQuickActions?: boolean;
    isFallback?: boolean;
    retryCount?: number;
    originalUserMessage?: string;
    feedback?: 'liked' | 'disliked' | null;
}

function deserializeMessages(stored: StoredMessage[]): ChatMessage[] {
    return stored.map((m) => ({
        ...m,
        timestamp: new Date(m.timestamp),
    }));
}

function serializeMessages(messages: ChatMessage[]): StoredMessage[] {
    return messages.slice(-MAX_STORED_MESSAGES).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
        category: m.category,
        showQuickActions: m.showQuickActions,
        isFallback: m.isFallback,
        retryCount: m.retryCount,
        originalUserMessage: m.originalUserMessage,
        feedback: m.feedback,
    }));
}

export interface ChatActions {
    toggleChat: () => void;
    closeChat: () => void;
    sendMessage: (content: string) => Promise<void>;
    handleQuickAction: (actionId: string, label: string) => void;
    clearChat: () => void;
    setCharacterState: (state: CharacterState) => void;
    wakeUp: () => void;
    retryMessage: (messageId: string, originalContent: string) => Promise<void>;
    giveFeedback: (messageId: string, feedback: 'liked' | 'disliked') => void;
    toggleMute: () => void;
    isMuted: boolean;
    unreadCount: number;
}

export function useChatAssistant(currentPage?: string): ChatState & ChatActions {
    const langContext = React.useContext(LanguageContext);
    if (!langContext) {
        throw new Error('useChatAssistant must be used within a LanguageProvider');
    }
    const { t, language } = langContext;

    const [storedMessages, setStoredMessages, isHydrated] = useLocalStorage<StoredMessage[]>('glow_chat_messages', []);
    const [isMuted, setIsMuted] = useLocalStorage<boolean>('glow_chat_muted', false);
    const [unreadCount, setUnreadCount] = React.useState(1);

    const [state, setState] = React.useState<ChatState>({
        isOpen: false,
        messages: [{ ...WELCOME_MESSAGE, content: t(WELCOME_MESSAGE.content), timestamp: new Date() }],
        isTyping: false,
        characterState: 'idle',
    });

    const sleepTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);
    const hydrationDone = React.useRef(false);

    // Initialize audio
    React.useEffect(() => {
        audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
        audioRef.current.volume = 0.4;
        return (): void => { audioRef.current = null; };
    }, []);

    const playNotification = React.useCallback((): void => {
        if (isMuted || !audioRef.current) return;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
    }, [isMuted]);

    // Hydrate messages from localStorage (runs once)
    React.useEffect(() => {
        if (!isHydrated || hydrationDone.current) return;
        hydrationDone.current = true;

        if (storedMessages.length > 0) {
            const restored = deserializeMessages(storedMessages);
            setState((prev) => ({ ...prev, messages: restored }));
            setUnreadCount(0);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isHydrated]);

    // Persist messages to localStorage on change
    React.useEffect(() => {
        if (!hydrationDone.current) return;
        setStoredMessages(serializeMessages(state.messages));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.messages]);

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
        setState((prev) => {
            const opening = !prev.isOpen;
            if (opening) {
                setUnreadCount(0);
            }
            return {
                ...prev,
                isOpen: opening,
                characterState: opening ? 'happy' : 'idle',
            };
        });
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
            let wasFallback = false;

            try {
                const history = state.messages
                    .filter((m) => m.id !== 'welcome')
                    .map((m) => ({
                        role: m.role,
                        content: m.content,
                    }));

                const result = await chatService.sendMessage({
                    message: content.trim(),
                    language,
                    history,
                    currentPage,
                });

                responseContent = result.reply;
                hasFollowUp = true;
            } catch {
                const delay =
                    Math.random() * (TYPING_DELAY.max - TYPING_DELAY.min) +
                    TYPING_DELAY.min;
                await new Promise((resolve) => setTimeout(resolve, delay));

                const mock = findMockResponse(content);
                responseContent = mock.content;
                hasFollowUp = !!mock.followUpActions?.length;
                wasFallback = true;
            }

            const botMessage: ChatMessage = {
                id: `bot-${Date.now()}`,
                role: 'assistant',
                content: responseContent,
                timestamp: new Date(),
                showQuickActions: hasFollowUp,
                isFallback: wasFallback,
                originalUserMessage: wasFallback ? content.trim() : undefined,
                retryCount: 0,
            };

            setState((prev) => {
                if (!prev.isOpen) {
                    setUnreadCount((c) => c + 1);
                }
                return {
                    ...prev,
                    messages: [...prev.messages, botMessage],
                    isTyping: false,
                    characterState: 'talking',
                };
            });

            playNotification();
            setTimeout(() => setCharacterState('idle'), 2000);
        },
        [
            findMockResponse,
            setCharacterState,
            wakeUp,
            state.messages,
            language,
            currentPage,
            playNotification,
        ]
    );

    const retryMessage = React.useCallback(
        async (messageId: string, originalContent: string): Promise<void> => {
            setState((prev) => ({
                ...prev,
                isTyping: true,
                characterState: 'thinking',
            }));

            try {
                const history = state.messages
                    .filter((m) => m.id !== 'welcome' && m.id !== messageId)
                    .map((m) => ({
                        role: m.role,
                        content: m.content,
                    }));

                const result = await chatService.sendMessage({
                    message: originalContent,
                    language,
                    history,
                    currentPage,
                });

                setState((prev) => ({
                    ...prev,
                    messages: prev.messages.map((m) =>
                        m.id === messageId
                            ? {
                                  ...m,
                                  content: result.reply,
                                  isFallback: false,
                                  originalUserMessage: undefined,
                                  retryCount: 0,
                              }
                            : m
                    ),
                    isTyping: false,
                    characterState: 'talking',
                }));

                playNotification();
                setTimeout(() => setCharacterState('idle'), 2000);
            } catch {
                setState((prev) => ({
                    ...prev,
                    messages: prev.messages.map((m) =>
                        m.id === messageId
                            ? { ...m, retryCount: (m.retryCount ?? 0) + 1 }
                            : m
                    ),
                    isTyping: false,
                    characterState: 'idle',
                }));
            }
        },
        [state.messages, language, currentPage, setCharacterState, playNotification]
    );

    const giveFeedback = React.useCallback(
        (messageId: string, feedback: 'liked' | 'disliked'): void => {
            setState((prev) => ({
                ...prev,
                messages: prev.messages.map((m) =>
                    m.id === messageId
                        ? { ...m, feedback: m.feedback === feedback ? null : feedback }
                        : m
                ),
            }));
        },
        []
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
        setStoredMessages([]);
    }, [t, setStoredMessages]);

    const toggleMute = React.useCallback((): void => {
        setIsMuted((prev: boolean) => !prev);
    }, [setIsMuted]);

    return {
        ...state,
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
    };
}
