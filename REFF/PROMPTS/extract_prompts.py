import openpyxl
import json
import re
import sys
from collections import Counter

# ──────────────────────────────────────────────────────────────────────────────
# LOAD DATA
# ──────────────────────────────────────────────────────────────────────────────
wb = openpyxl.load_workbook('C:/Users/User/Desktop/GITHUB/lashme/REFF/PROMPTS/telegram_comments_20260223_0110.xlsx')
ws = wb.active

all_rows = []
for i, row in enumerate(ws.iter_rows(values_only=True)):
    if i == 0:
        continue
    post_id, post_date, post_title, comment_id, comment_date, author, author_id, comment_text = row
    all_rows.append({
        'post_id': post_id,
        'post_date': str(post_date) if post_date else '',
        'post_title': str(post_title) if post_title else '',
        'comment_id': comment_id,
        'comment_date': str(comment_date) if comment_date else '',
        'comment_text': str(comment_text) if comment_text else '',
    })

print(f"Loaded {len(all_rows)} rows", file=sys.stderr)

# ──────────────────────────────────────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────────────────────────────────────

def clean_title(raw):
    t = raw or ''
    t = re.sub(r'\*\*|\*|__', '', t)
    t = re.sub(r'[\U00010000-\U0010ffff]', '', t)
    t = re.sub(r'[\U0001F300-\U0001FAFF\U00002600-\U000027BF\U0000FE00-\U0000FE0F\U0001F900-\U0001F9FF]', '', t)
    t = t.split('\n')[0].split('[')[0]
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def extract_date(date_str):
    m = re.search(r'(\d{4}-\d{2}-\d{2})', date_str)
    return m.group(1) if m else date_str[:10] if len(date_str) >= 10 else ''

def detect_language(text):
    cyrillic = len(re.findall(r'[а-яёА-ЯЁ]', text))
    latin = len(re.findall(r'[a-zA-Z]', text))
    return 'ru' if cyrillic >= latin else 'en'

def has_feature(text_lower, keywords):
    return any(k in text_lower for k in keywords)

# ──────────────────────────────────────────────────────────────────────────────
# NON-PROMPT FILTER
# ──────────────────────────────────────────────────────────────────────────────

NON_PROMPT_START_PHRASES = [
    '[медиа/стикер]',
    'Получается если надо менять',
    'Я не могу зайти в чат gpt',
    'У меня проблема',
    'Моя подписка',
    'Вопрос: купила',
    'Да, тут надо пробовать',
    'У меня такая же проблема',
    'Нужен новый номер',
    'Я не входила через номер',
    'Ой погнала лошадей',
    'почему-то выдает фото?',
    'Лагает(',
    'Куда именно пытаетесь',
    'Такого не встречала',
    'В сам чат',
    'Я все понимаю',
    'Мне чат gpt на этот промт',
    'Пример: ',
    'То есть я беру',
    'Здравствуйте, описывайте',
    'Да, если вы возьмете',
    'Использую для Зубов',
    'Это в среднем',
    'Каждый Промт для ногтей',
    'Решила сделать пробный заход',
    'Хотелось бы больше',
    'Боже, спасибо',
    'Я б прислала',
    'Раньше делала',
    'Мне понравилось',
    'Пока особо',
    'Да, практически',
    'Если вы делаете фото с форматом макро',
    'Это не настоящий человек',
    'Удаляйте и делайте заново',
    'А сейчас вообще вот такое',
    'У меня он также',
    'Подскажите пожалуйста пишу',
    'Присоединяюсь',
    'Огромнейшее',
    'Благодарю',
    'Спасибо вам большое за данный',
    'Спасибо за курс',
    'и я хочу поделиться',
    'Если есть возможность, добавить',
    'Если есть возможность добавить',
    'Добрый день, благодарю',
    'Добрый вечер!',
    'Добрый день!',
    'Добрый день,',
    'Добрый вечер,',
    'Очень нравится',
    'Соглашусь со всеми',
    'Спасибо большое',
    'Просто, скажу спасибо',
    'Справедливости ради',
    '1. При регистрации',
    '2. Если вы не оформили',
    '3. Вы видите такую ситуацию',
    '4. Если у вас происходит',
    'Нет, обновите страницу',
    'Здравствуйте\n1. Причина',
    'Здравствуйте\nЭто лагает',
    'Здравствуйте так и пишите',
    'Здравствуйте, можно и на русском',
    'Здравствуйте, вы должны',
    'Здравствуйте!\nПо вашим',
    'высылаю список готовых фраз',
    'Лёгкая натуральная ретушь',  # tips list, not a prompt itself
    'У меня чат gpt на этот',
    'Ой, поняла(',
    'Это в среднем\nЕсли',
    'Добрый день,по Runway',
    '**1. Выберите фото предмета',  # tutorial
    'Как добавлять надпись на фон:',
    'Добрый день, подскажите',
    'Спасибо за такой шедов',
    'Спасибо большое за такую',
    'Это лагает',
    'Я когда по номеру пытаюсь',
]

NON_PROMPT_POST_TITLE_PHRASES = [
    'ВОПРОСЫ ПО ЧАТУ',
    'КАК ДОБАВИТЬ НАДПИСЬ',
    'ШРИФТОВ В CAP CUT',
    'РЕТУШЬ КОЖИ: убираем',
    'РАЗМЫТЫЙ КОЛЛАЖ',
    'КАК ПОДКЛЮЧИТЬ ПОДПИСКУ',
    'NanoBanana',
    'Дорогие мои, сегодня выложу',
    # Feedback/review posts - ONLY skip if comment is not an actual prompt
]

# Posts that are purely discussion/tutorial - skip ALL comments from them
SKIP_POST_IDS = set()  # We'll fill this based on post titles

