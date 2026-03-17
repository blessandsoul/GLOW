export interface CityOption {
    /** Lowercase slug — stored in DB and sent to API */
    value: string;
    ka: string;
    ru: string;
    en: string;
}

export const GEORGIAN_CITIES: CityOption[] = [
    { value: 'tbilisi',      ka: 'თბილისი',   ru: 'Тбилиси',     en: 'Tbilisi' },
    { value: 'batumi',       ka: 'ბათუმი',    ru: 'Батуми',      en: 'Batumi' },
    { value: 'kutaisi',      ka: 'ქუთაისი',   ru: 'Кутаиси',     en: 'Kutaisi' },
    { value: 'rustavi',      ka: 'რუსთავი',   ru: 'Რустави',     en: 'Rustavi' },
    { value: 'zugdidi',      ka: 'ზუგდიდი',   ru: 'Зугдиди',     en: 'Zugdidi' },
    { value: 'gori',         ka: 'გორი',      ru: 'Гори',        en: 'Gori' },
    { value: 'poti',         ka: 'ფოთი',      ru: 'Поти',        en: 'Poti' },
    { value: 'telavi',       ka: 'თელავი',    ru: 'Телави',      en: 'Telavi' },
    { value: 'kobuleti',     ka: 'ქობულეთი',  ru: 'Кობулети',    en: 'Kobuleti' },
    { value: 'senaki',       ka: 'სენაკი',    ru: 'Სენაки',      en: 'Senaki' },
    { value: 'samtredia',    ka: 'სამტრედია', ru: 'Самтредиа',   en: 'Samtredia' },
    { value: 'marneuli',     ka: 'მარნეული',  ru: 'Марნეული',    en: 'Marneuli' },
    { value: 'akhaltsikhe',  ka: 'ახალციხე',  ru: 'Ахалцихе',    en: 'Akhaltsikhe' },
    { value: 'ozurgeti',     ka: 'ოზურგეთი',  ru: 'Озургети',    en: 'Ozurgeti' },
    { value: 'tkibuli',      ka: 'ტყიბული',   ru: 'Ткибული',     en: 'Tkibuli' },
    { value: 'kaspi',        ka: 'კასპი',     ru: 'Каспი',       en: 'Kaspi' },
    { value: 'zestaponi',    ka: 'ზესტაფონი', ru: 'Зესტაფონი',   en: 'Zestaponi' },
    { value: 'mtskheta',     ka: 'მცხეთა',    ru: 'Мцхეთа',      en: 'Mtskheta' },
    { value: 'borjomi',      ka: 'ბორჯომი',   ru: 'Боржоми',     en: 'Borjomi' },
    { value: 'sighnaghi',    ka: 'სიღნაღი',   ru: 'Сигნахი',     en: 'Sighnaghi' },
];

/**
 * Get localized label for a city stored value.
 * Handles both lowercase slugs and legacy PascalCase/localized values.
 */
export function getCityLabel(storedValue: string, lang: string): string {
    const lower = storedValue.toLowerCase();
    // Try match on lowercase value
    let city = GEORGIAN_CITIES.find((c) => c.value === lower);

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

/** Get all cities as { value, label } for the current language. value = lowercase slug. */
export function getCityOptions(lang: string): { value: string; label: string }[] {
    return GEORGIAN_CITIES.map((c) => ({
        value: c.value,
        label: lang === 'ka' ? c.ka : lang === 'ru' ? c.ru : c.en,
    }));
}
