'use client';

import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { dictionaries, SupportedLanguage, defaultLanguage } from './config';

interface LanguageContextType {
    language: SupportedLanguage;
    setLanguage: (lang: SupportedLanguage) => void;
    t: (key: string) => string;
    tArray: (key: string) => string[];
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }): React.ReactElement {
    const [language, setLanguageState] = useState<SupportedLanguage>(defaultLanguage);
    const [transitioning, setTransitioning] = useState(false);
    const pendingLang = useRef<SupportedLanguage | null>(null);
    const isInitialized = useRef(false);

    useEffect(() => {
        const stored = localStorage.getItem('site_language') as SupportedLanguage | null;
        if (stored && dictionaries[stored]) {
            setLanguageState(stored);
            document.documentElement.lang = stored;
        } else {
            document.documentElement.lang = defaultLanguage;
        }
        isInitialized.current = true;
    }, []);

    const setLanguage = useCallback((lang: SupportedLanguage) => {
        if (lang === language || transitioning) return;

        // Skip animation on first load
        if (!isInitialized.current) {
            setLanguageState(lang);
            localStorage.setItem('site_language', lang);
            document.documentElement.lang = lang;
            return;
        }

        // Phase 1: fade out
        pendingLang.current = lang;
        setTransitioning(true);

        // Phase 2: after fade-out, swap language and fade back in
        const timer = setTimeout(() => {
            setLanguageState(lang);
            localStorage.setItem('site_language', lang);
            document.documentElement.lang = lang;
            pendingLang.current = null;
            setTransitioning(false);
        }, 150);

        return () => clearTimeout(timer);
    }, [language, transitioning]);

    const t = useCallback((key: string): string => {
        const keys = key.split('.');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let value: any = dictionaries[language];
        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) break;
        }

        if (value === undefined && language !== defaultLanguage) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let defValue: any = dictionaries[defaultLanguage];
            for (const k of keys) {
                defValue = defValue?.[k];
                if (defValue === undefined) break;
            }
            if (typeof defValue === 'string') return defValue;
        }

        return typeof value === 'string' ? value : key;
    }, [language]);

    const tArray = useCallback((key: string): string[] => {
        const keys = key.split('.');
        let value: unknown = dictionaries[language];
        for (const k of keys) {
            value = (value as Record<string, unknown>)?.[k];
            if (value === undefined) break;
        }

        if (!Array.isArray(value) && language !== defaultLanguage) {
            let defValue: unknown = dictionaries[defaultLanguage];
            for (const k of keys) {
                defValue = (defValue as Record<string, unknown>)?.[k];
                if (defValue === undefined) break;
            }
            if (Array.isArray(defValue)) return defValue as string[];
        }

        return Array.isArray(value) ? value as string[] : [];
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, tArray }}>
            <div
                className="motion-safe:transition-[opacity,transform] motion-safe:duration-200 motion-safe:ease-out"
                style={{
                    opacity: transitioning ? 0 : 1,
                    transform: transitioning ? 'translateY(4px)' : 'translateY(0)',
                }}
            >
                {children}
            </div>
        </LanguageContext.Provider>
    );
}
