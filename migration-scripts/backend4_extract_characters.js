#!/usr/bin/env node
/**
 * Backend Phase 4: Extract DiskCache, character I/O, and import functions
 * from characters.js into sub-modules.
 */

const fs = require('fs');
const path = require('path');

const SOURCE_PATH = '/sessions/admiring-relaxed-goldberg/mnt/SillyTavern/src/endpoints/characters.js';
const OUTPUT_DIR = '/sessions/admiring-relaxed-goldberg/mnt/SillyTavern/src/endpoints/characters';

const source = fs.readFileSync(SOURCE_PATH, 'utf8');
const lines = source.split('\n');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ============================================================
// Module 1: disk-cache.js (DiskCache class + getCacheKey + config)
// Lines 29-173
// ============================================================

const diskCacheModule = `/**
 * Disk cache for character card data — extracted from characters.js
 */
import path from 'node:path';
import fs from 'node:fs';

import storage from 'node-persist';

import { getConfigValue, MemoryLimitedMap } from '../../util.js';
import { getUserDirectories } from '../../users.js';

// With 100 MB limit it would take roughly 3000 characters to reach this limit
const memoryCacheCapacity = getConfigValue('performance.memoryCacheCapacity', '100mb');
export const memoryCache = new MemoryLimitedMap(memoryCacheCapacity);
// Some Android devices require tighter memory management
export const isAndroid = process.platform === 'android';
// Use shallow character data for the character list
export const useShallowCharacters = !!getConfigValue('performance.lazyLoadCharacters', false, 'boolean');
const useDiskCache = !!getConfigValue('performance.useDiskCache', true, 'boolean');

${lines.slice(37, 157).join('\n')}

export const diskCache = new DiskCache();

/**
 * Gets the cache key for the specified image file.
 * @param {string} inputFile - Path to the image file
 * @returns {string} - Cache key
 */
export function getCacheKey(inputFile) {
    if (fs.existsSync(inputFile)) {
        const stat = fs.statSync(inputFile);
        return \`\${inputFile}-\${stat.mtimeMs}\`;
    }

    return inputFile;
}
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'disk-cache.js'), diskCacheModule);
console.log(`  disk-cache.js: ${diskCacheModule.split('\n').length} lines`);

// ============================================================
// Module 2: character-io.js (read/write character data, image processing,
//   card format conversion, character processing)
// Lines 175-724
// ============================================================

const characterIOModule = `/**
 * Character I/O and card format conversion — extracted from characters.js
 */
import path from 'node:path';
import fs from 'node:fs';

import sanitize from 'sanitize-filename';
import { sync as writeFileAtomicSync } from 'write-file-atomic';
import _ from 'lodash';
import { Jimp, JimpMime } from '../../jimp.js';

import { AVATAR_WIDTH, AVATAR_HEIGHT, DEFAULT_AVATAR_PATH } from '../../constants.js';
import { deepMerge, humanizedDateTime, tryParse } from '../../util.js';
import { parse, write } from '../../character-card-parser.js';
import { readWorldInfoFile } from '../worldinfo.js';

import { diskCache, memoryCache, isAndroid, getCacheKey } from './disk-cache.js';

const useDiskCache = !!require('../../util.js').getConfigValue('performance.useDiskCache', true, 'boolean');

