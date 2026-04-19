#!/usr/bin/env node
/**
 * Backend Phase 5: Extract util.js into focused sub-modules under src/util/
 * All exports are re-exported from util.js for backward compatibility.
 */

const fs = require('fs');
const path = require('path');

const SOURCE_PATH = '/sessions/admiring-relaxed-goldberg/mnt/SillyTavern/src/util.js';
const OUTPUT_DIR = '/sessions/admiring-relaxed-goldberg/mnt/SillyTavern/src/util';

const source = fs.readFileSync(SOURCE_PATH, 'utf8');
const lines = source.split('\n');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Helper to write a module file
function writeModule(filename, content) {
    const outputPath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(outputPath, content);
    const lineCount = content.split('\n').length;
    console.log(`  ${filename}: ${lineCount} lines`);
}

// ============================================================
// Module 1: config.js (config management)
// Lines 26-119: CACHED_CONFIG, CONFIG_PATH, keyToEnv, setConfigFilePath, getConfig, getConfigValue, setConfigValue
// Also needs: toBoolean (lines 1075-1088), tryParse (lines 558-564), color (line 512)
// ============================================================

const configModule = `/**
 * Configuration management — extracted from util.js
 */
import path from 'node:path';
import fs from 'node:fs';
import process from 'node:process';

import yaml from 'yaml';
import _ from 'lodash';
import chalk from 'chalk';

export const color = chalk;

/**
 * Converts various JavaScript primitives to boolean values.
 * @param {any} value - The value to convert to boolean
 * @returns {boolean} - The boolean representation of the value
 */
export function toBoolean(value) {
    if (typeof value === 'string') {
        const trimmedLower = value.trim().toLowerCase();
        if (trimmedLower === 'true') return true;
        if (trimmedLower === 'false') return false;
    }
    return Boolean(value);
}

/**
 * @param {string} str
 * @returns {any}
 */
function tryParseInternal(str) {
    try {
        return JSON.parse(str);
    } catch {
        return undefined;
    }
}

/**
 * Parsed config object.
 */
let CACHED_CONFIG = null;
let CONFIG_PATH = null;

/**
 * Converts a configuration key to an environment variable key.
 * @param {string} key Configuration key
 * @returns {string} Environment variable key
 */
export const keyToEnv = (key) => 'SILLYTAVERN_' + String(key).toUpperCase().replace(/\\./g, '_');

/**
 * Set the config file path.
 * @param {string} configFilePath Path to the config file
 */
export function setConfigFilePath(configFilePath) {
    if (CONFIG_PATH !== null) {
        console.error(color.red('Config file path already set. Please restart the server to change the config file path.'));
    }
    CONFIG_PATH = path.resolve(configFilePath);
}

/**
 * Returns the config object from the config.yaml file.
 * @returns {object} Config object
 */
export function getConfig() {
    if (CONFIG_PATH === null) {
        console.trace();
        console.error(color.red('No config file path set. Please set the config file path using setConfigFilePath().'));
        process.exit(1);
    }
    if (CACHED_CONFIG) {
        return CACHED_CONFIG;
    }
    if (!fs.existsSync(CONFIG_PATH)) {
        console.error(color.red('No config file found. Please create a config.yaml file. The default config file can be found in the /default folder.'));
        console.error(color.red('The program will now exit.'));
        process.exit(1);
    }

    try {
        const config = yaml.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        CACHED_CONFIG = config;
        return config;
    } catch (error) {
        console.error(color.red('FATAL: Failed to read config.yaml. Please check the file for syntax errors.'));
        console.error(error.message);
        process.exit(1);
    }
}

/**
 * Returns the value for the given key from the config object.
 * @param {string} key - Key to get from the config object
 * @param {any} defaultValue - Default value to return if the key is not found
 * @param {'number'|'boolean'|null} typeConverter - Type to convert the value to
 * @returns {any} Value for the given key
 */
export function getConfigValue(key, defaultValue = null, typeConverter = null) {
    function _getValue() {
        const envKey = keyToEnv(key);
        if (envKey in process.env) {
            const needsJsonParse = defaultValue && typeof defaultValue === 'object';
            const envValue = process.env[envKey];
            return needsJsonParse ? (tryParseInternal(envValue) ?? defaultValue) : envValue;
        }
        const config = getConfig();
        return _.get(config, key, defaultValue);
    }

    const value = _getValue();
    switch (typeConverter) {
        case 'number':
            return isNaN(parseFloat(value)) ? defaultValue : parseFloat(value);
        case 'boolean':
            return toBoolean(value);
        default:
            return value;
    }
}

/**
 * THIS FUNCTION IS DEPRECATED AND ONLY EXISTS FOR BACKWARDS COMPATIBILITY. DON'T USE IT.
 * @param {any} _key Unused
 * @param {any} _value Unused
 * @deprecated Configs are read-only. Use environment variables instead.
 */
export function setConfigValue(_key, _value) {
    console.trace(color.yellow('setConfigValue is deprecated and should not be used.'));
}

/**
 * Setup the minimum log level
 */
export function setupLogLevel() {
    const { LOG_LEVELS } = await import('../constants.js');
    const logLevel = getConfigValue('logging.minLogLevel', LOG_LEVELS.DEBUG, 'number');

    globalThis.console.debug = logLevel <= LOG_LEVELS.DEBUG ? console.debug : () => { };
    globalThis.console.info = logLevel <= LOG_LEVELS.INFO ? console.info : () => { };
    globalThis.console.warn = logLevel <= LOG_LEVELS.WARN ? console.warn : () => { };
    globalThis.console.error = logLevel <= LOG_LEVELS.ERROR ? console.error : () => { };
}
`;

