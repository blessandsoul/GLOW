import json
import re
from collections import Counter

with open('filters_catalog_unique.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Georgian translations for categories
GEO_CATEGORIES = {
    'ДЕКОР ЛИЦА': {'id': 'face-decor', 'ka': 'სახის დეკორი', 'icon': 'Sparkle'},
    'ПРЕДМЕТНАЯ СЪЕМКА': {'id': 'product-photo', 'ka': 'პროდუქტის ფოტო', 'icon': 'Package'},
    'РЕТУШЬ КОЖИ': {'id': 'skin-retouch', 'ka': 'კანის რეტუში', 'icon': 'MagicWand'},
    'ЦВЕТЫ И РАСТЕНИЯ': {'id': 'flowers', 'ka': 'ყვავილები', 'icon': 'Flower'},
    'ГЕНЕРАЦИЯ / КОЛЛАЖ': {'id': 'generation', 'ka': 'გენერაცია / კოლაჟი', 'icon': 'Images'},
    'АКСЕССУАРЫ И ОДЕЖДА': {'id': 'accessories', 'ka': 'აქსესუარები', 'icon': 'TShirt'},
    'ЗАМЕНА ФОНА': {'id': 'background', 'ka': 'ფონის შეცვლა', 'icon': 'Image'},
    'ЕДА / ФРУКТЫ': {'id': 'food', 'ka': 'საკვები / ხილი', 'icon': 'Orange'},
    'МАКРО / РЕСНИЦЫ': {'id': 'macro-lashes', 'ka': 'მაკრო / წამწამები', 'icon': 'Eye'},
    'АНИМАЦИЯ': {'id': 'animation', 'ka': 'ანიმაცია', 'icon': 'Play'},
    'СТУДИЙНОЕ ФОТО': {'id': 'studio', 'ka': 'სტუდიური ფოტო', 'icon': 'Camera'},
    'ТЕМАТИЧЕСКИЕ': {'id': 'seasonal', 'ka': 'თემატური', 'icon': 'Heart'},
    'ЗАМЕНА ФОНА + РЕТУШЬ': {'id': 'bg-retouch', 'ka': 'ფონი + რეტუში', 'icon': 'ImageSquare'},
    'МАНИКЮР / ПЕДИКЮР': {'id': 'nails', 'ka': 'მანიკური / პედიკური', 'icon': 'HandPalm'},
    'БРОВИ / ПМ': {'id': 'brows-pmu', 'ka': 'წარბები / PM', 'icon': 'PenNib'},
    'ЗАМЕНА ФОНА + ОДЕЖДА': {'id': 'bg-outfit', 'ka': 'ფონი + ტანსაცმელი', 'icon': 'Hoodie'},
    'ДЕКОР РУК': {'id': 'hand-decor', 'ka': 'ხელის დეკორი', 'icon': 'Hand'},
    'ПРИЧЕСКА / ВОЛОСЫ': {'id': 'hair', 'ka': 'თმა / ვარცხნილობა', 'icon': 'Scissors'},
    'ГУБЫ': {'id': 'lips', 'ka': 'ტუჩები', 'icon': 'SmileyWink'},
    'КОСМЕТОЛОГИЯ': {'id': 'cosmetology', 'ka': 'კოსმეტოლოგია', 'icon': 'FirstAid'},
    'ВОЛОСЫ': {'id': 'hair-masters', 'ka': 'თმის მასტერები', 'icon': 'Scissors'},
    'ВИЗАЖИСТЫ': {'id': 'makeup-artists', 'ka': 'ვიზაჟისტები', 'icon': 'PaintBrush'},
}


def clean_name(name):
    name = re.sub(r'\*\*', '', name)
    name = re.sub(r'__', '', name)
    name = re.sub(r'^ПРОМТ\s*\d*\s*[-\u2013\u2014]?\s*', '', name, flags=re.IGNORECASE)
    name = re.sub(r'^ПРОМТ\s+ДЛЯ\s+', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s*Структура\s*.*$', '', name)
    name = name.strip()
    return name if name else 'Фильтр'


GEO_NAMES = {
    'веснушки': 'ჩხატები',
    'блестки': 'ბრჭყვიალა',
    'капли воды': 'წყლის წვეთები',
    'перья': 'ბუმბული',
    'поталь': 'პოტალი',
    'стразы': 'სტრაზები',
    'фольга': 'ფოლგა',
    'снег': 'თოვლი',
    'пионы': 'პეონები',
    'пион': 'პეონი',
    'розы': 'ვარდები',
    'роза': 'ვარდი',
    'ромашки': 'გვირილები',
    'ромашка': 'გვირილა',
    'сухоцветы': 'გამხმარი ყვავილები',
    'гипсофилы': 'გიფსოფილა',
    'ягоды': 'კენკრა',
    'лимон': 'ლიმონი',
    'клубника': 'მარწყვი',
    'мед': 'თაფლი',
    'подтеки меда': 'თაფლის წვეთები',
    'ретушь': 'რეტუში',
    'маникюр': 'მანიკური',
    'педикюр': 'პედიკური',
    'ресницы': 'წამწამები',
    'брови': 'წარბები',
    'губы': 'ტუჩები',
    'жемчуг': 'მარგალიტი',
    'бантики': 'ბანტები',
    'банты': 'ბანტები',
    'сердца': 'გულები',
    'лента': 'ლენტი',
    'ленты': 'ლენტები',
    'шуба': 'ბეწვის ქურთუკი',
    'кудрявые волосы': 'ხუხული თმა',
    'волнистые волосы': 'ტალღოვანი თმა',
    'черный фон': 'შავი ფონი',
    'белый фон': 'თეთრი ფონი',
    'замена фона': 'ფონის შეცვლა',
    'замена одежды': 'ტანსაცმლის შეცვლა',
    'предметная съемка': 'პროდუქტის ფოტო',
    'студийное фото': 'სტუდიური ფოტო',
    'студийная фотография': 'სტუდიური ფოტო',
    'clean girl': 'Clean Girl',
    'макро': 'მაკრო',
    'перчатки': 'ხელთათმანები',
    'очки': 'სათვალე',
    'повязка': 'თავსაბურავი',
    'кольца': 'ბეჭდები',
    'серьги': 'საყურეები',
    'одуванчик': 'ბაბუაწვერა',
    'подсолнух': 'მზესუმზირა',
    'тюльпаны': 'ტიტები',
    'бабочки': 'პეპლები',
    'масло': 'კარაქი',
    'мыльные пузыри': 'საპნის ბუშტები',
    'капсула': 'კაფსულა',
    'рожок': 'ნაყინი',
    'мармеладные мишки': 'მარმელადი',
    'малина': 'ჟოლო',
    'предметная': 'პროდუქტის ფოტო',
    'посыпка': 'საკონდიტრო მოყვანილობა',
    'кондитерская посыпка': 'საკონდიტრო მოყვანილობა',
    'металлические подтеки': 'მეტალის წვეთები',
    'влажная кожа': 'ტენიანი კანი',
    'крупинки сахара': 'შაქრის კრისტალები',
    'блик': 'ბზინვარება',
    'подарочные коробки': 'საჩუქრის ყუთები',
    'неон': 'ნეონი',
    'косметологов': 'კოსმეტოლოგები',
    'визажистов': 'ვიზაჟისტები',
    'бровистов': 'წარბების მასტერი',
    'мастеров пм': 'PM მასტერი',
    'мастеров по ресницам': 'წამწამების მასტერი',
    'мастеров маникюра': 'მანიკურის მასტერი',
    'мастеров по волосам': 'თმის მასტერი',
    'сияющей кожи': 'ბრწყინვალე კანი',
    'натуральная ретушь': 'ნატურალური რეტუში',
    'коммерческая ретушь': 'კომერციული რეტუში',
    'ленивая ретушь': 'სწრაფი რეტუში',
    'ретушь кожи': 'კანის რეტუში',
    'текстурная кожа': 'ტექსტურიანი კანი',
}


def translate_name(name):
    lower = name.lower()
    parts = []
    used = set()
    for ru, ka in sorted(GEO_NAMES.items(), key=lambda x: -len(x[0])):
        if ru in lower and ru not in used:
            parts.append(ka)
            used.add(ru)
            lower = lower.replace(ru, '', 1)
    if parts:
        return ' + '.join(parts[:3])
    return name


# Build output
filters_output = []
filter_id = 0

for item in data:
    cat_ru = item['category']
    cat_info = GEO_CATEGORIES.get(cat_ru, {'id': 'other', 'ka': 'სხვა', 'icon': 'Star'})

    raw_name = clean_name(item['name'])
    geo_name = translate_name(raw_name)

    filter_id += 1
    filters_output.append({
        'id': 'filter-' + str(filter_id),
        'categoryId': cat_info['id'],
        'name_ka': geo_name,
        'name_ru': raw_name,
        'prompt': item['prompt_text'],
    })

# Build categories
cat_counts = Counter(f['categoryId'] for f in filters_output)
categories_output = []
for cat_ru, info in GEO_CATEGORIES.items():
    count = cat_counts.get(info['id'], 0)
    if count > 0:
        categories_output.append({
            'id': info['id'],
            'label_ka': info['ka'],
            'label_ru': cat_ru,
            'icon': info['icon'],
            'count': count,
        })
categories_output.sort(key=lambda x: -x['count'])

output = {'categories': categories_output, 'filters': filters_output}

with open('filters_for_app.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print('Categories:', len(categories_output))
print('Filters:', len(filters_output))
for c in categories_output:
    print(f"  {c['id']}: {c['label_ka']} ({c['count']})")
print('Saved to filters_for_app.json')
