import type { Caption, CaptionVariant, CaptionLanguage } from '../types/caption.types';

const delay = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));

const captionStore = new Map<string, { data: Caption[]; createdMs: number }>();
const MAX_STORE_SIZE = 10;
const MAX_AGE_MS = 5 * 60 * 1000;

function evictStale(): void {
    const now = Date.now();
    for (const [key, entry] of captionStore) {
        if (now - entry.createdMs > MAX_AGE_MS || captionStore.size > MAX_STORE_SIZE) {
            captionStore.delete(key);
        }
    }
}

const MOCK_CAPTIONS: Record<CaptionLanguage, Record<CaptionVariant, { text: string; hashtags: string }>> = {
    RU: {
        SELLING: {
            text: `✨ Классическое наращивание 2D
Эффект лисьего взгляда

Идеально подчеркнёт ваш взгляд и добавит выразительности. Носка до 4 недель при правильном уходе.

📍 Запись через Direct
💰 От 80 лари
⏰ Длительность ~2 часа

Свободные окошки на эту неделю — пишите! 💬`,
            hashtags: 'system.sys_ier8eh',
        },
        INFORMATIONAL: {
            text: `Классическое наращивание 2D — что это?

Техника, при которой на каждую натуральную ресничку крепятся 2 искусственные. Результат — естественный, но заметный объём.

🔹 Эффект: лисий взгляд
🔹 Материал: гипоаллергенное волокно
🔹 Толщина: 0.07 мм
🔹 Изгиб: C / D
🔹 Носка: 3–4 недели

Идеально для тех, кто хочет выразительный взгляд без утяжеления.`,
            hashtags: 'system.sys_luwlg8',
        },
        CASUAL: {
            text: `Девочки, ну вот скажите — разве не магия? 🪄

Этот лисий взгляд — моя любовь! Клиентка пришла с запросом «хочу, чтоб вау, но естественно» — ну вот, пожалуйста 😍

Кто следующая? Пишите в Direct, обсудим ваш идеальный вариант 💕`,
            hashtags: 'system.sys_a97wd1',
        },
    },
    EN: {
        SELLING: {
            text: `✨ Classic 2D Lash Extensions
Fox Eye Effect

Perfectly enhances your gaze and adds expressiveness. Lasts up to 4 weeks with proper care.

📍 Book via DM
💰 From 80 GEL
⏰ Duration ~2 hours

Slots available this week — DM me! 💬`,
            hashtags: '#lashextensions #lashartist #lashes #2dlashes #foxeyelashes #beauty #beautymaster #booknow #tbilisilashes',
        },
        INFORMATIONAL: {
            text: `Classic 2D Lash Extensions — what is it?

A technique where 2 synthetic lashes are applied to each natural lash. The result is a natural yet noticeable volume.

🔹 Effect: fox eye
🔹 Material: hypoallergenic fiber
🔹 Thickness: 0.07 mm
🔹 Curl: C / D
🔹 Wear time: 3–4 weeks

Perfect for those who want an expressive look without heaviness.`,
            hashtags: '#lashextensions #2dvolume #classiclashes #lashartist #lashes #beautyeducation #lashcare #beauty',
        },
        CASUAL: {
            text: `Girls, tell me — isn't this pure magic? 🪄

This fox eye look is my absolute favorite! Client came in asking for "wow but natural" — well, here you go 😍

Who's next? DM me and let's find your perfect style 💕`,
            hashtags: '#lashes #lashextensions #lashartist #happyclient #foxeyelashes #beautyispower #beautymaster #tbilisilashes',
        },
    },
    KA: {
        SELLING: {
            text: `✨ კლასიკური 2D წამწამების დაგრძელება
მელიას თვალის ეფექტი

იდეალურად ხაზს უსვამს თქვენს მზერას და ამატებს გამომეტყველებას. ტარება 4 კვირამდე სწორი მოვლით.

📍 ჩაწერა Direct-ში
💰 80 ლარიდან
⏰ ხანგრძლივობა ~2 საათი

ამ კვირის თავისუფალი ადგილები — მომწერეთ! 💬`,
            hashtags: '#წამწამები #წამწამებისდაგრძელება #ბიუთიმასტერი #თბილისი #სილამაზე #2dწამწამები #ჩაწერაონლაინ',
        },
        INFORMATIONAL: {
            text: `კლასიკური 2D წამწამების დაგრძელება — რა არის?

ტექნიკა, რომლის დროსაც ყოველ ბუნებრივ წამწამზე 2 ხელოვნური მაგრდება. შედეგი — ბუნებრივი, მაგრამ შესამჩნევი მოცულობა.

🔹 ეფექტი: მელიას თვალი
🔹 მასალა: ჰიპოალერგიული ბოჭკო
🔹 სისქე: 0.07 მმ
🔹 მოხრა: C / D
🔹 ტარება: 3–4 კვირა

იდეალურია მათთვის, ვისაც სურს გამომეტყველი მზერა დამძიმების გარეშე.`,
            hashtags: '#წამწამები #2dმოცულობა #კლასიკურიდაგრძელება #ბიუთიმასტერი #სილამაზისგანათლება #წამწამებისმოვლა',
        },
        CASUAL: {
            text: `გოგოებო, თქვით — ეს ხომ მაგიაა? 🪄

ეს მელიას მზერა — ჩემი სიყვარულია! კლიენტმა მოვიდა თხოვნით "მინდა ვაუ, მაგრამ ბუნებრივი" — აი, გეთაყვა 😍

ვინ არის შემდეგი? მომწერეთ Direct-ში, განვიხილოთ თქვენი იდეალური ვარიანტი 💕`,
            hashtags: '#წამწამები #ბიუთიმასტერი #კმაყოფილიკლიენტი #მელიასთვალი #სილამაზეძალაა #თბილისისწამწამები',
        },
    },
};

class CaptionService {
    async generateCaptions(jobId: string, languages: CaptionLanguage[] = ['RU']): Promise<Caption[]> {
        await delay(1500);

        const variants: CaptionVariant[] = ['SELLING', 'INFORMATIONAL', 'CASUAL'];
        const captions: Caption[] = [];

        for (const lang of languages) {
            for (const variant of variants) {
                captions.push({
                    id: `cap-${jobId}-${lang}-${variant}-${Date.now()}`,
                    jobId,
                    variant,
                    language: lang,
                    text: MOCK_CAPTIONS[lang][variant].text,
                    hashtags: MOCK_CAPTIONS[lang][variant].hashtags,
                    createdAt: new Date().toISOString(),
                });
            }
        }

        evictStale();
        captionStore.set(jobId, { data: captions, createdMs: Date.now() });
        return captions;
    }

    async getCaptions(jobId: string): Promise<Caption[]> {
        await delay(200);
        return captionStore.get(jobId)?.data ?? [];
    }
}

export const captionService = new CaptionService();