// Wait, setupLogLevel uses `await import()` which only works in async contexts.
// Let me just keep the original import pattern and import LOG_LEVELS at the top.

const configModuleFixed = `/**
 * Configuration management — extracted from util.js
 */
import path from 'node:path';
import fs from 'node:fs';
import process from 'node:process';

import yaml from 'yaml';
import _ from 'lodash';
import chalk from 'chalk';

import { LOG_LEVELS } from '../constants.js';

export const color = chalk;

/**
 * Converts various JavaScript primitives to boolean values.
 * @param {any} value - The value to convert to boolean
 * @returns {boolean} - The boolean representation of the value
 */
export function toBoolean(value) {
    if (typeof value === 'string') {
        const trimmedLower = value.trim().toLowerCase();
        if (trimmedLower === 'true') return true;
        if (trimmedLower === 'false') return false;
    }
    return Boolean(value);
}

/**
 * @param {string} str
 * @returns {any}
 */
function tryParseInternal(str) {
    try {
        return JSON.parse(str);
    } catch {
        return undefined;
    }
}

/**
 * Parsed config object.
 */
let CACHED_CONFIG = null;
let CONFIG_PATH = null;

/**
 * Converts a configuration key to an environment variable key.
 * @param {string} key Configuration key
 * @returns {string} Environment variable key
 */
export const keyToEnv = (key) => 'SILLYTAVERN_' + String(key).toUpperCase().replace(/\\./g, '_');

/**
 * Set the config file path.
 * @param {string} configFilePath Path to the config file
 */
export function setConfigFilePath(configFilePath) {
    if (CONFIG_PATH !== null) {
        console.error(color.red('Config file path already set. Please restart the server to change the config file path.'));
    }
    CONFIG_PATH = path.resolve(configFilePath);
}

/**
 * Returns the config object from the config.yaml file.
 * @returns {object} Config object
 */
export function getConfig() {
    if (CONFIG_PATH === null) {
        console.trace();
        console.error(color.red('No config file path set. Please set the config file path using setConfigFilePath().'));
        process.exit(1);
    }
    if (CACHED_CONFIG) {
        return CACHED_CONFIG;
    }
    if (!fs.existsSync(CONFIG_PATH)) {
        console.error(color.red('No config file found. Please create a config.yaml file. The default config file can be found in the /default folder.'));
        console.error(color.red('The program will now exit.'));
        process.exit(1);
    }

    try {
        const config = yaml.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        CACHED_CONFIG = config;
        return config;
    } catch (error) {
        console.error(color.red('FATAL: Failed to read config.yaml. Please check the file for syntax errors.'));
        console.error(error.message);
        process.exit(1);
    }
}

/**
 * Returns the value for the given key from the config object.
 * @param {string} key - Key to get from the config object
 * @param {any} defaultValue - Default value to return if the key is not found
 * @param {'number'|'boolean'|null} typeConverter - Type to convert the value to
 * @returns {any} Value for the given key
 */
export function getConfigValue(key, defaultValue = null, typeConverter = null) {
    function _getValue() {
        const envKey = keyToEnv(key);
        if (envKey in process.env) {
            const needsJsonParse = defaultValue && typeof defaultValue === 'object';
            const envValue = process.env[envKey];
            return needsJsonParse ? (tryParseInternal(envValue) ?? defaultValue) : envValue;
        }
        const config = getConfig();
        return _.get(config, key, defaultValue);
    }

    const value = _getValue();
    switch (typeConverter) {
        case 'number':
            return isNaN(parseFloat(value)) ? defaultValue : parseFloat(value);
        case 'boolean':
            return toBoolean(value);
        default:
            return value;
    }
}

/**
 * THIS FUNCTION IS DEPRECATED AND ONLY EXISTS FOR BACKWARDS COMPATIBILITY. DON'T USE IT.
 * @param {any} _key Unused
 * @param {any} _value Unused
 * @deprecated Configs are read-only. Use environment variables instead.
 */
export function setConfigValue(_key, _value) {
    console.trace(color.yellow('setConfigValue is deprecated and should not be used.'));
}

/**
 * Setup the minimum log level
 */
export function setupLogLevel() {
    const logLevel = getConfigValue('logging.minLogLevel', LOG_LEVELS.DEBUG, 'number');

    globalThis.console.debug = logLevel <= LOG_LEVELS.DEBUG ? console.debug : () => { };
    globalThis.console.info = logLevel <= LOG_LEVELS.INFO ? console.info : () => { };
    globalThis.console.warn = logLevel <= LOG_LEVELS.WARN ? console.warn : () => { };
    globalThis.console.error = logLevel <= LOG_LEVELS.ERROR ? console.error : () => { };
}
`;

