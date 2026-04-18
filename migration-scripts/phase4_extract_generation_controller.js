#!/usr/bin/env node
/**
 * Phase 4: Extract generation-controller functions from script.js
 * Uses acorn AST parser for accurate function/class boundary detection.
 */

const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const SCRIPT_PATH = path.join(__dirname, 'mnt/SillyTavern/public/script.js');
const OUTPUT_PATH = path.join(__dirname, 'generation_controller_extract.json');

const source = fs.readFileSync(SCRIPT_PATH, 'utf8');
const lines = source.split('\n');

// Parse with acorn
const ast = acorn.parse(source, {
    ecmaVersion: 'latest',
    sourceType: 'module',
    locations: true,
});

// Functions/classes to extract into generation-controller.js
const EXTRACT_EXPORTED = [
    // Streaming
    'isStreamingEnabled',
    'StreamingProcessor',  // class
    // Prompt building
    'createRawPrompt',
    'generateRaw',
    // Core generation
    'Generate',
    'stopGeneration',
    // Auto-continue
    'shouldAutoContinue',
    'triggerAutoContinue',
    // Context helpers
    'removeMacros',
    'getMaxContextSize',
    // Network
    'sendGenerationRequest',
    'sendStreamingRequest',
    'getGenerateUrl',
    // API identification
    'getGeneratingApi',
    'getGeneratingModel',
    // Abort controller
    'setExternalAbortController',
    // isGenerating (const arrow - handled separately)
];

const EXTRACT_PRIVATE = [
    // Helper for Generate
    'removeLastMessage',
    // Injection helpers
    'doChatInject',
    'flushWIInjections',
    // Formatting helpers
    'formatMessageHistoryItem',
    // Token/context helpers
    'parseTokenCounts',
    'addChatsPreamble',
    'addChatsSeparator',
    'setInContextMessages',
    // Response parsing
    'extractTitleFromData',
    'extractImagesFromData',
    'parseAndSaveLogprobs',
    'extractMultiSwipes',
    'saveImageToMessage',
];

const ALL_TARGETS = new Set([...EXTRACT_EXPORTED, ...EXTRACT_PRIVATE]);

// Find function/class declarations and their exact boundaries
const results = [];

for (const node of ast.body) {
    let name = null;
    let isExported = false;
    let nodeType = 'function';

    if (node.type === 'FunctionDeclaration' && node.id) {
        name = node.id.name;
    } else if (node.type === 'ClassDeclaration' && node.id) {
        name = node.id.name;
        nodeType = 'class';
    } else if (node.type === 'ExportNamedDeclaration' && node.declaration) {
        if (node.declaration.type === 'FunctionDeclaration' && node.declaration.id) {
            name = node.declaration.id.name;
            isExported = true;
        } else if (node.declaration.type === 'ClassDeclaration' && node.declaration.id) {
            name = node.declaration.id.name;
            isExported = true;
            nodeType = 'class';
        } else if (node.declaration.type === 'VariableDeclaration') {
            // Handle: export const isGenerating = () => ...
            for (const decl of node.declaration.declarations) {
                if (decl.id && decl.id.name && ALL_TARGETS.has(decl.id.name)) {
                    name = decl.id.name;
                    isExported = true;
                    nodeType = 'const';
                }
            }
        }
    }

    if (name && ALL_TARGETS.has(name)) {
        const startLine = node.loc.start.line;
        const endLine = node.loc.end.line;

        // Check for JSDoc comment before the function
        let docStartLine = startLine;
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
            nodeType,
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
    console.error('WARNING: Could not find these:', missing);
}

console.log(`Found ${results.length}/${ALL_TARGETS.size} target items`);
let totalLines = 0;
for (const r of results) {
    const lines = r.endLine - r.startLine + 1;
    totalLines += lines;
    console.log(`  ${r.isExported ? 'export ' : '       '}${r.nodeType.padEnd(8)} ${r.name}: lines ${r.startLine}-${r.endLine} (${lines} lines)`);
}
console.log(`Total extracted lines: ${totalLines}`);

// Write results
fs.writeFileSync(OUTPUT_PATH, JSON.stringify({
    exported: EXTRACT_EXPORTED,
    private: EXTRACT_PRIVATE,
    functions: results,
}, null, 2));

console.log(`\nWrote ${OUTPUT_PATH}`);
