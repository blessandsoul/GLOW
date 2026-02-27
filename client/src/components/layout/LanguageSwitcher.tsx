'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { cn } from '@/lib/utils';
import type { SupportedLanguage } from '@/i18n/config';

/* ── SVG flag icons (inline for zero-dependency, crisp at 20×14) ── */

function FlagGE({ className }: { className?: string }): React.ReactElement {
    return (
        <svg viewBox="0 0 20 14" fill="none" className={className} aria-hidden>
            <rect width="20" height="14" rx="1.5" fill="#fff" />
            <path d="M8.5 0H11.5V14H8.5V0Z" fill="#E8112D" />
            <path d="M0 5.5H20V8.5H0V5.5Z" fill="#E8112D" />
            {/* Small crosses in each quadrant */}
            <path d="M3.75 1.75H5.25V3.25H3.75V1.75Z" fill="#E8112D" />
            <path d="M3.5 2.25H5.5V2.75H3.5V2.25Z" fill="#E8112D" />
            <path d="M4.25 1.5H4.75V3.5H4.25V1.5Z" fill="#E8112D" />
            <path d="M14.75 1.75H16.25V3.25H14.75V1.75Z" fill="#E8112D" />
            <path d="M14.5 2.25H16.5V2.75H14.5V2.25Z" fill="#E8112D" />
            <path d="M15.25 1.5H15.75V3.5H15.25V1.5Z" fill="#E8112D" />
            <path d="M3.75 10.75H5.25V12.25H3.75V10.75Z" fill="#E8112D" />
            <path d="M3.5 11.25H5.5V11.75H3.5V11.25Z" fill="#E8112D" />
            <path d="M4.25 10.5H4.75V12.5H4.25V10.5Z" fill="#E8112D" />
            <path d="M14.75 10.75H16.25V12.25H14.75V10.75Z" fill="#E8112D" />
            <path d="M14.5 11.25H16.5V11.75H14.5V11.25Z" fill="#E8112D" />
            <path d="M15.25 10.5H15.75V12.5H15.25V10.5Z" fill="#E8112D" />
        </svg>
    );
}

function FlagRU({ className }: { className?: string }): React.ReactElement {
    return (
        <svg viewBox="0 0 20 14" fill="none" className={className} aria-hidden>
            <rect width="20" height="14" rx="1.5" fill="#fff" />
            <rect y="4.667" width="20" height="4.667" fill="#0039A6" />
            <rect y="9.333" width="20" height="4.667" fill="#D52B1E" />
        </svg>
    );
}

function FlagGB({ className }: { className?: string }): React.ReactElement {
    return (
        <svg viewBox="0 0 20 14" fill="none" className={className} aria-hidden>
            <rect width="20" height="14" rx="1.5" fill="#012169" />
            {/* White diagonals */}
            <path d="M0 0L20 14M20 0L0 14" stroke="#fff" strokeWidth="2.5" />
            {/* Red diagonals */}
            <path d="M0 0L20 14M20 0L0 14" stroke="#C8102E" strokeWidth="1.2" />
            {/* White cross */}
            <path d="M10 0V14M0 7H20" stroke="#fff" strokeWidth="4" />
            {/* Red cross */}
            <path d="M10 0V14M0 7H20" stroke="#C8102E" strokeWidth="2.4" />
        </svg>
    );
}

const FLAG_MAP: Record<SupportedLanguage, typeof FlagGE> = {
    ka: FlagGE,
    ru: FlagRU,
    en: FlagGB,
};

const LANGUAGES: { code: SupportedLanguage; Flag: typeof FlagGE }[] = [
    { code: 'ka', Flag: FlagGE },
    { code: 'ru', Flag: FlagRU },
    { code: 'en', Flag: FlagGB },
];

export function LanguageSwitcher(): React.ReactElement {
    const { language, setLanguage } = useLanguage();
    const [open, setOpen] = useState(false);
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Animate dropdown open/close
    useEffect(() => {
        if (open) {
            // Mount first, then make visible on next frame for CSS transition
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setVisible(true));
            });
        } else {
            setVisible(false);
        }
    }, [open]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent): void => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                handleClose();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') handleClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (closeTimer.current) clearTimeout(closeTimer.current);
        };
    }, []);

    const handleClose = useCallback((): void => {
        setVisible(false);
        // Wait for exit animation before unmounting
        closeTimer.current = setTimeout(() => setOpen(false), 150);
    }, []);

    const handleSelect = useCallback((code: SupportedLanguage): void => {
        setLanguage(code);
        handleClose();
    }, [setLanguage, handleClose]);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => {
                    if (open) {
                        handleClose();
                    } else {
                        if (closeTimer.current) clearTimeout(closeTimer.current);
                        setOpen(true);
                    }
                }}
                aria-expanded={open}
                aria-label="Change language"
                className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md',
                    'transition-all duration-200',
                    'hover:bg-muted/40 active:scale-[0.98]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                    open && 'bg-muted/50',
                )}
            >
                {/* Stacked flags with crossfade */}
                <span className="relative h-3.5 w-5 shrink-0">
                    {LANGUAGES.map(({ code }) => {
                        const Flag = FLAG_MAP[code];
                        return (
                            <Flag
                                key={code}
                                className={cn(
                                    'absolute inset-0 h-3.5 w-5 transition-opacity duration-200',
                                    code === language ? 'opacity-100' : 'opacity-0',
                                )}
                            />
                        );
                    })}
                </span>
            </button>

            {open && (
                <div
                    className={cn(
                        'absolute right-0 top-full z-50 mt-1.5 rounded-xl border border-border/50 bg-background/95 p-1 shadow-lg backdrop-blur-sm',
                        'motion-safe:transition-all motion-safe:duration-150 motion-safe:ease-out origin-top-right',
                        visible
                            ? 'opacity-100 scale-100 translate-y-0'
                            : 'opacity-0 scale-95 -translate-y-1',
                    )}
                >
                    {LANGUAGES.map(({ code, Flag }, index) => {
                        const isActive = code === language;
                        return (
                            <button
                                key={code}
                                type="button"
                                onClick={() => handleSelect(code)}
                                aria-label={code}
                                style={{
                                    transitionDelay: visible ? `${index * 30}ms` : '0ms',
                                }}
                                className={cn(
                                    'flex w-full items-center justify-center rounded-md p-1.5',
                                    'motion-safe:transition-all motion-safe:duration-150',
                                    visible
                                        ? 'opacity-100 translate-x-0'
                                        : 'opacity-0 -translate-x-1',
                                    isActive
                                        ? 'bg-primary/10'
                                        : 'hover:bg-muted/60',
                                )}
                            >
                                <Flag className="h-3.5 w-5 shrink-0" />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
