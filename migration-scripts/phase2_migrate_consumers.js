#!/usr/bin/env node
/**
 * Phase 2: Migrate consumer imports — redirect character-manager function imports
 * from script.js to core/character-manager.js.
 */

const fs = require('fs');
const path = require('path');

const ROOT = '/sessions/admiring-relaxed-goldberg/mnt/SillyTavern/public';

// All exported symbols from character-manager.js
const CHAR_MANAGER_EXPORTS = new Set([
    'selectCharacterById',
    'printCharacters',
    'characterToEntity',
    'groupToEntity',
    'tagToEntity',
    'getEntitiesList',
    'getOneCharacter',
    'getCharacterSource',
    'getCharacters',
    'getCharacterAvatar',
    'formatCharacterAvatar',
    'duplicateCharacter',
    'setCharacterId',
    'setCharacterName',
    'renameCharacter',
    'unshallowCharacter',
    'getPastCharacterChats',
    'handleDeleteCharacter',
    'deleteCharacter',
    'select_selected_character',
    'select_rm_info',
    'buildAvatarList',
    'createOrEditCharacter',
    'processDroppedFiles',
    'newAssistantChat',
    // Also exported helpers
    'updateFavButtonState',
    'doCharListDisplaySwitch',
    'selectImportedChar',
    'importCharacter',
    'importFromURL',
    'importCharactersTags',
    'select_rm_create',
    'read_avatar_load',
    'openCharacterWorldPopup',
    'openAlternateGreetings',
    'addAlternateGreeting',
    'initCharacterSearch',
    // Private state exports
    'crop_data',
    'fav_ch_checked',
    'saveCharactersPage',
    'per_page_default',
    'importFlashTimeout',
    'is_advanced_char_open',
    '_set_cm_crop_data',
    '_set_cm_fav_ch_checked',
    '_set_cm_saveCharactersPage',
    '_set_cm_importFlashTimeout',
    '_set_cm_is_advanced_char_open',
]);

// Find all JS files
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

        // Split into character-manager symbols and remaining script.js symbols
        const charManagerSymbols = symbols.filter(s => CHAR_MANAGER_EXPORTS.has(s.original));
        const remainingSymbols = symbols.filter(s => !CHAR_MANAGER_EXPORTS.has(s.original));

        if (charManagerSymbols.length === 0) continue;

        // Calculate relative path from this file to core/character-manager.js
        const fileDir = path.dirname(filePath);
        const charManagerPath = path.join(ROOT, 'scripts/core/character-manager.js');
        let relPath = path.relative(fileDir, charManagerPath).replace(/\\/g, '/');
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

        // Add character-manager.js import
        if (charManagerSymbols.length <= 3) {
            replacement += `import { ${charManagerSymbols.map(s => s.raw).join(', ')} } from '${relPath}';`;
        } else {
            replacement += `import {\n`;
            replacement += charManagerSymbols.map(s => `    ${s.raw},`).join('\n') + '\n';
            replacement += `} from '${relPath}';`;
        }

        replacements.push({ from: importStr, to: replacement });
        importsRedirected += charManagerSymbols.length;
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
