/**
 * User management — directory listing, storage, avatars, and file-serving router.
 * Auth/session logic extracted to users/user-auth.js
 * Migration logic extracted to users/user-migration.js
 */
// Native Node Modules
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

// Express and other dependencies
import storage from 'node-persist';
import express from 'express';
import mime from 'mime-types';
import archiver from 'archiver';
import { sync as writeFileAtomicSync } from 'write-file-atomic';
import sanitize from 'sanitize-filename';

import { USER_DIRECTORY_TEMPLATE, DEFAULT_USER, PUBLIC_DIRECTORIES, SETTINGS_FILE, UPLOADS_DIRECTORY } from './constants.js';
import { getConfigValue, color, generateTimestamp, invalidateFirefoxCache } from './util.js';

export const KEY_PREFIX = 'user:';
const AVATAR_PREFIX = 'avatar:';
const COOKIE_SECRET_PATH = 'cookie-secret.txt';

const STORAGE_KEYS = {
    /**
     * @deprecated Read from COOKIE_SECRET_PATH in DATA_ROOT instead.
     */
    cookieSecret: 'cookieSecret',
};

/**
 * Cache for user directories.
 * @type {Map<string, UserDirectoryList>}
 */
const DIRECTORIES_CACHE = new Map();
const PUBLIC_USER_AVATAR = '/img/default-user.png';

/**
 * @typedef {Object} User
 * @property {string} handle - The user's short handle. Used for directories and other references
 * @property {string} name - The user's name. Displayed in the UI
 * @property {number} created - The timestamp when the user was created
 * @property {string} password - Scrypt hash of the user's password
 * @property {string} salt - Salt used for hashing the password
 * @property {boolean} enabled - Whether the user is enabled
 * @property {boolean} admin - Whether the user is an admin (can manage other users)
 */

/**
 * @typedef {Object} UserViewModel
 * @property {string} handle - The user's short handle. Used for directories and other references
 * @property {string} name - The user's name. Displayed in the UI
 * @property {string} avatar - The user's avatar image
 * @property {boolean} [admin] - Whether the user is an admin (can manage other users)
 * @property {boolean} password - Whether the user is password protected
 * @property {boolean} [enabled] - Whether the user is enabled
 * @property {number} [created] - The timestamp when the user was created
 */

/**
 * @typedef {Object} UserDirectoryList
 * @property {string} root - The root directory for the user
 * @property {string} thumbnails - The directory where the thumbnails are stored
 * @property {string} thumbnailsBg - The directory where the background thumbnails are stored
 * @property {string} thumbnailsAvatar - The directory where the avatar thumbnails are stored
 * @property {string} thumbnailsPersona - The directory where the persona thumbnails are stored
 * @property {string} worlds - The directory where the WI are stored
 * @property {string} user - The directory where the user's public data is stored
 * @property {string} avatars - The directory where the avatars are stored
 * @property {string} userImages - The directory where the images are stored
 * @property {string} groups - The directory where the groups are stored
 * @property {string} groupChats - The directory where the group chats are stored
 * @property {string} chats - The directory where the chats are stored
 * @property {string} characters - The directory where the characters are stored
 * @property {string} backgrounds - The directory where the backgrounds are stored
 * @property {string} novelAI_Settings - The directory where the NovelAI settings are stored
 * @property {string} koboldAI_Settings - The directory where the KoboldAI settings are stored
 * @property {string} openAI_Settings - The directory where the OpenAI settings are stored
 * @property {string} textGen_Settings - The directory where the TextGen settings are stored
 * @property {string} themes - The directory where the themes are stored
 * @property {string} movingUI - The directory where the moving UI data is stored
 * @property {string} extensions - The directory where the extensions are stored
 * @property {string} instruct - The directory where the instruct templates is stored
 * @property {string} context - The directory where the context templates is stored
 * @property {string} quickreplies - The directory where the quick replies are stored
 * @property {string} assets - The directory where the assets are stored
 * @property {string} comfyWorkflows - The directory where the ComfyUI workflows are stored
 * @property {string} files - The directory where the uploaded files are stored
 * @property {string} vectors - The directory where the vectors are stored
 * @property {string} backups - The directory where the backups are stored
 * @property {string} sysprompt - The directory where the system prompt data is stored
 * @property {string} reasoning - The directory where the reasoning templates are stored
 */

/**
 * Ensures that the content directories exist.
 * @returns {Promise<import('./users.js').UserDirectoryList[]>} - The list of user directories
 */
export async function ensurePublicDirectoriesExist() {
    for (const dir of Object.values(PUBLIC_DIRECTORIES)) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    const userHandles = await getAllUserHandles();
    const directoriesList = userHandles.map(handle => getUserDirectories(handle));
    for (const userDirectories of directoriesList) {
        for (const dir of Object.values(userDirectories)) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }
    return directoriesList;
}