# Identify skip-all post IDs
post_titles_map = {}
for row in all_rows:
    pid = row['post_id']
    if pid not in post_titles_map:
        post_titles_map[pid] = row['post_title']

for pid, ptitle in post_titles_map.items():
    for phrase in ['ШРИФТОВ В CAP CUT', 'КАК ПОДКЛЮЧИТЬ ПОДПИСКУ', 'NanoBanana',
                   'РЕТУШЬ КОЖИ: убираем', 'РАЗМЫТЫЙ КОЛЛАЖ',
                   'Дорогие мои, сегодня выложу обработку']:
        if phrase in ptitle:
            SKIP_POST_IDS.add(pid)
            break

PROMPT_START_PATTERNS = [
    r'^1\.\s',
    r'^Edit\s',
    r'^Отредакт',
    r'^Perform\s',
    r'^Create\s',
    r'^Создайте',
    r'^Сделайте',
    r'^Выполните',
    r'^Редактируйте',
    r'^Редактируй',
    r'^Get\s',
    r'^\*\*ПРОМТ',
    r'^Сделайте\s',
    r'^Изображение\s',
    r'^A high-quality',
    r'^high-fashion',
    r'^Editorial',
    r'^[А-ЯЁ][а-яё]+ профессиональную',
]

def looks_like_prompt(text):
    for pat in PROMPT_START_PATTERNS:
        if re.match(pat, text.strip()):
            return True
    return False

def is_non_prompt(row):
    text = row['comment_text'].strip()
    if not text or text == 'None':
        return True
    if len(text) < 100:
        return True
    if row['post_id'] in SKIP_POST_IDS:
        return True
    for phrase in NON_PROMPT_START_PHRASES:
        if text.startswith(phrase):
            if not looks_like_prompt(text):
                return True
    # Post-level checks
    post_title = row['post_title']
    for phrase in ['ВОПРОСЫ ПО ЧАТУ', 'КАК ДОБАВИТЬ НАДПИСЬ', 'КАК ОЖИВИТЬ ФОТО']:
        if phrase in post_title:
            if not looks_like_prompt(text):
                return True
    # "Девочки, под этим постом" feedback post - only actual prompts
    if 'под этим постом' in post_title:
        return not looks_like_prompt(text)
    # "Девушки, напишите в комментариях" - almost all are requests
    if 'напишите в комментариях' in post_title:
        return not looks_like_prompt(text)
    # Structural post: СТРУКТУРА ПРОМТА - keep only if looks like prompt
    if 'СТРУКТУРА ПРОМТА' in post_title and not looks_like_prompt(text):
        return True
    return False

# ──────────────────────────────────────────────────────────────────────────────
# CATEGORIZATION
# ──────────────────────────────────────────────────────────────────────────────

