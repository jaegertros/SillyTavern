#!/usr/bin/env node
/**
 * Phase 1 extraction using acorn AST for accurate function boundaries.
 * Extracts chat engine functions from script.js into core/chat-engine.js.
 *
 * Outputs: extract_results.json with exact line ranges for each function.
 */

const acorn = require('/sessions/admiring-relaxed-goldberg/mnt/SillyTavern/node_modules/acorn');
const fs = require('fs');
const path = require('path');

const ROOT = '/sessions/admiring-relaxed-goldberg/mnt/SillyTavern';
const SCRIPT = path.join(ROOT, 'public/script.js');

const code = fs.readFileSync(SCRIPT, 'utf8');
const lines = code.split('\n');

// Parse with acorn
const ast = acorn.parse(code, {
    ecmaVersion: 2022,
    sourceType: 'module',
    locations: true,
    ranges: true,
});

// Functions to extract (76 exported + 14 non-exported helpers)
const EXPORTED_FUNCS = new Set([
    // chat_state
    "getCurrentChatId", "printMessages", "scrollOnMediaLoad",
    "cancelDebouncedChatSave", "clearChat", "reloadCurrentChat",
    "reloadCurrentChatUnsafe", "saveChatDebounced", "saveChat",
    "getChatsFromFiles", "displayPastChats", "saveChatConditional",
    "importCharacterChat", "closeCurrentChat",
    // message_ops
    "showMoreMessages", "deleteLastMessage", "deleteMessage",
    "sendTextareaMessage", "updateMessageBlock", "ensureMessageMediaIsArray",
    "appendMediaToMessage", "addOneMessage", "updateMessageElement",
    "substituteParamsExtended", "substituteParamsLegacy", "substituteParams",
    "extractMessageBias", "baseChatReplace", "getNextMessageId",
    "getBiasStrings", "sendMessageAsUser", "extractMessageFromData",
    "extractJsonFromData", "cleanUpMessage", "saveReply",
    "setEditedMessageId", "messageEdit", "isMessageSwipeable",
    "deleteSwipe", "updateViewMessageIds", "getFirstDisplayedMessageId",
    "closeMessageEditor",
    // swipe
    "ensureSwipes", "syncMesToSwipe", "syncSwipeToMes",
    "updateSwipeCounter", "isSwipingAllowed", "getOverswipeBehavior",
    "refreshSwipeButtons", "showSwipeButtons", "hideSwipeButtons",
    "swipe", "swipe_left", "swipe_right",
    // misc chat-related
    "replaceCurrentChat", "redisplayChat", "scrollChatToBottom",
    "resetChatState", "getChat", "updateChatMetadata", "saveMetadata",
    "updateEditArrowClasses", "doNewChat", "renameChat", "updateRemoteChatName",
    "renameGroupOrCharacterChat",
    // Also include reloadChatMutex and extras
    "reloadChatMutex",
    // Co-extracted utility functions
    "getStoppingStrings", "generateQuietPrompt", "processCommands",
    "getExtensionPromptByName", "getExtensionPromptMaxDepth", "getExtensionPrompt",
    "parseMesExamples", "getMediaDisplay", "getMediaIndex", "addCopyToCodeBlocks",
]);

const NON_EXPORTED_HELPERS = new Set([
    "addPersonaDescriptionExtensionPrompt", "cleanGroupMessage", "delChat",
    "displayChats", "formatGenerationTimer", "formatSwipeCounter",
    "getAllExtensionPrompts", "getChatResult", "getMessageTextHTML",
    "insertSVGIcon", "processImageAttachment", "select_rm_characters",
    "unblockGeneration", "updateMessageItemizedPromptButton",
]);

const ALL_TARGET_FUNCS = new Set([...EXPORTED_FUNCS, ...NON_EXPORTED_HELPERS]);

// Private variables that should be co-extracted
const PRIVATE_VARS = new Set([
    "messageTemplate", "chatSaveTimeout", "this_edit_mes_id",
    "this_edit_mes_chname", "is_delete_mode", "generation_started", "swipes",
]);

// Walk the AST to find:
// 1. Exported function declarations
// 2. Non-exported function declarations
// 3. Variable declarations for private vars and exported consts (like reloadChatMutex)
const results = [];

