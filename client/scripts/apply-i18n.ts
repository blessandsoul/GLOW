import { Project, SyntaxKind, Node, FunctionDeclaration, ArrowFunction } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

const project = new Project({
    tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
});

const dictionaryCacheMap: Record<string, string> = {
    "sys_hp374w": "Тарифы — LashMe",
    "sys_oc43ru": "Выберите тариф для AI-ретуши фото beauty-мастера",
    "sys_4a6zcn": "Вход — LashMe",
    "sys_o53sey": "Регистрация — LashMe",
    "sys_lbrevv": "Только JPEG, PNG или WebP",
    "sys_49fni8": "Файл слишком большой. Макс 10 МБ",
    "sys_zi7fa5": "Заявка отправлена!",
    "sys_bea8v4": "Статус обновлён",
    "sys_nir1j0": "Мария К.",
    "sys_6q2f7f": "Классика 2D",
    "sys_we1pbx": "Хочу лисий эффект",
    "sys_tqq8j9": "Елена Т.",
    "sys_of3uqg": "Объёмное 3D",
    "sys_74zpig": "Новая",
    "sys_1f8t80": "Подтверждена",
    "sys_knicji": "Отменена",
    "sys_ns0wwy": "Брендинг сохранён",
    "sys_q2ext5": "Брендинг удалён",
    "sys_2nhhz5": "Подписи сгенерированы",
    "sys_ier8eh": "#наращиваниересниц #лэшмейкер #ресницы #2dнаращивание #лисийвзгляд #красота #бьютимастер #записьонлайн #ресницытбилиси",
    "sys_luwlg8": "#наращиваниересниц #2dобъём #классическоенаращивание #лэшмейкер #ресницы #бьютиобразование #уходзаресницами #красота",
    "sys_a97wd1": "#ресницы #наращиваниересниц #лэшмейкер #довольнаяклиентка #лисийвзгляд #красотаэтосила #бьютимастер #ресничкитбилиси",
    "sys_2px1vo": "Продающий",
    "sys_1cosfm": "С призывом к действию",
    "sys_9klrsj": "Информативный",
    "sys_klh0t1": "Описание процедуры",
    "sys_5wh2s2": "Лёгкий и дружелюбный",
    "sys_kif3ln": "Русский",
    "sys_xy9c2g": "Мы заметили, что вы используете русский. Перевести сайт?",
    "sys_aabixu": "Да, перевести",
    "sys_u3ujkt": "Закрыть",
    "sys_74gceg": "Ресницы — до и после AI-ретуши",
    "sys_sn17xf": "Макияж — до и после AI-ретуши",
    "sys_oxymms": "Брови — до и после AI-ретуши",
    "sys_vifwyt": "Ногти — до и после AI-ретуши",
    "sys_ga2li7": "Загрузи фото",
    "sys_m7x59z": "Смотри результат",
    "sys_2lexch": "Что дальше?",
    "sys_ykzsc6": "Работа добавлена в портфолио",
    "sys_n9htfx": "Работа удалена",
    "sys_vy9px7": "Объёмное наращивание",
    "sys_ojosp0": "Профессиональное наращивание ресниц в Тбилиси. 5+ лет опыта. Сертифицированный мастер.",
    "sys_ztyawf": "Тбилиси",
    "sys_ab9vx7": "Мега-объём 5D",
    "sys_72pxmw": "Снятие + наращивание",
    "sys_pvn3rc": "Профиль сохранён",
    "sys_mmxyux": "Батуми",
    "sys_wpm6qq": "Кутаиси",
    "sys_nimqj6": "Рустави",
    "sys_cdwzfd": "Москва",
    "sys_o39fd7": "Санкт-Петербург",
    "sys_4kiz9b": "Киев",
    "sys_kn35eu": "Минск",
    "sys_mesjqx": "Ресницы",
    "sys_mr3nfs": "Ногти",
    "sys_2fxpdj": "Брови",
    "sys_n9zycc": "Макияж",
    "sys_fhc890": "Волосы",
    "sys_xkk87u": "Уход за кожей",
    "sys_74j6sw": "Ретушь завершена!",
    "sys_hmwggu": "Клей",
    "sys_1dr2kt": "Покраснение",
    "sys_dr9ajs": "Неровность",
    "sys_wjrsq3": "Дефект",
    "sys_hgur0c": "Другое",
    "sys_x1nv1w": "Пост запланирован",
    "sys_qbp0ia": "Пост отменён",
    "sys_pqwxoe": "Классическое наращивание 2D. Эффект лисьего взгляда.",
    "sys_xla17p": "#наращиваниересниц #лэшмейкер #ресницы",
    "sys_72zs0k": "Мега-объём для смелых! 5D наращивание.",
    "sys_irn5od": "#мегаобъём #ресницы5d #бьютимастер",
    "sys_dq9q98": "До и после — магия наращивания.",
    "sys_f3uthc": "#доипосле #ресницы #красота",
    "sys_kz89gr": "Запланировано",
    "sys_cndlki": "Напоминание отправлено",
    "sys_hrlov4": "Опубликовано",
    "sys_4a27fv": "Отменено",
    "sys_r2f9gv": "Спасибо за отзыв!",
    "sys_54thy9": "Stories готовы!",
    "sys_mwtoxa": "Запись открыта ✨",
    "sys_2jxk3g": "🔥 Новая работа!",
    "sys_l2o7eg": "Минимализм",
    "sys_jc1ffk": "Чистый фон, фокус на фото",
    "sys_ejfr7x": "Градиент",
    "sys_k20b20": "Цветной градиент + текст",
    "sys_6ypxgc": "Акцент",
    "sys_lmx4ll": "Стикеры и надписи",
    "sys_n17nai": "Шаблон применён",
    "sys_mawgyb": "Премиальный набор для лэшмейкеров. Элегантные шаблоны с золотыми акцентами.",
    "sys_71d5yp": "Мягкие, естественные тона. Минимализм и чистота для портфолио.",
    "sys_5n0r9j": "Яркие неоновые акценты на тёмном фоне. Дерзко и стильно.",
    "sys_q3ag45": "Нежные розовые оттенки с цветочными элементами. Романтичный стиль.",
    "sys_msveqd": "Карусель",
    "sys_n5opkl": "Хайлайты",
    "sys_bvmxr5": "Бесплатно",
    "sys_hvs3qt": "Нежная обработка с мягким размытием фона и тёплыми тонами. Идеально для портретных фото.",
    "sys_p7j631": "Чистая, клиничная эстетика. Ровный свет, минимальные тени, акцент на деталях.",
    "sys_o0mkqa": "Тёплый золотистый свет, как при закатном солнце. Создаёт уютную атмосферу.",
    "sys_e16dxe": "Глубокие тени, контрастные блики. Для драматичных портфолио.",
    "sys_4u50q8": "Пастельные тона с лёгким розоватым оттенком.",
    "sys_p6wrug": "Имитация плёночной фотографии с зерном и характерными цветами.",
    "sys_buh6jq": "1 кредит",
    "sys_i5tezd": "Брендинг",
    "sys_yq7dhk": "Реферальная программа — LashMe"
};

