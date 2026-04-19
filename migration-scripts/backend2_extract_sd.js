#!/usr/bin/env node
/**
 * Backend Phase 2: Extract image generation sub-routers from stable-diffusion.js
 * into individual modules under src/endpoints/image-generation/.
 */

const fs = require('fs');
const path = require('path');

const SOURCE_PATH = '/sessions/admiring-relaxed-goldberg/mnt/SillyTavern/src/endpoints/stable-diffusion.js';
const OUTPUT_DIR = '/sessions/admiring-relaxed-goldberg/mnt/SillyTavern/src/endpoints/image-generation';

const source = fs.readFileSync(SOURCE_PATH, 'utf8');
const lines = source.split('\n');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Import mappings: module -> import statement template
const importMap = {
    'fs': "import fs from 'node:fs';",
    'path': "import path from 'node:path';",
    'express': "import express from 'express';",
    'fetch': "import fetch from 'node-fetch';",
    'sanitize': "import sanitize from 'sanitize-filename';",
    'writeFileAtomicSync': "import { sync as writeFileAtomicSync } from 'write-file-atomic';",
    'FormData': "import FormData from 'form-data';",
    'urlJoin': "import urlJoin from 'url-join';",
    '_': "import _ from 'lodash';",
    'mime': "import mime from 'mime-types';",
    'delay': { mod: '../util.js', name: 'delay' },
    'getBasicAuthHeader': { mod: '../util.js', name: 'getBasicAuthHeader' },
    'isValidUrl': { mod: '../util.js', name: 'isValidUrl' },
    'tryParse': { mod: '../util.js', name: 'tryParse' },
    'readSecret': { mod: './secrets.js', name: 'readSecret' },
    'SECRET_KEYS': { mod: './secrets.js', name: 'SECRET_KEYS' },
    'getFileNameValidationFunction': { mod: '../middleware/validateFileName.js', name: 'getFileNameValidationFunction' },
    'AIMLAPI_HEADERS': { mod: '../constants.js', name: 'AIMLAPI_HEADERS' },
};

const routers = [
    { name: 'comfy', file: 'comfy.js', start: 387, end: 635,
      uses: ['fs', 'path', 'express', 'fetch', 'sanitize', 'writeFileAtomicSync', 'urlJoin', '_', 'delay', 'getBasicAuthHeader', 'tryParse', 'getFileNameValidationFunction'],
      extraCode: [
        '',
        '/**',
        ' * Gets the comfy workflows.',
        ' * @param {import("../users.js").UserDirectoryList} directories',
        ' * @returns {string[]} List of comfy workflows',
        ' */',
        'function getComfyWorkflows(directories) {',
        '    return fs',
        "        .readdirSync(directories.comfyWorkflows)",
        "        .filter(file => file[0] !== '.' && file.toLowerCase().endsWith('.json'))",
        '        .sort(Intl.Collator().compare);',
        '}',
      ],
    },
    { name: 'comfyRunPod', file: 'comfy-runpod.js', start: 636, end: 737,
      uses: ['path', 'express', 'fetch', 'urlJoin', 'delay', 'tryParse', 'readSecret', 'SECRET_KEYS'] },
    { name: 'together', file: 'together.js', start: 738, end: 832,
      uses: ['express', 'fetch', 'readSecret', 'SECRET_KEYS'] },
    { name: 'sdcpp', file: 'sdcpp.js', start: 833, end: 899,
      uses: ['express', 'fetch'] },
    { name: 'drawthings', file: 'drawthings.js', start: 900, end: 993,
      uses: ['express', 'fetch', 'getBasicAuthHeader'] },
    { name: 'pollinations', file: 'pollinations.js', start: 994, end: 1065,
      uses: ['express', 'fetch', 'mime', 'readSecret', 'SECRET_KEYS'] },
    { name: 'stability', file: 'stability.js', start: 1066, end: 1125,
      uses: ['express', 'fetch', 'FormData', 'readSecret', 'SECRET_KEYS'] },
    { name: 'huggingface', file: 'huggingface.js', start: 1126, end: 1164,
      uses: ['express', 'fetch', 'readSecret', 'SECRET_KEYS'] },
    { name: 'electronhub', file: 'electronhub.js', start: 1165, end: 1290,
      uses: ['express', 'fetch', 'readSecret', 'SECRET_KEYS'] },
    { name: 'chutes', file: 'chutes.js', start: 1291, end: 1373,
      uses: ['express', 'fetch', 'readSecret', 'SECRET_KEYS'] },
    { name: 'nanogpt', file: 'nanogpt.js', start: 1374, end: 1457,
      uses: ['express', 'fetch', 'readSecret', 'SECRET_KEYS'] },
    { name: 'bfl', file: 'bfl.js', start: 1458, end: 1571,
      uses: ['express', 'fetch', 'delay', 'readSecret', 'SECRET_KEYS'] },
    { name: 'falai', file: 'falai.js', start: 1572, end: 1716,
      uses: ['express', 'fetch', 'delay', 'readSecret', 'SECRET_KEYS'] },
    { name: 'xai', file: 'xai.js', start: 1717, end: 1766,
      uses: ['express', 'fetch', 'readSecret', 'SECRET_KEYS'] },
    { name: 'aimlapi', file: 'aimlapi.js', start: 1767, end: 1850,
      uses: ['express', 'fetch', 'readSecret', 'SECRET_KEYS', 'AIMLAPI_HEADERS'] },
    { name: 'zai', file: 'zai.js', start: 1851, end: 2012,
      uses: ['path', 'express', 'fetch', 'delay', 'isValidUrl', 'readSecret', 'SECRET_KEYS'] },
];

