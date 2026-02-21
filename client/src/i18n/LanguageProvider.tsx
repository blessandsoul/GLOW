'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { dictionaries, SupportedLanguage, defaultLanguage } from './config';

interface LanguageContextType {
    language: SupportedLanguage;
    setLanguage: (lang: SupportedLanguage) => void;
    t: (key: string) => string;
    tArray: (key: string) => string[];
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<SupportedLanguage>(defaultLanguage);

    useEffect(() => {
        const stored = localStorage.getItem('site_language') as SupportedLanguage | null;
        if (stored && dictionaries[stored]) {
            setLanguageState(stored);
            document.documentElement.lang = stored;
        } else {
            document.documentElement.lang = defaultLanguage;
        }
    }, []);

    const setLanguage = useCallback((lang: SupportedLanguage) => {
        setLanguageState(lang);
        localStorage.setItem('site_language', lang);
        document.documentElement.lang = lang;
    }, []);

    const t = useCallback((key: string): string => {
        const keys = key.split('.');
        let value: any = dictionaries[language];
        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) break;
        }

        if (value === undefined && language !== defaultLanguage) {
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
            {children}
        </LanguageContext.Provider>
    );
}
