#!/usr/bin/env node
/**
 * Phase 1: Build core/chat-engine.js from AST-verified extraction results.
 * Also updates script.js: removes extracted code, adds imports/re-exports/bindings.
 */

const fs = require('fs');
const path = require('path');

const ROOT = '/sessions/admiring-relaxed-goldberg/mnt/SillyTavern';
const SCRIPT = path.join(ROOT, 'public/script.js');
const CHAT_ENGINE = path.join(ROOT, 'public/scripts/core/chat-engine.js');

// Load extraction results
const { results, exported, helpers, privateVars } = JSON.parse(
    fs.readFileSync('/sessions/admiring-relaxed-goldberg/extract_results.json', 'utf8')
);

const code = fs.readFileSync(SCRIPT, 'utf8');
const lines = code.split('\n');

// ============================================================
// Step 1: Extract function bodies using accurate line ranges
// ============================================================

const extractedBodies = [];
for (const r of results) {
    // Lines are 1-indexed in the results
    const body = lines.slice(r.startLine - 1, r.endLine).join('\n');
    extractedBodies.push({ ...r, body });
}

// ============================================================
// Step 2: Analyze dependencies to build import lists
// ============================================================

// State symbols (from core/state.js)
const STATE_SYMBOLS = new Set([
    "converter", "systemUserName", "neutralCharacterName", "name1", "name2",
    "chat", "swipeState", "isChatSaving", "settingsReady", "displayVersion",
    "characters", "this_chid", "default_avatar", "system_avatar", "chatElement",
    "chat_metadata", "streamingProcessor", "extension_prompt_types",
    "extension_prompt_roles", "MAX_INJECTION_DEPTH", "menu_type",
    "selected_button", "animation_duration", "is_send_press",
    "settings", "amount_gen", "max_context", "swipesHidden", "recentSwipes",
    "extension_prompts", "main_api", "token", "active_character", "active_group",
    "DEFAULT_SAVE_EDIT_TIMEOUT", "DEFAULT_PRINT_TIMEOUT",
    "comment_avatar", "default_user_avatar", "default_user_name",
    "talkativeness_default", "depth_prompt_depth_default", "depth_prompt_role_default",
    "create_save", "animation_easing", "online_status",
    "abortStatusCheck", "charDragDropHandler", "chatDragDropHandler",
    "CLIENT_VERSION", "lastSwipeInfo",
]);

const SETTER_PATTERN = /^_set_(\w+)$/;
const ALL_SETTERS = new Set([
    "_set_name2", "_set_swipeState", "_set_isChatSaving", "_set_chat_metadata",
    "_set_selected_button", "_set_is_send_press", "_set_swipesHidden",
    "_set_lastSwipeInfo", "_set_recentSwipes", "_set_extension_prompts",
    "_set_chat", "_set_streamingProcessor", "_set_this_chid", "_set_menu_type",
    "_set_characters", "_set_name1", "_set_active_character", "_set_active_group",
    "_set_online_status", "_set_settings", "_set_amount_gen", "_set_max_context",
    "_set_converter", "_set_settingsReady", "_set_displayVersion",
    "_set_CLIENT_VERSION", "_set_abortStatusCheck",
    "_set_charDragDropHandler", "_set_chatDragDropHandler",
    "_set_create_save", "_set_animation_duration", "_set_animation_easing",
    "_set_token", "_set_main_api",
]);

const DEBOUNCED_SYMBOLS = new Set([
    "saveSettingsDebounced", "saveCharacterDebounced",
    "printCharactersDebounced", "entitiesFilter",
]);

// Combine all extracted function/var bodies to scan for references
const allBodies = extractedBodies.map(e => e.body).join('\n');

// Find which state symbols are used
const neededState = new Set();
const neededSetters = new Set();
const neededDebounced = new Set();

for (const sym of STATE_SYMBOLS) {
    if (new RegExp(`\\b${sym}\\b`).test(allBodies)) {
        neededState.add(sym);
    }
}
for (const sym of ALL_SETTERS) {
    if (new RegExp(`\\b${sym.replace('$', '\\$')}\\b`).test(allBodies)) {
        neededSetters.add(sym);
    }
}
for (const sym of DEBOUNCED_SYMBOLS) {
    if (new RegExp(`\\b${sym}\\b`).test(allBodies)) {
        neededDebounced.add(sym);
    }
}

