import { Project, SyntaxKind, StringLiteral, NoSubstitutionTemplateLiteral } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

const project = new Project({
    tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
});

const sourceFiles = project.getSourceFiles('src/**/*.{ts,tsx}');

const kaDictPath = path.join(process.cwd(), 'src', 'i18n', 'dictionaries', 'ka.json');
const ruDictPath = path.join(process.cwd(), 'src', 'i18n', 'dictionaries', 'ru.json');
const enDictPath = path.join(process.cwd(), 'src', 'i18n', 'dictionaries', 'en.json');

const kaData = JSON.parse(fs.readFileSync(kaDictPath, 'utf-8'));
const ruData = JSON.parse(fs.readFileSync(ruDictPath, 'utf-8'));
const enData = JSON.parse(fs.readFileSync(enDictPath, 'utf-8'));

if (!kaData.system) kaData.system = {};
if (!ruData.system) ruData.system = {};
if (!enData.system) enData.system = {};

let extractedCount = 0;

function containsCyrillic(str: string) {
    return /[А-Яа-яЁё]/.test(str);
}

function generateKeyLabel(str: string): string {
    return Math.random().toString(36).substring(2, 8);
}

const extractedStrings: Record<string, string> = {};

sourceFiles.forEach(sourceFile => {
    let fileModified = false;
    let hasUseLanguage = sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue().includes('useLanguage')) !== undefined;

    // Process regular StringLiterals
    const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
    for (const literal of stringLiterals) {
        const text = literal.getLiteralValue();
        if (containsCyrillic(text)) {
            // Find existing key or create new
            let key = Object.keys(extractedStrings).find(k => extractedStrings[k] === text);
            if (!key) {
                key = `sys_${generateKeyLabel(text)}`;
                extractedStrings[key] = text;
            }

            // Check if we are in a component or hook where we can safely use t()
            // For this quick & dirty script, we just log the locations for manual or semi-manual injection,
            // or we try to replace if it's safe.
            // Actually, because replacing AST nodes for `t()` requires `useLanguage` injection which is complex,
            // let's just dump ALL remaining Russian strings to a report file so the agent can see EXACTLY what is left.
        }
    }
});

fs.writeFileSync('remaining_cyrillic.json', JSON.stringify(extractedStrings, null, 2));
console.log(`Found ${Object.keys(extractedStrings).length} unique Cyrillic strings remaining.`);
