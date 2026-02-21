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