console.log(`State imports needed: ${neededState.size}`);
console.log(`Setter imports needed: ${neededSetters.size}`);
console.log(`Debounced imports needed: ${neededDebounced.size}`);

// ============================================================
// Step 3: Determine late-bind dependencies
// ============================================================

// These are functions that remain in script.js but are called by extracted code
const LATE_BIND_DEPS = [
    // Original 13 from analysis
    "Generate", "createOrEditCharacter", "getCharacterCardFields",
    "getCharacters", "getGeneratingApi", "getGeneratingModel",
    "newAssistantChat", "printCharacters", "setActiveCharacter",
    "setActiveGroup", "setCharacterId", "setCharacterName", "unshallowCharacter",
    // 9 new from helper analysis
    "activateSendButtons", "flushWIInjections", "getFirstMessage",
    "saveImageToMessage", "selectRightMenuWithAnimation", "select_selected_character",
    "setExtensionPrompt", "setGenerationProgress", "setMenuType",
];

// Filter to only those actually referenced
const activeLateBinds = LATE_BIND_DEPS.filter(dep =>
    new RegExp(`\\b${dep}\\b`).test(allBodies)
);
console.log(`Late-bind deps (active): ${activeLateBinds.length} of ${LATE_BIND_DEPS.length}`);

// ============================================================
// Step 4: Determine external module imports
// ============================================================

// Read the import section of script.js to build a map of what's imported from where
const importMap = new Map(); // symbol -> { source, isDefault }
const importLines = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^import\s/.test(line)) {
        importLines.push(i);
    }
    // Stop at first non-import, non-comment, non-empty line
    if (i > 10 && !/^import\s|^\s*$|^\/\/|^\/\*|\*/.test(line) && !line.startsWith(' * ') && !line.startsWith('} from')) {
        // Check if we're in a multi-line import
        if (i > 0 && !lines[i-1].includes('from ')) continue;
        break;
    }
}

// Parse imports more carefully - handle multi-line imports
const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/gs;
const defaultImportRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
const importAsRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/gs;

let match;
while ((match = importRegex.exec(code)) !== null) {
    const symbols = match[1].split(',').map(s => {
        s = s.trim();
        // Handle "foo as bar"
        const asMatch = s.match(/(\w+)\s+as\s+(\w+)/);
        if (asMatch) return { original: asMatch[1], local: asMatch[2], source: match[2] };
        return { original: s, local: s, source: match[2] };
    }).filter(s => s.local);

    for (const sym of symbols) {
        importMap.set(sym.local, { source: sym.source, original: sym.original, local: sym.local });
    }
}

// Group needed external imports by source module
const externalImports = new Map(); // source -> [{original, local}]
const stateSource = './scripts/core/state.js';
const debouncedSource = './scripts/core/debounced.js';

for (const [local, info] of importMap) {
    // Skip state/debounced/core imports (handled separately)
    if (info.source.includes('core/state') || info.source.includes('core/debounced')) continue;

    // Check if this symbol is used in extracted code
    if (new RegExp(`\\b${local}\\b`).test(allBodies)) {
        // Convert source path relative to core/ directory
        let relSource = info.source;
        if (relSource.startsWith('./scripts/')) {
            relSource = '../' + relSource.substring('./scripts/'.length);
        } else if (relSource.startsWith('./')) {
            relSource = '../../' + relSource.substring('./'.length);
        }

        if (!externalImports.has(relSource)) {
            externalImports.set(relSource, []);
        }
        externalImports.get(relSource).push({
            original: info.original,
            local: info.local,
        });
    }
}

console.log(`External module imports: ${externalImports.size} modules`);

// ============================================================
// Step 5: Generate chat-engine.js
// ============================================================

let output = `/**
 * Chat engine — message rendering, CRUD, swipe handling, chat save/load.
 * Extracted from script.js to break the 101-file SCC.
 * @module core/chat-engine
 */

`;

// State imports
output += `// State imports (cycle-free)\nimport {\n`;
const stateImportList = [...neededState].sort();
const setterImportList = [...neededSetters].sort();
output += stateImportList.map(s => `    ${s},`).join('\n') + '\n';
output += setterImportList.map(s => `    ${s},`).join('\n') + '\n';
output += `} from './state.js';\n\n`;