def categorize(row):
    text = row['comment_text']
    tl = text.lower()
    pt = row['post_title'].lower()
    combined = pt + ' ' + tl

    features = []
    target_audience = []

    # SKIN RETOUCH
    if has_feature(tl, ['ретушь кожи', 'skin retouch', 'retouching', 'текстуру кожи',
                         'skin texture', 'blemish', 'кожа должна', 'skin should',
                         'естественная текстура', 'skin should look', 'кожа должна выглядеть',
                         'retouch', 'ретушь', 'дефект кожи', 'skin imperfect']):
        features.append('skin_retouch')

    if has_feature(tl, ['веснушки', 'freckle', 'румянец']):
        features.append('freckles_blush')

    # BACKGROUND - use specific patterns to avoid false positives
    if has_feature(tl, ['замените фон', 'замена фона', 'замените фон на', 'черный фон',
                         'белый фон', 'replace the background', 'replace background',
                         'changing the background', 'change the background', 'фон на черный',
                         'фон на белый', 'черном фоне', 'белом фоне', 'studio background',
                         'студийный фон', 'background.*replace', 'темный фон']):
        features.append('background_change')

    # CLOTHING - specific
    if has_feature(tl, ['замена одежд', 'replace clothing', 'replace.*cloth', 'change.*outfit',
                         'шуба', 'fur coat', 'меховая', 'одежд', 'платье в', 'перчатки',
                         'gloves']):
        features.append('clothing_change')

    # FLOWERS - positive mention of flowers (not just "не касалась бровей" etc)
    flower_kws_ru = ['сухоцвет', 'ветки нежно', 'кустовую ветку', 'ветку из',
                     'ветки из', 'лизиантус', 'пион', 'мак на щек', 'гипсофил',
                     'подсолнух', 'ягоды', 'ягод на', 'желтые цветы', 'желтых цветов',
                     'цветочн', 'цветы на', 'лепестки на', 'розы на']
    flower_kws_en = ['sunflower', 'gypsophila', 'flowers on', 'petals on', 'bouquet',
                     'peony', 'roses on']
    if has_feature(tl, flower_kws_ru + flower_kws_en):
        if has_feature(tl, ['сухоцвет', 'dried flower', 'dry flower']):
            features.append('dried_flowers')
        else:
            features.append('live_flowers')

    # FOIL / POTAL
    if has_feature(tl, ['потал', 'поталь', 'gold leaf', 'gold foil', 'silver foil',
                         'мелкую', 'размер потали', 'поталь должна']):
        if has_feature(tl, ['потал', 'поталь']):
            features.append('foil_potal')

    # GLITTER / RHINESTONES - only when explicitly added as decoration
    if has_feature(tl, ['блестки', 'блёстки', 'блесток', 'мерцание', 'шиммер',
                         'glitter', 'стразы на', 'стразы по', 'мерцающ', 'shimmer',
                         'sparkl', 'мелкое мерцание', 'микро-косметическое мерцание']):
        features.append('glitter_sparkles')
    # Rhinestones specifically on lips
    if has_feature(tl, ['страз', 'rhinestone', 'стразы']):
        features.append('glitter_sparkles')

    # WATER / LIQUID EFFECTS - only when explicitly added
    if has_feature(tl, ['капли воды', 'water drop', 'drop of water', 'drops of water',
                         'конденсат', 'condensation', 'влажн', 'wet skin', 'wet look',
                         'пена на руках', 'foam on', 'капли сливочного масла',
                         'drops of butter', 'butter drops']):
        features.append('water_liquid_effects')

    # SUGAR / FOOD
    if has_feature(tl, ['сахар', 'sugar', 'крупинки сахара', 'поп корн', 'popcorn',
                         'шарики мороженого', 'торт', 'шоколад', 'chocolate', 'круассан',
                         'croissant', 'кокос', 'coconut', 'молоке с нежно', 'хлопьями']):
        features.append('food_elements')

    # SNOW / WINTER
    if has_feature(tl, ['снег', 'snow', 'варежк', 'mittens', 'лёгкий снег', 'легкий снег']):
        features.append('snow_winter')

    # ACCESSORIES (only actually added items)
    if has_feature(tl, ['бандан', 'bandana']):
        features.append('accessories')
    if has_feature(tl, ['кружевную повязку', 'кружевная повязка', 'белую повязку', 'красную повязку',
                         'повязку на голову', 'lace headband', 'head bandage']):
        features.append('accessories')
    if has_feature(tl, ['атласную ленту', 'атласной лент', 'лента на шею', 'satin ribbon', 'ribbon on neck']):
        features.append('accessories')
    if has_feature(tl, ['чокер', 'choker']):
        features.append('accessories')
    if has_feature(tl, ['кольца', 'кольцо', 'ring on finger', 'rings on']):
        features.append('accessories')
    if has_feature(tl, ['очки', 'sunglasses', 'glasses on']):
        features.append('accessories')
    if has_feature(tl, ['белые перья', 'white feathers', 'перья на']):
        features.append('accessories')
    if has_feature(tl, ['белые крылья', 'white wings', 'крылья']):
        features.append('accessories')
    if has_feature(tl, ['меховую шапку', 'меховая шапка', 'варежки', 'fur hat', 'mittens']):
        features.append('accessories')
    if has_feature(tl, ['атласный палантин', 'палантин на голову', 'шарф']):
        features.append('accessories')
    if has_feature(tl, ['листом', 'листа', 'лист на', 'leaf on']):
        # botanical leaf added as decoration
        if has_feature(tl, ['добавь лист', 'добавь на', 'добавьте лист']):
            features.append('accessories')

    # EYE HIGHLIGHT - specific phrase
    if has_feature(tl, ['блик на глазу', 'блик на радужку', 'добавьте блик',
                         'добавь блик', 'eye highlight', 'add highlight.*eye']):
        features.append('eye_highlight')

    # NAIL CARE
    if has_feature(tl, ['маникюр', 'manicure', 'педикюр', 'pedicure']):
        features.append('nail_care')
    # "ногти" is often in "не трогайте ногти" - only flag if it's the subject
    if has_feature(pt, ['маникюра', 'маникюр', 'педикюра', 'педикюр']):
        features.append('nail_care')

    # PRODUCT PHOTOGRAPHY
    if has_feature(tl, ['тюбик', 'мой предмет', 'my product', 'my item', 'мое изделие',
                         'вакуумн', 'vacuum', 'упаковк', 'packaging',
                         'studio photo.*product', 'product photo', 'предмет с фото',
                         'студийную фотографию моего', 'студийную фотографию моего предмета']):
        features.append('product_photography')

    # LIP FOCUS - must be subject of the prompt, not just "не меняйте цвет губ"
    # True lip subject prompts: "крупный план губ", "сахар на губах", "стразы на губе", "перманент губ"
    if has_feature(tl, ['крупный план.*губ', 'губ.*выглядывающего', 'сахар.*губ', 'страз.*губ',
                         'перманент губ', 'lip.*close', 'close.*lip', 'lips.*torn',
                         'губ.*разорванн', 'разорванн.*губ']):
        features.append('lip_focus_primary')
    elif has_feature(pt, ['для губ', 'губ 👄', 'для перманента губ']):
        features.append('lip_focus_primary')

    # EYE / LASH CLOSEUP - as subject
    if has_feature(tl, ['крупный план.*глаз', 'крупный план.*ресниц', 'крупный план.*бров',
                         'выглядывающего через разорванн', 'through.*torn', 'macro.*eye',
                         'макросъемочный снимок', 'область вокруг глаз']):
        features.append('eye_lash_closeup')
    elif has_feature(pt, ['для ресниц', 'для мастеров по ресниц']):
        features.append('eye_lash_closeup')

    # BROW FIXATION (common in most prompts - only flag from post title or explicit)
    if has_feature(pt, ['бровист', 'для бровистов', 'мастеров пм', 'для мастеров пм']):
        features.append('brow_fixation')

    # HAIR
    if has_feature(pt, ['волосам', 'парикмахер']) or has_feature(tl, ['волосы — это полностью защищен',
                                                                         'ни в коем случае не изменяй волосы',
                                                                         'hair.*fully protected']):
        features.append('hair_retouch')

    # COMPOSITE
    if has_feature(tl, ['смартфон', 'smartphone', 'экране камер', 'camera screen',
                         'camera mode interface', 'кнопку съемки']):
        features.append('composite_collage')
    if has_feature(pt, ['журнал', 'magazine']) or has_feature(tl, ['журнал на фоне', 'magazine background']):
        features.append('magazine_style')

    # CAT / ANIMAL - only if genuinely added to the scene
    if has_feature(tl, ['кот моргает', 'кот должен', 'добавь кота', 'with a cat', 'cat blinks']):
        features.append('animal_pet')

    # VIDEO ANIMATION
    if has_feature(tl, ['моргает', 'blink', 'оживить', 'animate', 'наклоняет голов',
                         'наклоняет голову', 'slight head tilt', 'natural blink', 'slightly tilt',
                         'blinking', 'моргание', 'легко моргает']):
        features.append('video_animation')

    # TEXT / LETTERING
    if has_feature(tl, ['надпись', 'inscription', 'lettering', 'шрифт', 'надпись на фон',
                         '3d.*letter', 'letter.*fur', 'letter.*chocolate', 'letter.*knit',
                         'объемную надпись', 'объёмную надпись', 'three-dimensional.*lettering',
                         '3d rendering', '3d-рендеринг', 'volumetric.*text', 'объемный текст',
                         'add an inscription']):
        features.append('text_lettering')

    # GLOW / TAN
    if has_feature(tl, ['загар', 'subtle tan', 'лёгкий загар', 'легкий загар', 'create.*tan']):
        features.append('glow_tan')

    # COMMERCIAL / EDITORIAL
    if has_feature(tl, ['коммерческая ретушь', 'commercial retouch', 'high-end', 'high fashion',
                         'редакционной бьюти', 'editorial beauty', 'editorial photography',
                         'редакционной фотографии', 'high end', 'studio sculpting beauty']):
        features.append('commercial_editorial')

    # WET SKIN EFFECT
    if has_feature(tl, ['влажный оттенок', 'wet highlight', 'влажн', 'wet look', 'wet skin',
                         'влажная кожа']):
        features.append('wet_skin')

    # ── TARGET AUDIENCE ────────────────────────────────────────────────────────
    if has_feature(combined, ['бровист', 'brow master', 'мастеров по бров', 'бровистам']):
        target_audience.append('brow_masters')
    if has_feature(combined, ['мастер пм', 'мастеров пм', 'перманент', 'permanent makeup', 'пм/']):
        target_audience.append('pm_masters')
    if has_feature(combined, ['ресниц', 'lash master', 'мастеров по ресниц', 'ресничник']):
        target_audience.append('lash_masters')
    if has_feature(combined, ['косметолог', 'cosmetolog']):
        target_audience.append('cosmetologists')
    if has_feature(combined, ['визажист', 'makeup artist', 'visagist']):
        target_audience.append('makeup_artists')
    if has_feature(combined, ['маникюр', 'nail master', 'мастер маникюра', 'мастеров маникюра']):
        target_audience.append('nail_masters')
    if has_feature(combined, ['педикюр', 'pedicure', 'мастер педикюр']):
        target_audience.append('pedicure_masters')
    if has_feature(combined, ['волосам', 'парикмахер', 'hair master']):
        target_audience.append('hair_masters')

    # ── POST-TITLE BASED FEATURE ENRICHMENT ───────────────────────────────────
    # For prompts where the comment is a template (applies to many scenarios),
    # enrich features from the post title.
    if 'серебряная поталь' in pt or 'поталь' in pt:
        if 'foil_potal' not in features: features.append('foil_potal')
    if 'блестки' in pt or 'блёстки' in pt or 'блестками' in pt:
        if 'glitter_sparkles' not in features: features.append('glitter_sparkles')
    if 'снег' in pt:
        if 'snow_winter' not in features: features.append('snow_winter')
    if 'капли воды' in pt or 'влажная кожа' in pt:
        if 'water_liquid_effects' not in features: features.append('water_liquid_effects')
    if 'капли сливочного масла' in pt:
        if 'water_liquid_effects' not in features: features.append('water_liquid_effects')
    if 'стразы' in pt:
        if 'glitter_sparkles' not in features: features.append('glitter_sparkles')
    if any(f in pt for f in ['мак на', 'пион', 'розы', 'гипсофил', 'желтые цветы', 'желтых цветов',
                              'цветочная композиция', 'нежный фон и розы']):
        if 'live_flowers' not in features and 'dried_flowers' not in features:
            features.append('live_flowers')
    if 'сухоцветы' in pt:
        if 'dried_flowers' not in features: features.append('dried_flowers')
    if any(f in pt for f in ['бандана', 'бандан']):
        if 'accessories' not in features: features.append('accessories')
    if any(f in pt for f in ['повязка', 'повязку', 'кружевная повязка']):
        if 'accessories' not in features: features.append('accessories')
    if any(f in pt for f in ['атласная лента', 'лента на шею', 'лента 🖤']):
        if 'accessories' not in features: features.append('accessories')
    if 'чокер' in pt:
        if 'accessories' not in features: features.append('accessories')
    if 'кольца' in pt:
        if 'accessories' not in features: features.append('accessories')
    if 'очки' in pt:
        if 'accessories' not in features: features.append('accessories')
    if 'перья' in pt:
        if 'accessories' not in features: features.append('accessories')
    if 'крылья' in pt:
        if 'accessories' not in features: features.append('accessories')
    if any(f in pt for f in ['шуба', 'белая шуба', 'коричневая шуба', 'меховая шапка', 'варежки']):
        if 'clothing_change' not in features: features.append('clothing_change')
        if 'accessories' not in features and any(f in pt for f in ['меховая шапка', 'варежки']):
            features.append('accessories')
    if 'палантин' in pt:
        if 'accessories' not in features: features.append('accessories')
    if 'замена одежды' in pt or 'замена фона + замена одежды' in pt:
        if 'clothing_change' not in features: features.append('clothing_change')
    if 'замена фона' in pt and 'background_change' not in features:
        features.append('background_change')

    # ── PRIMARY CATEGORY ───────────────────────────────────────────────────────
    # Priority: most specific/distinctive first.
    # Background change is used only when NO other distinctive decoration is present.
    subcategory = None

    if 'video_animation' in features:
        category = 'video_animation'

    elif 'text_lettering' in features:
        category = 'composite'
        subcategory = 'text_lettering'

    elif 'composite_collage' in features:
        category = 'composite'
        subcategory = 'phone_screen'

    elif 'magazine_style' in features and 'nail_care' not in features:
        category = 'composite'
        subcategory = 'magazine'

    elif 'product_photography' in features:
        category = 'product_photography'

    elif 'nail_care' in features:
        category = 'manicure'
        subcategory = 'pedicure' if has_feature(tl + pt, ['педикюр', 'pedicure']) else 'manicure'

    elif 'eye_lash_closeup' in features:
        category = 'eye_art'
        subcategory = 'close_up_lash' if has_feature(tl, ['крупный план', 'close-up', 'разорванн', 'torn']) else 'lash_portrait'

    elif 'lip_focus_primary' in features:
        category = 'lip_art'
        subcategory = 'close_up' if has_feature(tl, ['крупный план', 'close-up', 'разорванн', 'torn']) else 'portrait'

    elif 'dried_flowers' in features:
        category = 'decorative_flowers'
        subcategory = 'dried_flowers'

    elif 'live_flowers' in features:
        category = 'decorative_flowers'
        subcategory = 'fresh_flowers'

    elif 'foil_potal' in features:
        category = 'decorative_effects'
        subcategory = 'foil_potal'

    elif 'glitter_sparkles' in features:
        category = 'decorative_effects'
        subcategory = 'glitter'

    elif 'snow_winter' in features:
        category = 'decorative_effects'
        subcategory = 'snow_winter'

    elif 'water_liquid_effects' in features:
        category = 'decorative_effects'
        if has_feature(tl + pt, ['пена', 'foam']): subcategory = 'foam'
        elif has_feature(tl + pt, ['масл', 'butter', 'oil', 'сливочного']): subcategory = 'oil_drops'
        elif has_feature(tl + pt, ['влажная кожа', 'wet skin']): subcategory = 'wet_skin'
        else: subcategory = 'water_drops'

    elif 'food_elements' in features:
        category = 'decorative_effects'
        subcategory = 'food_crystals'

    elif 'accessories' in features:
        category = 'accessories'
        if has_feature(tl + pt, ['бандан', 'bandana']): subcategory = 'bandana'
        elif has_feature(tl + pt, ['кружевн', 'lace', 'повязку на голову']): subcategory = 'headband'
        elif has_feature(tl + pt, ['красную повязку', 'белую повязку', 'повязк']): subcategory = 'headband'
        elif has_feature(tl + pt, ['атласную ленту', 'лента на шею', 'лента', 'satin ribbon']): subcategory = 'ribbon'
        elif has_feature(tl + pt, ['чокер', 'choker']): subcategory = 'choker'
        elif has_feature(tl + pt, ['кольц', 'ring']): subcategory = 'rings'
        elif has_feature(tl + pt, ['очки', 'glasses']): subcategory = 'glasses'
        elif has_feature(tl + pt, ['перья', 'feather']): subcategory = 'feathers'
        elif has_feature(tl + pt, ['крылья', 'wings']): subcategory = 'wings'
        elif has_feature(tl + pt, ['меховую шапку', 'меховая шапка', 'варежки', 'fur hat', 'mittens']): subcategory = 'winter_hat'
        elif has_feature(tl + pt, ['палантин', 'шарф']): subcategory = 'scarf'

    elif 'clothing_change' in features:
        category = 'clothing_change'

    elif has_feature(combined, ['косметолог', 'cosmetolog']) and 'skin_retouch' in features:
        category = 'cosmetology'

    elif 'hair_retouch' in features:
        category = 'skin_retouch'
        subcategory = 'hair_retouch'

    elif 'background_change' in features and 'skin_retouch' in features:
        # Pure background change with portrait retouch — no distinctive decoration
        category = 'background_change'

    elif 'skin_retouch' in features:
        category = 'skin_retouch'
        if 'commercial_editorial' in features:
            subcategory = 'commercial'
        elif 'glow_tan' in features:
            subcategory = 'glow'
        else:
            subcategory = 'natural'

    else:
        category = 'skin_retouch'
        subcategory = 'natural'

    return {
        'category': category,
        'subcategory': subcategory,
        'features': sorted(set(features)),
        'target_audience': sorted(set(target_audience)),
    }

