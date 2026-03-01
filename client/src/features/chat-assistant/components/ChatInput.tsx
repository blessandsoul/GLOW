'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { PaperPlaneRight } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { LanguageContext } from '@/i18n/LanguageProvider';

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
}

export function ChatInput({
    onSend,
    disabled,
    onFocus,
    onBlur,
}: ChatInputProps): React.ReactElement {
    const langContext = React.useContext(LanguageContext);
    if (!langContext) {
        throw new Error('ChatInput must be used within LanguageProvider');
    }
    const { t } = langContext;

    const [value, setValue] = React.useState('');
    const [isFocused, setIsFocused] = React.useState(false);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    React.useLayoutEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }, [value]);

    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        if (value.trim() && !disabled) {
            onSend(value.trim());
            setValue('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent): void => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleFocus = (): void => {
        setIsFocused(true);
        onFocus?.();
    };

    const handleBlur = (): void => {
        setIsFocused(false);
        onBlur?.();
    };

    const canSend = value.trim().length > 0 && !disabled;

    return (
        <form
            onSubmit={handleSubmit}
            className="relative flex items-end gap-2 border-t border-border/40 bg-background/80 px-3 py-2.5 backdrop-blur-sm"
        >
            {/* Subtle glow line on focus */}
            <motion.div
                className="absolute inset-x-0 top-0 h-px"
                style={{
                    background:
                        'linear-gradient(90deg, transparent, oklch(0.58 0.15 340 / 0.5), transparent)',
                }}
                animate={{ opacity: isFocused ? 1 : 0 }}
                transition={{ duration: 0.2 }}
            />

            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => setValue(e.target.value.slice(0, 500))}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={t('chat.input_placeholder')}
                disabled={disabled}
                rows={1}
                className="max-h-24 flex-1 resize-none overflow-y-auto rounded-md border border-border/30 bg-muted/40 px-3 py-2 text-sm leading-relaxed scrollbar-none transition-colors placeholder:text-muted-foreground focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                maxLength={500}
            />

            <motion.div
                animate={{ scale: canSend ? 1 : 0.9, opacity: canSend ? 1 : 0.4 }}
                transition={{ duration: 0.15 }}
            >
                <Button
                    type="submit"
                    size="icon"
                    disabled={!canSend}
                    className="h-9 w-9 shrink-0 rounded-xl shadow-sm transition-shadow hover:shadow-md"
                >
                    <PaperPlaneRight className="h-4 w-4" weight="fill" />
                </Button>
            </motion.div>
        </form>
    );
}
