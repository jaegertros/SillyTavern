#!/usr/bin/env node
/**
 * Phase 2 Step 2: Remove extracted functions from script.js,
 * add imports from character-manager.js, re-exports, and bind calls.
 */

const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const SCRIPT_PATH = path.join(__dirname, 'mnt/SillyTavern/public/script.js');
const EXTRACT_JSON = path.join(__dirname, 'char_manager_extract.json');

const extractData = JSON.parse(fs.readFileSync(EXTRACT_JSON, 'utf8'));
const { exported: EXPORTED, private: PRIVATE, functions } = extractData;

let source = fs.readFileSync(SCRIPT_PATH, 'utf8');
const lines = source.split('\n');

// ============================================================
// 1. Remove extracted function blocks (bottom-up to preserve line numbers)
// ============================================================
const sortedFns = [...functions].sort((a, b) => b.startLine - a.startLine);

for (const fn of sortedFns) {
    const startIdx = fn.startLine - 1;
    const endIdx = fn.endLine; // endLine is 1-indexed, slice end is exclusive

    // Remove lines, leaving a blank line as separator
    lines.splice(startIdx, endIdx - startIdx, '');
}

source = lines.join('\n');
// Clean up multiple consecutive blank lines
source = source.replace(/\n{4,}/g, '\n\n\n');

console.log(`Removed ${functions.length} function blocks from script.js`);

// ============================================================
// 2. Remove co-extracted private variables
// ============================================================
// These patterns match the private var declarations that moved to character-manager
const privateVarPatterns = [
    /^let crop_data = undefined;\n/m,
    /^let fav_ch_checked = false;\n/m,
    /^let saveCharactersPage = 0;\n/m,
    /^const per_page_default = 50;\n/m,
    /^let importFlashTimeout;\n/m,
    /^var is_advanced_char_open = false;\n/m,
];

for (const pattern of privateVarPatterns) {
    const before = source;
    source = source.replace(pattern, '');
    if (source !== before) {
        console.log(`  Removed: ${pattern.source.slice(1, 40)}...`);
    }
}

// ============================================================
// 3. Add character-manager imports after chat-engine imports
// ============================================================

const charManagerImport = `
// Character manager imports
import {
    // Exported functions
    selectCharacterById,
    printCharacters,
    characterToEntity,
    groupToEntity,
    tagToEntity,
    getEntitiesList,
    getOneCharacter,
    getCharacterSource,
    getCharacters,
    getCharacterAvatar,
    formatCharacterAvatar,
    duplicateCharacter,
    setCharacterId,
    setCharacterName,
    renameCharacter,
    unshallowCharacter,
    getPastCharacterChats,
    handleDeleteCharacter,
    deleteCharacter,
    select_selected_character,
    select_rm_info,
    buildAvatarList,
    createOrEditCharacter,
    processDroppedFiles,
    newAssistantChat,
    // Late-bind wiring functions
    bind_cm_cancelTtsPlay,
    bind_cm_setMenuType,
    bind_cm_selectRightMenuWithAnimation,
    bind_cm_getFirstMessage,
    // Private state still referenced by script.js
    crop_data as cm_crop_data,
    fav_ch_checked as cm_fav_ch_checked,
    saveCharactersPage as cm_saveCharactersPage,
    per_page_default,
    importFlashTimeout as cm_importFlashTimeout,
    is_advanced_char_open as cm_is_advanced_char_open,
    _set_cm_crop_data,
    _set_cm_fav_ch_checked,
    _set_cm_saveCharactersPage,
    _set_cm_importFlashTimeout,
    _set_cm_is_advanced_char_open,
    // Private helper functions that may be called from remaining script.js code
    initCharacterSearch,
} from './scripts/core/character-manager.js';
`;

// Insert after the chat-engine import block
const chatEngineEndMarker = "} from './scripts/core/chat-engine.js';";
const insertPos = source.indexOf(chatEngineEndMarker);
if (insertPos === -1) {
    console.error('Could not find chat-engine import block end');
    process.exit(1);
}
const insertAfter = source.indexOf('\n', insertPos) + 1;
source = source.slice(0, insertAfter) + charManagerImport + source.slice(insertAfter);
console.log('Added character-manager imports');

// ============================================================
// 4. Add re-exports for backward compatibility
// ============================================================

const reExportBlock = `
// Re-exports from core/character-manager.js
export {
    selectCharacterById,
    printCharacters,
    characterToEntity,
    groupToEntity,
    tagToEntity,
    getEntitiesList,
    getOneCharacter,
    getCharacterSource,
    getCharacters,
    getCharacterAvatar,
    formatCharacterAvatar,
    duplicateCharacter,
    setCharacterId,
    setCharacterName,
    renameCharacter,
    unshallowCharacter,
    getPastCharacterChats,
    handleDeleteCharacter,
    deleteCharacter,
    select_selected_character,
    select_rm_info,
    buildAvatarList,
    createOrEditCharacter,
    processDroppedFiles,
    newAssistantChat,
};
`;

// Insert after the existing chat-engine re-export block
const chatEngineReExportEnd = "    updateViewMessageIds,\n};";
const reExportPos = source.indexOf(chatEngineReExportEnd);
if (reExportPos === -1) {
    console.error('Could not find chat-engine re-export block end');
    process.exit(1);
}
const reExportInsertAfter = source.indexOf('\n', reExportPos + chatEngineReExportEnd.length) + 1;
source = source.slice(0, reExportInsertAfter) + reExportBlock + source.slice(reExportInsertAfter);
console.log('Added character-manager re-exports');

// ============================================================
// 5. Add bind calls in firstLoadInit()
// ============================================================

const bindCalls = `
    // Character manager late-bind wiring
    bind_cm_cancelTtsPlay(cancelTtsPlay);
    bind_cm_setMenuType(setMenuType);
    bind_cm_selectRightMenuWithAnimation(selectRightMenuWithAnimation);
    bind_cm_getFirstMessage(getFirstMessage);
`;

// Insert after the last chat-engine bind call
const lastBindMarker = '    bind_removeMacros(removeMacros);';
const bindPos = source.indexOf(lastBindMarker);
if (bindPos === -1) {
    console.error('Could not find bind_removeMacros marker');
    process.exit(1);
}
const bindInsertAfter = source.indexOf('\n', bindPos) + 1;
source = source.slice(0, bindInsertAfter) + bindCalls + source.slice(bindInsertAfter);
console.log('Added bind calls in firstLoadInit()');

// ============================================================
// 6. Write modified script.js
// ============================================================
fs.writeFileSync(SCRIPT_PATH, source);
console.log(`\nWrote updated script.js (${source.split('\n').length} lines)`);

// ============================================================
// 7. Validate with acorn parse
// ============================================================
try {
    acorn.parse(source, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        locations: true,
    });
    console.log('✓ script.js parses successfully');
} catch (e) {
    console.error(`✗ Parse error in script.js: ${e.message} at line ${e.loc?.line}`);
    // Show context around the error
    const errLines = source.split('\n');
    const errLine = e.loc?.line || 0;
    for (let i = Math.max(0, errLine - 3); i < Math.min(errLines.length, errLine + 3); i++) {
        console.error(`  ${i + 1}: ${errLines[i]}`);
    }
}
