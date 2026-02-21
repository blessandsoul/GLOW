import { Project, SyntaxKind, StringLiteral, JsxText, Node } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

// 1. Load project
const project = new Project({
    tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
});

// We only want to process UI components for now
const sourceFiles = project.getSourceFiles('src/**/*.tsx');

// Load or initialize our dictionaries
const kaDictPath = path.join(process.cwd(), 'src/i18n/dictionaries/ka.json');
const ruDictPath = path.join(process.cwd(), 'src/i18n/dictionaries/ru.json');
const enDictPath = path.join(process.cwd(), 'src/i18n/dictionaries/en.json');

const kaDict = JSON.parse(fs.readFileSync(kaDictPath, 'utf8'));
const ruDict = JSON.parse(fs.readFileSync(ruDictPath, 'utf8'));
const enDict = JSON.parse(fs.readFileSync(enDictPath, 'utf8'));

// We'll put new auto-extracted strings into a generic "ui" namespace
if (!kaDict.ui) kaDict.ui = {};
if (!ruDict.ui) ruDict.ui = {};
if (!enDict.ui) enDict.ui = {};

const CYRILLIC_REGEX = /[А-Яа-яЁё]/;

// Helper to generate a safe key from Russian text
function generateKey(text: string): string {
    // 1. Transliterate or just use a hash/simple lowercase + replace spaces
    // For simplicity, we'll hash it or create a sequential key if it's long, 
    // but a human readable key is better. Let's just create a hash-based key for automation,
    // or a simplified version of the text.

    // Simple approach: auto_key_1, auto_key_2, or derived from english if we had it.
    // Let's use a hash of the russian text to avoid duplicates.
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return `text_${Math.abs(hash).toString(36)}`;
}

let modifiedFiles = 0;
let totalReplaced = 0;

