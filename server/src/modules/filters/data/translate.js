import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:/Users/User/Desktop/GITHUB/lashme/server/src/modules/filters/data/prompts.json', 'utf-8'));

const names_map = {
    "Bold Red Lip": { "ka": "მკვეთრი წითელი ტუჩსაცხი", "ru": "Яркие красные губы" },
    "Clean Girl": { "ka": "Clean Girl", "ru": "Clean Girl" },
    "Coquette": { "ka": "Coquette", "ru": "Coquette" },
    "Douyin": { "ka": "Douyin", "ru": "Douyin" },
    "Glitter": { "ka": "გლიტერი", "ru": "Глиттер" },
    "Golden Hour Glow": { "ka": "ოქროს საათის ნათება", "ru": "Сияние золотого часа" },
    "Old Money": { "ka": "Old Money", "ru": "Old Money" },
    "Rose Petal": { "ka": "ვარდის ფურცელი", "ru": "Лепесток розы" },
    "Sun": { "ka": "მზე", "ru": "Солнце" },
    "Freckles + Colored Gloves": { "ka": "ჭორფლები + ფერადი ხელთათმანები", "ru": "Веснушки + Цветные перчатки" },
    "Hair Bows + Wavy Hair": { "ka": "თმის ბაფთები + ტალღოვანი თმა", "ru": "Банты для волос + Волнистые волосы" },
    "Clean Girl — Editorial Beauty": { "ka": "Clean Girl — სარედაქციო სილამაზე", "ru": "Clean Girl — Журнальная красота" },
    "Valentine’s Day — Red Lips & Heart Accessories": { "ka": "ვალენტინობა — წითელი ტუჩები და გულის აქსესუარები", "ru": "День Святого Валентина — Красные губы и аксессуары-сердечки" },
    "Hearts on Face": { "ka": "გულები სახეზე", "ru": "Сердечки на лице" },
    "Honey Dripping on Face": { "ka": "თაფლი სახეზე", "ru": "Мед на лице" },
    "Capsule in Mouth with Custom Text": { "ka": "კაფსულა პირში შენი ტექსტით", "ru": "Капсула во рту со своим текстом" },
    "Editorial Studio Portrait — Colored Background": { "ka": "სარედაქციო სტუდიური პორტრეტი — ფერადი ფონი", "ru": "Студийный журнальный портрет — Цветной фон" },
    "Decorative Material on Face": { "ka": "დეკორატიული მასალა სახეზე", "ru": "Декоративный материал на лице" },
    "Lazy Retouch — Skin Only": { "ka": "მსუბუქი რეტუში — მხოლოდ კანი", "ru": "Легкая ретушь — Только кожа" },
    "Freckles + Pearls Under Eyes": { "ka": "ჭორფლები + მარგალიტები თვალის ქვეშ", "ru": "Веснушки + Жемчуг под глазами" },
    "Satin Bows on Background": { "ka": "ატლასის ბაფთები ფონზე", "ru": "Атласные банты на фоне" },
    "After Shower — Spa Look": { "ka": "შხაპის შემდეგ — სპა ლუქი", "ru": "После душа — Спа-образ" },
    "Large Flower Held Near Face": { "ka": "დიდი ყვავილი სახესთან", "ru": "Большой цветок у лица" },
    "Dandelion in Mouth": { "ka": "ბაბუაწვერა პირში", "ru": "Одуванчик во рту" },
    "Hydrogel Patch with Text Under Eyes": { "ka": "ჰიდროგელის პაჩი ტექსტით თვალის ქვეშ", "ru": "Гидрогелевые патчи с текстом под глазами" },
    "Butterflies + Gloves + Bandeau Top": { "ka": "პეპლები + ხელთათმანები + ტოპი", "ru": "Бабочки + Перчатки + Топ бандо" },
    "Flowers Intertwined in Hair — Organic": { "ka": "ყვავილები თმაში — ორგანული", "ru": "Цветы, вплетенные в волосы — Органика" },
    "Daisies Scattered on Face": { "ka": "გვირილები სახეზე", "ru": "Ромашки на лице" },
    "Metallic Drips on Face": { "ka": "მეტალის წვეთები სახეზე", "ru": "Металлические капли на лице" },
    "White Roses on Background": { "ka": "თეთრი ვარდები ფონზე", "ru": "Белые розы на фоне" },
    "Product on Textured Surface": { "ka": "პროდუქტი ტექსტურირებულ ზედაპირზე", "ru": "Косметика на текстурной поверхности" },
    "Curly Hair + Black Top": { "ka": "ხვეული თმა + შავი ტოპი", "ru": "Кудрявые волосы + Черный топ" },
    "Ice Cream Cone Near Lips": { "ka": "ნაყინი ტუჩებთან", "ru": "Мороженое у губ" },
    "Black Velvet Ribbons in Hair + Neck Bow": { "ka": "შავი ხავერდის ლენტები თმაში + ბაფთა ყელზე", "ru": "Черные бархатные ленты в волосах + Бант на шее" },
    "White Satin Bow Under Eyes": { "ka": "თეთრი ატლასის ბაფთა თვალის ქვეშ", "ru": "Белый атласный бант под глазами" },
    "Black Lace on Face + Eye Catchlight": { "ka": "შავი მაქმანი სახეზე + ნათება თვალებში", "ru": "Черное кружево на лице + Блик в глазах" },
    "Rhinestones + Fur Sweater": { "ka": "თვლები + ბეწვის სვიტერი", "ru": "Стразы + Меховой свитер" },
    "Lemon Held to Lips with Dripping Juice": { "ka": "ლიმონი ტუჩებთან წვეთებით", "ru": "Лимон у губ с каплей сока" },
    "Gold Earrings Hanging from Fingers": { "ka": "ოქროს საყურეები თითებზე", "ru": "Золотые серьги свисают с пальцев" },
    "Raspberry Bows + Velvet Hearts in Hands": { "ka": "ჟოლოსფერი ბაფთები + ხავერდის გულები ხელში", "ru": "Малиновые банты + Бархатные сердечки в руках" },
    "Black Rhinestones + Bandeau Top on Decollete": { "ka": "შავი თვლები დეკოლტეზე + ტოპი", "ru": "Черные стразы на декольте + Топ бандо" },
    "Wavy Hair + Ribbon + Hair/Face Decor": { "ka": "ტალღოვანი თმა + ლენტი + დეკორი თმასა და სახეზე", "ru": "Волнистые волосы + Лента + Декор на волосах и лице" },
    "Gift Boxes on Background": { "ka": "სასაჩუქრე ყუთები ფონზე", "ru": "Подарочные коробки на фоне" },
    "Basic Skin Retouch + Background Change": { "ka": "კანის ბაზური რეტუში + ფონის შეცვლა", "ru": "Базовая ретушь кожи + Замена фона" },
    "Macro Eyelash Photography": { "ka": "წამწამების მაკრო ფოტოგრაფია", "ru": "Макро съемка ресниц" },
    "Professional Editorial Skin Retouch — Full Lock": { "ka": "პროფესიონალური ჟურნალის რეტუში — სრული დაცვა", "ru": "Журнальная ретушь — Полное сохранение черт" },
    "Runway Blink Animation — Vertical Video": { "ka": "თვალის დახამხამების ანიმაცია — ვერტიკალური ვიდეო", "ru": "Анимация моргания — Вертикальное видео" },
    "Textured Glowing Skin — Editorial Macro": { "ka": "მბზინავი ტექსტურირებული კანი — მაკრო რეტუში", "ru": "Текстурная сияющая кожа — Макро ретушь" },
    "Plush/Furry Product Transformation": { "ka": "პროდუქტის ბეწვად ტრანსფორმაცია", "ru": "Плюшевая/Меховая косметика" },
    "Dried Flower Branches in Foreground": { "ka": "გამხმარი ყვავილის ტოტები წინა პლანზე", "ru": "Ветки сухоцветов на переднем плане" },
    "Wet Skin Effect — Editorial": { "ka": "სველი კანის ეფექტი — ჟურნალის სტილი", "ru": "Эффект влажной кожи — Журнальный стиль" },
    "Cosmetic Glitter on Skin": { "ka": "კოსმეტიკური გლიტერი კანზე", "ru": "Косметический глиттер на коже" },
    "Eye Through Torn Paper — Macro": { "ka": "თვალი დახეულ ქაღალდში — მაკრო", "ru": "Глаз сквозь порванную бумагу — Макро" },
    "Lips Through Torn Paper": { "ka": "ტუჩები დახეულ ქაღალდში", "ru": "Губы сквозь порванную бумагу" },
    "Lash Artist Macro — Shimmer Around Eye": { "ka": "წამწამების მაკრო — შიმერი თვალის გარშემო", "ru": "Макро для лешмейкеров — Шиммер вокруг глаза" },
    "Manicure Retouch + Background + Accessory": { "ka": "მანიკურის რეტუში + ფონი + აქსესუარი", "ru": "Ретушь маникюра + Фон + Аксессуар" },
    "Cat Cheek-to-Cheek Portrait": { "ka": "პორტრეტი კატასთან ერთად", "ru": "Портрет с котом щека к щеке" },
    "Cat + Person Blink Animation": { "ka": "ანიმაცია: კატის და ადამიანის თვალის დახამხამება", "ru": "Анимация моргания: Кот + Человек" },
    "Vacuum-Sealed Product": { "ka": "ვაკუუმში შეფუთული პროდუქტი", "ru": "Косметика в вакуумной упаковке" },
    "Product with Ribbon Wrap": { "ka": "პროდუქტი ლენტით", "ru": "Косметика обернутая лентой" },
    "Product on Location/Surface — Minimalist": { "ka": "პროდუქტი ზედაპირზე — მინიმალისტური", "ru": "Косметика на поверхности — Минимализм" },
    "Product in Food/Confections — Luxury Ad": { "ka": "პროდუქტი დესერტში — ლუქს რეკლამა", "ru": "Косметика в еде/сладостях — Люкс реклама" },
    "Cosmetologist Retouch — Lips Protected": { "ka": "კოსმეტოლოგის რეტუში — ტუჩები დაცულია", "ru": "Ретушь для косметолога — Губы защищены" },
    "Commercial Skin Retouch — Full Feature Lock": { "ka": "კომერციული რეტუში — სრული დაცვა", "ru": "Коммерческая ретушь — Полное сохранение черт" },
    "Sugar Crystals on Lips": { "ka": "შაქრის კრისტალები ტუჩებზე", "ru": "Кристаллы сахара на губах" },
    "Clothing Replacement": { "ka": "ტანსაცმლის შეცვლა", "ru": "Замена одежды" },
    "White Fur Coat Background for Nails": { "ka": "თეთრი ბეწვის ფონი მანიკურისთვის", "ru": "Фон белой шубы для ногтей" },
    "Background + Outfit + Neck Accessory": { "ka": "ფონი + სამოსი + ყელის აქსესუარი", "ru": "Фон + Одежда + Аксессуар на шею" },
    "Neon Accent Background — Studio Portrait": { "ka": "ნეონის აქცენტიანი ფონი — სტუდიური პორტრეტი", "ru": "Фон с неоновым акцентом — Студийный портрет" },
    "Angel Wings Behind Model": { "ka": "ანგელოზის ფრთები მოდელის უკან", "ru": "Крылья ангела за спиной" },
    "Makeup Artist Retouch — Face & Makeup Protected": { "ka": "ვიზაჟისტის რეტუში — მაკიაჟი დაცულია", "ru": "Ретушь визажиста — Лицо и макияж защищены" },
    "PMU Master Retouch — Brow Focus": { "ka": "პერმანენტის რეტუში — აქცენტი წარბებზე", "ru": "Ретушь мастера перманента — Акцент на брови" },
    "Smartphone Camera Collage — Gloved Hand": { "ka": "კოლაჟი: სმარტფონი ხელთათმანიან ხელში", "ru": "Коллаж смартфона камеры — Рука в перчатке" },
    "3D Text Lettering — Material Variants": { "ka": "3D ტექსტი — სხვადასხვა მასალა", "ru": "3D текст — Разные материалы" },
    "3D Text on Background Behind Model": { "ka": "3D ტექსტი მოდელის უკან ფონზე", "ru": "3D текст на фоне позади модели" },
    "Valentine’s Day — Red Ribbons as Hearts Under Eyes": { "ka": "ვალენტინობა — წითელი ლენტის გულები თვალის ქვეშ", "ru": "День Святого Валентина — Сердечки из лент под глазами" },
    "Background Replacement + Cosmetic Extras for Lip Artists": { "ka": "ფონის შეცვლა ტუჩის ოსტატებისთვის + დეტალები", "ru": "Замена фона и доп. ретушь для мастеров губ" },
    "Rose Petals / Foam on Fingers — Nail Protected": { "ka": "ვარდის ფურცლები / ქაფი თითებზე — მანიკური დაცულია", "ru": "Лепестки роз / Пена на пальцах — Ногти защищены" },
    "Pedicure Retouch + Background + Decor": { "ka": "პედიკურის რეტუში + ფონი + დეკორი", "ru": "Ретушь педикюра + Фон + Декор" },
    "Hair Stylist Retouch — Hair Protected": { "ka": "სტილისტის რეტუში — თმა დაცულია", "ru": "Ретушь стилиста — Волосы защищены" },
    "Lip Rhinestone Decor — Lips Protected": { "ka": "ტუჩის დეკორი თვლებით — ტუჩები დაცულია", "ru": "Декор губ стразами — Губы защищены" },
    "Lash Master — Editorial Skin Retouch (Full)": { "ka": "წამწამების ოსტატი — ჟურნალის რეტუში (სრული)", "ru": "Лешмейкер — Журнальная ретушь кожи" },
    "Black Background + Highlights + Red Gloves + Hair Wave": { "ka": "შავი ფონი + ნათებები + წითელი ხელთათმანები", "ru": "Черный фон + Блики + Красные перчатки + Укладка" },
    "Pearl Accessories — Layered Necklace": { "ka": "მარგალიტის აქსესუარები — მრავალშრიანი ყელსაბამი", "ru": "Жемчужные аксессуары — Многослойное ожерелье" }
};

