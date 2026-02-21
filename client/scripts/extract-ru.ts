import { Project, SyntaxKind, StringLiteral, JsxText, Node } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

const project = new Project({
    tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
});

const sourceFiles = project.getSourceFiles('src/**/*.{ts,tsx}');
const result: Record<string, string[]> = {};
const CYRILLIC_REGEX = /[А-Яа-яЁё]/;

let totalStrings = 0;

for (const sf of sourceFiles) {
    const filePath = sf.getFilePath();
    const relativePath = path.relative(process.cwd(), filePath);
    const stringsInFile: string[] = [];

    // Find all StringLiterals
    const stringLiterals = sf.getDescendantsOfKind(SyntaxKind.StringLiteral);
    for (const st of stringLiterals) {
        const text = st.getLiteralValue();
        if (CYRILLIC_REGEX.test(text)) {
            stringsInFile.push(text);
        }
    }

    // Find all JsxText
    const jsxTexts = sf.getDescendantsOfKind(SyntaxKind.JsxText);
    for (const jt of jsxTexts) {
        const text = jt.getLiteralText().trim();
        if (text && CYRILLIC_REGEX.test(text)) {
            stringsInFile.push(text);
        }
    }

    if (stringsInFile.length > 0) {
        // Remove duplicates
        const uniqueStrings = [...new Set(stringsInFile)];
        result[relativePath] = uniqueStrings;
        totalStrings += uniqueStrings.length;
    }
}

fs.writeFileSync('ru-strings.json', JSON.stringify(result, null, 2), 'utf-8');
console.log(`Found ${totalStrings} Russian strings in ${Object.keys(result).length} files.`);