# ──────────────────────────────────────────────────────────────────────────────
# TITLE EXTRACTION
# ──────────────────────────────────────────────────────────────────────────────

def extract_prompt_title(row):
    post_title = row['post_title']
    comment_text = row['comment_text']

    # Check comment for a bolded header that isn't just "N ФОТО"
    m = re.match(r'^\*\*([^*\n]{3,80})\*\*', comment_text.strip())
    if m:
        cmt_header = m.group(1).strip()
        # Skip photo number headers
        if not re.match(r'^\d+\s+ФОТО\s*$', cmt_header, re.IGNORECASE) and \
           cmt_header not in ('ПРОМТ ДЛЯ GPT', 'ПРОМТ ДЛЯ ОЖИВЛЕНИЯ ФОТО:'):
            return cmt_header

    # Derive from post title
    raw = clean_title(post_title)
    raw = re.sub(r'^ПРОМТ\s*[-–—]\s*', '', raw, flags=re.IGNORECASE).strip()
    raw = re.sub(r'^ПРОМТ\s+ДЛЯ\s+', 'Для ', raw, flags=re.IGNORECASE).strip()
    raw = re.sub(r'^ПРОМТ\s+\d+\s*[-–—]\s*', '', raw, flags=re.IGNORECASE).strip()
    raw = re.sub(r'^ПРОМТ\s*\d*\s*', '', raw, flags=re.IGNORECASE).strip()
    raw = re.sub(r'\s+', ' ', raw).strip()

    # Remove trailing "Структура промта" etc.
    raw = re.sub(r'\s*Структура.*$', '', raw, flags=re.IGNORECASE).strip()

    return raw if raw else post_title[:100]