for (const node of ast.body) {
    // ExportNamedDeclaration with FunctionDeclaration
    if (node.type === 'ExportNamedDeclaration' && node.declaration) {
        const decl = node.declaration;
        if (decl.type === 'FunctionDeclaration' && EXPORTED_FUNCS.has(decl.id.name)) {
            // Find JSDoc comment before this node
            const startLine = findJSDocStart(node.start, code);
            results.push({
                name: decl.id.name,
                exported: true,
                startLine: startLine,
                endLine: node.loc.end.line,
                startOffset: startLine === node.loc.start.line ? node.start : offsetOfLine(startLine),
                endOffset: node.end,
            });
        }
        // VariableDeclaration (e.g., export const reloadChatMutex = ...)
        if (decl.type === 'VariableDeclaration') {
            for (const vd of decl.declarations) {
                if (vd.id.type === 'Identifier' && EXPORTED_FUNCS.has(vd.id.name)) {
                    const startLine = findJSDocStart(node.start, code);
                    results.push({
                        name: vd.id.name,
                        exported: true,
                        startLine: startLine,
                        endLine: node.loc.end.line,
                        startOffset: startLine === node.loc.start.line ? node.start : offsetOfLine(startLine),
                        endOffset: node.end,
                    });
                }
            }
        }
    }

    // Non-exported function declarations
    if (node.type === 'FunctionDeclaration' && NON_EXPORTED_HELPERS.has(node.id.name)) {
        const startLine = findJSDocStart(node.start, code);
        results.push({
            name: node.id.name,
            exported: false,
            startLine: startLine,
            endLine: node.loc.end.line,
            startOffset: startLine === node.loc.start.line ? node.start : offsetOfLine(startLine),
            endOffset: node.end,
        });
    }

    // Variable declarations for private vars
    if (node.type === 'VariableDeclaration') {
        for (const vd of node.declarations) {
            if (vd.id.type === 'Identifier' && PRIVATE_VARS.has(vd.id.name)) {
                results.push({
                    name: vd.id.name,
                    exported: false,
                    isPrivateVar: true,
                    startLine: node.loc.start.line,
                    endLine: node.loc.end.line,
                    startOffset: node.start,
                    endOffset: node.end,
                });
            }
        }
    }
}

function findJSDocStart(nodeStart, code) {
    // Look backwards from nodeStart for a JSDoc comment (/** ... */)
    const before = code.substring(Math.max(0, nodeStart - 3000), nodeStart);
    const lastJSDoc = before.lastIndexOf('/**');
    if (lastJSDoc === -1) return lineOfOffset(nodeStart);

    // Make sure there's only whitespace between the JSDoc end and the node
    const jsDocEnd = before.indexOf('*/', lastJSDoc);
    if (jsDocEnd === -1) return lineOfOffset(nodeStart);

    const between = before.substring(jsDocEnd + 2);
    if (between.trim() === '') {
        return lineOfOffset(nodeStart - before.length + lastJSDoc);
    }
    return lineOfOffset(nodeStart);
}

function lineOfOffset(offset) {
    let line = 1;
    for (let i = 0; i < offset && i < code.length; i++) {
        if (code[i] === '\n') line++;
    }
    return line;
}

function offsetOfLine(lineNum) {
    let line = 1;
    for (let i = 0; i < code.length; i++) {
        if (line === lineNum) return i;
        if (code[i] === '\n') line++;
    }
    return 0;
}

// Sort by start line
results.sort((a, b) => a.startLine - b.startLine);

// Report
console.log(`Found ${results.length} items to extract:`);
const exported = results.filter(r => r.exported && !r.isPrivateVar);
const helpers = results.filter(r => !r.exported && !r.isPrivateVar);
const privVars = results.filter(r => r.isPrivateVar);
console.log(`  Exported functions: ${exported.length}`);
console.log(`  Non-exported helpers: ${helpers.length}`);
console.log(`  Private variables: ${privVars.length}`);

// Check for missing functions
const found = new Set(results.map(r => r.name));
for (const f of ALL_TARGET_FUNCS) {
    if (!found.has(f)) console.log(`  WARNING: ${f} not found!`);
}
for (const v of PRIVATE_VARS) {
    if (!found.has(v)) console.log(`  WARNING private var: ${v} not found!`);
}

// Write results
fs.writeFileSync('/sessions/admiring-relaxed-goldberg/extract_results.json', JSON.stringify({
    results,
    exported: exported.map(r => r.name),
    helpers: helpers.map(r => r.name),
    privateVars: privVars.map(r => r.name),
}, null, 2));

console.log('\nWrote extract_results.json');

// Also output the line ranges for verification
for (const r of results) {
    const tag = r.isPrivateVar ? 'VAR' : (r.exported ? 'EXP' : 'HLP');
    console.log(`  ${tag} ${r.name.padEnd(45)} L${r.startLine}-${r.endLine} (${r.endLine - r.startLine + 1} lines)`);
}
