#!/usr/bin/env node
/**
 * Phase 3: Migrate consumer imports — redirect settings-manager function imports
 * from script.js to core/settings-manager.js.
 */

const fs = require('fs');
const path = require('path');

const ROOT = '/sessions/admiring-relaxed-goldberg/mnt/SillyTavern/public';

// All exported symbols from settings-manager.js
const SM_EXPORTS = new Set([
    'getSlideToggleOptions',
    'pingServer',
    'cancelStatusCheck',
    'displayOnlineStatus',
    'setAnimationDuration',
    'setActiveCharacter',
    'setActiveGroup',
    'startStatusLoading',
    'stopStatusLoading',
    'resultCheckStatus',
    'activateSendButtons',
    'deactivateSendButtons',
    'setMenuType',
    'setOnlineStatus',
    'setSendButtonState',
    'changeMainAPI',
    'setUserName',
    'getSettings',
    'saveSettings',
    'setGenerationParamsFromPreset',
    'getCurrentChatDetails',
    'selectRightMenuWithAnimation',
    'setExtensionPrompt',
    'getExtensionPromptRoleByName',
    'removeDepthPrompts',
    'setGenerationProgress',
    // Also exported helpers
    'showStopButton',
    'hideStopButton',
]);

// Find all JS files (excluding script.js and core/settings-manager.js itself)
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

        // Split into settings-manager symbols and remaining script.js symbols
        const smSymbols = symbols.filter(s => SM_EXPORTS.has(s.original));
        const remainingSymbols = symbols.filter(s => !SM_EXPORTS.has(s.original));

        if (smSymbols.length === 0) continue;

        // Calculate relative path from this file to core/settings-manager.js
        const fileDir = path.dirname(filePath);
        const smPath = path.join(ROOT, 'scripts/core/settings-manager.js');
        let relPath = path.relative(fileDir, smPath).replace(/\\/g, '/');
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

        // Add settings-manager.js import
        if (smSymbols.length <= 3) {
            replacement += `import { ${smSymbols.map(s => s.raw).join(', ')} } from '${relPath}';`;
        } else {
            replacement += `import {\n`;
            replacement += smSymbols.map(s => `    ${s.raw},`).join('\n') + '\n';
            replacement += `} from '${relPath}';`;
        }

        replacements.push({ from: importStr, to: replacement });
        importsRedirected += smSymbols.length;
    }

    // Apply replacements
    for (const r of replacements) {
        content = content.replace(r.from, r.to);
    }

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        const relFile = path.relative(ROOT, filePath);
        console.log(`  Updated: ${relFile}`);
        filesModified++;
    }
}

console.log(`\nDone: ${filesModified} files modified, ${importsRedirected} imports redirected`);