const desc_map = {
    "Classic, confident, timeless, Modern Old Hollywood": { "ka": "კლასიკური, თავდაჯერებული, დროგაუსაძლისი, თანამედროვე ძველი ჰოლივუდი", "ru": "Классический, уверенный, вне времени, Современный Старый Голливуд" },
    "Dewy, minimal, effortless, skin-from-within": { "ka": "მბზინავი, მინიმალისტური, ბუნებრივი, შიგნიდან მანათობელი კანი", "ru": "Сияющий, минималистичный, естественный, свечение изнутри" },
    "Dainty, balletcore, pink, delicately feminine": { "ka": "ნაზი, ბალეტკორი, ვარდისფერი, დელიკატურად ქალური", "ru": "Нежный, балеткор, розовый, женственный" },
    "Youthful, bitten peach, K-beauty, glass skin": { "ka": "ახალგაზრდული, ატმისფერი, K-beauty, მინის კანი", "ru": "Молодежный, персиковый, K-beauty, стеклянная кожа" },
    "Editorial, luxurious, stage-ready glam": { "ka": "სარედაქციო, მდიდრული, სასცენო გლამური", "ru": "Журнальный, роскошный, сценический гламур" },
    "Sun-drenched, warm bronze, luminous golden radiance": { "ka": "მზით სავსე, თბილი ბრინჯაო, მანათობელი ოქროსფერი ნათება", "ru": "Залитый солнцем, теплая бронза, золотистое сияние" },
    "Muted, refined, quietly expensive, effortless": { "ka": "მკრთალი, დახვეწილი, ჩუმად მდიდრული, ბუნებრივი", "ru": "Приглушенный, утонченный, тихая роскошь, естественность" },
    "Romantic, garden-soft, pink-flushed, dewy": { "ka": "რომანტიული, ბაღისებრ ნაზი, ვარდისფერი ფერმკრთალი, მბზინავი", "ru": "Романтичный, нежный, с розовым румянцем, сияющий" },
    "Coral-flushed, sun-kissed, real sunburn warmth": { "ka": "მარჯნისფერი, მზისგან ნაკოცნი, ნამდვილი ნამზეურის სითბო", "ru": "Коралловый румянец, поцелуй солнца, тепло настоящего загара" },
    "FACE DECOR": { "ka": "სახის დეკორი", "ru": "Декор на лице" },
    "ACCESSORIES & CLOTHING": { "ka": "აქსესუარები და ტანსაცმელი", "ru": "Аксессуары и одежда" },
    "STUDIO PORTRAIT": { "ka": "სტუდიური პორტრეტი", "ru": "Студийный портрет" },
    "SEASONAL/THEMED": { "ka": "სეზონური/თემატური", "ru": "Сезонное/Тематическое" },
    "FOOD & FRUITS": { "ka": "საკვები და ხილი", "ru": "Еда и фрукты" },
    "SKIN RETOUCH": { "ka": "კანის რეტუში", "ru": "Ретушь кожи" },
    "FLOWERS & BOTANICALS": { "ka": "ყვავილები და ბოტანიკა", "ru": "Цветы и ботаника" },
    "BROWS / PMU": { "ka": "წარბები / პერმანენტი", "ru": "Брови / Перманент" },
    "BACKGROUND REPLACEMENT": { "ka": "ფონის შეცვლა", "ru": "Замена фона" },
    "BACKGROUND + RETOUCH": { "ka": "ფონი + რეტუში", "ru": "Фон + Ретушь" },
    "BACKGROUND + CLOTHING": { "ka": "ფონი + სამოსი", "ru": "Фон + Одежда" },
    "PRODUCT PHOTOGRAPHY": { "ka": "პროდუქტის ფოტოგრაფია", "ru": "Предметная съемка" },
    "HAIRSTYLE": { "ka": "ვარცხნილობა", "ru": "Прическа" },
    "LIPS": { "ka": "ტუჩები", "ru": "Губы" },
    "MACRO / LASHES": { "ka": "მაკრო / წამწამები", "ru": "Макро / Ресницы" },
    "NAILS": { "ka": "ფრჩხილები", "ru": "Ногти" },
    "GENERATION / COLLAGE": { "ka": "გენერაცია / კოლაჟი", "ru": "Генерация / Коллаж" },
    "COSMETOLOGY": { "ka": "კოსმეტოლოგია", "ru": "Косметология" },
    "MAKEUP ARTISTS": { "ka": "ვიზაჟისტები", "ru": "Визажисты" },
    "HAND DECOR": { "ka": "ხელის დეკორი", "ru": "Декор для рук" },
    "HAIR": { "ka": "თმა", "ru": "Волосы" },
    "ANIMATION": { "ka": "ანიმაცია", "ru": "Анимация" }
};

let translatedCount = 0;

data.filters.forEach(item => {
    const name_eng = item.name_ka;
    if (names_map[name_eng]) {
        item.name_ka = names_map[name_eng].ka;
        item.name_ru = names_map[name_eng].ru;
        translatedCount++;
    }

    const desc_eng = item.description_ka;
    if (desc_map[desc_eng]) {
        item.description_ka = desc_map[desc_eng].ka;
        item.description_ru = desc_map[desc_eng].ru;
    }
});

fs.writeFileSync('C:/Users/User/Desktop/GITHUB/lashme/server/src/modules/filters/data/prompts.json', JSON.stringify(data, null, 2), 'utf-8');
console.log(`Translation processed! Translated ${translatedCount} filters.`);