writeModule('config.js', configModuleFixed);

// ============================================================
// Module 2: cache.js (Cache and MemoryLimitedMap classes)
// Lines 884-1291
// ============================================================

const cacheModule = `/**
 * Cache utilities — extracted from util.js
 */
import bytes from 'bytes';

${lines.slice(883, 934).join('\n')}

${lines.slice(1115, 1291).join('\n')}
`;

writeModule('cache.js', cacheModule);

// ============================================================
// Module 3: zip.js (ZIP archive utilities)
// Lines 202-463 + 465-488 (readAllChunks)
// ============================================================

const zipModule = `/**
 * ZIP archive utilities — extracted from util.js
 */
import path from 'node:path';
import fs from 'node:fs';
import { Buffer } from 'node:buffer';

import yauzl from 'yauzl';
import mime from 'mime-types';

${lines.slice(201, 463).join('\n')}

${lines.slice(464, 488).join('\n')}
`;

writeModule('zip.js', zipModule);

// ============================================================
// Module 4: file-utils.js (file system helpers)
// Lines 390-408 (ensureDirectory), 1293-1302 (safeReadFileSync),
// 1334-1368 (setPermissionsSync), 1370-1383 (isPathUnderParent),
// 1478-1506 (tryWriteFileSync, tryReadFileSync),
// 1508-1522 (tryDeleteFile), 1524-1554 (readFirstLine),
// 637-660 (removeOldBackups), 1556-1569 (invalidateFirefoxCache)
// ============================================================

const fileUtilsModule = `/**
 * File system utilities — extracted from util.js
 */
import path from 'node:path';
import fs from 'node:fs';
import readline from 'node:readline';

import { sync as writeFileAtomicSync } from 'write-file-atomic';
import mime from 'mime-types';

import { getConfigValue } from './config.js';
import { isFirefox } from '../express-common.js';

${lines.slice(389, 408).join('\n')}

${lines.slice(636, 660).join('\n')}

${lines.slice(1292, 1302).join('\n')}

${lines.slice(1333, 1368).join('\n')}

${lines.slice(1369, 1383).join('\n')}

${lines.slice(1477, 1506).join('\n')}

${lines.slice(1507, 1522).join('\n')}

${lines.slice(1523, 1554).join('\n')}

${lines.slice(1555, 1569).join('\n')}
`;

