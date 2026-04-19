#!/usr/bin/env node
/**
 * Backend Phase 3: Extract provider-specific prompt converters from prompt-converters.js
 * into src/prompt-converters/ directory.
 */

const fs = require('fs');
const path = require('path');

const SOURCE_PATH = '/sessions/admiring-relaxed-goldberg/mnt/SillyTavern/src/prompt-converters.js';
const OUTPUT_DIR = '/sessions/admiring-relaxed-goldberg/mnt/SillyTavern/src/prompt-converters';

const source = fs.readFileSync(SOURCE_PATH, 'utf8');
const lines = source.split('\n');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ============================================================
// Claude converter module
// ============================================================
const claudeFns = [
    { name: 'convertClaudePrompt', start: 107, end: 187 },  // includes JSDoc
    { name: 'convertClaudeMessages', start: 189, end: 377 }, // includes JSDoc
    { name: 'cachingAtDepthForClaude', start: 979, end: 1011 },
    { name: 'cachingAtDepthForOpenRouterClaude', start: 1013, end: 1059 },
    { name: 'cachingSystemPromptForOpenRouter', start: 1061, end: 1108 },
    { name: 'calculateClaudeBudgetTokens', start: 1110, end: 1147 },
];

function extractModule(filename, fns, imports, localConstants = []) {
    const parts = [];
    parts.push(`/**`);
    parts.push(` * Prompt converter: ${filename.replace('.js', '')} — extracted from prompt-converters.js`);
    parts.push(` */`);
    parts.push('');

    for (const imp of imports) {
        parts.push(imp);
    }
    parts.push('');

    for (const c of localConstants) {
        parts.push(c);
    }
    if (localConstants.length) parts.push('');

    for (const fn of fns) {
        // Grab from start (including JSDoc) to end
        let startIdx = fn.start - 1;
        // Look for JSDoc or blank lines above
        for (let i = startIdx - 1; i >= Math.max(0, startIdx - 30); i--) {
            const trimmed = lines[i].trim();
            if (trimmed.startsWith('*') || trimmed.startsWith('/**') || trimmed === '*/') {
                startIdx = i;
            } else if (trimmed === '') {
                // Skip blank lines between JSDoc and function
            } else {
                break;
            }
        }
        const code = lines.slice(startIdx, fn.end);
        // Ensure export keyword
        const transformed = code.map(line => {
            if (line.match(/^function /)) return 'export ' + line;
            if (line.match(/^export function /)) return line;
            return line;
        });
        parts.push(...transformed);
        parts.push('');
    }

    const output = parts.join('\n');
    const outputPath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(outputPath, output);
    console.log(`  ${filename}: ${output.split('\n').length} lines`);
}

// Claude module
extractModule('claude.js', claudeFns, [
    "import { getConfigValue } from '../util.js';",
    "import { PROMPT_PLACEHOLDER, REASONING_EFFORT } from '../prompt-converters.js';",
], []);

// Google module
const googleFns = [
    { name: 'convertGooglePrompt', start: 425, end: 620 },
    { name: 'calculateGoogleBudgetTokens', start: 1149, end: 1298 },
];
extractModule('google.js', googleFns, [
    "import { getConfigValue } from '../util.js';",
    "import { REASONING_EFFORT, GEMINI_MEDIA_RESOLUTION, enableThoughtSignatures } from '../prompt-converters.js';",
], []);

// Other providers module
const otherFns = [
    { name: 'convertCohereMessages', start: 379, end: 423 },
    { name: 'convertAI21Messages', start: 622, end: 692 },
    { name: 'convertMistralMessages', start: 694, end: 774 },
    { name: 'convertXAIMessages', start: 776, end: 811 },
];
extractModule('others.js', otherFns, [
    "import { PROMPT_PLACEHOLDER } from '../prompt-converters.js';",
], []);

// ============================================================
// Now modify prompt-converters.js to re-export from sub-modules
// ============================================================

let modified = lines.slice();

// Remove extracted functions (from bottom up)
const allExtracted = [...claudeFns, ...googleFns, ...otherFns].sort((a, b) => b.start - a.start);

for (const fn of allExtracted) {
    // Find JSDoc above
    let removeStart = fn.start - 1;
    for (let i = removeStart - 1; i >= Math.max(0, removeStart - 30); i--) {
        const trimmed = modified[i].trim();
        if (trimmed.startsWith('*') || trimmed.startsWith('/**') || trimmed === '*/') {
            removeStart = i;
        } else if (trimmed === '') {
            removeStart = i;
        } else {
            break;
        }
    }
    const count = fn.end - removeStart;
    console.log(`  Removing ${fn.name}: ${count} lines`);
    modified.splice(removeStart, count);
}

// Add re-exports from sub-modules at the end
modified.push('');
modified.push('// Re-exports from provider-specific converter modules');
modified.push("export { convertClaudePrompt, convertClaudeMessages, cachingAtDepthForClaude, cachingAtDepthForOpenRouterClaude, cachingSystemPromptForOpenRouter, calculateClaudeBudgetTokens } from './prompt-converters/claude.js';");
modified.push("export { convertGooglePrompt, calculateGoogleBudgetTokens } from './prompt-converters/google.js';");
modified.push("export { convertCohereMessages, convertAI21Messages, convertMistralMessages, convertXAIMessages } from './prompt-converters/others.js';");
modified.push('');

// Also export the constants that sub-modules need to import
// PROMPT_PLACEHOLDER, REASONING_EFFORT, GEMINI_MEDIA_RESOLUTION, enableThoughtSignatures
// need to be exported (they're currently module-level const without export)

let src = modified.join('\n');

// Export PROMPT_PLACEHOLDER
src = src.replace(
    "const PROMPT_PLACEHOLDER = getConfigValue('promptPlaceholder', 'Let\\'s get started.');",
    "export const PROMPT_PLACEHOLDER = getConfigValue('promptPlaceholder', 'Let\\'s get started.');"
);

// Export REASONING_EFFORT
src = src.replace(
    'const REASONING_EFFORT = {',
    'export const REASONING_EFFORT = {'
);

// Export GEMINI_MEDIA_RESOLUTION
src = src.replace(
    'const GEMINI_MEDIA_RESOLUTION = {',
    'export const GEMINI_MEDIA_RESOLUTION = {'
);

// Export enableThoughtSignatures
src = src.replace(
    'const enableThoughtSignatures = ',
    'export const enableThoughtSignatures = '
);

modified = src.split('\n');

fs.writeFileSync(SOURCE_PATH, modified.join('\n'));
console.log(`\nWrote prompt-converters.js: ${modified.length} lines`);
