import { Project, SyntaxKind } from 'ts-morph';
import * as path from 'path';

const project = new Project({
    tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
});

const sourceFiles = project.getSourceFiles('src/app/**/*.tsx');
let modifiedFiles = 0;

for (const sf of sourceFiles) {
    // Only check files that now have useLanguage import
    if (sf.getImportDeclaration('useLanguage') || sf.getImportDeclarations().some(imp => imp.getModuleSpecifierValue().includes('useLanguage'))) {

        // Ensure 'use client'; is at the top
        const hasUseClient = sf.getStatements().some(stmt => {
            if (stmt.getKind() === SyntaxKind.ExpressionStatement) {
                const exprStmt = stmt as import('ts-morph').ExpressionStatement;
                const expr = exprStmt.getExpression();
                if (expr.getKind() === SyntaxKind.StringLiteral) {
                    const literal = expr as import('ts-morph').StringLiteral;
                    return literal.getLiteralValue() === 'use client';
                }
            }
            return false;
        });

        if (!hasUseClient) {
            sf.insertStatements(0, "'use client';");
            sf.saveSync();
            modifiedFiles++;
            console.log(`Added 'use client' to ${sf.getFilePath()}`);
        }
    }
}

console.log(`Added 'use client' to ${modifiedFiles} files.`);