export function cleanUploads() {
    try {
        const uploadsPath = path.join(globalThis.DATA_ROOT, UPLOADS_DIRECTORY);
        if (fs.existsSync(uploadsPath)) {
            const uploads = fs.readdirSync(uploadsPath);

            if (!uploads.length) {
                return;
            }

            console.debug(`Cleaning uploads folder (${uploads.length} files)`);
            uploads.forEach(file => {
                const pathToFile = path.join(uploadsPath, file);
                fs.unlinkSync(pathToFile);
            });
        }
    } catch (err) {
        console.error(err);
    }
}

/**
 * Gets a list of all user directories.
 * @returns {Promise<import('./users.js').UserDirectoryList[]>} - The list of user directories
 */
export async function getUserDirectoriesList() {
    const userHandles = await getAllUserHandles();
    const directoriesList = userHandles.map(handle => getUserDirectories(handle));
    return directoriesList;
}

/**
 * Converts a user handle to a storage key.
 * @param {string} handle User handle
 * @returns {string} The key for the user storage
 */
export function toKey(handle) {
    return `${KEY_PREFIX}${handle}`;
}

/**
 * Converts a user handle to a storage key for avatars.
 * @param {string} handle User handle
 * @returns {string} The key for the avatar storage
 */
export function toAvatarKey(handle) {
    return `${AVATAR_PREFIX}${handle}`;
}

/**
 * Initializes the user storage.
 * @param {string} dataRoot The root directory for user data
 * @returns {Promise<void>}
 */
export async function initUserStorage(dataRoot) {
    console.log('Using data root:', color.green(dataRoot));
    await storage.init({
        dir: path.join(dataRoot, '_storage'),
        ttl: false, // Never expire
        expiredInterval: 0,
    });

    const keys = await getAllUserHandles();

    // If there are no users, create the default user
    if (keys.length === 0) {
        await storage.setItem(toKey(DEFAULT_USER.handle), DEFAULT_USER);
    }
}

/**
 * Get the cookie secret from the config. If it doesn't exist, generate a new one.
 * @param {string} dataRoot The root directory for user data
 * @returns {string} The cookie secret
 */
export function getCookieSecret(dataRoot) {
    const cookieSecretPath = path.join(dataRoot, COOKIE_SECRET_PATH);

    if (fs.existsSync(cookieSecretPath)) {
        const stat = fs.statSync(cookieSecretPath);
        if (stat.size > 0) {
            return fs.readFileSync(cookieSecretPath, 'utf8');
        }
    }

    const oldSecret = getConfigValue(STORAGE_KEYS.cookieSecret);
    if (oldSecret) {
        console.log('Migrating cookie secret from config.yaml...');
        writeFileAtomicSync(cookieSecretPath, oldSecret, { encoding: 'utf8' });
        return oldSecret;
    }

    console.warn(color.yellow('Cookie secret is missing from data root. Generating a new one...'));
    const secret = crypto.randomBytes(64).toString('base64');
    writeFileAtomicSync(cookieSecretPath, secret, { encoding: 'utf8' });
    return secret;
}

/**
 * Gets a list of all user handles.
 * @returns {Promise<string[]>} - The list of user handles
 */
export async function getAllUserHandles() {
    const keys = await storage.keys(x => x.key.startsWith(KEY_PREFIX));
    const handles = keys.map(x => x.replace(KEY_PREFIX, ''));
    return handles;
}

/**
 * Gets the directories listing for the provided user.
 * @param {string} handle User handle
 * @returns {UserDirectoryList} User directories
 */
export function getUserDirectories(handle) {
    if (DIRECTORIES_CACHE.has(handle)) {
        const cache = DIRECTORIES_CACHE.get(handle);
        if (cache) {
            return cache;
        }
    }

    const directories = structuredClone(USER_DIRECTORY_TEMPLATE);
    for (const key in directories) {
        directories[key] = path.join(globalThis.DATA_ROOT, handle, USER_DIRECTORY_TEMPLATE[key]);
    }
    DIRECTORIES_CACHE.set(handle, directories);
    return directories;
}

/**
 * Gets the avatar URL for the provided user.
 * @param {string} handle User handle
 * @returns {Promise<string>} User avatar URL
 */
export async function getUserAvatar(handle) {
    try {
        // Check if the user has a custom avatar
        const avatarKey = toAvatarKey(handle);
        const avatar = await storage.getItem(avatarKey);

        if (avatar) {
            return avatar;
        }

        // Fallback to reading from files if custom avatar is not set
        const directory = getUserDirectories(handle);
        const pathToSettings = path.join(directory.root, SETTINGS_FILE);
        const settings = fs.existsSync(pathToSettings) ? JSON.parse(fs.readFileSync(pathToSettings, 'utf8')) : {};
        const avatarFile = settings?.power_user?.default_persona || settings?.user_avatar;
        if (!avatarFile) {
            return PUBLIC_USER_AVATAR;
        }
        const avatarPath = path.join(directory.avatars, sanitize(avatarFile));
        if (!fs.existsSync(avatarPath)) {
            return PUBLIC_USER_AVATAR;
        }
        const mimeType = mime.lookup(avatarPath);
        const base64Content = fs.readFileSync(avatarPath, 'base64');
        return `data:${mimeType};base64,${base64Content}`;
    }
    catch {
        // Ignore errors
        return PUBLIC_USER_AVATAR;
    }
}

