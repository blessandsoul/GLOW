'use client';

import * as React from 'react';
import { PaperPlaneRight } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    const inputRef = React.useRef<HTMLInputElement>(null);

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

    return (
        <form
            onSubmit={handleSubmit}
            className="flex gap-2 border-t border-border/50 bg-background p-3"
        >
            <Input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={onFocus}
                onBlur={onBlur}
                placeholder={t('chat.input_placeholder')}
                disabled={disabled}
                className="flex-1 text-sm"
                maxLength={500}
            />
            <Button
                type="submit"
                size="icon"
                disabled={!value.trim() || disabled}
                className="shrink-0"
            >
                <PaperPlaneRight className="h-4 w-4" weight="fill" />
            </Button>
        </form>
    );
}