writeModule('file-utils.js', fileUtilsModule);

// ============================================================
// Module 5: network.js (network/HTTP utilities)
// Lines 121-129 (getBasicAuthHeader), 704-802 (forwardFetchResponse, makeHttp2Request),
// 955-1019 (isValidUrl, urlHostnameToIPv6, canResolve),
// 1021-1065 (getHasIP), 1385-1419 (isFileURL, getRequestURL)
// ============================================================

const networkModule = `/**
 * Network and HTTP utilities — extracted from util.js
 */
import http2 from 'node:http2';
import { Readable } from 'node:stream';
import { Buffer } from 'node:buffer';
import { promises as dnsPromise } from 'node:dns';
import os from 'node:os';

${lines.slice(120, 129).join('\n')}

${lines.slice(703, 802).join('\n')}

${lines.slice(954, 1065).join('\n')}

${lines.slice(1384, 1419).join('\n')}
`;

writeModule('network.js', networkModule);

// ============================================================
// Now rewrite util.js to import from sub-modules and re-export everything
// ============================================================

const newUtil = `/**
 * Utility functions for SillyTavern.
 * Sub-modules extracted for maintainability; everything re-exported for backward compatibility.
 */
import path from 'node:path';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';

import { default as simpleGit } from 'simple-git';
import { sync as commandExistsSync } from 'command-exists';
import yaml from 'yaml';
import _ from 'lodash';
import bytes from 'bytes';
import mime from 'mime-types';

import { CHAT_COMPLETION_SOURCES, MEDIA_REQUEST_TYPE } from './constants.js';
import { serverDirectory } from './server-directory.js';

// Re-export everything from sub-modules
export { color, toBoolean, keyToEnv, setConfigFilePath, getConfig, getConfigValue, setConfigValue, setupLogLevel } from './util/config.js';
export { Cache, MemoryLimitedMap } from './util/cache.js';
export { extractFileFromZipBuffer, normalizeZipEntryPath, extractFilesFromZipBuffer, getImageBuffers, readAllChunks } from './util/zip.js';
export { ensureDirectory, removeOldBackups, safeReadFileSync, setPermissionsSync, isPathUnderParent, tryWriteFileSync, tryReadFileSync, tryDeleteFile, readFirstLine, invalidateFirefoxCache } from './util/file-utils.js';
export { getBasicAuthHeader, forwardFetchResponse, makeHttp2Request, isValidUrl, urlHostnameToIPv6, canResolve, getHasIP, isFileURL, getRequestURL } from './util/network.js';

/**
 * Returns the version of the running instance.
 * @returns {Promise<{agent: string, pkgVersion: string, gitRevision: string | null, gitBranch: string | null, commitDate: string | null, isLatest: boolean}>}
 */
export async function getVersion() {
${lines.slice(136, 167).join('\n')}
}

${lines.slice(168, 176).join('\n')}

${lines.slice(178, 191).join('\n')}

${lines.slice(192, 200).join('\n')}

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

${lines.slice(493, 510).join('\n')}

${lines.slice(513, 564).join('\n')}

${lines.slice(565, 614).join('\n')}

${lines.slice(620, 635).join('\n')}

${lines.slice(661, 702).join('\n')}

${lines.slice(803, 861).join('\n')}

${lines.slice(862, 879).join('\n')}

${lines.slice(935, 953).join('\n')}

${lines.slice(1066, 1099).join('\n')}

${lines.slice(1099, 1111).join('\n')}

${lines.slice(1316, 1332).join('\n')}

${lines.slice(1420, 1476).join('\n')}
`;

fs.writeFileSync(SOURCE_PATH, newUtil);
console.log(`\\nWrote util.js: ${newUtil.split('\\n').length} lines`);
