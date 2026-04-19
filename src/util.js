/**
 * Utility functions for SillyTavern.
 * Sub-modules extracted for maintainability; everything re-exported for backward compatibility.
 */
import path from 'node:path';
import fs from 'node:fs';
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
 * Returns the version of the running instance. Get the version from the package.json file and the git revision.
 * Also returns the agent string for the Horde API.
 * @returns {Promise<{agent: string, pkgVersion: string, gitRevision: string | null, gitBranch: string | null, commitDate: string | null, isLatest: boolean}>} Version info object
 */
export async function getVersion() {
    let pkgVersion = 'UNKNOWN';
    let gitRevision = null;
    let gitBranch = null;
    let commitDate = null;
    let isLatest = true;

    try {
        const require = createRequire(import.meta.url);
        const pkgJson = require(path.join(serverDirectory, './package.json'));
        pkgVersion = pkgJson.version;
        if (commandExistsSync('git')) {
            const git = simpleGit({ baseDir: serverDirectory });
            gitRevision = await git.revparse(['--short', 'HEAD']);
            gitBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
            commitDate = await git.show(['-s', '--format=%ci', gitRevision]);

            const trackingBranch = await git.revparse(['--abbrev-ref', '@{u}']);

            // Might fail, but exception is caught. Just don't run anything relevant after in this block...
            const localLatest = await git.revparse(['HEAD']);
            const remoteLatest = await git.revparse([trackingBranch]);
            isLatest = localLatest === remoteLatest;
        }
    }
    catch {
        // suppress exception
    }

    const agent = `SillyTavern:${pkgVersion}:Cohee#1207`;
    return { agent, pkgVersion, gitRevision, gitBranch, commitDate: commitDate?.trim() ?? null, isLatest };
}

/**
 * Delays the current async function by the given amount of milliseconds.
 * @param {number} ms Milliseconds to wait
 * @returns {Promise<void>} Promise that resolves after the given amount of milliseconds
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generates a random hex string of the given length.
 * @param {number} length String length
 * @returns {string} Random hex string
 * @example getHexString(8) // 'a1b2c3d4'
 */
