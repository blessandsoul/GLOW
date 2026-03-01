'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { ThumbsUp, ThumbsDown, ArrowClockwise, WifiSlash } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

import type { ChatMessage as ChatMessageType } from '../types';
import { Character } from './Character';
import { LanguageContext } from '@/i18n/LanguageProvider';

interface ChatMessageProps {
    message: ChatMessageType;
    onFeedback?: (messageId: string, feedback: 'liked' | 'disliked') => void;
    onRetry?: (messageId: string, originalContent: string) => void;
}

const LOCALE_MAP: Record<string, string> = {
    ka: 'ka-GE',
    ru: 'ru-RU',
    en: 'en-US',
};

// Custom link renderer: internal links use Next.js Link, external open in new tab
function MarkdownLink({ href, children }: { href?: string; children?: React.ReactNode }): React.ReactElement {
    if (!href) return <span>{children}</span>;

    const isInternal = href.startsWith('/');

    if (isInternal) {
        return (
            <Link
                href={href}
                className="font-medium text-primary underline decoration-primary/40 underline-offset-2 transition-colors hover:decoration-primary"
            >
                {children}
            </Link>
        );
    }

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline decoration-primary/40 underline-offset-2 transition-colors hover:decoration-primary"
        >
            {children}
        </a>
    );
}

export function ChatMessage({
    message,
    onFeedback,
    onRetry,
}: ChatMessageProps): React.ReactElement {
    const langContext = React.useContext(LanguageContext);
    const locale = LOCALE_MAP[langContext?.language ?? 'ka'] ?? 'ka-GE';
    const { t } = langContext ?? { t: (k: string): string => k };
    const isUser = message.role === 'user';
    const canRetry = !isUser && message.isFallback && (message.retryCount ?? 0) < 1;
    const showFeedback = !isUser && message.id !== 'welcome';

    return (
        <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
                'group flex max-w-[85%] gap-2',
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}
        >
            {/* Bot avatar */}
            {!isUser && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/8">
                    <Character state="idle" size={22} />
                </div>
            )}

            <div className="flex flex-col">
                <div
                    className={cn(
                        'rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
                        isUser
                            ? 'rounded-br-md bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                            : 'rounded-bl-md bg-muted/80 text-foreground'
                    )}
                >
                    {isUser ? (
                        <p className="whitespace-pre-wrap break-words">
                            {message.content}
                        </p>
                    ) : (
                        <ReactMarkdown
                            components={{
                                a: MarkdownLink,
                                p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                                ul: ({ children }) => <ul className="mb-1.5 ml-3 list-disc space-y-0.5">{children}</ul>,
                                ol: ({ children }) => <ol className="mb-1.5 ml-3 list-decimal space-y-0.5">{children}</ol>,
                                li: ({ children }) => <li className="text-[13px]">{children}</li>,
                                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                em: ({ children }) => <em className="italic">{children}</em>,
                                code: ({ children }) => <code className="rounded bg-foreground/10 px-1 py-0.5 font-mono text-[11px]">{children}</code>,
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    )}

                    <span
                        className={cn(
                            'mt-1 flex items-center gap-1.5 text-[10px] tabular-nums',
                            isUser
                                ? 'text-primary-foreground/50'
                                : 'text-muted-foreground/70'
                        )}
                    >
                        {message.timestamp.toLocaleTimeString(locale, {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                        {message.isFallback && (
                            <span className="inline-flex items-center gap-0.5">
                                <WifiSlash className="h-2.5 w-2.5" />
                                {t('chat.fallback_notice')}
                            </span>
                        )}
                    </span>
                </div>

                {/* Action row: feedback + retry */}
                {!isUser && (showFeedback || canRetry) && (
                    <div className="mt-1 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        {showFeedback && onFeedback && (
                            <>
                                <motion.button
                                    whileTap={{ scale: 0.85 }}
                                    onClick={() => onFeedback(message.id, 'liked')}
                                    className={cn(
                                        'rounded-md p-1 transition-colors',
                                        message.feedback === 'liked'
                                            ? 'text-success'
                                            : 'text-muted-foreground/40 hover:text-success/70'
                                    )}
                                    aria-label="Helpful"
                                >
                                    <ThumbsUp className="h-3.5 w-3.5" weight={message.feedback === 'liked' ? 'fill' : 'regular'} />
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.85 }}
                                    onClick={() => onFeedback(message.id, 'disliked')}
                                    className={cn(
                                        'rounded-md p-1 transition-colors',
                                        message.feedback === 'disliked'
                                            ? 'text-destructive'
                                            : 'text-muted-foreground/40 hover:text-destructive/70'
                                    )}
                                    aria-label="Not helpful"
                                >
                                    <ThumbsDown className="h-3.5 w-3.5" weight={message.feedback === 'disliked' ? 'fill' : 'regular'} />
                                </motion.button>
                            </>
                        )}
                        {canRetry && onRetry && (
                            <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={() => onRetry(message.id, message.originalUserMessage ?? '')}
                                className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground/50 transition-colors hover:text-primary"
                            >
                                <ArrowClockwise className="h-3 w-3" weight="bold" />
                                {t('chat.retry')}
                            </motion.button>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