for (const sf of sourceFiles) {
    let fileModified = false;
    const filePath = sf.getFilePath();

    // Skip layout, page.tsx at root level, and already translated files if needed
    // But mostly we just rely on regex.

    const stringsToReplace: Array<{ node: Node, text: string, type: 'jsx' | 'string' }> = [];

    // Find all StringLiterals
    const stringLiterals = sf.getDescendantsOfKind(SyntaxKind.StringLiteral);
    for (const st of stringLiterals) {
        const text = st.getLiteralValue();
        if (CYRILLIC_REGEX.test(text)) {
            // Check if it's an import path or something weird (unlikely with Cyrillic but safe)
            if (st.getParentIfKind(SyntaxKind.ImportDeclaration)) continue;

            stringsToReplace.push({ node: st, text, type: 'string' });
        }
    }

    // Find all JsxText
    const jsxTexts = sf.getDescendantsOfKind(SyntaxKind.JsxText);
    for (const jt of jsxTexts) {
        const text = jt.getLiteralText();
        if (text.trim() && CYRILLIC_REGEX.test(text)) {
            stringsToReplace.push({ node: jt, text: text.trim(), type: 'jsx' });
        }
    }

    if (stringsToReplace.length === 0) continue;

    // We need to make sure the file imports useLanguage
    let hasUseLanguage = sf.getImportDeclaration('useLanguage') !== undefined;
    let hasI18nImport = sf.getImportDeclarations().some(imp => imp.getModuleSpecifierValue().includes('useLanguage'));

    if (!hasI18nImport) {
        // Add import
        sf.addImportDeclaration({
            namedImports: ['useLanguage'],
            moduleSpecifier: '@/i18n/hooks/useLanguage'
        });
        hasI18nImport = true;
    }

    // Find where to put const { t } = useLanguage();
    // Usually inside the default export or the main function.
    // This is tricky programmatically for arbitrary files, so we'll do a best-effort.
    // We look for functions returning JSX.
    const functions = sf.getFunctions();
    const arrowFunctions = sf.getDescendantsOfKind(SyntaxKind.ArrowFunction);

    const allComponents = [...functions, ...arrowFunctions].filter(f => {
        // Very basic heuristic: if it returns JSX and is exported
        // or just has JSX inside
        return f.getDescendantsOfKind(SyntaxKind.JsxElement).length > 0 ||
            f.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).length > 0;
    });

    // Determine target nodes for hook injection
    const componentsToInject = new Set<Node>();

    // Sort replacements bottom-up to avoid offset issues
    stringsToReplace.sort((a, b) => b.node.getPos() - a.node.getPos());

    for (const replacement of stringsToReplace) {
        const { node, text, type } = replacement;

        // Find enclosing component logic
        let enclosingComp = node.getFirstAncestor(anc => allComponents.includes(anc as any));

        if (!enclosingComp) {
            console.warn(`Could not find component for string "${text}" in ${filePath}`);
            continue;
        }

        componentsToInject.add(enclosingComp);

        // Generate key and update dict
        const key = generateKey(text);

        // Add to dictionaries if not exist
        if (!ruDict.ui[key]) {
            ruDict.ui[key] = text;
            kaDict.ui[key] = `[KA] ${text}`; // Placeholder for manual translation
            enDict.ui[key] = `[EN] ${text}`;
        }

        const fullKeyPath = `ui.${key}`;

        if (type === 'jsx') {
            // Replace JSX text with {t('key')}
            // Since JsxText has whitespace around it often, we need to be careful
            // Replacing the whole node is safest
            node.replaceWithText(`{t('${fullKeyPath}')}`);
        } else if (type === 'string') {
            // It's a string literal, e.g., placeholder="Текст" or label="Текст"
            // If it's a JSX attribute, we need to wrap in {}
            const parent = node.getParent();
            if (parent && parent.getKind() === SyntaxKind.JsxAttribute) {
                node.replaceWithText(`{t('${fullKeyPath}')}`);
            } else {
                // It might be an argument to a function or an array element
                node.replaceWithText(`t('${fullKeyPath}')`);
            }
        }

        fileModified = true;
        totalReplaced++;
    }

    // Inject const { t } = useLanguage(); into components
    for (const comp of componentsToInject) {
        try {
            // Depending on if it's a FunctionDeclaration or ArrowFunction
            if (comp.getKind() === SyntaxKind.FunctionDeclaration) {
                const func = comp as import('ts-morph').FunctionDeclaration;
                const body = func.getBody();
                if (body && body.getKind() === SyntaxKind.Block) {
                    const block = body as import('ts-morph').Block;
                    // Check if it already has t
                    if (!block.getText().includes('const { t } = useLanguage();')) {
                        block.insertStatements(0, 'const { t } = useLanguage();');
                    }
                }
            } else if (comp.getKind() === SyntaxKind.ArrowFunction) {
                const arrow = comp as import('ts-morph').ArrowFunction;
                const body = arrow.getBody();
                if (body && body.getKind() === SyntaxKind.Block) {
                    const block = body as import('ts-morph').Block;
                    if (!block.getText().includes('const { t } = useLanguage();')) {
                        block.insertStatements(0, 'const { t } = useLanguage();');
                    }
                } else if (body) {
                    // It's an implicit return arrow function like () => <div/>
                    // We need to convert it to a block
                    const expr = body.getText();
                    arrow.setBodyText(`{\n  const { t } = useLanguage();\n  return ${expr};\n}`);
                }
            }
        } catch (e) {
            console.error(`Error injecting hook in ${filePath}`, e);
        }
    }

    if (fileModified) {
        sf.saveSync();
        modifiedFiles++;
    }
}

// Save dictionaries
fs.writeFileSync(kaDictPath, JSON.stringify(kaDict, null, 4), 'utf8');
fs.writeFileSync(ruDictPath, JSON.stringify(ruDict, null, 4), 'utf8');
fs.writeFileSync(enDictPath, JSON.stringify(enDict, null, 4), 'utf8');

console.log(`Successfully replaced ${totalReplaced} strings in ${modifiedFiles} files.`);
