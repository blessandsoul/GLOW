import ka from './dictionaries/ka.json';
import ru from './dictionaries/ru.json';
import en from './dictionaries/en.json';

export const defaultLanguage = 'ka';

export const dictionaries = {
    ka,
    ru,
    en,
} as const;

export type SupportedLanguage = keyof typeof dictionaries;

export type Dictionary = typeof ka;

/**
 * Resolve a localized field from an object with `_ka`, `_ru`, `_en` suffixes.
 *
 * Usage:
 *   localized(style, 'name', language)   → style.name_ka | name_ru | name_en
 *   localized(category, 'label', language) → category.label_ka | label_ru | label_en
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function localized(
    obj: any,
    field: string,
    lang: SupportedLanguage,
): string {
    const value = obj[`${field}_${lang}`];
    if (typeof value === 'string' && value) return value;
    // Fallback to Georgian
    const fallback = obj[`${field}_ka`];
    return typeof fallback === 'string' ? fallback : '';
}