# ──────────────────────────────────────────────────────────────────────────────
# DESCRIPTIONS
# ──────────────────────────────────────────────────────────────────────────────

def build_description_ru(row, cat_info):
    tl = row['comment_text'].lower()
    ft = cat_info['features']
    cat = cat_info['category']
    parts = []

    if 'skin_retouch' in ft:
        if 'commercial_editorial' in ft:
            parts.append('коммерческая/editorial ретушь кожи')
        else:
            parts.append('натуральная ретушь кожи')
    if 'freckles_blush' in ft:
        parts.append('добавление веснушек и румянца')
    if 'eye_highlight' in ft:
        parts.append('блик на радужке глаза')
    if 'glow_tan' in ft:
        parts.append('лёгкий загар')
    if 'wet_skin' in ft:
        parts.append('влажный эффект кожи')
    if 'dried_flowers' in ft:
        parts.append('ветки сухоцветов на переднем плане')
    if 'live_flowers' in ft:
        for kw, nm in [('лизиантус', 'лизиантусы'), ('пион', 'пионы'), ('мак на', 'маки'),
                       ('гипсофил', 'гипсофилы'), ('подсолнух', 'подсолнухи'),
                       ('ягод', 'ягоды'), ('розы', 'розы'), ('роз', 'розы'), ('желтые цветы', 'желтые цветы')]:
            if kw in tl:
                parts.append(f'добавление {nm}')
                break
        else:
            parts.append('добавление живых цветов')
    if 'foil_potal' in ft:
        color = 'серебряная' if has_feature(tl, ['серебр', 'silver']) else 'золотая' if has_feature(tl, ['золот', 'gold']) else 'розовая' if 'розов' in tl else ''
        parts.append(f'{"" if not color else color + " "}поталь на лице')
    if 'glitter_sparkles' in ft:
        if has_feature(tl, ['страз', 'rhinestone']):
            parts.append('стразы на коже/губах')
        elif has_feature(tl, ['мерцание', 'shimmer']):
            parts.append('мерцание на коже вокруг глаз')
        else:
            parts.append('блёстки на лице')
    if 'water_liquid_effects' in ft:
        if has_feature(tl, ['пена', 'foam']): parts.append('пена на руках')
        elif has_feature(tl, ['масл', 'butter', 'oil']): parts.append('капли сливочного масла')
        else: parts.append('капли воды на коже')
    if 'snow_winter' in ft:
        parts.append('лёгкий снег на лице')
    if 'food_elements' in ft:
        if has_feature(tl, ['сахар', 'sugar']): parts.append('крупинки сахара на губах')
        elif has_feature(tl, ['шоколад', 'chocolate']): parts.append('шоколадные элементы')
        elif has_feature(tl, ['мороженое', 'ice cream']): parts.append('шарики мороженого')
        elif has_feature(tl, ['кокос', 'coconut']): parts.append('кокосы')
        elif has_feature(tl, ['торт', 'cake']): parts.append('торт')
        elif has_feature(tl, ['поп корн', 'popcorn']): parts.append('попкорн')
        else: parts.append('пищевые декоративные элементы')
    if 'accessories' in ft and cat == 'accessories':
        acc = []
        if has_feature(tl, ['бандан', 'bandana']): acc.append('бандана')
        if has_feature(tl, ['кружевн', 'lace']): acc.append('кружевная повязка')
        if has_feature(tl, ['красную повязку', 'белую повязку', 'повязку на голову']): acc.append('повязка')
        if has_feature(tl, ['атласную ленту', 'лента на шею']): acc.append('атласная лента')
        if has_feature(tl, ['атласный палантин', 'палантин']): acc.append('атласный палантин')
        if has_feature(tl, ['чокер', 'choker']): acc.append('чокер')
        if has_feature(tl, ['кольца', 'кольцо']): acc.append('кольца')
        if has_feature(tl, ['очки', 'glasses']): acc.append('очки')
        if has_feature(tl, ['белые перья', 'перья']): acc.append('белые перья')
        if has_feature(tl, ['крылья', 'wings']): acc.append('белые крылья')
        if has_feature(tl, ['меховую шапку', 'меховая шапка']): acc.append('меховая шапка')
        if has_feature(tl, ['варежки', 'mittens']): acc.append('варежки')
        if has_feature(tl, ['шуба', 'fur coat']): acc.append('шуба')
        if acc: parts.append(f'добавление: {", ".join(acc)}')
    if 'clothing_change' in ft and cat == 'clothing_change':
        parts.append('замена одежды')
    if 'background_change' in ft:
        parts.append('замена фона')
    if 'nail_care' in ft and cat == 'manicure':
        if has_feature(tl + row['post_title'].lower(), ['педикюр', 'pedicure']):
            parts.append('обработка фото педикюра')
        else:
            parts.append('обработка фото маникюра')
    if 'product_photography' in ft:
        parts.append('предметная фотосъёмка')
    if 'composite_collage' in ft:
        parts.append('коллаж с экраном смартфона')
    if 'magazine_style' in ft:
        parts.append('журнальный стиль')
    if 'text_lettering' in ft:
        parts.append('объёмные 3D-надписи на фоне')
    if 'video_animation' in ft:
        parts.append('оживление фото (видеоэффект через Runway)')
    if 'animal_pet' in ft:
        parts.append('добавление кота в кадр')
    if 'hair_retouch' in ft:
        parts.append('защита/ретушь волос')

    return ', '.join(parts) if parts else ''

