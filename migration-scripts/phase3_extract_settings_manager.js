#!/usr/bin/env node
/**
 * Phase 3: Extract settings-manager functions from script.js
 * Uses acorn AST parser for accurate function boundary detection.
 */

const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const SCRIPT_PATH = path.join(__dirname, 'mnt/SillyTavern/public/script.js');
const OUTPUT_PATH = path.join(__dirname, 'settings_manager_extract.json');

const source = fs.readFileSync(SCRIPT_PATH, 'utf8');
const lines = source.split('\n');

// Parse with acorn
const ast = acorn.parse(source, {
    ecmaVersion: 'latest',
    sourceType: 'module',
    locations: true,
});

// Functions to extract into settings-manager.js
const EXTRACT_EXPORTED = [
    // Core settings persistence
    'getSettings',
    'saveSettings',
    'setGenerationParamsFromPreset',
    'changeMainAPI',
    'setUserName',
    // Connection/status helpers
    'setOnlineStatus',
    'displayOnlineStatus',
    'cancelStatusCheck',
    'startStatusLoading',
    'stopStatusLoading',
    'resultCheckStatus',
    'pingServer',
    // UI state setters
    'setMenuType',
    'setSendButtonState',
    'setAnimationDuration',
    'setActiveCharacter',
    'setActiveGroup',
    'getSlideToggleOptions',
    // Extension prompt helpers
    'setExtensionPrompt',
    'getExtensionPromptRoleByName',
    'removeDepthPrompts',
    // Misc
    'activateSendButtons',
    'deactivateSendButtons',
    'setGenerationProgress',
    'selectRightMenuWithAnimation',
    'getCurrentChatDetails',
    'setExternalAbortController',
];

const EXTRACT_PRIVATE = [
    // Co-extracted helpers called by extracted functions
    'doOnboarding',
    'reloadLoop',
    'showStopButton',
    'hideStopButton',
];

const ALL_TARGETS = new Set([...EXTRACT_EXPORTED, ...EXTRACT_PRIVATE]);

// Find function declarations and their exact boundaries
const results = [];

for (const node of ast.body) {
    let name = null;
    let isExported = false;

    if (node.type === 'FunctionDeclaration' && node.id) {
        name = node.id.name;
    } else if (node.type === 'ExportNamedDeclaration' && node.declaration) {
        if (node.declaration.type === 'FunctionDeclaration' && node.declaration.id) {
            name = node.declaration.id.name;
            isExported = true;
        }
    }

    if (name && ALL_TARGETS.has(name)) {
        const startLine = node.loc.start.line;
        const endLine = node.loc.end.line;

        // Check for JSDoc comment before the function
        let docStartLine = startLine;
        // Manual check: look backwards from startLine for /** ... */
        for (let i = startLine - 2; i >= Math.max(0, startLine - 30); i--) {
            const trimmed = lines[i].trim();
            if (trimmed === '') continue;
            if (trimmed.startsWith('/**') || trimmed.startsWith('*') || trimmed.startsWith('*/')) {
                if (trimmed.startsWith('/**')) {
                    docStartLine = i + 1; // 1-indexed
                    break;
                }
                continue;
            }
            break;
        }

        results.push({
            name,
            isExported,
            startLine: docStartLine,
            endLine,
            bodyStartLine: startLine,
        });
    }
}

// Sort by startLine
results.sort((a, b) => a.startLine - b.startLine);

// Report what we found vs what we expected
const foundNames = new Set(results.map(r => r.name));
const missing = [...ALL_TARGETS].filter(n => !foundNames.has(n));
if (missing.length > 0) {
    console.error('WARNING: Could not find these functions:', missing);
}

console.log(`Found ${results.length}/${ALL_TARGETS.size} target functions`);
for (const r of results) {
    console.log(`  ${r.isExported ? 'export ' : '       '}${r.name}: lines ${r.startLine}-${r.endLine}`);
}

// Write results
fs.writeFileSync(OUTPUT_PATH, JSON.stringify({
    exported: EXTRACT_EXPORTED,
    private: EXTRACT_PRIVATE,
    functions: results,
}, null, 2));

console.log(`\nWrote ${OUTPUT_PATH}`);
