#!/usr/bin/env node
/**
 * Backend Phase 1: Extract provider handler functions from chat-completions.js
 * into individual modules under src/endpoints/backends/providers/.
 */

const fs = require('fs');
const path = require('path');

const ROOT = '/sessions/admiring-relaxed-goldberg/mnt/SillyTavern/src/endpoints/backends';
const SOURCE_PATH = path.join(ROOT, 'chat-completions.js');
const PROVIDERS_DIR = path.join(ROOT, 'providers');

const source = fs.readFileSync(SOURCE_PATH, 'utf8');
const lines = source.split('\n');

// ============================================================
// Provider definitions: function name, line range, output file, imports needed
// ============================================================

const providers = [
    {
        file: 'claude.js',
        functions: [{ name: 'sendClaudeRequest', start: 205, end: 385 }],
        imports: {
            'node-fetch': ['fetch'],
            '../../../constants.js': [],
            '../../../util.js': ['forwardFetchResponse', 'color', 'flattenSchema'],
            '../../../prompt-converters.js': ['convertClaudeMessages', 'cachingAtDepthForClaude', 'getPromptNames', 'calculateClaudeBudgetTokens'],
            '../../secrets.js': ['readSecret', 'SECRET_KEYS'],
        },
        localConstants: [
            "const API_CLAUDE = 'https://api.anthropic.com/v1';",
        ],
        moduleVars: [
            "import { getConfigValue } from '../../../util.js';",
            '',
            "const cacheTTL = getConfigValue('claude.extendedTTL', false, 'boolean') ? '1h' : '5m';",
            "const enableSystemPromptCache = getConfigValue('claude.enableSystemPromptCache', false, 'boolean');",
            'const cachingAtDepth = (() => {',
            "    const value = getConfigValue('claude.cachingAtDepth', -1, 'number');",
            '    return Number.isInteger(value) && value >= 0 ? value : -1;',
            '})();',
        ],
    },
    {
        file: 'google.js',
        functions: [{ name: 'sendMakerSuiteRequest', start: 392, end: 721 }],
        imports: {
            'node-fetch': ['fetch'],
            '../../../constants.js': ['CHAT_COMPLETION_SOURCES', 'GEMINI_SAFETY', 'VERTEX_SAFETY'],
            '../../../util.js': ['forwardFetchResponse', 'getConfigValue', 'tryParse'],
            '../../../prompt-converters.js': ['convertGooglePrompt', 'getPromptNames', 'calculateGoogleBudgetTokens'],
            '../../secrets.js': ['readSecret', 'SECRET_KEYS'],
            '../../google.js': ['getVertexAIAuth', 'getProjectIdFromServiceAccount'],
        },
        localConstants: [
            "const API_MAKERSUITE = 'https://generativelanguage.googleapis.com';",
            "const API_VERTEX_AI = 'https://us-central1-aiplatform.googleapis.com';",
        ],
    },
    {
        file: 'ai21.js',
        functions: [{ name: 'sendAI21Request', start: 728, end: 802 }],
        imports: {
            'node-fetch': ['fetch'],
            '../../../util.js': ['forwardFetchResponse', 'tryParse'],
            '../../../prompt-converters.js': ['convertAI21Messages', 'getPromptNames'],
            '../../secrets.js': ['readSecret', 'SECRET_KEYS'],
        },
        localConstants: [
            "const API_AI21 = 'https://api.ai21.com/studio/v1';",
        ],
    },
    {
        file: 'mistral.js',
        functions: [{ name: 'sendMistralAIRequest', start: 809, end: 892 }],
        imports: {
            'node-fetch': ['fetch'],
            '../../../util.js': ['forwardFetchResponse', 'tryParse'],
            '../../../prompt-converters.js': ['convertMistralMessages', 'getPromptNames'],
            '../../secrets.js': ['readSecret', 'SECRET_KEYS'],
        },
        localConstants: [
            "const API_MISTRAL = 'https://api.mistral.ai/v1';",
        ],
    },
    {
        file: 'cohere.js',
        functions: [{ name: 'sendCohereRequest', start: 899, end: 992 }],
        imports: {
            'node-fetch': ['fetch'],
            '../../../util.js': ['forwardFetchResponse', 'tryParse'],
            '../../../prompt-converters.js': ['convertCohereMessages', 'getPromptNames'],
            '../../secrets.js': ['readSecret', 'SECRET_KEYS'],
        },
        localConstants: [
            "const API_COHERE_V2 = 'https://api.cohere.ai/v2';",
        ],
    },
    {
        file: 'deepseek.js',
        functions: [{ name: 'sendDeepSeekRequest', start: 999, end: 1102 }],
        imports: {
            'node-fetch': ['fetch'],
            '../../../util.js': ['forwardFetchResponse', 'tryParse'],
            '../../../prompt-converters.js': ['getPromptNames', 'postProcessPrompt', 'PROMPT_PROCESSING_TYPE', 'addAssistantPrefix', 'addReasoningContentToToolCalls'],
            '../../secrets.js': ['readSecret', 'SECRET_KEYS'],
        },
        localConstants: [
            "const API_DEEPSEEK = 'https://api.deepseek.com/beta';",
        ],
    },
    {
        file: 'xai.js',
        functions: [{ name: 'sendXaiRequest', start: 1109, end: 1219 }],
        imports: {
            'node-fetch': ['fetch'],
            '../../../util.js': ['forwardFetchResponse', 'tryParse'],
            '../../../prompt-converters.js': ['convertXAIMessages', 'getPromptNames'],
            '../../secrets.js': ['readSecret', 'SECRET_KEYS'],
        },
        localConstants: [
            "const API_XAI = 'https://api.x.ai/v1';",
        ],
    },
    {
        file: 'aimlapi.js',
        functions: [{ name: 'sendAimlapiRequest', start: 1226, end: 1324 }],
        imports: {
            'node-fetch': ['fetch'],
            '../../../constants.js': ['AIMLAPI_HEADERS'],
            '../../../util.js': ['forwardFetchResponse', 'tryParse'],
            '../../secrets.js': ['readSecret', 'SECRET_KEYS'],
        },
        localConstants: [
            "const API_AIMLAPI = 'https://api.aimlapi.com/v1';",
        ],
    },
    {
        file: 'electronhub.js',
        functions: [{ name: 'sendElectronHubRequest', start: 1331, end: 1437 }],
        imports: {
            'node-fetch': ['fetch'],
            '../../../util.js': ['forwardFetchResponse', 'getConfigValue', 'tryParse'],
            '../../../prompt-converters.js': ['cachingAtDepthForOpenRouterClaude', 'cachingSystemPromptForOpenRouter'],
            '../../secrets.js': ['readSecret', 'SECRET_KEYS'],
        },
        localConstants: [
            "const API_ELECTRONHUB = 'https://api.electronhub.ai/v1';",
        ],
        moduleVars: [
            "const cacheTTL = getConfigValue('claude.extendedTTL', false, 'boolean') ? '1h' : '5m';",
            "const enableSystemPromptCache = getConfigValue('claude.enableSystemPromptCache', false, 'boolean');",
            'const cachingAtDepth = (() => {',
            "    const value = getConfigValue('claude.cachingAtDepth', -1, 'number');",
            '    return Number.isInteger(value) && value >= 0 ? value : -1;',
            '})();',
        ],
    },
    {
        file: 'chutes.js',
        functions: [{ name: 'sendChutesRequest', start: 1444, end: 1539 }],
        imports: {
            'node-fetch': ['fetch'],
            '../../../util.js': ['forwardFetchResponse', 'tryParse'],
            '../../secrets.js': ['readSecret', 'SECRET_KEYS'],
        },
        localConstants: [
            "const API_CHUTES = 'https://llm.chutes.ai/v1';",
        ],
    },
    {
        file: 'azure.js',
        functions: [{ name: 'sendAzureOpenAIRequest', start: 1546, end: 1633 }],
        imports: {
            'node-fetch': ['fetch'],
            '../../../constants.js': ['AZURE_OPENAI_KEYS', 'OPENAI_REASONING_EFFORT_MAP', 'OPENAI_REASONING_EFFORT_MODELS'],
            '../../../util.js': ['forwardFetchResponse', 'tryParse'],
            '../../secrets.js': ['readSecret', 'SECRET_KEYS'],
        },
        localConstants: [],
    },
];