def build_description_en(row, cat_info):
    tl = row['comment_text'].lower()
    ft = cat_info['features']
    cat = cat_info['category']
    parts = []

    if 'skin_retouch' in ft:
        if 'commercial_editorial' in ft:
            parts.append('commercial/editorial skin retouching')
        else:
            parts.append('natural skin retouching')
    if 'freckles_blush' in ft:
        parts.append('adding freckles and blush')
    if 'eye_highlight' in ft:
        parts.append('iris highlight/glow')
    if 'glow_tan' in ft:
        parts.append('subtle tan effect')
    if 'wet_skin' in ft:
        parts.append('wet skin effect')
    if 'dried_flowers' in ft:
        parts.append('dried flower branches in foreground')
    if 'live_flowers' in ft:
        for kw, nm in [('лизиантус', 'lisianthus'), ('пион', 'peonies'), ('мак на', 'poppies'),
                       ('гипсофил', 'gypsophila'), ('подсолнух', 'sunflowers'),
                       ('ягод', 'berries'), ('розы', 'roses'), ('роз', 'roses'),
                       ('желтые цветы', 'yellow flowers'), ('peony', 'peonies'), ('roses', 'roses')]:
            if kw in tl:
                parts.append(f'adding {nm}')
                break
        else:
            parts.append('adding fresh flowers')
    if 'foil_potal' in ft:
        color = 'silver' if has_feature(tl, ['серебр', 'silver']) else 'gold' if has_feature(tl, ['золот', 'gold']) else 'pink' if 'розов' in tl else ''
        parts.append(f'{"" if not color else color + " "}foil on face')
    if 'glitter_sparkles' in ft:
        if has_feature(tl, ['страз', 'rhinestone']): parts.append('rhinestones')
        elif has_feature(tl, ['мерцание', 'shimmer']): parts.append('shimmer around eyes')
        else: parts.append('glitter on face')
    if 'water_liquid_effects' in ft:
        if has_feature(tl, ['пена', 'foam']): parts.append('foam on hands')
        elif has_feature(tl, ['масл', 'butter', 'oil']): parts.append('butter/oil drops')
        else: parts.append('water drops on skin')
    if 'snow_winter' in ft:
        parts.append('light snow on face')
    if 'food_elements' in ft:
        if has_feature(tl, ['сахар', 'sugar']): parts.append('sugar crystals on lips')
        elif has_feature(tl, ['шоколад', 'chocolate']): parts.append('chocolate elements')
        elif has_feature(tl, ['мороженое', 'ice cream']): parts.append('ice cream scoops')
        elif has_feature(tl, ['кокос', 'coconut']): parts.append('coconuts')
        elif has_feature(tl, ['поп корн', 'popcorn']): parts.append('popcorn')
        else: parts.append('food decorative elements')
    if 'accessories' in ft and cat == 'accessories':
        acc = []
        if has_feature(tl, ['бандан', 'bandana']): acc.append('bandana')
        if has_feature(tl, ['кружевн', 'lace']): acc.append('lace headband')
        if has_feature(tl, ['красную повязку', 'белую повязку', 'повязку на голову']): acc.append('headband')
        if has_feature(tl, ['атласную ленту', 'лента на шею', 'satin ribbon']): acc.append('satin ribbon')
        if has_feature(tl, ['атласный палантин', 'палантин']): acc.append('satin headscarf')
        if has_feature(tl, ['чокер', 'choker']): acc.append('choker')
        if has_feature(tl, ['кольца', 'кольцо', 'ring']): acc.append('rings')
        if has_feature(tl, ['очки', 'glasses']): acc.append('glasses')
        if has_feature(tl, ['белые перья', 'перья']): acc.append('white feathers')
        if has_feature(tl, ['крылья', 'wings']): acc.append('white wings')
        if has_feature(tl, ['меховую шапку', 'меховая шапка']): acc.append('fur hat')
        if has_feature(tl, ['варежки', 'mittens']): acc.append('mittens')
        if has_feature(tl, ['шуба', 'fur coat']): acc.append('fur coat')
        if acc: parts.append(f'adding: {", ".join(acc)}')
    if 'clothing_change' in ft and cat == 'clothing_change':
        parts.append('clothing replacement')
    if 'background_change' in ft:
        parts.append('background replacement')
    if 'nail_care' in ft and cat == 'manicure':
        parts.append('pedicure photo editing' if has_feature(tl + row['post_title'].lower(), ['педикюр', 'pedicure']) else 'manicure photo editing')
    if 'product_photography' in ft:
        parts.append('product photography')
    if 'composite_collage' in ft:
        parts.append('smartphone camera screen composite')
    if 'magazine_style' in ft:
        parts.append('magazine style layout')
    if 'text_lettering' in ft:
        parts.append('3D lettering overlay on background')
    if 'video_animation' in ft:
        parts.append('photo animation / video effect (Runway)')
    if 'animal_pet' in ft:
        parts.append('adding a cat to the scene')
    if 'hair_retouch' in ft:
        parts.append('hair protection / retouching')

    return ', '.join(parts) if parts else ''

