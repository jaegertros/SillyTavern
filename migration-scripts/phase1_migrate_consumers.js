#!/usr/bin/env node
/**
 * Migrate consumer imports: redirect chat engine function imports
 * from script.js to core/chat-engine.js.
 */

const fs = require('fs');
const path = require('path');

const ROOT = '/sessions/admiring-relaxed-goldberg/mnt/SillyTavern/public';

// Load what was exported from chat-engine.js
const { exported } = JSON.parse(
    fs.readFileSync('/sessions/admiring-relaxed-goldberg/extract_results.json', 'utf8')
);
const CHAT_ENGINE_EXPORTS = new Set(exported);

// Find all JS files that import from script.js
function findJSFiles(dir) {
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'lib' && entry.name !== 'node_modules') {
            results.push(...findJSFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.js') && entry.name !== 'script.js') {
            results.push(fullPath);
        }
    }
    return results;
}

const allFiles = findJSFiles(path.join(ROOT, 'scripts'));
console.log(`Scanning ${allFiles.length} JS files for script.js imports...`);

let filesModified = 0;
let importsRedirected = 0;

for (const filePath of allFiles) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Find imports from script.js (or ../script.js, ../../script.js, etc.)
    // Match multi-line imports too
    const importPattern = /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]*script\.js)['"]\s*;?/g;

    let match;
    const replacements = [];

    while ((match = importPattern.exec(content)) !== null) {
        const importStr = match[0];
        const symbolsStr = match[1];
        const sourcePath = match[2];

        // Parse imported symbols
        const symbols = symbolsStr.split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .map(s => {
                const asMatch = s.match(/^(\w+)\s+as\s+(\w+)$/);
                if (asMatch) return { original: asMatch[1], local: asMatch[2], raw: s };
                return { original: s, local: s, raw: s };
            });

        // Split into chat-engine symbols and remaining script.js symbols
        const chatEngineSymbols = symbols.filter(s => CHAT_ENGINE_EXPORTS.has(s.original));
        const remainingSymbols = symbols.filter(s => !CHAT_ENGINE_EXPORTS.has(s.original));

        if (chatEngineSymbols.length === 0) continue;

        // Calculate relative path from this file to core/chat-engine.js
        const fileDir = path.dirname(filePath);
        const chatEnginePath = path.join(ROOT, 'scripts/core/chat-engine.js');
        let relPath = path.relative(fileDir, chatEnginePath).replace(/\\/g, '/');
        if (!relPath.startsWith('.')) relPath = './' + relPath;

        // Build replacement
        let replacement = '';

        if (remainingSymbols.length > 0) {
            // Keep the script.js import for remaining symbols
            if (remainingSymbols.length <= 3) {
                replacement += `import { ${remainingSymbols.map(s => s.raw).join(', ')} } from '${sourcePath}';\n`;
            } else {
                replacement += `import {\n`;
                replacement += remainingSymbols.map(s => `    ${s.raw},`).join('\n') + '\n';
                replacement += `} from '${sourcePath}';\n`;
            }
        }

        // Add chat-engine.js import
        if (chatEngineSymbols.length <= 3) {
            replacement += `import { ${chatEngineSymbols.map(s => s.raw).join(', ')} } from '${relPath}';`;
        } else {
            replacement += `import {\n`;
            replacement += chatEngineSymbols.map(s => `    ${s.raw},`).join('\n') + '\n';
            replacement += `} from '${relPath}';`;
        }

        replacements.push({ from: importStr, to: replacement });
        importsRedirected += chatEngineSymbols.length;
    }

    // Apply replacements
    for (const r of replacements) {
        content = content.replace(r.from, r.to);
    }

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        const relFile = path.relative(ROOT, filePath);
        const chatSymCount = replacements.reduce((sum, r) => {
            const matches = r.to.match(/from '.*chat-engine\.js'/);
            return sum + (matches ? 1 : 0);
        }, 0);
        console.log(`  Updated: ${relFile}`);
        filesModified++;
    }
}

console.log(`\nDone: ${filesModified} files modified, ${importsRedirected} imports redirected`);
