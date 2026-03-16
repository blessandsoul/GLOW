export interface CityOption {
    slug: string;
    ka: string;
    ru: string;
    en: string;
}

export const GEORGIAN_CITIES: CityOption[] = [
    { slug: 'tbilisi',   ka: 'თბილისი',   ru: 'Тбилиси',          en: 'Tbilisi' },
    { slug: 'batumi',    ka: 'ბათუმი',    ru: 'Батуми',           en: 'Batumi' },
    { slug: 'kutaisi',   ka: 'ქუთაისი',   ru: 'Кутаиси',          en: 'Kutaisi' },
    { slug: 'rustavi',   ka: 'რუსთავი',   ru: 'Рустави',          en: 'Rustavi' },
    { slug: 'zugdidi',   ka: 'ზუგდიდი',   ru: 'Зугдиди',          en: 'Zugdidi' },
    { slug: 'gori',      ka: 'გორი',      ru: 'Гори',             en: 'Gori' },
    { slug: 'poti',      ka: 'ფოთი',      ru: 'Поти',             en: 'Poti' },
    { slug: 'telavi',    ka: 'თელავი',    ru: 'Телави',           en: 'Telavi' },
    { slug: 'kobuleti',  ka: 'ქობულეთი',  ru: 'Кобулети',         en: 'Kobuleti' },
    { slug: 'senaki',    ka: 'სენაკი',    ru: 'Сенаки',           en: 'Senaki' },
    { slug: 'samtredia', ka: 'სამტრედია', ru: 'Самтредиа',        en: 'Samtredia' },
    { slug: 'marneuli',  ka: 'მარნეული',  ru: 'Марнеули',         en: 'Marneuli' },
    { slug: 'akhaltsikhe', ka: 'ახალციხე', ru: 'Ахалцихе',       en: 'Akhaltsikhe' },
    { slug: 'ozurgeti',  ka: 'ოზურგეთი',  ru: 'Озургети',         en: 'Ozurgeti' },
    { slug: 'tqibuli',   ka: 'ტყიბული',   ru: 'Ткибули',          en: 'Tkibuli' },
    { slug: 'kaspi',     ka: 'კასპი',     ru: 'Каспи',            en: 'Kaspi' },
    { slug: 'zestaponi', ka: 'ზესტაფონი', ru: 'Зестафони',        en: 'Zestaponi' },
    { slug: 'mtskheta',  ka: 'მცხეთა',    ru: 'Мцхета',           en: 'Mtskheta' },
    { slug: 'borjomi',   ka: 'ბორჯომი',   ru: 'Боржоми',          en: 'Borjomi' },
    { slug: 'sighnaghi', ka: 'სიღნაღი',   ru: 'Сигнахи',          en: 'Sighnaghi' },
];

/** Get the localized label for a city by its slug */
export function getCityLabel(slug: string, lang: string): string {
    const city = GEORGIAN_CITIES.find((c) => c.slug === slug);
    if (!city) return slug;
    if (lang === 'ka') return city.ka;
    if (lang === 'ru') return city.ru;
    return city.en;
}

/** Get all cities as { value, label } for the current language */
export function getCityOptions(lang: string): { value: string; label: string }[] {
    return GEORGIAN_CITIES.map((c) => ({
        value: c.slug,
        label: lang === 'ka' ? c.ka : lang === 'ru' ? c.ru : c.en,
    }));
}