for (const r of routers) {
    const parts = [];

    // Header
    parts.push(`/**`);
    parts.push(` * Image generation backend: ${r.name} — extracted from stable-diffusion.js`);
    parts.push(` */`);
    parts.push('');

    // Build imports
    // Group named imports by module
    const defaultImports = [];
    const namedByModule = {};

    for (const id of r.uses) {
        const mapping = importMap[id];
        if (typeof mapping === 'string') {
            defaultImports.push(mapping);
        } else {
            if (!namedByModule[mapping.mod]) namedByModule[mapping.mod] = [];
            namedByModule[mapping.mod].push(mapping.name);
        }
    }

    for (const imp of defaultImports) {
        parts.push(imp);
    }
    if (defaultImports.length > 0 && Object.keys(namedByModule).length > 0) parts.push('');
    for (const [mod, names] of Object.entries(namedByModule)) {
        if (names.length <= 3) {
            parts.push(`import { ${names.join(', ')} } from '${mod}';`);
        } else {
            parts.push(`import {`);
            for (const n of names) parts.push(`    ${n},`);
            parts.push(`} from '${mod}';`);
        }
    }
    parts.push('');

    // Extra code (e.g. getComfyWorkflows for comfy.js)
    if (r.extraCode) {
        for (const line of r.extraCode) parts.push(line);
        parts.push('');
    }

    // Extract the sub-router code
    const routerCode = lines.slice(r.start - 1, r.end);

    // Replace `const xxx = express.Router();` with `export const router = express.Router();`
    // and replace all `xxx.post/get/use` with `router.post/get/use`
    const varName = r.name;
    const transformed = routerCode.map(line => {
        // Replace declaration
        if (line === `const ${varName} = express.Router();`) {
            return `export const router = express.Router();`;
        }
        // Replace route registrations
        if (line.startsWith(`${varName}.`)) {
            return line.replace(new RegExp(`^${varName}\\.`), 'router.');
        }
        return line;
    });

    for (const line of transformed) {
        parts.push(line);
    }

    const output = parts.join('\n');
    const outputPath = path.join(OUTPUT_DIR, r.file);
    fs.writeFileSync(outputPath, output);
    console.log(`  ${r.file}: ${output.split('\n').length} lines`);
}

// Now modify stable-diffusion.js: remove sub-routers, add imports
let modified = lines.slice();

// Remove sub-router sections (from bottom up)
const sortedRouters = [...routers].sort((a, b) => b.start - a.start);
for (const r of sortedRouters) {
    // Also remove blank lines above
    let removeStart = r.start - 1; // 0-indexed
    while (removeStart > 0 && modified[removeStart - 1].trim() === '') removeStart--;

    const count = r.end - removeStart;
    modified.splice(removeStart, count);
    console.log(`  Removed ${r.name}: ${count} lines`);
}

// Remove router.use lines (they'll be at the end now)
modified = modified.filter(line => !line.startsWith('router.use('));

// Remove trailing blank lines at end
while (modified.length > 0 && modified[modified.length - 1].trim() === '') modified.pop();

// Add imports for the extracted sub-routers after the existing imports
let lastImportIdx = 0;
for (let i = 0; i < modified.length; i++) {
    if (modified[i].startsWith('import ') || (modified[i].startsWith('}') && modified[i].includes("from '"))) {
        lastImportIdx = i;
    }
}

const subRouterImports = [
    '',
    '// Image generation backend imports',
    "import { router as comfy } from './image-generation/comfy.js';",
    "import { router as comfyRunPod } from './image-generation/comfy-runpod.js';",
    "import { router as together } from './image-generation/together.js';",
    "import { router as sdcpp } from './image-generation/sdcpp.js';",
    "import { router as drawthings } from './image-generation/drawthings.js';",
    "import { router as pollinations } from './image-generation/pollinations.js';",
    "import { router as stability } from './image-generation/stability.js';",
    "import { router as huggingface } from './image-generation/huggingface.js';",
    "import { router as electronhub } from './image-generation/electronhub.js';",
    "import { router as chutes } from './image-generation/chutes.js';",
    "import { router as nanogpt } from './image-generation/nanogpt.js';",
    "import { router as bfl } from './image-generation/bfl.js';",
    "import { router as falai } from './image-generation/falai.js';",
    "import { router as xai } from './image-generation/xai.js';",
    "import { router as aimlapi } from './image-generation/aimlapi.js';",
    "import { router as zai } from './image-generation/zai.js';",
];

modified.splice(lastImportIdx + 1, 0, ...subRouterImports);

// Add router.use registrations at the end
modified.push('');
modified.push('// Mount image generation backend sub-routers');
modified.push("router.use('/comfy', comfy);");
modified.push("router.use('/comfyrunpod', comfyRunPod);");
modified.push("router.use('/together', together);");
modified.push("router.use('/sdcpp', sdcpp);");
modified.push("router.use('/drawthings', drawthings);");
modified.push("router.use('/pollinations', pollinations);");
modified.push("router.use('/stability', stability);");
modified.push("router.use('/huggingface', huggingface);");
modified.push("router.use('/electronhub', electronhub);");
modified.push("router.use('/chutes', chutes);");
modified.push("router.use('/nanogpt', nanogpt);");
modified.push("router.use('/bfl', bfl);");
modified.push("router.use('/falai', falai);");
modified.push("router.use('/xai', xai);");
modified.push("router.use('/aimlapi', aimlapi);");
modified.push("router.use('/zai', zai);");
modified.push('');

fs.writeFileSync(SOURCE_PATH, modified.join('\n'));
console.log(`\nWrote stable-diffusion.js: ${modified.length} lines`);

console.log(`\nGenerated ${routers.length} backend modules in ${OUTPUT_DIR}`);