// ============================================================
// Generate each provider file
// ============================================================

for (const provider of providers) {
    const parts = [];

    // Header
    parts.push(`/* eslint-disable dot-notation */`);
    parts.push(`/**`);
    parts.push(` * Provider: ${provider.file.replace('.js', '')} — extracted from chat-completions.js`);
    parts.push(` */`);
    parts.push('');

    // Imports
    for (const [mod, names] of Object.entries(provider.imports)) {
        if (mod === 'node-fetch') {
            parts.push(`import fetch from 'node-fetch';`);
        } else if (names.length <= 3) {
            parts.push(`import { ${names.join(', ')} } from '${mod}';`);
        } else {
            parts.push(`import {`);
            for (const n of names) {
                parts.push(`    ${n},`);
            }
            parts.push(`} from '${mod}';`);
        }
    }
    parts.push('');

    // Module vars (e.g., caching config for Claude)
    if (provider.moduleVars) {
        for (const line of provider.moduleVars) {
            parts.push(line);
        }
        parts.push('');
    }

    // Local constants (API URLs)
    if (provider.localConstants?.length) {
        for (const c of provider.localConstants) {
            parts.push(c);
        }
        parts.push('');
    }

    // Extract function code
    for (const fn of provider.functions) {
        // Include JSDoc comment above the function
        let startIdx = fn.start - 1;
        for (let i = startIdx - 1; i >= Math.max(0, startIdx - 20); i--) {
            const trimmed = lines[i].trim();
            if (trimmed.startsWith('*') || trimmed.startsWith('/**') || trimmed === '*/') {
                startIdx = i;
                continue;
            }
            if (trimmed === '') {
                continue;
            }
            break;
        }

        const code = lines.slice(startIdx, fn.end).join('\n');
        // Add export keyword
        const exportedCode = code.replace(/^(async )?function /, 'export $1function ');
        parts.push(exportedCode);
        parts.push('');
    }

    const output = parts.join('\n');
    const outputPath = path.join(PROVIDERS_DIR, provider.file);
    fs.writeFileSync(outputPath, output);
    console.log(`  ${provider.file}: ${output.split('\n').length} lines`);
}

console.log(`\nGenerated ${providers.length} provider modules in ${PROVIDERS_DIR}`);