export function getHexString(length) {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

/**
 * Formats a byte size into a human-readable string with units
 * @param {number} numBytes - The size in bytes to format
 * @returns {string} The formatted string (e.g., "1.5 MB")
 */
export function formatBytes(numBytes) {
    return bytes.format(numBytes) ?? '';
}

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

export function deepMerge(target, source) {
    let output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

/**
 * Gets a random UUIDv4 string.
 * @returns {string} A UUIDv4 string
 */
export function uuidv4() {
    // Node v16.7.0+
    if ('crypto' in globalThis && 'randomUUID' in globalThis.crypto) {
        return globalThis.crypto.randomUUID();
    }
    // Node v14.17.0+
    if ('randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    // Very insecure UUID generator, but it's better than nothing.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Gets a humanized date time string from a given timestamp.
 * @param {number} timestamp Timestamp in milliseconds
 * @returns {string} Humanized date time string in the format `YYYY-MM-DD@HHhMMmSSsMSms`
 */
export function humanizedDateTime(timestamp = Date.now()) {
    const date = new Date(timestamp);
    const dt = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        second: date.getSeconds(),
        millisecond: date.getMilliseconds(),
    };
    for (const key in dt) {
        const padLength = key === 'millisecond' ? 3 : 2;
        dt[key] = dt[key].toString().padStart(padLength, '0');
    }
    return `${dt.year}-${dt.month}-${dt.day}@${dt.hour}h${dt.minute}m${dt.second}s${dt.millisecond}ms`;
}

export function tryParse(str) {
    try {
        return JSON.parse(str);
    } catch {
        return undefined;
    }
}

/**
 * Takes a path to a client-accessible file in the data folder and converts it to a relative URL segment that the
 * client can fetch it from. This involves stripping the data root path prefix and always using `/` as the separator.
 * @param {string} root The root directory of the user data folder.
 * @param {string} inputPath The path to be converted.
 * @returns The relative URL path from which the client can access the file.
 */
export function clientRelativePath(root, inputPath) {
    if (!inputPath.startsWith(root)) {
        throw new Error('Input path does not start with the root directory');
    }

    return inputPath.slice(root.length).split(path.sep).join('/');
}

/**
 * Returns a name that is unique among the names that exist.
 * @param {string} baseName The name to check.
 * @param {{ (name: string): boolean; }} exists Function to check if name exists.
 * @param {Object} [options] The options.
 * @param {((baseName: string, i: number) => string)|null} [options.nameBuilder=null] Function to build the name.
 * @param {number} [options.maxTries=1000] The maximum number of tries to find a unique name. Default is 1000.
 * @param {number} [options.startIndex=1] The index to start with when building the name. Default is 1.
 * @returns {string|null} A unique name. Null if no unique name could be found in `maxTries`.
 */
export function getUniqueName(baseName, exists, { nameBuilder = null, maxTries = 1000, startIndex = 1 } = {}) {
    nameBuilder ??= (baseName, i) => i === 0 ? baseName : `${baseName} (${i})`;
    let i = startIndex;
    let name;
    while (i < maxTries + startIndex) {
        name = nameBuilder(baseName, i);
        if (!exists(name)) {
            return name;
        }
        i++;
    }
    return null;
}

/**
 * Provides safe replacements for characters in filenames.
 * @param {string} char Character to sanitize
 * @returns {string} Safe replacement character
 */
export function sanitizeSafeCharacterReplacements(char) {
    return '_';
}

/**
 * Strip the last file extension from a given file name.
 * @param {string} filename The file name to remove the extension from.
 * @returns The file name, sans extension
 */
export function removeFileExtension(filename) {
    return filename.replace(/\.[^.]+$/, '');
}

export function generateTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * Get a list of images in a directory.
 * @param {string} directoryPath Path to the directory containing the images
 * @param {'name' | 'date'} sortBy Sort images by name or date
 * @param {number} type Bitwise flag representing media types to include
 * @returns {string[]} List of image file names
 */
export function getImages(directoryPath, sortBy = 'name', type = MEDIA_REQUEST_TYPE.IMAGE) {
    function getSortFunction() {
        switch (sortBy) {
            case 'name':
                return Intl.Collator().compare;
            case 'date':
                return (a, b) => fs.statSync(path.join(directoryPath, a)).mtimeMs - fs.statSync(path.join(directoryPath, b)).mtimeMs;
            default:
                return (_a, _b) => 0;
        }
    }

    return fs
        .readdirSync(directoryPath, { withFileTypes: true })
        .filter(dirent => dirent.isFile())
        .map(dirent => dirent.name)
        .filter(file => {
            const fileType = mime.lookup(file);
            if (!fileType) {
                return false;
            }
            if ((type & MEDIA_REQUEST_TYPE.IMAGE) && fileType.startsWith('image/')) {
                return true;
            }
            if ((type & MEDIA_REQUEST_TYPE.VIDEO) && fileType.startsWith('video/')) {
                return true;
            }
            if ((type & MEDIA_REQUEST_TYPE.AUDIO) && fileType.startsWith('audio/')) {
                return true;
            }
            return false;
        })
        .sort(getSortFunction());
}

/**
 * Adds YAML-serialized object to the object.
 * @param {object} obj Object
 * @param {string} yamlString YAML-serialized object
 */
export function mergeObjectWithYaml(obj, yamlString) {
    if (!yamlString) {
        return;
    }

    try {
        const parsedObject = yaml.parse(yamlString);

        if (Array.isArray(parsedObject)) {
            for (const item of parsedObject) {
                if (typeof item === 'object' && item && !Array.isArray(item)) {
                    Object.assign(obj, item);
                }
            }
        }
        else if (parsedObject && typeof parsedObject === 'object') {
            Object.assign(obj, parsedObject);
        }
    } catch {
        // Do nothing
    }
}

/**
 * Removes keys from the object by YAML-serialized array.
 * @param {object} obj Object
 * @param {string} yamlString YAML-serialized array
 * @returns {void}
 */
export function excludeKeysByYaml(obj, yamlString) {
    if (!yamlString) {
        return;
    }

    try {
        const parsedObject = yaml.parse(yamlString);

        if (Array.isArray(parsedObject)) {
            parsedObject.forEach(key => {
                delete obj[key];
            });
        } else if (typeof parsedObject === 'object') {
            Object.keys(parsedObject).forEach(key => {
                delete obj[key];
            });
        } else if (typeof parsedObject === 'string') {
            delete obj[parsedObject];
        }
    } catch {
        // Do nothing
    }
}

/**
 * Removes trailing slash and /v1 from a string.
 * @param {string} str Input string
 * @returns {string} Trimmed string
 */
export function trimV1(str) {
    return String(str ?? '').replace(/\/$/, '').replace(/\/v1$/, '');
}

/**
 * Removes trailing slash from a string.
 * @param {string} str Input string
 * @returns {string} String with trailing slash removed
 */
export function trimTrailingSlash(str) {
    return String(str ?? '').replace(/\/$/, '');
}

/**
 * Removes color formatting from a text string.
 * @param {string} text Text with color formatting
 * @returns {string} Text without color formatting
 */
export function removeColorFormatting(text) {
    return text.replace(/\x1b\[\d{1,2}(;\d{1,2})*m/g, '');
}

/**
 * Gets a separator string repeated n times.
 * @param {number} n Number of times to repeat the separator
 * @returns {string} Separator string
 */
export function getSeparator(n) {
    return '='.repeat(n);
}

/**
 * converts string to boolean accepts 'true' or 'false' else it returns the string put in
 * @param {string|null} str Input string or null
 * @returns {boolean|string|null}
 */
export function stringToBool(str) {
    if (String(str).trim().toLowerCase() === 'true') return true;
    if (String(str).trim().toLowerCase() === 'false') return false;
    return str;
}

/**
 * Set the title of the terminal window
 * @param {string} title Desired title for the window
 */
export function setWindowTitle(title) {
    if (process.platform === 'win32') {
        process.title = title;
    }
    else {
        process.stdout.write(`\x1b]2;${title}\x1b\x5c`);
    }
}

/**
 * Parses a JSON string and applies a mutation function to the parsed object.
 * @param {string} jsonString JSON string to parse
 * @param {function(any): void} mutation Mutation function to apply to the parsed JSON object
 * @returns {string} Mutated JSON string
 */
export function mutateJsonString(jsonString, mutation) {
    try {
        const json = JSON.parse(jsonString);
        mutation(json);
        return JSON.stringify(json);
    } catch (error) {
        console.error('Error parsing or mutating JSON:', error);
        return jsonString;
    }
}

/**
 * Flattens and simplifies a JSON schema to be compatible with the strict requirements
 * of Google's Generative AI API.
 * @param {object} schema The JSON schema to process.
 * @param {string} api The API source.
 * @returns {object} The flattened and simplified schema.
 */
export function flattenSchema(schema, api) {
    if (!schema || typeof schema !== 'object') {
        return schema;
    }

    const schemaCopy = structuredClone(schema);
    const isGoogleApi = [CHAT_COMPLETION_SOURCES.VERTEXAI, CHAT_COMPLETION_SOURCES.MAKERSUITE].includes(api);

    const definitions = schemaCopy.$defs || {};
    delete schemaCopy.$defs;

    function resolve(obj, parents = []) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(item => resolve(item, parents));
        }

        // 1. Resolve $refs first
        if (obj.$ref?.startsWith('#/$defs/')) {
            const defName = obj.$ref.split('/').pop();
            if (parents.includes(defName)) return {}; // Prevent infinite recursion
            if (definitions[defName]) {
                return resolve(structuredClone(definitions[defName]), [...parents, defName]);
            }
            return {}; // Broken reference
        }

        // 2. Process the object's properties
        const result = {};
        for (const key in obj) {
            if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

            // For Google, filter unsupported top-level keywords
            if (isGoogleApi && ['default', 'additionalProperties', 'exclusiveMinimum', 'propertyNames'].includes(key)) {
                continue;
            }

            result[key] = resolve(obj[key], parents);
        }

        return result;
    }

    const flattenedSchema = resolve(schemaCopy);
    delete flattenedSchema.$schema;
    return flattenedSchema;
}
