/**
 * File system utilities — extracted from util.js
 */
import path from 'node:path';
import fs from 'node:fs';
import readline from 'node:readline';

import { sync as writeFileAtomicSync } from 'write-file-atomic';
import mime from 'mime-types';

import { getConfigValue } from './config.js';
import { isFirefox } from '../express-common.js';

/**
 * Ensures a directory exists, creating it if necessary.
 * @param {string} dirPath Path to the directory
 * @returns {boolean} True if the directory exists or was created, false on error
 */
export function ensureDirectory(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        } else if (!fs.statSync(dirPath).isDirectory()) {
            console.warn(`ensureDirectory: Path ${dirPath} exists and is not a directory.`);
            return false;
        }
        return true;
    } catch (error) {
        console.error(`ensureDirectory: Failed to prepare directory ${dirPath}`, error);
        return false;
    }
}

/**
 * Remove old backups with the given prefix from a specified directory.
 * @param {string} directory The root directory to remove backups from.
 * @param {string} prefix File prefix to filter backups by.
 * @param {number?} limit Maximum number of backups to keep. If null, the limit is determined by the `backups.common.numberOfBackups` config value.
 */
export function removeOldBackups(directory, prefix, limit = null) {
    const MAX_BACKUPS = limit ?? Number(getConfigValue('backups.common.numberOfBackups', 50, 'number'));

    let files = fs.readdirSync(directory).filter(f => f.startsWith(prefix));
    if (files.length > MAX_BACKUPS) {
        files = files.map(f => path.join(directory, f));
        files.sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);

        while (files.length > MAX_BACKUPS) {
            const oldest = files.shift();
            if (!oldest) {
                break;
            }

            fs.unlinkSync(oldest);
        }
    }
}

/**
 * A 'safe' version of `fs.readFileSync()`. Returns the contents of a file if it exists, falling back to a default value if not.
 * @param {string} filePath Path of the file to be read.
 * @param {Parameters<typeof fs.readFileSync>[1]} options Options object to pass through to `fs.readFileSync()` (default: `{ encoding: 'utf-8' }`).
 * @returns The contents at `filePath` if it exists, or `null` if not.
 */
export function safeReadFileSync(filePath, options = { encoding: 'utf-8' }) {
    if (fs.existsSync(filePath)) return fs.readFileSync(filePath, options);
    return null;
}

/**
 * Sets the permissions of a file or directory to be writable.
 * @param {string} targetPath Path to the file or directory
 */
export function setPermissionsSync(targetPath) {
    /**
     * Appends writable permission to the file mode.
     * @param {string} filePath Path to the file
     * @param {fs.Stats} stats File stats
     */
    function appendWritablePermission(filePath, stats) {
        const currentMode = stats.mode;
        const newMode = currentMode | 0o200;
        if (newMode != currentMode) {
            fs.chmodSync(filePath, newMode);
        }
    }

    try {
        const stats = fs.statSync(targetPath);

        if (stats.isDirectory()) {
            appendWritablePermission(targetPath, stats);
            const files = fs.readdirSync(targetPath);

            files.forEach((file) => {
                setPermissionsSync(path.join(targetPath, file));
            });
        } else {
            appendWritablePermission(targetPath, stats);
        }
    } catch (error) {
        console.error(`Error setting write permissions for ${targetPath}:`, error);
    }
}

/**
 * Checks if a child path is under a parent path.
 * @param {string} parentPath Parent path
 * @param {string} childPath Child path
 * @returns {boolean} Returns true if the child path is under the parent path, false otherwise
 */
export function isPathUnderParent(parentPath, childPath) {
    const normalizedParent = path.normalize(parentPath);
    const normalizedChild = path.normalize(childPath);

    const relativePath = path.relative(normalizedParent, normalizedChild);

    return !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
}

/**
 * Writes to a file, creating it's parent directories if needed.
 * @param {string} filePath
 * @param {string} data
 */
export function tryWriteFileSync(filePath, data) {
    const directory = path.dirname(filePath);
    //Ensure the directory exists.
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
    writeFileAtomicSync(filePath, data, 'utf8');
}

/**
* Attempts to read a file as utf8.
* @param {string} filePath
* @returns {string|null}
*/
export function tryReadFileSync(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'utf8');
        }
    } catch (error) {
        console.error(`Error reading ${filePath}: ${error.message}`);
    }
    return null;
}

/**
* Attempts to delete a file.
* @param {string} filePath Target file.
* @returns {boolean} Returns true if the file was found and deleted.
*/
export function tryDeleteFile(filePath) {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.info(`Deleted file: ${filePath}`);
        return true;
    } else {
        console.error(`File not found '${filePath}'`);
        return false;
    }
}

/**
 * Reads the first line of a file asynchronously.
 * @param {string} filePath Path to the file
 * @returns {Promise<string>} The first line of the file
 */
export function readFirstLine(filePath) {
    const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream });
    return new Promise((resolve, reject) => {
        let resolved = false;
        rl.on('line', line => {
            resolved = true;
            rl.close();
            stream.close();
            resolve(line);
        });

        rl.on('error', error => {
            resolved = true;
            reject(error);
        });

        // Handle empty files
        stream.on('end', () => {
            if (!resolved) {
                resolved = true;
                resolve('');
            }
        });
    });
}

/**
 * If the file is an image, and the request's user agent matches Firefox, then the response's headers are set to invalidate the cache.
 * Without this, Firefox ignores updated images even after a refresh.
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
 * @param {string} file File path
 * @param {import('express').Request} request Request object
 * @param {import('express').Response} response Response object
 */
export function invalidateFirefoxCache(file, request, response) {
    const mimeType = isFirefox(request) && mime.lookup(file);
    if (mimeType && mimeType.startsWith('image/')) {
        response.setHeader('Cache-Control', 'must-understand, no-store');
    }
}
