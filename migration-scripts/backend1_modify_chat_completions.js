#!/usr/bin/env node
/**
 * Backend Phase 1: Modify chat-completions.js to remove extracted provider functions
 * and add imports from the new provider modules.
 */

const fs = require('fs');
const path = require('path');

const SOURCE_PATH = '/sessions/admiring-relaxed-goldberg/mnt/SillyTavern/src/endpoints/backends/chat-completions.js';

let source = fs.readFileSync(SOURCE_PATH, 'utf8');
let lines = source.split('\n');

console.log(`Original: ${lines.length} lines`);

// Functions to remove (sorted by start line descending so we remove from bottom first)
const toRemove = [
    { name: 'sendAzureOpenAIRequest', start: 1546, end: 1633 },
    { name: 'sendChutesRequest', start: 1444, end: 1539 },
    { name: 'sendElectronHubRequest', start: 1331, end: 1437 },
    { name: 'sendAimlapiRequest', start: 1226, end: 1324 },
    { name: 'sendXaiRequest', start: 1109, end: 1219 },
    { name: 'sendDeepSeekRequest', start: 999, end: 1102 },
    { name: 'sendCohereRequest', start: 899, end: 992 },
    { name: 'sendMistralAIRequest', start: 809, end: 892 },
    { name: 'sendAI21Request', start: 728, end: 802 },
    { name: 'sendMakerSuiteRequest', start: 392, end: 721 },
    { name: 'sendClaudeRequest', start: 205, end: 385 },
];

for (const fn of toRemove) {
    // Find JSDoc above the function
    let removeStart = fn.start - 1; // 0-indexed
    for (let i = removeStart - 1; i >= Math.max(0, removeStart - 20); i--) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('*') || trimmed.startsWith('/**') || trimmed === '*/') {
            removeStart = i;
            continue;
        }
        if (trimmed === '') {
            removeStart = i;
            continue;
        }
        break;
    }

    const count = fn.end - removeStart;
    console.log(`  Removing ${fn.name}: lines ${removeStart + 1}-${fn.end} (${count} lines)`);
    lines.splice(removeStart, count);
}

source = lines.join('\n');
lines = source.split('\n');

// Add provider imports after the existing import block
// Find the last import line
let lastImportLine = 0;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ') || (lines[i].startsWith('}') && lines[i].includes("from '"))) {
        lastImportLine = i;
    }
    // Stop after we hit non-import code
    if (i > 10 && !lines[i].startsWith('import') && !lines[i].startsWith('}') && !lines[i].startsWith('    ') && !lines[i].trim().startsWith('//') && lines[i].trim() !== '' && !lines[i].includes("from '")) {
        break;
    }
}

const providerImports = `
// Provider-specific handler imports
import { sendClaudeRequest } from './providers/claude.js';
import { sendMakerSuiteRequest } from './providers/google.js';
import { sendAI21Request } from './providers/ai21.js';
import { sendMistralAIRequest } from './providers/mistral.js';
import { sendCohereRequest } from './providers/cohere.js';
import { sendDeepSeekRequest } from './providers/deepseek.js';
import { sendXaiRequest } from './providers/xai.js';
import { sendAimlapiRequest } from './providers/aimlapi.js';
import { sendElectronHubRequest } from './providers/electronhub.js';
import { sendChutesRequest } from './providers/chutes.js';
import { sendAzureOpenAIRequest } from './providers/azure.js';`;

lines.splice(lastImportLine + 1, 0, providerImports);

// Also remove the API_CLAUDE, API_AI21, etc. constants that are now only used by provider modules
// But keep the ones still used in /status and /generate routes
// Let's check which API_* constants are still referenced after removing the functions
source = lines.join('\n');

// Remove API constants that are ONLY used by the extracted functions
// These are used in /status or /generate inline code too, so we need to check carefully
const apiConstants = [
    'API_CLAUDE', 'API_MISTRAL', 'API_COHERE_V1', 'API_COHERE_V2',
    'API_AI21', 'API_DEEPSEEK', 'API_XAI', 'API_AIMLAPI',
    'API_ELECTRONHUB', 'API_CHUTES', 'API_VERTEX_AI',
];

lines = source.split('\n');
for (const constant of apiConstants) {
    // Count references (excluding the declaration itself)
    const declPattern = new RegExp(`^const ${constant} = `);
    const usageCount = lines.filter((l, i) => {
        if (declPattern.test(l)) return false;
        return l.includes(constant);
    }).length;

    if (usageCount === 0) {
        // Safe to remove
        const idx = lines.findIndex(l => declPattern.test(l));
        if (idx !== -1) {
            lines.splice(idx, 1);
            console.log(`  Removed unused constant: ${constant}`);
        }
    } else {
        console.log(`  Keeping ${constant} (${usageCount} remaining references)`);
    }
}

fs.writeFileSync(SOURCE_PATH, lines.join('\n'));
console.log(`\nWrote ${SOURCE_PATH} (${lines.length} lines)`);