// Debounced imports
if (neededDebounced.size > 0) {
    output += `import { ${[...neededDebounced].sort().join(', ')} } from './debounced.js';\n\n`;
}

// External module imports (sorted by source)
output += `// External module imports\n`;
const sortedSources = [...externalImports.keys()].sort();
for (const source of sortedSources) {
    const symbols = externalImports.get(source).sort((a, b) => a.local.localeCompare(b.local));
    if (symbols.length <= 3) {
        const importStr = symbols.map(s =>
            s.original !== s.local ? `${s.original} as ${s.local}` : s.local
        ).join(', ');
        output += `import { ${importStr} } from '${source}';\n`;
    } else {
        output += `import {\n`;
        for (const s of symbols) {
            const str = s.original !== s.local ? `${s.original} as ${s.local}` : s.local;
            output += `    ${str},\n`;
        }
        output += `} from '${source}';\n`;
    }
}

// Late-bind section
output += `\n// ============================================================\n`;
output += `// Late-bound references to script.js functions\n`;
output += `// (set by script.js during init to break circular deps)\n`;
output += `// ============================================================\n\n`;

for (const dep of activeLateBinds.sort()) {
    output += `let _${dep};\n`;
    output += `/** @param {Function} fn */\n`;
    output += `export function bind_${dep}(fn) { _${dep} = fn; }\n`;
}

// Private variables
output += `\n// Private variables (migrated from script.js)\n`;
const privVarBodies = extractedBodies.filter(e => e.isPrivateVar);
for (const pv of privVarBodies) {
    output += pv.body + '\n';
}

// Exported functions
output += `\n// ============================================================\n`;
output += `// Exported functions\n`;
output += `// ============================================================\n\n`;

const exportedBodies = extractedBodies.filter(e => e.exported && !e.isPrivateVar);
for (const func of exportedBodies) {
    output += func.body + '\n\n';
}

// Non-exported helper functions
output += `// ============================================================\n`;
output += `// Non-exported helper functions (co-extracted from script.js)\n`;
output += `// ============================================================\n\n`;

const helperBodies = extractedBodies.filter(e => !e.exported && !e.isPrivateVar);
for (const func of helperBodies) {
    output += func.body + '\n\n';
}

// Replace late-bind dep calls with underscore-prefixed versions
// Be careful not to replace in bind function definitions or let declarations
for (const dep of activeLateBinds) {
    // Replace dep( with _dep( but NOT bind_dep or let _dep or function bind_dep
    // Use negative lookbehind for _ and bind_
    const pattern = new RegExp(`(?<!\\w)(?<!bind_)(?<!_)${dep}(?=\\s*\\()`, 'g');
    // But we need to be more careful. Only replace in function bodies, not in import/bind sections
    // Simple approach: only replace after the "Exported functions" header
    const headerIdx = output.indexOf('// Exported functions');
    if (headerIdx > -1) {
        const before = output.substring(0, headerIdx);
        let after = output.substring(headerIdx);
        // Replace in function bodies
        for (const dep2 of activeLateBinds) {
            // Match the function name followed by ( but not preceded by bind_ or .
            after = after.replace(new RegExp(`(?<![\\w.])${dep2}\\(`, 'g'), `_${dep2}(`);
        }
        output = before + after;
    }
}

fs.writeFileSync(CHAT_ENGINE, output);
console.log(`\nWrote ${CHAT_ENGINE} (${output.split('\n').length} lines)`);

// ============================================================
// Step 6: Update script.js — remove extracted code
// ============================================================

// Build set of lines to remove (1-indexed -> 0-indexed)
const linesToRemove = new Set();
for (const r of results) {
    for (let i = r.startLine - 1; i < r.endLine; i++) {
        linesToRemove.add(i);
    }
}

console.log(`Lines to remove from script.js: ${linesToRemove.size}`);

// Build new script.js
const newLines = [];
for (let i = 0; i < lines.length; i++) {
    if (!linesToRemove.has(i)) {
        newLines.push(lines[i]);
    }
}

// ============================================================
// Step 7: Add imports from chat-engine.js
// ============================================================