# ──────────────────────────────────────────────────────────────────────────────
# MAIN LOOP
# ──────────────────────────────────────────────────────────────────────────────

prompts = []
prompt_id = 1

for row in all_rows:
    if is_non_prompt(row):
        continue

    text = row['comment_text'].strip()
    if not text or text == 'None':
        continue

    cat_info = categorize(row)
    title = extract_prompt_title(row)
    lang = detect_language(text)
    date = extract_date(row['post_date'])
    desc_ru = build_description_ru(row, cat_info)
    desc_en = build_description_en(row, cat_info)

    p = {
        'id': prompt_id,
        'post_id': row['post_id'],
        'comment_id': row['comment_id'],
        'title': title,
        'category': cat_info['category'],
        'subcategory': cat_info['subcategory'],
        'date': date,
        'description_ru': desc_ru,
        'description_en': desc_en,
        'features': cat_info['features'],
        'prompt_text': text,
        'language': lang,
        'target_audience': cat_info['target_audience'],
    }
    prompts.append(p)
    prompt_id += 1

print(f"Extracted {len(prompts)} prompts", file=sys.stderr)

# Stats
cat_counts = Counter(p['category'] for p in prompts)
lang_counts = Counter(p['language'] for p in prompts)
print("\nCategory distribution:", file=sys.stderr)
for cat, count in sorted(cat_counts.items(), key=lambda x: -x[1]):
    print(f"  {cat}: {count}", file=sys.stderr)