/**
 * Gets all of the users.
 * @returns {Promise<User[]>}
 */
async function getAllUsers() {
    const ENABLE_ACCOUNTS = getConfigValue('enableUserAccounts', false, 'boolean');
    if (!ENABLE_ACCOUNTS) {
        return [];
    }
    /**
     * @type {User[]}
     */
    const users = await storage.values();
    return users;
}

/**
 * Gets all of the enabled users.
 * @returns {Promise<User[]>}
 */
export async function getAllEnabledUsers() {
    const users = await getAllUsers();
    return users.filter(x => x.enabled);
}

/**
 * Creates an archive of the user's data root directory.
 * @param {string} handle User handle
 * @param {import('express').Response} response Express response object to write to
 * @returns {Promise<void>} Promise that resolves when the archive is created
 */
export async function createBackupArchive(handle, response) {
    const directories = getUserDirectories(handle);

    console.info('Backup requested for', handle);
    const archive = archiver('zip');

    archive.on('error', function (err) {
        response.status(500).send({ error: err.message });
    });

    // On stream closed we can end the request
    archive.on('end', function () {
        console.info('Archive wrote %d bytes', archive.pointer());
        response.end(); // End the Express response
    });

    const timestamp = generateTimestamp();

    // Set the archive name
    response.attachment(`${handle}-${timestamp}.zip`);

    // This is the streaming magic
    // @ts-ignore
    archive.pipe(response);

    // Append files from a sub-directory, putting its contents at the root of archive
    archive.directory(directories.root, false);
    archive.finalize();
}

/**
 * Resolves the splat parameter from an Express 5 wildcard route.
 * @param {import('express').Request} req
 * @returns {string}
 */
function resolveSplatPath(req) {
    const raw = req.params.splat ?? req.params[0];
    if (Array.isArray(raw)) {
        return raw.map(s => decodeURIComponent(String(s))).join('/');
    }
    return decodeURIComponent(String(raw ?? ''));
}

/**
 * Creates a route handler for serving files from a specific directory.
 * @param {(req: import('express').Request) => string} directoryFn A function that returns the directory path to serve files from
 * @returns {import('express').RequestHandler}
 */
function createRouteHandler(directoryFn) {
    return async (req, res) => {
        try {
            const directory = directoryFn(req);
            const filePath = resolveSplatPath(req);
            const exists = fs.existsSync(path.join(directory, filePath));
            if (!exists) {
                return res.sendStatus(404);
            }

            invalidateFirefoxCache(filePath, req, res);
            return res.sendFile(filePath, { root: directory });
        } catch (error) {
            return res.sendStatus(500);
        }
    };
}

/**
 * Creates a route handler for serving extensions.
 * @param {(req: import('express').Request) => string} directoryFn A function that returns the directory path to serve files from
 * @returns {import('express').RequestHandler}
 */
function createExtensionsRouteHandler(directoryFn) {
    return async (req, res) => {
        try {
            const directory = directoryFn(req);
            const filePath = resolveSplatPath(req);

            const existsLocal = fs.existsSync(path.join(directory, filePath));
            if (existsLocal) {
                return res.sendFile(filePath, { root: directory });
            }

            const existsGlobal = fs.existsSync(path.join(PUBLIC_DIRECTORIES.globalExtensions, filePath));
            if (existsGlobal) {
                return res.sendFile(filePath, { root: PUBLIC_DIRECTORIES.globalExtensions });
            }

            return res.sendStatus(404);
        } catch (error) {
            return res.sendStatus(500);
        }
    };
}

/**
 * Express router for serving files from the user's directories.
 */
export const router = express.Router();
router.use('/backgrounds/{*splat}', createRouteHandler(req => req.user.directories.backgrounds));
router.use('/characters/{*splat}', createRouteHandler(req => req.user.directories.characters));
router.use('/User%20Avatars/{*splat}', createRouteHandler(req => req.user.directories.avatars));
router.use('/assets/{*splat}', createRouteHandler(req => req.user.directories.assets));
router.use('/user/images/{*splat}', createRouteHandler(req => req.user.directories.userImages));
router.use('/user/files/{*splat}', createRouteHandler(req => req.user.directories.files));
router.use('/scripts/extensions/third-party/{*splat}', createExtensionsRouteHandler(req => req.user.directories.extensions));

// Re-exports for backward compatibility
export {
    verifySecuritySettings,
    getPasswordSalt,
    getCookieSessionName,
    getSessionCookieAge,
    getPasswordHash,
    getCsrfSecret,
    shouldRedirectToLogin,
    tryAutoLogin,
    setUserDataMiddleware,
    requireLoginMiddleware,
    loginPageMiddleware,
    requireAdminMiddleware,
} from './users/user-auth.js';

export {
    migrateUserData,
    migrateSystemPrompts,
} from './users/user-migration.js';
