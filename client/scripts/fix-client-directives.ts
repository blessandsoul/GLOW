import * as fs from 'fs';
import * as path from 'path';

function walk(dir: string, callback: (filepath: string) => void) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(dirPath);
    });
}

walk(path.join(process.cwd(), 'src'), (filePath) => {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;

    let content = fs.readFileSync(filePath, 'utf-8');
    // If it has 'use client' but not at the very beginning (ignoring whitespace)
    if (content.includes("'use client';") || content.includes('"use client";')) {
        const lines = content.split('\n');
        const firstLine = lines[0].trim();
        if (firstLine !== "'use client';" && firstLine !== '"use client";') {
            // Remove all other instances
            content = content.replace(/['"]use client['"];?\r?\n?/g, '');
            // Prepend it
            content = "'use client';\n" + content;
            fs.writeFileSync(filePath, content);
            console.log('Fixed directive in:', filePath);
        }
    }
});
