import type { ChatCategory, MockResponse } from '../types';

export const TYPING_DELAY = { min: 800, max: 1800 };

export const WELCOME_MESSAGE = {
    id: 'welcome',
    role: 'assistant' as const,
    content: 'chat.welcome', // Dictionary key
    timestamp: new Date(),
    showQuickActions: true,
};

export const MOCK_RESPONSES: Record<ChatCategory, MockResponse[]> = {
    services: [
        {
            patterns: [
                'наращивание',
                'ресницы',
                'объём',
                'классика',
                'lash',
                'eyelash',
                'extensions',
                'წამწამები',
                'დაგრძელება'
            ],
            responses: [
                'chat.mock_services_1',
                'chat.mock_services_2',
            ],
            followUpActions: ['portfolio', 'services'],
        },
        {
            patterns: [
                'ламинирование',
                'ботокс',
                'lifting',
                'лифтинг',
                'окрашивание',
                'lamination',
                'ლამინირება',
                'ბოტოქსი'
            ],
            responses: [
                'chat.mock_services_3',
                'chat.mock_services_4',
            ],
            followUpActions: ['services', 'support'],
        },
        {
            patterns: ['цена', 'стоимость', 'сколько', 'прайс', 'price', 'cost', 'ფასი', 'რა ღირს', 'ღირებულება'],
            responses: [
                'chat.mock_services_5',
                'chat.mock_services_6',
            ],
            followUpActions: ['services', 'navigation'],
        },
    ],
    navigation: [
        {
            patterns: [
                'каталог',
                'мастера',
                'найти',
                'поиск',
                'browse',
                'catalog',
                'find',
                'კატალოგი',
                'იპოვე',
                'ძებნა',
                'ოსტატი'
            ],
            responses: [
                'chat.mock_nav_1',
            ],
            followUpActions: ['services'],
        },
        {
            patterns: [
                'вход',
                'регистрация',
                'аккаунт',
                'профиль',
                'login',
                'register',
                'account',
                'შესვლა',
                'რეგისტრაცია',
                'ანგარიში'
            ],
            responses: [
                'chat.mock_nav_2',
            ],
        },
        {
            patterns: [
                'контакт',
                'связь',
                'адрес',
                'телефон',
                'contact',
                'phone',
                'address',
                'კონტაქტი',
                'ტელეფონი',
                'მისამართი'
            ],
            responses: [
                'chat.mock_nav_3',
            ],
            followUpActions: ['support'],
        },
    ],
    support: [
        {
            patterns: [
                'помощь',
                'помогите',
                'проблема',
                'ошибка',
                'help',
                'problem',
                'error',
                'დახმარება',
                'პრობლემა',
                'შეცდომა'
            ],
            responses: [
                'chat.mock_support_1',
            ],
            followUpActions: ['services', 'navigation'],
        },
        {
            patterns: ['whatsapp', 'ватсап', 'написать', 'чат', 'chat', 'message'],
            responses: [
                'chat.mock_support_2',
            ],
        },
        {
            patterns: ['запись', 'записаться', 'время', 'дата', 'appointment', 'book', 'ჩაწერა', 'დრო', 'თარიღი'],
            responses: [
                'chat.mock_support_3',
                'chat.mock_support_4',
            ],
            followUpActions: ['services', 'navigation'],
        },
    ],
    portfolio: [
        {
            patterns: [
                'работы',
                'фото',
                'портфолио',
                'результат',
                'до после',
                'portfolio',
                'photo',
                'results',
                'before after',
                'ფოტო',
                'შედეგი',
                'პორტფოლიო',
                'ნამუშევარი',
                'მანამდე'
            ],
            responses: [
                'chat.mock_portfolio_1',
                'chat.mock_portfolio_2',
            ],
            followUpActions: ['navigation', 'services'],
        },
        {
            patterns: ['стиль', 'тренд', 'модно', 'trend', 'style', 'სტილი', 'ტრენდი', 'მოდა'],
            responses: [
                'chat.mock_portfolio_3',
            ],
            followUpActions: ['services'],
        },
    ],
    general: [
        {
            patterns: [
                'привет',
                'здравствуй',
                'добрый',
                'hello',
                'hi',
                'hey',
                'გამარჯობა',
                'სალამი'
            ],
            responses: [
                'chat.mock_general_1',
                'chat.mock_general_2',
            ],
            followUpActions: ['services', 'navigation', 'support'],
        },
        {
            patterns: ['спасибо', 'благодарю', 'thanks', 'thank', 'მადლობა', 'გმადლობთ'],
            responses: [
                'chat.mock_general_3',
                'chat.mock_general_4',
            ],
        },
        {
            patterns: ['ок', 'понятно', 'ясно', 'got it', 'okay', 'ok', 'კარგი', 'გასაგებია'],
            responses: [
                'chat.mock_general_5',
                'chat.mock_general_6',
            ],
            followUpActions: ['services', 'support'],
        },
        {
            patterns: ['кто ты', 'что ты', 'бот', 'who are you', 'ვინ ხარ', 'რა ხარ', 'ბოტი'],
            responses: [
                'chat.mock_general_7',
            ],
        },
    ],
};

export const DEFAULT_RESPONSE = {
    responses: [
        'chat.mock_default_1',
        'chat.mock_default_2',
        'chat.mock_default_3',
    ],
    followUpActions: ['services', 'support', 'navigation'],
};
