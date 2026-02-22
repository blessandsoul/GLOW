from html.parser import HTMLParser
import re, json, openpyxl
from collections import Counter

# ========== HTML PARSER ==========
class TelegramHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.messages = []
        self.current_msg = None
        self.in_text = False
        self.in_from = False
        self.current_text = ''
        self.current_from = ''
        self.depth = 0
        self.text_depth = -1
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        cls = attrs_dict.get('class', '')
        if tag == 'div': self.depth += 1
        if tag == 'div' and 'message' in cls and 'default' in cls:
            mid = attrs_dict.get('id', '')
            if mid: self.current_msg = {'id': mid, 'text': '', 'from': ''}
        if tag == 'div' and cls.strip() == 'text' and self.current_msg is not None:
            self.in_text = True; self.text_depth = self.depth; self.current_text = ''
        if tag == 'div' and 'from_name' in cls:
            self.in_from = True; self.current_from = ''
        if tag == 'br' and self.in_text: self.current_text += '\n'
    def handle_endtag(self, tag):
        if tag == 'div':
            if self.in_text and self.depth == self.text_depth:
                self.in_text = False; self.text_depth = -1
                if self.current_msg is not None:
                    self.current_msg['text'] = self.current_text.strip()
                    if len(self.current_msg['text']) > 50: self.messages.append(self.current_msg)
                    self.current_msg = None
            if self.in_from:
                self.in_from = False
                if self.current_msg is not None: self.current_msg['from'] = self.current_from.strip()
            self.depth -= 1
    def handle_data(self, data):
        if self.in_text: self.current_text += data
        if self.in_from: self.current_from += data

# ========== PARSE HTML ==========
with open('messages.html', 'r', encoding='utf-8') as f:
    content = f.read()
parser = TelegramHTMLParser()
parser.feed(content)

html_prompts = []
for m in parser.messages:
    text = m['text']
    first_line = text.split('\n')[0].strip().upper()
    is_numbered = bool(re.match(r'ПРОМТ\s*\d+', first_line))
    is_named = first_line.startswith('ПРОМТ') and len(text) > 200
    has_content = any(kw in text.lower() for kw in [
        'edit your photo','create','perform professional','retouch',
        'отредактируй','выполните','сделайте ультра','high-fashion','ultra-realistic'
    ])
    skip_words = ['НАВИГАЦИЯ','ЗАКРЕПИМ','ДЕВОЧКИ','КАК ','ФРАЗЫ','ДАВАЙТЕ']

    if (is_numbered or is_named) and has_content and len(text) > 200:
        if not any(s in first_line for s in skip_words):
            name = text.split('\n')[0].strip()
            html_prompts.append({'source': 'html', 'id': m['id'], 'name': name, 'prompt_text': text})

# Special non-numbered prompts
for m in parser.messages:
    text = m['text']
    fl = text.split('\n')[0].strip().upper()
    specials = ['RUNWAY', 'ДЛЯ ТЕКСТУРНОЙ И СИЯЮЩЕЙ', 'ПЛЮШЕВЫЕ ПРЕДМЕТЫ']
    if any(kw in fl for kw in specials) and len(text) > 200:
        already = any(p['id'] == m['id'] for p in html_prompts)
        if not already:
            html_prompts.append({'source': 'html', 'id': m['id'], 'name': text.split('\n')[0].strip(), 'prompt_text': text})

# ========== PARSE EXCEL ==========
wb = openpyxl.load_workbook('telegram_comments_20260223_0110.xlsx')
ws = wb.active
excel_posts = {}
for row in ws.iter_rows(min_row=2, values_only=True):
    post_id = row[0]; post_title = str(row[2] or '').strip(); comment = str(row[7] or '').strip()
    if len(comment) < 100: continue
    lower = comment.lower()
    skip_comments = [
        'можете скинуть','интересно посмотреть','пост с обратной','туда можно',
        'получается если надо','добрый день, подскажите','мне чат gpt на этот промт',
        'нужен новый номер','здравствуйте','причина нужно постоянно','подписка 900','ой, поняла'
    ]
    if any(s in lower for s in skip_comments): continue
    if post_id not in excel_posts:
        excel_posts[post_id] = {'title': post_title, 'prompts': []}
    excel_posts[post_id]['prompts'].append(comment)

def clean_title(t):
    t = re.sub(r'\*\*', '', t)
    t = re.sub(r'__', '', t)
    return t.split('\n')[0].strip()