const valueToKey: Record<string, string> = {};
for (const [key, val] of Object.entries(dictionaryCacheMap)) {
    valueToKey[val] = key;
}

function isInsideReactComponentOrHook(node: Node): FunctionDeclaration | ArrowFunction | null {
    const parentFunction = node.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration) || node.getFirstAncestorByKind(SyntaxKind.ArrowFunction);
    if (!parentFunction) return null;
    let name = '';
    if (Node.isFunctionDeclaration(parentFunction)) {
        name = parentFunction.getName() || '';
    } else if (Node.isArrowFunction(parentFunction)) {
        const varDecl = parentFunction.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
        if (varDecl) name = varDecl.getName();
    }
    if (/^[A-Z]/.test(name) || /^use[A-Z]/.test(name)) return parentFunction as FunctionDeclaration | ArrowFunction;
    return null;
}

const sourceFiles = project.getSourceFiles('src/**/*.{ts,tsx}');

sourceFiles.forEach(sourceFile => {
    let fileModified = false;
    let componentOrHookMap = new Set<FunctionDeclaration | ArrowFunction>();

    const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
    const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);

    for (const literal of stringLiterals) {
        const text = literal.getLiteralValue();
        if (valueToKey[text]) {
            const key = valueToKey[text];
            const componentOrHook = isInsideReactComponentOrHook(literal);

            if (componentOrHook) {
                // Determine if it's already inside a t() call or wrapped in anything.
                // Replace with `t('system.sys_xxx')` 
                const parent = literal.getParent();

                if (Node.isCallExpression(parent) && parent.getExpression().getText() === 't') continue; // already wrapped

                if (Node.isJsxAttribute(parent?.getParent())) {
                    // It's in a JSX prop like title="Русский" -> title={t('system.sys_xxx')}
                    literal.replaceWithText(`{t('system.${key}')}`);
                } else {
                    // Regular assignment or call argument
                    literal.replaceWithText(`t('system.${key}')`);
                }
                componentOrHookMap.add(componentOrHook);
            } else {
                // Not in a React component/hook. Just replace the string val to "system.sys_xxx".
                literal.replaceWithText(`'system.${key}'`);
            }
            fileModified = true;
        }
    }

    for (const jsxText of jsxTexts) {
        const text = jsxText.getText().trim();
        if (valueToKey[text]) {
            const key = valueToKey[text];
            const componentOrHook = isInsideReactComponentOrHook(jsxText);
            if (componentOrHook) {
                jsxText.replaceWithText(`{t('system.${key}')}`);
                componentOrHookMap.add(componentOrHook);
                fileModified = true;
            }
        }
    }

    // Inject the hook if we modified any component/hook in this file
    if (componentOrHookMap.size > 0) {
        const hasUseLanguageImport = sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue().includes('useLanguage'));
        if (!hasUseLanguageImport) {
            sourceFile.insertImportDeclaration(0, {
                namedImports: ['useLanguage'],
                moduleSpecifier: '@/i18n/hooks/useLanguage'
            });
        }

        for (const func of componentOrHookMap) {
            const body = func.getBody();
            if (Node.isBlock(body)) {
                // Check if already has const { t } = useLanguage();
                if (!body.getText().includes('useLanguage()')) {
                    body.insertStatements(0, 'const { t } = useLanguage();');
                }
            }
        }
    }

    if (fileModified) {
        console.log(`Updated ${sourceFile.getBaseName()}`);
        sourceFile.saveSync();
    }
});

console.log('Done mapping Cyrillic strings.');