// Find insertion point for new import (after existing core imports)
let importInsertIdx = -1;
for (let i = 0; i < newLines.length; i++) {
    if (newLines[i].includes("from './scripts/core/")) {
        importInsertIdx = i + 1;
    }
}
// Fallback: after last import line
if (importInsertIdx === -1) {
    for (let i = 0; i < newLines.length; i++) {
        if (/^import\s/.test(newLines[i]) || /^} from\s/.test(newLines[i])) {
            importInsertIdx = i + 1;
        }
    }
}

const chatEngineImports = exported.sort();
const bindImports = activeLateBinds.sort().map(d => `bind_${d}`);

let importBlock = `\n// Chat engine imports\nimport {\n`;
importBlock += chatEngineImports.map(f => `    ${f},`).join('\n') + '\n';
importBlock += bindImports.map(f => `    ${f},`).join('\n') + '\n';
importBlock += `} from './scripts/core/chat-engine.js';\n`;

const importBlockLines = importBlock.split('\n');
newLines.splice(importInsertIdx, 0, ...importBlockLines);

// ============================================================
// Step 8: Add re-exports from chat-engine.js
// ============================================================

// Find existing re-export block for core/state.js to insert after
let reexportInsertIdx = -1;
for (let i = 0; i < newLines.length; i++) {
    if (newLines[i].includes('// Re-exports from core/')) {
        // Find end of this export block
        for (let j = i + 1; j < newLines.length; j++) {
            if (newLines[j].startsWith('};')) {
                reexportInsertIdx = j + 1;
            }
            if (newLines[j] === '' && reexportInsertIdx > -1) break;
        }
    }
}

let reexportBlock = `\n// Re-exports from core/chat-engine.js\nexport {\n`;
reexportBlock += chatEngineImports.map(f => `    ${f},`).join('\n') + '\n';
reexportBlock += `};\n`;

if (reexportInsertIdx > -1) {
    newLines.splice(reexportInsertIdx, 0, ...reexportBlock.split('\n'));
} else {
    // Append at end of file
    newLines.push(...reexportBlock.split('\n'));
}

// ============================================================
// Step 9: Add bind calls in firstLoadInit()
// ============================================================

// Find "bindPrintCharacters(printCharacters);" and insert after it
let bindInsertIdx = -1;
for (let i = 0; i < newLines.length; i++) {
    if (newLines[i].includes('bindPrintCharacters(printCharacters)')) {
        bindInsertIdx = i + 1;
        break;
    }
}
if (bindInsertIdx === -1) {
    // Fallback: find bindSaveSettings
    for (let i = 0; i < newLines.length; i++) {
        if (newLines[i].includes('bindSaveSettings(saveSettings)')) {
            bindInsertIdx = i + 1;
            break;
        }
    }
}

if (bindInsertIdx > -1) {
    const bindCalls = [
        '',
        '    // Chat engine late-bind wiring',
        ...activeLateBinds.sort().map(dep => `    bind_${dep}(${dep});`),
    ];
    newLines.splice(bindInsertIdx, 0, ...bindCalls);
    console.log(`Added ${activeLateBinds.length} bind calls at line ${bindInsertIdx}`);
} else {
    console.log('WARNING: Could not find bind insertion point!');
}

// Write updated script.js
const newCode = newLines.join('\n');
fs.writeFileSync(SCRIPT, newCode);
console.log(`\nUpdated script.js: ${lines.length} -> ${newLines.length} lines (removed ${lines.length - newLines.length} net)`);

// ============================================================
// Step 10: Verify with acorn
// ============================================================

const acorn = require('/sessions/admiring-relaxed-goldberg/mnt/SillyTavern/node_modules/acorn');

try {
    acorn.parse(fs.readFileSync(CHAT_ENGINE, 'utf8'), { ecmaVersion: 2022, sourceType: 'module' });
    console.log('\nchat-engine.js: PARSE OK ✓');
} catch (e) {
    console.log(`\nchat-engine.js: PARSE ERROR at line ${e.loc?.line}: ${e.message}`);
}

try {
    acorn.parse(newCode, { ecmaVersion: 2022, sourceType: 'module' });
    console.log('script.js: PARSE OK ✓');
} catch (e) {
    console.log(`script.js: PARSE ERROR at line ${e.loc?.line}: ${e.message}`);
}