# ========== CATEGORIZER ==========
def categorize_name(name):
    n = name.lower()
    if any(w in n for w in ['маникюр','педикюр','nail']): return 'МАНИКЮР / ПЕДИКЮР'
    if any(w in n for w in ['на пальцах рук','на руках','пена на руках','капли воды на пальц']): return 'ДЕКОР РУК'
    if any(w in n for w in ['предметн','предментн','предметка','product','плюшев']): return 'ПРЕДМЕТНАЯ СЪЕМКА'
    if any(w in n for w in ['оживл','оживить','runway','видео']): return 'АНИМАЦИЯ'
    if any(w in n for w in ['косметолог','перманент']): return 'КОСМЕТОЛОГИЯ'
    if any(w in n for w in ['губ','lip']): return 'ГУБЫ'
    if 'визажист' in n: return 'ВИЗАЖИСТЫ'
    if 'волос' in n and 'мастер' in n: return 'ВОЛОСЫ'
    if any(w in n for w in ['бровист','мастер пм','мастеров пм','brows']): return 'БРОВИ / ПМ'
    if any(w in n for w in ['ресниц','lashes','макро съемка','макро']): return 'МАКРО / РЕСНИЦЫ'
    if any(w in n for w in ['пион','гипсофил','сухоцвет','ромашк','подсолнух','одуванчик','тюльпан']): return 'ЦВЕТЫ И РАСТЕНИЯ'
    if any(w in n for w in ['роза ','розы ',' роз ','розы,','розы+','розы\n','белые розы','зеленые цветы','желтые цветы','голубые розы','оранжевые розы']): return 'ЦВЕТЫ И РАСТЕНИЯ'
    if any(w in n for w in ['ягод','лепестк','ветк']): return 'ЦВЕТЫ И РАСТЕНИЯ'
    if any(w in n for w in ['клубник','малин','лимон','мармелад','рожок','мед ']): return 'ЕДА / ФРУКТЫ'
    if 'подтеки меда' in n: return 'ЕДА / ФРУКТЫ'
    if any(w in n for w in ['блестк','поталь','капл воды','капли воды на лице','пена','страз','фольга','посыпк','металлические подтеки','подтек металл','сердца на лице','жемчуг','патч','капсула']): return 'ДЕКОР ЛИЦА'
    if any(w in n for w in ['веснушк','влажн','снег','заснеж','бархатн']): return 'ДЕКОР ЛИЦА'
    if any(w in n for w in ['замена фон','фон +','черный фон','белый фон','+ фон','неон','блик на глаз']):
        if any(w in n for w in ['одежд','шуба','палантин','чокер']): return 'ЗАМЕНА ФОНА + ОДЕЖДА'
        return 'ЗАМЕНА ФОНА'
    if any(w in n for w in ['замена одежд','шуба','бандана','палантин','чокер','кольц','журнал']): return 'АКСЕССУАРЫ И ОДЕЖДА'
    if any(w in n for w in ['серьги','перчатк','бант','свитер','топ бандо','кружев','повязк','лента','меховая шапка','варежк']): return 'АКСЕССУАРЫ И ОДЕЖДА'
    if any(w in n for w in ['студийн','studio','clean girl']): return 'СТУДИЙНОЕ ФОТО'
    if any(w in n for w in ['ретушь','retouch','натуральн','коммерческ','сияющ','текстурн','ленив','после душа']): return 'РЕТУШЬ КОЖИ'
    if any(w in n for w in ['генерир','коллаж','картинк','делаем','nanobanana','надпис']): return 'ГЕНЕРАЦИЯ / КОЛЛАЖ'
    if any(w in n for w in ['14 февраля','валентин','valentine']): return 'ТЕМАТИЧЕСКИЕ'
    if any(w in n for w in ['кудряв','волнист']): return 'ПРИЧЕСКА / ВОЛОСЫ'
    if 'подарочн' in n or 'коробк' in n: return 'ЗАМЕНА ФОНА'
    if any(w in n for w in ['кот ','с котом']): return 'ГЕНЕРАЦИЯ / КОЛЛАЖ'
    return 'ПРОЧЕЕ'

# ========== BUILD COMBINED CATALOG ==========
all_filters = []

def categorize_by_content(prompt_text):
    """Fallback categorizer using prompt body text"""
    p = prompt_text.lower()
    if 'ретушь кожи' in p or 'skin retouch' in p or 'skin retouching' in p:
        if any(w in p for w in ['замен','фон на','background','replace']):
            return 'ЗАМЕНА ФОНА + РЕТУШЬ'
        return 'РЕТУШЬ КОЖИ'
    if any(w in p for w in ['замените фон','replace the background','background']):
        return 'ЗАМЕНА ФОНА'
    if any(w in p for w in ['одежд','clothing','outfit']):
        return 'АКСЕССУАРЫ И ОДЕЖДА'
    return 'РЕТУШЬ КОЖИ'  # default for beauty prompts

for p in html_prompts:
    cat = categorize_name(p['name'])
    if cat == 'ПРОЧЕЕ':
        cat = categorize_by_content(p['prompt_text'])
    all_filters.append({
        'source': 'html',
        'source_id': p['id'],
        'category': cat,
        'name': p['name'],
        'prompt_text': p['prompt_text']
    })

for pid in sorted(excel_posts.keys(), reverse=True):
    ep = excel_posts[pid]
    title = clean_title(ep['title'])
    title_lower = title.lower()
    skip_titles = ['обратн','вопрос','навигац','как подключ','девочки, под этим','девушки, напишите','в комментариях оставлю']
    if any(s in title_lower for s in skip_titles): continue

    for i, prompt in enumerate(ep['prompts']):
        variant = title + (f' (вариант {i+1})' if len(ep['prompts']) > 1 else '')
        cat = categorize_name(title)
        if cat == 'ПРОЧЕЕ':
            cat = categorize_name(prompt.split('\n')[0])
        if cat == 'ПРОЧЕЕ':
            cat = categorize_by_content(prompt)
        all_filters.append({
            'source': 'excel',
            'source_id': str(pid),
            'category': cat,
            'name': variant,
            'prompt_text': prompt
        })

# ========== SAVE ==========
with open('filters_catalog.json', 'w', encoding='utf-8') as f:
    json.dump(all_filters, f, ensure_ascii=False, indent=2)

# ========== SUMMARY ==========
cats = Counter(f['category'] for f in all_filters)
html_count = sum(1 for f in all_filters if f['source'] == 'html')
excel_count = sum(1 for f in all_filters if f['source'] == 'excel')

print('=' * 60)
print('ПОЛНЫЙ КАТАЛОГ ФИЛЬТРОВ — GLOW.GE')
print('=' * 60)
print(f'Из HTML (посты канала): {html_count}')
print(f'Из Excel (комментарии): {excel_count}')
print(f'ВСЕГО: {len(all_filters)} промптов')
print(f'КАТЕГОРИЙ: {len(cats)}')
print()
for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
    print(f'  {cat}: {count}')
