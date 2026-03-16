export interface CityOption {
    /** English name — stored in DB and sent to API */
    value: string;
    ka: string;
    ru: string;
    en: string;
}

export const GEORGIAN_CITIES: CityOption[] = [
    { value: 'Tbilisi',      ka: 'თბილისი',   ru: 'Тбилиси',     en: 'Tbilisi' },
    { value: 'Batumi',       ka: 'ბათუმი',    ru: 'Батуми',      en: 'Batumi' },
    { value: 'Kutaisi',      ka: 'ქუთაისი',   ru: 'Кутаиси',     en: 'Kutaisi' },
    { value: 'Rustavi',      ka: 'რუსთავი',   ru: 'Рустави',     en: 'Rustavi' },
    { value: 'Zugdidi',      ka: 'ზუგდიდი',   ru: 'Зугдиди',     en: 'Zugdidi' },
    { value: 'Gori',         ka: 'გორი',      ru: 'Гори',        en: 'Gori' },
    { value: 'Poti',         ka: 'ფოთი',      ru: 'Поти',        en: 'Poti' },
    { value: 'Telavi',       ka: 'თელავი',    ru: 'Телави',      en: 'Telavi' },
    { value: 'Kobuleti',     ka: 'ქობულეთი',  ru: 'Кобулети',    en: 'Kobuleti' },
    { value: 'Senaki',       ka: 'სენაკი',    ru: 'Сенаки',      en: 'Senaki' },
    { value: 'Samtredia',    ka: 'სამტრედია', ru: 'Самтредиа',   en: 'Samtredia' },
    { value: 'Marneuli',     ka: 'მარნეული',  ru: 'Марнეული',    en: 'Marneuli' },
    { value: 'Akhaltsikhe',  ka: 'ახალციხე',  ru: 'Ахалцихе',    en: 'Akhaltsikhe' },
    { value: 'Ozurgeti',     ka: 'ოზურგეთი',  ru: 'Озургети',    en: 'Ozurgeti' },
    { value: 'Tkibuli',      ka: 'ტყიბული',   ru: 'Ткибули',     en: 'Tkibuli' },
    { value: 'Kaspi',        ka: 'კასპი',     ru: 'Каспи',       en: 'Kaspi' },
    { value: 'Zestaponi',    ka: 'ზესტაფონი', ru: 'Зესტაфონი',   en: 'Zestaponi' },
    { value: 'Mtskheta',     ka: 'მცხეთა',    ru: 'Мцხета',      en: 'Mtskheta' },
    { value: 'Borjomi',      ka: 'ბორჯომი',   ru: 'Боржоми',     en: 'Borjomi' },
    { value: 'Sighnaghi',    ka: 'სიღნაღი',   ru: 'Сигнахи',     en: 'Sighnaghi' },
];

/**
 * Get localized label for a city stored value (English name).
 * Also handles legacy values in Georgian/Russian by matching against all locales.
 */
export function getCityLabel(storedValue: string, lang: string): string {
    // Try exact match on value (English name)
    let city = GEORGIAN_CITIES.find((c) => c.value === storedValue);

    // Fallback: try matching against any locale (handles legacy "თბილისი", "Тбилиси" etc.)
    if (!city) {
        city = GEORGIAN_CITIES.find(
            (c) => c.ka === storedValue || c.ru === storedValue || c.en === storedValue
        );
    }

    if (!city) return storedValue;
    if (lang === 'ka') return city.ka;
    if (lang === 'ru') return city.ru;
    return city.en;
}

/** Get all cities as { value, label } for the current language. value = English name. */
export function getCityOptions(lang: string): { value: string; label: string }[] {
    return GEORGIAN_CITIES.map((c) => ({
        value: c.value,
        label: lang === 'ka' ? c.ka : lang === 'ru' ? c.ru : c.en,
    }));
}
