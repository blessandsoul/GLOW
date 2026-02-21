'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { SupportedLanguage, defaultLanguage, dictionaries } from '@/i18n/config';

export function LanguageDetector() {
    const { setLanguage, t } = useLanguage();
    const checkedRef = useRef(false);

    useEffect(() => {
        if (checkedRef.current) return;
        checkedRef.current = true;

        const hasStoredLanguage = localStorage.getItem('site_language');
        if (hasStoredLanguage) return;

        const browserLang = navigator.language.split('-')[0] as SupportedLanguage;

        if (browserLang && browserLang !== defaultLanguage && dictionaries[browserLang]) {
            const suggestionText =
                browserLang === 'ru' ? t('system.sys_xy9c2g') :
                    browserLang === 'en' ? 'We noticed you are using English. Translate the site?' : '';

            const yesText = browserLang === 'ru' ? t('system.sys_aabixu') : 'Yes, translate';
            const closeText = browserLang === 'ru' ? t('system.sys_u3ujkt') : 'Close';

            if (suggestionText) {
                toast(suggestionText, {
                    duration: 10000,
                    action: {
                        label: yesText,
                        onClick: () => {
                            setLanguage(browserLang);
                        }
                    },
                    cancel: {
                        label: closeText,
                        onClick: () => {
                            localStorage.setItem('site_language', defaultLanguage);
                        }
                    },
                    onDismiss: () => {
                        if (!localStorage.getItem('site_language')) {
                            localStorage.setItem('site_language', defaultLanguage);
                        }
                    }
                });
            }
        }
    }, [setLanguage]);

    return null;
}