${lines.slice(179, 724).join('\n')}
`;

// Wait — we can't use require() in ESM. Let me fix that.

// Actually let me rebuild character-io.js properly
const characterIOLines = [];
characterIOLines.push(`/**`);
characterIOLines.push(` * Character I/O and card format conversion — extracted from characters.js`);
characterIOLines.push(` */`);
characterIOLines.push(`import path from 'node:path';`);
characterIOLines.push(`import fs from 'node:fs';`);
characterIOLines.push(``);
characterIOLines.push(`import sanitize from 'sanitize-filename';`);
characterIOLines.push(`import { sync as writeFileAtomicSync } from 'write-file-atomic';`);
characterIOLines.push(`import _ from 'lodash';`);
characterIOLines.push(`import { Jimp, JimpMime } from '../../jimp.js';`);
characterIOLines.push(``);
characterIOLines.push(`import { AVATAR_WIDTH, AVATAR_HEIGHT, DEFAULT_AVATAR_PATH } from '../../constants.js';`);
characterIOLines.push(`import { deepMerge, humanizedDateTime, tryParse, getConfigValue } from '../../util.js';`);
characterIOLines.push(`import { parse, write } from '../../character-card-parser.js';`);
characterIOLines.push(`import { readWorldInfoFile } from '../worldinfo.js';`);
characterIOLines.push(``);
characterIOLines.push(`import { diskCache, memoryCache, isAndroid, getCacheKey } from './disk-cache.js';`);
characterIOLines.push(``);
characterIOLines.push(`const useDiskCache = !!getConfigValue('performance.useDiskCache', true, 'boolean');`);
characterIOLines.push(``);

// readCharacterData (lines 180-209) - needs export
const readCharacterDataCode = lines.slice(179, 209);
readCharacterDataCode[0] = readCharacterDataCode[0].replace('async function', 'export async function');
characterIOLines.push(...readCharacterDataCode);
characterIOLines.push('');

// writeCharacterData (lines 220-265) - needs export
const writeCharacterDataCode = lines.slice(219, 265);
writeCharacterDataCode[0] = writeCharacterDataCode[0].replace('async function', 'export async function');
characterIOLines.push(...writeCharacterDataCode);
characterIOLines.push('');

// Crop typedef (lines 267-274)
characterIOLines.push(...lines.slice(266, 274));
characterIOLines.push('');

// applyAvatarCropResize (lines 276-306) - already exported
characterIOLines.push(...lines.slice(275, 306));
characterIOLines.push('');

// parseImageBuffer (lines 308-317)
characterIOLines.push(...lines.slice(307, 317));
characterIOLines.push('');

// tryReadImage (lines 319-335)
characterIOLines.push(...lines.slice(318, 335));
characterIOLines.push('');

// calculateChatSize (lines 337-359)
characterIOLines.push(...lines.slice(336, 359));
characterIOLines.push('');

// calculateDataSize (lines 361-363)
characterIOLines.push(...lines.slice(360, 364));
characterIOLines.push('');

// toShallow (lines 366-395)
characterIOLines.push(...lines.slice(365, 395));
characterIOLines.push('');

// processCharacter (lines 397-442) - needs export
const processCharacterCode = lines.slice(396, 442);
// processCharacter is a const arrow fn, so add export
processCharacterCode[0] = 'export ' + processCharacterCode[0];
characterIOLines.push(...processCharacterCode);
characterIOLines.push('');

// getCharaCardV2 (lines 444-462) - needs export
const getCharaCardV2Code = lines.slice(443, 462);
getCharaCardV2Code[0] = getCharaCardV2Code[0].replace('function getCharaCardV2', 'export function getCharaCardV2');
characterIOLines.push(...getCharaCardV2Code);
characterIOLines.push('');

// convertToV2 (lines 464-494) - needs export
const convertToV2Code = lines.slice(463, 494);
convertToV2Code[0] = convertToV2Code[0].replace('function convertToV2', 'export function convertToV2');
characterIOLines.push(...convertToV2Code);
characterIOLines.push('');

// unsetPrivateFields (lines 496-503) - needs export
const unsetPrivateFieldsCode = lines.slice(497, 503);
characterIOLines.push('/**');
characterIOLines.push(' * Removes fields that are not meant to be shared.');
characterIOLines.push(' */');
characterIOLines.push('export ' + unsetPrivateFieldsCode[0]);
characterIOLines.push(...unsetPrivateFieldsCode.slice(1));
characterIOLines.push('');

// readFromV2 (lines 505-558) - needs export
const readFromV2Code = lines.slice(504, 558);
readFromV2Code[0] = 'export ' + readFromV2Code[0];
characterIOLines.push(...readFromV2Code);
characterIOLines.push('');

// charaFormatData (lines 560-659) - needs export
const charaFormatDataCode = lines.slice(559, 659);
charaFormatDataCode[0] = charaFormatDataCode[0].replace('function charaFormatData', 'export function charaFormatData');
characterIOLines.push(...charaFormatDataCode);
characterIOLines.push('');

// convertWorldInfoToCharacterBook (lines 661-724) - needs export
const convertWICode = lines.slice(660, 724);
convertWICode[0] = convertWICode[0].replace('function convertWorldInfoToCharacterBook', 'export function convertWorldInfoToCharacterBook');
characterIOLines.push(...convertWICode);
characterIOLines.push('');

const characterIOOutput = characterIOLines.join('\n');
fs.writeFileSync(path.join(OUTPUT_DIR, 'character-io.js'), characterIOOutput);
console.log(`  character-io.js: ${characterIOOutput.split('\n').length} lines`);

// ============================================================
// Module 3: character-import.js (import functions)
// Lines 726-953 + getPngName (1391-1405) + getPreservedName (1407-1416)
// ============================================================

const characterImportLines = [];
characterImportLines.push(`/**`);
characterImportLines.push(` * Character import functions — extracted from characters.js`);
characterImportLines.push(` */`);
characterImportLines.push(`import path from 'node:path';`);
characterImportLines.push(`import fs from 'node:fs';`);
characterImportLines.push(`import { promises as fsPromises } from 'node:fs';`);
characterImportLines.push(``);
characterImportLines.push(`import sanitize from 'sanitize-filename';`);
characterImportLines.push(`import { sync as writeFileAtomicSync } from 'write-file-atomic';`);
characterImportLines.push(`import yaml from 'yaml';`);
characterImportLines.push(``);
characterImportLines.push(`import { DEFAULT_AVATAR_PATH } from '../../constants.js';`);
characterImportLines.push(`import { humanizedDateTime, getUniqueName, clientRelativePath, sanitizeSafeCharacterReplacements } from '../../util.js';`);
characterImportLines.push(`import { read } from '../../character-card-parser.js';`);
characterImportLines.push(`import { importRisuSprites } from '../sprites.js';`);
characterImportLines.push(`import { ByafParser } from '../../byaf.js';`);
characterImportLines.push(`import { CharXParser, persistCharXAssets } from '../../charx.js';`);
characterImportLines.push(``);
characterImportLines.push(`import {`);
characterImportLines.push(`    readCharacterData,`);
characterImportLines.push(`    writeCharacterData,`);
characterImportLines.push(`    getCharaCardV2,`);
characterImportLines.push(`    convertToV2,`);
characterImportLines.push(`    unsetPrivateFields,`);
characterImportLines.push(`    readFromV2,`);
characterImportLines.push(`} from './character-io.js';`);
characterImportLines.push(``);

// getPngName (lines 1391-1405) - export it
const getPngNameCode = lines.slice(1390, 1405);
// Add JSDoc
characterImportLines.push(...lines.slice(1390, 1405).map((line, i) => {
    if (i === 0) return line.replace('function getPngName', 'export function getPngName');
    return line;
}));
characterImportLines.push('');

// getPreservedName (lines 1407-1416) - export it
characterImportLines.push(...lines.slice(1406, 1416).map((line, i) => {
    if (i === 0) return line.replace('function getPreservedName', 'export function getPreservedName');
    return line;
}));
characterImportLines.push('');

// importFromYaml (lines 726-757)
characterImportLines.push(...lines.slice(725, 757).map(line => {
    if (line.startsWith('async function importFromYaml')) return 'export ' + line;
    return line;
}));
characterImportLines.push('');

// importFromCharX (lines 759-800)
characterImportLines.push(...lines.slice(758, 800).map(line => {
    if (line.startsWith('async function importFromCharX')) return 'export ' + line;
    return line;
}));
characterImportLines.push('');

// importFromByaf (lines 802-873)
characterImportLines.push(...lines.slice(801, 873).map(line => {
    if (line.startsWith('async function importFromByaf')) return 'export ' + line;
    return line;
}));
characterImportLines.push('');

// importFromJson (lines 875-953)
characterImportLines.push(...lines.slice(874, 953).map(line => {
    if (line.startsWith('async function importFromJson')) return 'export ' + line;
    return line;
}));
characterImportLines.push('');

// importFromPng (lines 955-1011)
characterImportLines.push(...lines.slice(954, 1011).map(line => {
    if (line.startsWith('async function importFromPng')) return 'export ' + line;
    return line;
}));
characterImportLines.push('');

const characterImportOutput = characterImportLines.join('\n');
fs.writeFileSync(path.join(OUTPUT_DIR, 'character-import.js'), characterImportOutput);
console.log(`  character-import.js: ${characterImportOutput.split('\n').length} lines`);

// ============================================================
// Now rewrite characters.js as a slim router
// ============================================================

const newCharactersLines = [];

// Imports
newCharactersLines.push(`import path from 'node:path';`);
newCharactersLines.push(`import fs from 'node:fs';`);
newCharactersLines.push(`import { promises as fsPromises } from 'node:fs';`);
newCharactersLines.push(``);
newCharactersLines.push(`import express from 'express';`);
newCharactersLines.push(`import sanitize from 'sanitize-filename';`);
newCharactersLines.push(`import _ from 'lodash';`);
newCharactersLines.push(`import mime from 'mime-types';`);
newCharactersLines.push(``);
newCharactersLines.push(`import { tryParse, deepMerge, mutateJsonString } from '../util.js';`);
newCharactersLines.push(`import { TavernCardValidator } from '../validator/TavernCardValidator.js';`);
newCharactersLines.push(`import { read, write } from '../character-card-parser.js';`);
newCharactersLines.push(`import { invalidateThumbnail } from './thumbnails.js';`);
newCharactersLines.push(`import { getChatInfo } from './chats.js';`);
newCharactersLines.push(`import { default as validateAvatarUrlMiddleware, getFileNameValidationFunction } from '../middleware/validateFileName.js';`);
newCharactersLines.push(`import cacheBuster from '../middleware/cacheBuster.js';`);
newCharactersLines.push(``);
newCharactersLines.push(`// Sub-module imports`);
newCharactersLines.push(`import { diskCache, useShallowCharacters } from './characters/disk-cache.js';`);
newCharactersLines.push(`import {`);
newCharactersLines.push(`    readCharacterData,`);
newCharactersLines.push(`    writeCharacterData,`);
newCharactersLines.push(`    applyAvatarCropResize,`);
newCharactersLines.push(`    processCharacter,`);
newCharactersLines.push(`    getCharaCardV2,`);
newCharactersLines.push(`    unsetPrivateFields,`);
newCharactersLines.push(`    charaFormatData,`);
newCharactersLines.push(`} from './characters/character-io.js';`);
newCharactersLines.push(`import {`);
newCharactersLines.push(`    getPngName,`);
newCharactersLines.push(`    getPreservedName,`);
newCharactersLines.push(`    importFromYaml,`);
newCharactersLines.push(`    importFromCharX,`);
newCharactersLines.push(`    importFromByaf,`);
newCharactersLines.push(`    importFromJson,`);
newCharactersLines.push(`    importFromPng,`);
newCharactersLines.push(`} from './characters/character-import.js';`);
newCharactersLines.push(``);
newCharactersLines.push(`// Re-exports for backward compatibility`);
newCharactersLines.push(`export { diskCache } from './characters/disk-cache.js';`);
newCharactersLines.push(`export { applyAvatarCropResize } from './characters/character-io.js';`);
newCharactersLines.push(``);

// Router endpoints (lines 1013-1547)
newCharactersLines.push(...lines.slice(1012));

const newCharactersOutput = newCharactersLines.join('\n');
fs.writeFileSync(SOURCE_PATH, newCharactersOutput);
console.log(`\nWrote characters.js: ${newCharactersOutput.split('\n').length} lines`);
