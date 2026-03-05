'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface OtpInputProps {
    onComplete: (code: string) => void;
    error?: string | null;
    disabled?: boolean;
    digitLabel?: string;
}

export function OtpInput({ onComplete, error, disabled, digitLabel = 'Digit' }: OtpInputProps): React.ReactElement {
    const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleDigitChange = useCallback((index: number, value: string): void => {
        if (!/^\d*$/.test(value)) return;
        const newDigits = [...digits];
        newDigits[index] = value.slice(-1);
        setDigits(newDigits);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        const code = newDigits.join('');
        if (code.length === 6 && newDigits.every(d => d !== '')) {
            onComplete(code);
        }
    }, [digits, onComplete]);

    const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent): void => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    }, [digits]);

    const handlePaste = useCallback((e: React.ClipboardEvent): void => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;
        const newDigits = [...digits];
        for (let i = 0; i < pasted.length; i++) {
            newDigits[i] = pasted[i];
        }
        setDigits(newDigits);

        const nextEmpty = newDigits.findIndex(d => d === '');
        inputRefs.current[nextEmpty >= 0 ? nextEmpty : 5]?.focus();

        if (pasted.length === 6) {
            onComplete(pasted);
        }
    }, [digits, onComplete]);

    const reset = useCallback((): void => {
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
    }, []);

    // Expose reset via a stable ref pattern - parent can call via key change
    useEffect(() => {
        if (error) {
            // Don't auto-clear on error - let user see what they typed
        }
    }, [error]);

    return (
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {digits.map((digit, index) => (
                <Input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={disabled}
                    aria-label={`${digitLabel} ${index + 1}`}
                    className={cn(
                        'h-12 w-12 text-center text-lg font-semibold bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary/20 rounded-xl',
                        error && 'border-destructive focus-visible:ring-destructive/20',
                    )}
                />
            ))}
        </div>
    );
}
