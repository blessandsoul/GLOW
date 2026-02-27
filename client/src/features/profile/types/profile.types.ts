export interface MasterProfile {
    id: string;
    userId: string;
    city: string | null;
    niche: string | null;
    services: ServiceItem[] | null;
    bio: string | null;
    phone: string | null;
    whatsapp: string | null;
    telegram: string | null;
    instagram: string | null;
    createdAt: string;
    updatedAt: string;
}

export type PriceType = 'fixed' | 'hourly';

export interface ServiceItem {
    name: string;
    price: number;
    priceType: PriceType;
    category: string;
}

export interface ProfileFormData {
    city: string;
    niche: string;
    bio: string;
    phone: string;
    whatsapp: string;
    telegram: string;
    instagram: string;
    services: ServiceItem[];
}

export const CITIES = [
    { value: 'tbilisi', label: 'თბილისი' },
    { value: 'batumi', label: 'ბათუმი' },
    { value: 'kutaisi', label: 'ქუთაისი' },
    { value: 'rustavi', label: 'რუსთავი' },
    { value: 'moscow', label: 'მოსკოვი' },
    { value: 'saint_petersburg', label: 'სანქტ-პეტერბურგი' },
    { value: 'kyiv', label: 'კიევი' },
    { value: 'minsk', label: 'მინსკი' },
] as const;

export const NICHES = [
    { value: 'lashes', label: 'წამწამები' },
    { value: 'nails', label: 'ფრჩხილები' },
    { value: 'brows', label: 'წარბები' },
    { value: 'makeup', label: 'მაკიაჟი' },
    { value: 'hair', label: 'თმა' },
    { value: 'skincare', label: 'კანის მოვლა' },
] as const;

// ─── Beauty Industry Service Categories ───────────────────────────────────────

export interface ServiceCategory {
    id: string;
    label: string;
    icon: string;
    suggestions: string[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
    {
        id: 'lashes',
        label: 'ლეში ინდუსტრია',
        icon: '✦',
        suggestions: [
            'ნარდი 2D',
            'ნარდი 3D',
            'ნარდი 4D',
            'ნარდი 5D+',
            'ნარდი Mega Volume',
            'ნარდი Classic',
            'წამწამების კორექცია',
            'წამწამების მოხსნა',
            'წამწამების ლამინირება',
            'წამწამების შეღებვა',
            'წამწამების ბიოზავივი',
            'Lash Lift',
        ],
    },
    {
        id: 'brows',
        label: 'წარბები',
        icon: '✦',
        suggestions: [
            'წარბების არქიტექტურა',
            'წარბების შეღებვა ხნოთი',
            'წარბების შეღებვა საღებავით',
            'წარბების ლამინირება',
            'წარბების ბიოზავივი',
            'წარბების კორექცია ცვილით',
            'წარბების კორექცია ძაფით',
            'წარბების ფორმირება პინცეტით',
        ],
    },
    {
        id: 'nails',
        label: 'ფრჩხილები',
        icon: '✦',
        suggestions: [
            'კლასიკური მანიკური',
            'აპარატული მანიკური',
            'კომბინირებული მანიკური',
            'კლასიკური პედიკური',
            'აპარატული პედიკური',
            'გელ-ლაქის გადაფარვა',
            'გელით ნარდი',
            'აკრილით ნარდი',
            'გელ-ლაქის მოხსნა',
            'ფრჩხილების დიზაინი',
            'ფრჩხილების გამაგრება',
            'French / Ombre',
        ],
    },
    {
        id: 'makeup',
        label: 'მაკიაჟი',
        icon: '✦',
        suggestions: [
            'დღიური მაკიაჟი',
            'საღამოს მაკიაჟი',
            'საქორწილო მაკიაჟი',
            'მაკიაჟი ფოტოსესიისთვის',
            'მაკიაჟი ღონისძიებისთვის',
            'Smoky eyes',
            'ნუდ მაკიაჟი',
            'ტუჩების პერმანენტული მაკიაჟი',
            'წარბების პერმანენტული მაკიაჟი',
            'ქუთუთოების პერმანენტული მაკიაჟი',
        ],
    },
    {
        id: 'hair',
        label: 'თმა',
        icon: '✦',
        suggestions: [
            'თმის შეღებვა',
            'ჰაილაიტინგი',
            'ბალაიაჟი',
            'ომბრე',
            'ტონირება',
            'ქალის ვარცხნილობა',
            'თმის ვარცხნა',
            'კერატინის გასწორება',
            'ბოტოქსი თმისთვის',
            'ფესვების შეღებვა',
            'თმის პრიალა',
            'თმის ნარდი',
        ],
    },
    {
        id: 'skincare',
        label: 'კანის მოვლა',
        icon: '✦',
        suggestions: [
            'სახის გაწმენდა',
            'სახის პილინგი',
            'სახის მასაჟი',
            'მიკრონიდლინგი',
            'RF-ლიფტინგი',
            'ულტრაბგერითი გაწმენდა',
            'მეზოთერაპია',
            'ბიორევიტალიზაცია',
            'კონტურული პლასტიკა',
            'ბოტულინოთერაპია',
            'კრიოთერაპია',
            'ლიმფოდრენაჟული მასაჟი',
        ],
    },
    {
        id: 'waxing',
        label: 'დეპილაცია / შუგარინგი',
        icon: '✦',
        suggestions: [
            'შუგარინგი (ბიკინი)',
            'შუგარინგი (ფეხები)',
            'შუგარინგი (იღლია)',
            'ცვილის დეპილაცია',
            'ლაზერული ეპილაცია',
            'ფოტოეპილაცია',
            'სახის დეპილაცია',
            'ხელების დეპილაცია',
        ],
    },
    {
        id: 'body',
        label: 'მასაჟი / სხეული',
        icon: '✦',
        suggestions: [
            'კლასიკური მასაჟი',
            'ანტიცელულიტური მასაჟი',
            'დამამშვიდებელი მასაჟი',
            'შეფუთვა',
            'LPG-მასაჟი',
            'პრესოთერაპია',
            'ცხელი ქვები',
            'Spa-პროგრამა',
        ],
    },
    {
        id: 'other',
        label: 'სხვა',
        icon: '✦',
        suggestions: [],
    },
];

export const DEFAULT_PROFILE: ProfileFormData = {
    city: '',
    niche: '',
    bio: '',
    phone: '',
    whatsapp: '',
    telegram: '',
    instagram: '',
    services: [],
};