print(f"\nLanguage distribution: {dict(lang_counts)}", file=sys.stderr)

# ──────────────────────────────────────────────────────────────────────────────
# CATEGORIES
# ──────────────────────────────────────────────────────────────────────────────

categories = [
    {
        'id': 'skin_retouch',
        'name_ru': 'Ретушь кожи',
        'name_en': 'Skin Retouch',
        'description_ru': 'Профессиональная ретушь кожи с сохранением естественной текстуры, пор и деталей. Натуральный и коммерческий (editorial) стиль.',
        'description_en': 'Professional skin retouching that preserves natural texture, pores, and detail. Natural and commercial (editorial) styles.',
    },
    {
        'id': 'decorative_flowers',
        'name_ru': 'Декоративные цветы',
        'name_en': 'Decorative Flowers',
        'description_ru': 'Добавление живых и сушёных цветов, лепестков и ботанических веток к портрету.',
        'description_en': 'Adding fresh and dried flowers, petals, and botanical branches to portraits.',
    },
    {
        'id': 'decorative_effects',
        'name_ru': 'Декоративные эффекты',
        'name_en': 'Decorative Effects',
        'description_ru': 'Поталь/фольга, блёстки, стразы, капли воды и масла, снег, кристаллы сахара и другие текстурные элементы.',
        'description_en': 'Foil, glitter, rhinestones, water/oil drops, snow, sugar crystals, and other textural elements.',
    },
    {
        'id': 'background_change',
        'name_ru': 'Замена фона',
        'name_en': 'Background Change',
        'description_ru': 'Замена фона фотографии на студийный, белый, чёрный, цветной или текстурный.',
        'description_en': 'Replacing photo background with studio, white, black, colored, or textured backgrounds.',
    },
    {
        'id': 'clothing_change',
        'name_ru': 'Замена одежды',
        'name_en': 'Clothing Change',
        'description_ru': 'Замена или добавление одежды: шубы, пальто, платья и другие образы.',
        'description_en': 'Replacing or adding clothing: fur coats, dresses, and other outfit changes.',
    },
    {
        'id': 'accessories',
        'name_ru': 'Аксессуары',
        'name_en': 'Accessories',
        'description_ru': 'Добавление головных повязок, бандан, лент, чокеров, колец, очков, перьев, крыльев и других аксессуаров.',
        'description_en': 'Adding headbands, bandanas, ribbons, chokers, rings, glasses, feathers, wings, and other accessories.',
    },
    {
        'id': 'manicure',
        'name_ru': 'Маникюр и педикюр',
        'name_en': 'Manicure & Pedicure',
        'description_ru': 'Профессиональная обработка фото маникюра и педикюра с заменой фона и добавлением декора.',
        'description_en': 'Professional manicure and pedicure photo editing with background replacement and decorative elements.',
    },
    {
        'id': 'product_photography',
        'name_ru': 'Предметная съёмка',
        'name_en': 'Product Photography',
        'description_ru': 'Создание профессиональных студийных снимков косметических изделий и продуктов.',
        'description_en': 'Creating professional studio shots of cosmetic products and items.',
    },
    {
        'id': 'lip_art',
        'name_ru': 'Крупный план губ',
        'name_en': 'Lip Art',
        'description_ru': 'Крупный план губ, художественные эффекты на губах (стразы, сахар, цветы).',
        'description_en': 'Lip close-ups with artistic effects (rhinestones, sugar, flowers).',
    },
    {
        'id': 'eye_art',
        'name_ru': 'Крупный план глаз и ресниц',
        'name_en': 'Eye & Lash Art',
        'description_ru': 'Крупный план глаз, ресниц с художественным фреймингом (разорванная бумага, мерцание).',
        'description_en': 'Close-up of eyes and lashes with artistic framing (torn paper, shimmer).',
    },
    {
        'id': 'cosmetology',
        'name_ru': 'Косметология и ПМ',
        'name_en': 'Cosmetology & PM',
        'description_ru': 'Промты для косметологов и мастеров перманентного макияжа.',
        'description_en': 'Prompts for cosmetologists and permanent makeup masters.',
    },
    {
        'id': 'video_animation',
        'name_ru': 'Видео и анимация',
        'name_en': 'Video & Animation',
        'description_ru': 'Промты для оживления фотографий (моргание, движение головы) через Runway.',
        'description_en': 'Prompts for animating photos (blinking, head movement) via Runway.',
    },
    {
        'id': 'composite',
        'name_ru': 'Коллажи и надписи',
        'name_en': 'Composites & Lettering',
        'description_ru': 'Коллажи с экраном смартфона, журнальный стиль, объёмные 3D-надписи на фоне.',
        'description_en': 'Smartphone screen composites, magazine-style layouts, 3D lettering on backgrounds.',
    },
]

# ──────────────────────────────────────────────────────────────────────────────
# OUTPUT
# ──────────────────────────────────────────────────────────────────────────────

output = {
    'meta': {
        'total_prompts': len(prompts),
        'total_categories': len(categories),
        'source_file': 'telegram_comments_20260223_0110.xlsx',
        'generated_at': '2026-02-22',
        'description': 'Catalog of AI photo editing prompts for beauty professionals extracted from Glow.GE Telegram channel.',
        'category_stats': dict(cat_counts),
        'language_stats': dict(lang_counts),
    },
    'categories': categories,
    'prompts': prompts,
}

out_path = 'C:/Users/User/Desktop/GITHUB/lashme/REFF/PROMPTS/prompts_catalog.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\nWritten to {out_path}", file=sys.stderr)
print(f"Total prompts: {len(prompts)}", file=sys.stderr)
