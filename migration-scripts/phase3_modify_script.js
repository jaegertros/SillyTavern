#!/usr/bin/env node
/**
 * Phase 3: Modify script.js to remove extracted settings-manager functions
 * and add imports + re-exports.
 */

const fs = require('fs');
const path = require('path');

const SCRIPT_PATH = '/sessions/admiring-relaxed-goldberg/mnt/SillyTavern/public/script.js';
const EXTRACT_PATH = '/sessions/admiring-relaxed-goldberg/settings_manager_extract.json';

let source = fs.readFileSync(SCRIPT_PATH, 'utf8');
let lines = source.split('\n');
const data = JSON.parse(fs.readFileSync(EXTRACT_PATH, 'utf8'));

console.log(`Original: ${lines.length} lines`);

// Sort functions by startLine descending so we remove from bottom first
const sorted = [...data.functions].sort((a, b) => b.startLine - a.startLine);

for (const fn of sorted) {
    const startIdx = fn.startLine - 1; // 0-indexed
    const endIdx = fn.endLine;          // exclusive (1-indexed endLine maps to 0-indexed endIdx)

    // Also remove any blank lines and comments immediately before the function
    // (the docStart already accounts for JSDoc, but there might be section comments)
    let removeStart = startIdx;
    // Check for section comments like //MARK: or ////////
    for (let i = removeStart - 1; i >= Math.max(0, removeStart - 5); i--) {
        const trimmed = lines[i].trim();
        if (trimmed === '' || trimmed.startsWith('//MARK:') || trimmed.match(/^\/\/\/+/)) {
            removeStart = i;
            continue;
        }
        break;
    }

    console.log(`  Removing ${fn.name}: lines ${removeStart + 1}-${endIdx} (${endIdx - removeStart} lines)`);
    lines.splice(removeStart, endIdx - removeStart);
}

// Now add the import block after the character-manager import block
// Find the end of the character-manager import block
source = lines.join('\n');
lines = source.split('\n');

const cmImportEnd = lines.findIndex(l => l.includes("} from './scripts/core/character-manager.js';"));
if (cmImportEnd === -1) {
    console.error('Could not find character-manager import end');
    process.exit(1);
}

const importBlock = `
// Settings manager imports
import {
    // Exported functions
    getSlideToggleOptions,
    pingServer,
    cancelStatusCheck,
    displayOnlineStatus,
    setAnimationDuration,
    setActiveCharacter,
    setActiveGroup,
    startStatusLoading,
    stopStatusLoading,
    resultCheckStatus,
    activateSendButtons,
    deactivateSendButtons,
    setMenuType,
    setOnlineStatus,
    setSendButtonState,
    changeMainAPI,
    setUserName,
    getSettings,
    saveSettings,
    setGenerationParamsFromPreset,
    getCurrentChatDetails,
    selectRightMenuWithAnimation,
    setExtensionPrompt,
    getExtensionPromptRoleByName,
    removeDepthPrompts,
    setGenerationProgress,
    // Private state co-extracted
    firstRun as sm_firstRun,
    _set_sm_firstRun,
    sm_currentVersion,
    _set_sm_currentVersion,
} from './scripts/core/settings-manager.js';`;

// Insert after character-manager import line
lines.splice(cmImportEnd + 1, 0, importBlock);

// Now update script.js local references to firstRun
// Find `let firstRun = false;` and remove it
const firstRunIdx = lines.findIndex(l => l.trim() === 'let firstRun = false;');
if (firstRunIdx !== -1) {
    lines.splice(firstRunIdx, 1);
    console.log(`  Removed 'let firstRun = false;' at line ${firstRunIdx + 1}`);
}

// Find `let currentVersion = '0.0.0';` and remove it
const cvIdx = lines.findIndex(l => l.trim() === "let currentVersion = '0.0.0';");
if (cvIdx !== -1) {
    lines.splice(cvIdx, 1);
    console.log(`  Removed 'let currentVersion' at line ${cvIdx + 1}`);
}

// Replace remaining firstRun references with sm_firstRun
source = lines.join('\n');
// Be careful: only replace standalone `firstRun` not `settings.firstRun`
// The remaining refs should be in addDebugFunctions: `firstRun = true;`
source = source.replace(/^(\s+)firstRun = true;/m, '$1_set_sm_firstRun(true);');

// Replace currentVersion = data.pkgVersion with setter
source = source.replace(/currentVersion = data\.pkgVersion/, '_set_sm_currentVersion(data.pkgVersion)');

// Also replace any remaining read of currentVersion with sm_currentVersion
// Check what remains
const cvRefs = [...source.matchAll(/\bcurrentVersion\b/g)];
console.log(`  Remaining currentVersion refs: ${cvRefs.length}`);

lines = source.split('\n');
console.log(`After removals: ${lines.length} lines`);

// Now add re-export block — find the character-manager re-export section
const cmReexportStart = lines.findIndex(l => l.includes("// Re-exports from core/character-manager.js"));
if (cmReexportStart === -1) {
    console.error('Could not find character-manager re-export section');
    process.exit(1);
}

// Find the closing brace of that re-export block
let cmReexportEnd = cmReexportStart;
for (let i = cmReexportStart; i < lines.length; i++) {
    if (lines[i].includes("} from './scripts/core/character-manager.js';")) {
        cmReexportEnd = i;
        break;
    }
}

const reexportBlock = `
// Re-exports from core/settings-manager.js
export {
    getSlideToggleOptions,
    pingServer,
    cancelStatusCheck,
    displayOnlineStatus,
    setAnimationDuration,
    setActiveCharacter,
    setActiveGroup,
    startStatusLoading,
    stopStatusLoading,
    resultCheckStatus,
    activateSendButtons,
    deactivateSendButtons,
    setMenuType,
    setOnlineStatus,
    setSendButtonState,
    changeMainAPI,
    setUserName,
    getSettings,
    saveSettings,
    setGenerationParamsFromPreset,
    getCurrentChatDetails,
    selectRightMenuWithAnimation,
    setExtensionPrompt,
    getExtensionPromptRoleByName,
    removeDepthPrompts,
    setGenerationProgress,
};`;

lines.splice(cmReexportEnd + 1, 0, reexportBlock);

// Write out
fs.writeFileSync(SCRIPT_PATH, lines.join('\n'));
console.log(`\nWrote ${SCRIPT_PATH} (${lines.length} lines)`);
