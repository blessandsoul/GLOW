import * as fs from 'fs';
import * as path from 'path';

const dicts = {
    ka: path.join(process.cwd(), 'src', 'i18n', 'dictionaries', 'ka.json'),
    ru: path.join(process.cwd(), 'src', 'i18n', 'dictionaries', 'ru.json'),
    en: path.join(process.cwd(), 'src', 'i18n', 'dictionaries', 'en.json'),
};

const updates = {
    header: {
        ka: { login: "შესვლა", start: "დაწყება", master: "ოსტატი" },
        en: { login: "Login", start: "Get Started", master: "Master" },
        ru: { login: "Войти", start: "Начать", master: "Мастер" }
    },
    upload: {
        ka: {
            mode_beauty: "ნამუშევრის ფოტო", mode_ba: "მანამდე / შემდეგ", mode_ad: "რეკლამა", mode_batch: "პაკეტი",
            tab_presets: "პრესეტები", tab_trends: "ტრენდები", tab_custom: "მორგება"
        },
        en: {
            mode_beauty: "Work Photo", mode_ba: "Before / After", mode_ad: "Ad", mode_batch: "Batch",
            tab_presets: "Presets", tab_trends: "Trends", tab_custom: "Custom"
        },
        ru: {
            mode_beauty: "Фото работы", mode_ba: "До / После", mode_ad: "Реклама", mode_batch: "Пакет",
            tab_presets: "Пресеты", tab_trends: "Тренды", tab_custom: "Настроить"
        }
    },
    branding: {
        ka: {
            style_minimal: "მინიმალური", style_minimal_desc: "სახელი ფოტოს კუთხეში",
            style_framed: "ჩარჩო", style_framed_desc: "ბრენდირებული ჩარჩო ფოტოს გარშემო",
            style_stories: "Stories", style_stories_desc: "შაბლონი Instagram Stories-ისთვის"
        },
        en: {
            style_minimal: "Minimal", style_minimal_desc: "Handle in photo corner",
            style_framed: "Framed", style_framed_desc: "Branded frame around photo",
            style_stories: "Stories", style_stories_desc: "Template for Instagram Stories"
        },
        ru: {
            style_minimal: "Минимальный", style_minimal_desc: "Ник в углу фото",
            style_framed: "Рамка", style_framed_desc: "Фирменная рамка вокруг фото",
            style_stories: "Stories", style_stories_desc: "Шаблон для Instagram Stories"
        }
    },
    pricing: {
        ka: {
            plan_free: "უფასო", plan_pro: "Pro", plan_business: "Business",
            period_forever: "სამუდამოდ", period_month: "/თვე",
            desc_free: "დასაწყისისთვის", desc_pro: "აქტიური ოსტატებისთვის", desc_business: "სტუდიებისა და ქსელებისთვის",
            feat_free_1: "3 ფოტო თვეში", feat_free_2: "ბაზისური პორტფოლიო (12 ფოტო)", feat_free_3: "LashMe წყლის ნიშანი", feat_free_4: "Showcase რეჟიმი",
            feat_pro_1: "ულიმიტო ფოტოები", feat_pro_2: "ყველა დამუშავების შაბლონი", feat_pro_3: "საკუთარი ბრენდინგი / წყლის ნიშანი", feat_pro_4: "AI წარწერები და ჰეშთეგები", feat_pro_5: "კონტენტ-კალენდარი", feat_pro_6: "100 ნამუშევარი პორტფოლიოში",
            feat_biz_1: "ყველაფერი Pro-დან", feat_biz_2: "პორტფოლიოს საკუთარი დომენი", feat_biz_3: "ნახვების ანალიტიკა", feat_biz_4: "მულტი-ექაუნთი (5 ოსტატამდე)", feat_biz_5: "პრიორიტეტული დამუშავება", feat_biz_6: "ულიმიტო პორტფოლიო"
        },
        en: {
            plan_free: "Free", plan_pro: "Pro", plan_business: "Business",
            period_forever: "forever", period_month: "/mo",
            desc_free: "For starters", desc_pro: "For active masters", desc_business: "For studios and chains",
            feat_free_1: "3 photos / month", feat_free_2: "Basic portfolio (12 photos)", feat_free_3: "LashMe watermark", feat_free_4: "Showcase mode",
            feat_pro_1: "Unlimited photos", feat_pro_2: "All processing templates", feat_pro_3: "Own branding / watermark", feat_pro_4: "AI captions and hashtags", feat_pro_5: "Content scheduler", feat_pro_6: "100 portfolio items",
            feat_biz_1: "Everything in Pro", feat_biz_2: "Custom portfolio domain", feat_biz_3: "View analytics", feat_biz_4: "Multi-account (up to 5 masters)", feat_biz_5: "Priority processing", feat_biz_6: "Unlimited portfolio"
        },
        ru: {
            plan_free: "Free", plan_pro: "Pro", plan_business: "Business",
            period_forever: "навсегда", period_month: "/мес",
            desc_free: "Для начала", desc_pro: "Для активных мастеров", desc_business: "Для студий и сетей",
            feat_free_1: "3 фото в месяц", feat_free_2: "Базовое портфолио (12 фото)", feat_free_3: "Водяной знак LashMe", feat_free_4: "Showcase режим",
            feat_pro_1: "Безлимит фото", feat_pro_2: "Все шаблоны обработки", feat_pro_3: "Свой брендинг / водяной знак", feat_pro_4: "AI-подписи и хештеги", feat_pro_5: "Планировщик контента", feat_pro_6: "100 позиций в портфолио",
            feat_biz_1: "Всё из Pro", feat_biz_2: "Кастомный домен портфолио", feat_biz_3: "Аналитика просмотров", feat_biz_4: "Мульти-аккаунт (до 5 мастеров)", feat_biz_5: "Приоритетная обработка", feat_biz_6: "Безлимитное портфолио"
        }
    }
};

for (const [lang, fp] of Object.entries(dicts)) {
    const data = JSON.parse(fs.readFileSync(fp, 'utf-8'));

    if (!data.header) data.header = {};
    Object.assign(data.header, updates.header[lang as keyof typeof updates.header]);

    if (!data.upload) data.upload = {};
    Object.assign(data.upload, updates.upload[lang as keyof typeof updates.upload]);

    if (!data.branding) data.branding = {};
    Object.assign(data.branding, updates.branding[lang as keyof typeof updates.branding]);

    if (!data.pricing) data.pricing = {};
    Object.assign(data.pricing, updates.pricing[lang as keyof typeof updates.pricing]);

    fs.writeFileSync(fp, JSON.stringify(data, null, 4));
}

console.log('Translations successfully appended to all dicts');
