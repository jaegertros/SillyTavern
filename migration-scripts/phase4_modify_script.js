#!/usr/bin/env node
/**
 * Phase 4: Modify script.js to remove extracted generation-controller functions
 * and add imports + re-exports.
 */

const fs = require('fs');
const path = require('path');

const SCRIPT_PATH = '/sessions/admiring-relaxed-goldberg/mnt/SillyTavern/public/script.js';
const EXTRACT_PATH = '/sessions/admiring-relaxed-goldberg/generation_controller_extract.json';

let source = fs.readFileSync(SCRIPT_PATH, 'utf8');
let lines = source.split('\n');
const data = JSON.parse(fs.readFileSync(EXTRACT_PATH, 'utf8'));

console.log(`Original: ${lines.length} lines`);

// Sort functions by startLine descending so we remove from bottom first
const sorted = [...data.functions].sort((a, b) => b.startLine - a.startLine);

for (const fn of sorted) {
    const startIdx = fn.startLine - 1;
    const endIdx = fn.endLine;

    // Also remove section comments and blank lines immediately before
    let removeStart = startIdx;
    for (let i = removeStart - 1; i >= Math.max(0, removeStart - 5); i--) {
        const trimmed = lines[i].trim();
        if (trimmed === '' || trimmed.startsWith('//MARK:') || trimmed.match(/^\/\/\/+/) || trimmed.match(/^\/\/ @st-tracked/)) {
            removeStart = i;
            continue;
        }
        break;
    }

    console.log(`  Removing ${fn.name}: lines ${removeStart + 1}-${endIdx}`);
    lines.splice(removeStart, endIdx - removeStart);
}

source = lines.join('\n');
lines = source.split('\n');

// Also remove `export const isGenerating` line
const isGenIdx = lines.findIndex(l => l.includes('export const isGenerating'));
if (isGenIdx !== -1) {
    lines.splice(isGenIdx, 1);
    console.log(`  Removed 'export const isGenerating' at line ${isGenIdx + 1}`);
}

// Remove `let abortController;` and its JSDoc
const abortIdx = lines.findIndex(l => l.trim() === 'let abortController;');
if (abortIdx !== -1) {
    // Also remove the JSDoc above it
    let removeFrom = abortIdx;
    if (abortIdx > 0 && lines[abortIdx - 1].includes('@type {AbortController}')) {
        removeFrom = abortIdx - 1;
    }
    lines.splice(removeFrom, abortIdx - removeFrom + 1);
    console.log(`  Removed 'let abortController' at line ${removeFrom + 1}`);
}

// Remove `var kobold_horde_model = '';`
const khmIdx = lines.findIndex(l => l.trim() === "var kobold_horde_model = '';");
if (khmIdx !== -1) {
    lines.splice(khmIdx, 1);
    console.log(`  Removed 'kobold_horde_model' at line ${khmIdx + 1}`);
}

// Remove `let scrollLock = false;`
const slIdx = lines.findIndex(l => l.trim() === 'let scrollLock = false;');
if (slIdx !== -1) {
    lines.splice(slIdx, 1);
    console.log(`  Removed 'let scrollLock' at line ${slIdx + 1}`);
}

source = lines.join('\n');
lines = source.split('\n');

// Add import block after settings-manager import block
const smImportEnd = lines.findIndex(l => l.includes("} from './scripts/core/settings-manager.js';"));
if (smImportEnd === -1) {
    console.error('Could not find settings-manager import end');
    process.exit(1);
}

const importBlock = `
// Generation controller imports
import {
    isGenerating,
    isStreamingEnabled,
    StreamingProcessor,
    createRawPrompt,
    generateRaw,
    Generate,
    stopGeneration,
    shouldAutoContinue,
    triggerAutoContinue,
    removeMacros,
    getMaxContextSize,
    sendGenerationRequest,
    sendStreamingRequest,
    getGenerateUrl,
    getGeneratingApi,
    getGeneratingModel,
    setExternalAbortController,
    // Private helpers still called from remaining script.js
    doChatInject,
    flushWIInjections,
    formatMessageHistoryItem,
    parseTokenCounts,
    addChatsPreamble,
    addChatsSeparator,
    setInContextMessages,
    extractTitleFromData,
    extractImagesFromData,
    parseAndSaveLogprobs,
    extractMultiSwipes,
    saveImageToMessage,
    removeLastMessage,
} from './scripts/core/generation-controller.js';`;

lines.splice(smImportEnd + 1, 0, importBlock);

// Replace remaining scrollLock references with state.js import
// (event handlers in script.js still read/write scrollLock)
// We need to add scrollLock and _set_scrollLock to state.js import
source = lines.join('\n');

// Add scrollLock to state import
source = source.replace(
    /(_set_active_group,\n\}) from '\.\/scripts\/core\/state\.js'/,
    '_set_active_group,\n    scrollLock,\n    _set_scrollLock,\n} from \'./scripts/core/state.js\''
);

// Replace scrollLock writes in remaining code
source = source.replace(/\bscrollLock = (true|false)\b/g, '_set_scrollLock($1)');

lines = source.split('\n');

// Add re-export block
const smReexportEnd = lines.findIndex(l => l.includes("} from './scripts/core/settings-manager.js';") && lines[l - 1 > 0 ? l - 1 : 0]?.includes?.('export'));
// Find the settings-manager re-export section end more robustly
let reexportInsertPoint = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('// Re-exports from core/settings-manager.js')) {
        // Find closing brace
        for (let j = i; j < lines.length; j++) {
            if (lines[j].includes('};')) {
                reexportInsertPoint = j;
                break;
            }
        }
        break;
    }
}

if (reexportInsertPoint === -1) {
    console.error('Could not find settings-manager re-export section end');
    process.exit(1);
}

const reexportBlock = `
// Re-exports from core/generation-controller.js
export {
    isGenerating,
    isStreamingEnabled,
    StreamingProcessor,
    createRawPrompt,
    generateRaw,
    Generate,
    stopGeneration,
    shouldAutoContinue,
    triggerAutoContinue,
    removeMacros,
    getMaxContextSize,
    sendGenerationRequest,
    sendStreamingRequest,
    getGenerateUrl,
    getGeneratingApi,
    getGeneratingModel,
    setExternalAbortController,
};`;

lines.splice(reexportInsertPoint + 1, 0, reexportBlock);

fs.writeFileSync(SCRIPT_PATH, lines.join('\n'));
console.log(`\nWrote ${SCRIPT_PATH} (${lines.length} lines)`);
