import * as fs from 'fs';
import * as path from 'path';

const kaDictPath = path.join(process.cwd(), 'src', 'i18n', 'dictionaries', 'ka.json');
const ruDictPath = path.join(process.cwd(), 'src', 'i18n', 'dictionaries', 'ru.json');
const enDictPath = path.join(process.cwd(), 'src', 'i18n', 'dictionaries', 'en.json');

const kaData = JSON.parse(fs.readFileSync(kaDictPath, 'utf-8'));
const ruData = JSON.parse(fs.readFileSync(ruDictPath, 'utf-8'));
const enData = JSON.parse(fs.readFileSync(enDictPath, 'utf-8'));

if (!kaData.system) kaData.system = {};
if (!ruData.system) ruData.system = {};
if (!enData.system) enData.system = {};

// Hardcoded Russian strings and their translations
const dictionary = {
    "sys_hp374w": { ru: "Тарифы — LashMe", en: "Pricing — LashMe", ka: "ტარიფები — LashMe" },
    "sys_oc43ru": { ru: "Выберите тариф для AI-ретуши фото beauty-мастера", en: "Choose a plan for AI retouching", ka: "აირჩიეთ ტარიფი AI რეტუშისთვის" },
    "sys_4a6zcn": { ru: "Вход — LashMe", en: "Login — LashMe", ka: "შესვლა — LashMe" },
    "sys_o53sey": { ru: "Регистрация — LashMe", en: "Register — LashMe", ka: "რეგისტრაცია — LashMe" },
    "sys_lbrevv": { ru: "Только JPEG, PNG или WebP", en: "Only JPEG, PNG or WebP", ka: "მხოლოდ JPEG, PNG ან WebP" },
    "sys_49fni8": { ru: "Файл слишком большой. Макс 10 МБ", en: "File is too large. Max 10 MB", ka: "ფაილი ძალიან დიდია. მაქს. 10 MB" },
    "sys_zi7fa5": { ru: "Заявка отправлена!", en: "Request sent!", ka: "მოთხოვნა გაგზავნილია!" },
    "sys_bea8v4": { ru: "Статус обновлён", en: "Status updated", ka: "სტატუსი განახლებულია" },
    "sys_nir1j0": { ru: "Мария К.", en: "Maria K.", ka: "მარიამ კ." },
    "sys_6q2f7f": { ru: "Классика 2D", en: "Classic 2D", ka: "კლასიკა 2D" },
    "sys_we1pbx": { ru: "Хочу лисий эффект", en: "I want fox effect", ka: "მინდა მელიის ეფექტი" },
    "sys_tqq8j9": { ru: "Елена Т.", en: "Elena T.", ka: "ელენე ტ." },
    "sys_of3uqg": { ru: "Объёмное 3D", en: "Volume 3D", ka: "მოცულობითი 3D" },
    "sys_74zpig": { ru: "Новая", en: "New", ka: "ახალი" },
    "sys_1f8t80": { ru: "Подтверждена", en: "Confirmed", ka: "დადასტურებული" },
    "sys_knicji": { ru: "Отменена", en: "Cancelled", ka: "გაუქმებული" },
    "sys_ns0wwy": { ru: "Брендинг сохранён", en: "Branding saved", ka: "ბრენდინგი შენახულია" },
    "sys_q2ext5": { ru: "Брендинг удалён", en: "Branding removed", ka: "ბრენდინგი წაშლილია" },
    "sys_2nhhz5": { ru: "Подписи сгенерированы", en: "Captions generated", ka: "წარწერები გენერირებულია" },
    "sys_ier8eh": { ru: "#наращиваниересниц...", en: "#lashextensions...", ka: "#წამწამებისდაგრძელება..." },
    "sys_luwlg8": { ru: "#наращиваниересниц 2D...", en: "#lashextensions 2D...", ka: "#წამწამებისდაგრძელება 2D..." },
    "sys_a97wd1": { ru: "#ресницы...", en: "#lashes...", ka: "#წამწამები..." },
    "sys_2px1vo": { ru: "Продающий", en: "Selling", ka: "გაყიდვითი" },
    "sys_1cosfm": { ru: "С призывом к действию", en: "With Call to Action", ka: "მოწოდებითქმედებისკენ" },
    "sys_9klrsj": { ru: "Информативный", en: "Informative", ka: "ინფორმაციული" },
    "sys_klh0t1": { ru: "Описание процедуры", en: "Procedure description", ka: "პროცედურის აღწერა" },
    "sys_5wh2s2": { ru: "Лёгкий и дружелюбный", en: "Light and friendly", ka: "მსუბუქი და მეგობრული" },
    "sys_kif3ln": { ru: "Русский", en: "Russian", ka: "რუსული" },
    "sys_xy9c2g": { ru: "Мы заметили, что вы используете русский. Перевести сайт?", en: "Translate site?", ka: "ვთარგმნოთ საიტი?" },
    "sys_aabixu": { ru: "Да, перевести", en: "Yes, translate", ka: "დიახ, თარგმნე" },
    "sys_u3ujkt": { ru: "Закрыть", en: "Close", ka: "დახურვა" },
    "sys_74gceg": { ru: "Ресницы — до и после AI-ретуши", en: "Lashes — Before & After AI", ka: "წამწამები — AI რეტუშამდე და შემდეგ" },
    "sys_sn17xf": { ru: "Макияж — до и после AI-ретуши", en: "Makeup — Before & After AI", ka: "მაკიაჟი — AI რეტუშამდე და შემდეგ" },
    "sys_oxymms": { ru: "Брови — до и после AI-ретуши", en: "Brows — Before & After AI", ka: "წარბები — AI რეტუშამდე და შემდეგ" },
    "sys_vifwyt": { ru: "Ногти — до и после AI-ретуши", en: "Nails — Before & After AI", ka: "ფრჩხილები — AI რეტუშამდე და შემდეგ" },
    "sys_ga2li7": { ru: "Загрузи фото", en: "Upload photo", ka: "ატვირთე ფოტო" },
    "sys_m7x59z": { ru: "Смотри результат", en: "See result", ka: "ნახე შედეგი" },
    "sys_2lexch": { ru: "Что дальше?", en: "What's next?", ka: "რა იქნება შემდეგ?" },
    "sys_ykzsc6": { ru: "Работа добавлена в портфолио", en: "Work added to portfolio", ka: "ნამუშევარი დამატებულია პორტფოლიოში" },
    "sys_n9htfx": { ru: "Работа удалена", en: "Work removed", ka: "ნამუშევარი წაშლილია" },
    "sys_vy9px7": { ru: "Объёмное наращивание", en: "Volume extensions", ka: "მოცულობითი დაგრძელება" },
    "sys_ojosp0": { ru: "Профессиональное наращивание...", en: "Professional extensions...", ka: "პროფესიონალური დაგრძელება..." },
    "sys_ztyawf": { ru: "Тбилиси", en: "Tbilisi", ka: "თბილისი" },
    "sys_ab9vx7": { ru: "Мега-объём 5D", en: "Mega volume 5D", ka: "მეგა-მოცულობა 5D" },
    "sys_72pxmw": { ru: "Снятие + наращивание", en: "Removal + Extension", ka: "მოხსნა + დაგრძელება" },
    "sys_pvn3rc": { ru: "Профиль сохранён", en: "Profile saved", ka: "პროფილი შენახულია" },
    "sys_mmxyux": { ru: "Батуми", en: "Batumi", ka: "ბათუმი" },
    "sys_wpm6qq": { ru: "Кутаиси", en: "Kutaisi", ka: "ქუთაისი" },
    "sys_nimqj6": { ru: "Рустави", en: "Rustavi", ka: "რუსთავი" },
    "sys_cdwzfd": { ru: "Москва", en: "Moscow", ka: "მოსკოვი" },
    "sys_o39fd7": { ru: "Санкт-Петербург", en: "St. Petersburg", ka: "სანქტ-პეტერბურგი" },
    "sys_4kiz9b": { ru: "Киев", en: "Kyiv", ka: "კიევი" },
    "sys_kn35eu": { ru: "Минск", en: "Minsk", ka: "მინსკი" },
    "sys_mesjqx": { ru: "Ресницы", en: "Lashes", ka: "წამწამები" },
    "sys_mr3nfs": { ru: "Ногти", en: "Nails", ka: "ფრჩხილები" },
    "sys_2fxpdj": { ru: "Брови", en: "Brows", ka: "წარბები" },
    "sys_n9zycc": { ru: "Макияж", en: "Makeup", ka: "მაკიაჟი" },
    "sys_fhc890": { ru: "Волосы", en: "Hair", ka: "თმა" },
    "sys_xkk87u": { ru: "Уход за кожей", en: "Skincare", ka: "კანის მოვლა" },
    "sys_74j6sw": { ru: "Ретушь завершена!", en: "Retouch complete!", ka: "რეტუში დასრულებულია!" },
    "sys_hmwggu": { ru: "Клей", en: "Glue", ka: "წებო" },
    "sys_1dr2kt": { ru: "Покраснение", en: "Redness", ka: "სიწითლე" },
    "sys_dr9ajs": { ru: "Неровность", en: "Unevenness", ka: "უსწორმასწორობა" },
    "sys_wjrsq3": { ru: "Дефект", en: "Blemish", ka: "დეფექტი" },
    "sys_hgur0c": { ru: "Другое", en: "Other", ka: "სხვა" },
    "sys_x1nv1w": { ru: "Пост запланирован", en: "Post scheduled", ka: "პოსტი დაგეგმილია" },
    "sys_qbp0ia": { ru: "Пост отменён", en: "Post cancelled", ka: "პოსტი გაუქმებულია" },
    "sys_pqwxoe": { ru: "Классическое наращивание 2D...", en: "Classic 2D extension...", ka: "კლასიკური 2D დაგრძელება..." },
    "sys_xla17p": { ru: "#наращиваниересниц...", en: "#lashextensions...", ka: "#წამწამებისდაგრძელება..." },
    "sys_72zs0k": { ru: "Мега-объём для смелых! 5D...", en: "Mega volume! 5D...", ka: "მეგა-მოცულობა თამამებისთვის! 5D..." },
    "sys_irn5od": { ru: "#мегаобъём #ресницы5d...", en: "#megavolume #lashes5d...", ka: "#მეგამოცულობა #წამწამები5d..." },
    "sys_dq9q98": { ru: "До и после — магия...", en: "Before and after magic...", ka: "დაგრძელების მაგია რეტუშამდე..." },
    "sys_f3uthc": { ru: "#доипосле...", en: "#beforeandafter...", ka: "#მანამდეშემდეგ..." },
    "sys_kz89gr": { ru: "Запланировано", en: "Scheduled", ka: "დაგეგმილია" },
    "sys_cndlki": { ru: "Напоминание отправлено", en: "Reminder sent", ka: "შეხსენება გაგზავნილია" },
    "sys_hrlov4": { ru: "Опубликовано", en: "Posted", ka: "გამოქვეყნებულია" },
    "sys_4a27fv": { ru: "Отменено", en: "Cancelled", ka: "გაუქმებულია" },
    "sys_r2f9gv": { ru: "Спасибо за отзыв!", en: "Thanks for reviewing!", ka: "მადლობა შეფასებისთვის!" },
    "sys_54thy9": { ru: "Stories готовы!", en: "Stories ready!", ka: "Stories მზადაა!" },
    "sys_mwtoxa": { ru: "Запись открыта ✨", en: "Booking open ✨", ka: "ჩაწერა ღიაა ✨" },
    "sys_2jxk3g": { ru: "🔥 Новая работа!", en: "🔥 New work!", ka: "🔥 ახალი ნამუშევარი!" },
    "sys_l2o7eg": { ru: "Минимализм", en: "Minimalism", ka: "მინიმალიზმი" },
    "sys_jc1ffk": { ru: "Чистый фон, фокус на фото", en: "Clean background", ka: "სუფთა ფონი" },
    "sys_ejfr7x": { ru: "Градиент", en: "Gradient", ka: "გრადიენტი" },
    "sys_k20b20": { ru: "Цветной градиент + текст", en: "Gradient + text", ka: "ფერადი გრადიენტი + ტექსტი" },
    "sys_6ypxgc": { ru: "Акцент", en: "Accent", ka: "აქცენტი" },
    "sys_lmx4ll": { ru: "Стикеры и надписи", en: "Stickers and labels", ka: "სტიკერები და წარწერები" },
    "sys_n17nai": { ru: "Шаблон применён", en: "Template applied", ka: "შაბლონი გამოყენებულია" },
    "sys_mawgyb": { ru: "Премиальный набор для лэшмейкеров...", en: "Premium lashmaker set...", ka: "პრემიუმ ნაკრები ლეშმეიკერებისთვის..." },
    "sys_71d5yp": { ru: "Мягкие, естественные тона...", en: "Soft, natural tones...", ka: "რბილი, ბუნებრივი ტონები..." },
    "sys_5n0r9j": { ru: "Яркие неоновые акценты...", en: "Bright neon accents...", ka: "ნათელი ნეონის აქცენტები..." },
    "sys_q3ag45": { ru: "Нежные розовые оттенки...", en: "Delicate pink shades...", ka: "ნაზი ვარდისფერი ელფერები..." },
    "sys_msveqd": { ru: "Карусель", en: "Carousel", ka: "კარუსელი" },
    "sys_n5opkl": { ru: "Хайлайты", en: "Highlights", ka: "ჰაილაითები" },
    "sys_bvmxr5": { ru: "Бесплатно", en: "Free", ka: "უფასო" },
    "sys_hvs3qt": { ru: "Нежная обработка с мягким...", en: "Soft processing with blur...", ka: "ნაზი დამუშავება რბილი ფონით..." },
    "sys_p7j631": { ru: "Чистая, клиничная эстетика...", en: "Clean, clinical aesthetic...", ka: "სუფთა, კლინიკური ესთეტიკა..." },
    "sys_o0mkqa": { ru: "Тёплый золотистый свет...", en: "Warm golden light...", ka: "თბილი ოქროსფერი შუქი..." },
    "sys_e16dxe": { ru: "Глубокие тени, контрастные...", en: "Deep shadows, contrasting...", ka: "ღრმა ჩრდილები, კონტრასტული..." },
    "sys_4u50q8": { ru: "Пастельные тона с лёгким...", en: "Pastel tones with light tint...", ka: "პასტელური ტონები მსუბუქი ელფერით..." },
    "sys_p6wrug": { ru: "Имитация плёночной фотографии...", en: "Film photography imitation...", ka: "ფირის ფოტოგრაფიის იმიტაცია..." },
    "sys_buh6jq": { ru: "1 кредит", en: "1 credit", ka: "1 კრედიტი" },
    "sys_i5tezd": { ru: "Брендинг", en: "Branding", ka: "ბრენდინგი" },
    "sys_yq7dhk": { ru: "Реферальная программа — LashMe", en: "Referral Program — LashMe", ka: "რეფერალური პროგრამა — LashMe" }
};

for (const [key, trans] of Object.entries(dictionary)) {
    kaData.system[key] = trans.ka;
    enData.system[key] = trans.en;
    ruData.system[key] = trans.ru;
}

fs.writeFileSync(kaDictPath, JSON.stringify(kaData, null, 4));
fs.writeFileSync(enDictPath, JSON.stringify(enData, null, 4));
fs.writeFileSync(ruDictPath, JSON.stringify(ruData, null, 4));

console.log('Successfully injected 104 keys into system dictionary namespaces');
