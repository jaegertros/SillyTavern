/**
 * User authentication, session management, and security middleware.
 * Extracted from users.js
 */
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import process from 'node:process';

import storage from 'node-persist';

import { getConfigValue, color } from '../util.js';
import { readSecret, writeSecret } from '../endpoints/secrets.js';
import { DEFAULT_USER, SETTINGS_FILE } from '../constants.js';
import { serverDirectory } from '../server-directory.js';
import { toKey, getAllUserHandles, getUserDirectories, getAllEnabledUsers } from '../users.js';

const ENABLE_ACCOUNTS = getConfigValue('enableUserAccounts', false, 'boolean');
const AUTHELIA_AUTH = getConfigValue('sso.autheliaAuth', false, 'boolean');
const AUTHENTIK_AUTH = getConfigValue('sso.authentikAuth', false, 'boolean');
const PER_USER_BASIC_AUTH = getConfigValue('perUserBasicAuth', false, 'boolean');
const ANON_CSRF_SECRET = crypto.randomBytes(64).toString('base64');

const STORAGE_KEYS = {
    csrfSecret: 'csrfSecret',
};

/**
 * Prints an error message and exits the process if necessary
 * @param {string} message The error message to print
 * @returns {void}
 */
function logSecurityAlert(message) {
    const { basicAuthMode, whitelistMode } = globalThis.COMMAND_LINE_ARGS;
    if (basicAuthMode || whitelistMode) return; // safe!
    console.error(color.red(message));
    if (getConfigValue('securityOverride', false, 'boolean')) {
        console.warn(color.red('Security has been overridden. If it\'s not a trusted network, change the settings.'));
        return;
    }
    process.exit(1);
}

/**
 * Verifies the security settings and prints warnings if necessary
 * @returns {Promise<void>}
 */
export async function verifySecuritySettings() {
    const { listen, basicAuthMode } = globalThis.COMMAND_LINE_ARGS;

    // Skip all security checks as listen is set to false
    if (!listen) {
        return;
    }

    if (!ENABLE_ACCOUNTS) {
        logSecurityAlert('Your current SillyTavern configuration is insecure (listening to non-localhost). Enable whitelisting, basic authentication or user accounts.');
    }

    const users = await getAllEnabledUsers();
    const unprotectedUsers = users.filter(x => !x.password);
    const unprotectedAdminUsers = unprotectedUsers.filter(x => x.admin);

    if (unprotectedUsers.length > 0) {
        console.warn(color.blue('A friendly reminder that the following users are not password protected:'));
        unprotectedUsers.map(x => `${color.yellow(x.handle)} ${color.red(x.admin ? '(admin)' : '')}`).forEach(x => console.warn(x));
        console.log();
        console.warn(`Consider setting a password in the admin panel or by using the ${color.blue('recover.js')} script.`);
        console.log();

        if (unprotectedAdminUsers.length > 0) {
            logSecurityAlert('If you are not using basic authentication or whitelisting, you should set a password for all admin users.');
        }
    }

    if (basicAuthMode) {
        const perUserBasicAuth = getConfigValue('perUserBasicAuth', false, 'boolean');
        if (perUserBasicAuth && !ENABLE_ACCOUNTS) {
            console.error(color.red(
                'Per-user basic authentication is enabled, but user accounts are disabled. This configuration may be insecure.',
            ));
        } else if (!perUserBasicAuth) {
            const basicAuthUserName = getConfigValue('basicAuthUser.username', '');
            const basicAuthUserPassword = getConfigValue('basicAuthUser.password', '');
            if (!basicAuthUserName || !basicAuthUserPassword) {
                console.warn(color.yellow(
                    'Basic Authentication is enabled, but username or password is not set or empty!',
                ));
            }
        }
    }
}

/**
 * Generates a random password salt.
 * @returns {string} The password salt
 */
export function getPasswordSalt() {
    return crypto.randomBytes(16).toString('base64');
}

/**
 * Get the session name for the current server.
 * @returns {string} The session name
 */
export function getCookieSessionName() {
    // Get server hostname and hash it to generate a session suffix
    const hostname = os.hostname() || 'localhost';
    const suffix = crypto.createHash('sha256').update(hostname).digest('hex').slice(0, 8);
    return `session-${suffix}`;
}

export function getSessionCookieAge() {
    // Defaults to "no expiration" if not set
    const configValue = getConfigValue('sessionTimeout', -1, 'number');

    // Convert to milliseconds
    if (configValue > 0) {
        return configValue * 1000;
    }

    // "No expiration" is just 400 days as per RFC 6265
    if (configValue < 0) {
        return 400 * 24 * 60 * 60 * 1000;
    }

    // 0 means session cookie is deleted when the browser session ends
    // (depends on the implementation of the browser)
    return undefined;
}

/**
 * Hashes a password using scrypt with the provided salt.
 * @param {string} password Password to hash
 * @param {string} salt Salt to use for hashing
 * @returns {string} Hashed password
 */
export function getPasswordHash(password, salt) {
    return crypto.scryptSync(password.normalize(), salt, 64).toString('base64');
}

/**
 * Get the CSRF secret from the storage.
 * @param {import('express').Request} [request] HTTP request object
 * @returns {string} The CSRF secret
 */
export function getCsrfSecret(request) {
    if (!request || !request.user) {
        return ANON_CSRF_SECRET;
    }

    let csrfSecret = readSecret(request.user.directories, STORAGE_KEYS.csrfSecret);

    if (!csrfSecret) {
        csrfSecret = crypto.randomBytes(64).toString('base64');
        writeSecret(request.user.directories, STORAGE_KEYS.csrfSecret, csrfSecret);
    }

    return csrfSecret;
}

/**
 * Checks if the user should be redirected to the login page.
 * @param {import('express').Request} request Request object
 * @returns {boolean} Whether the user should be redirected to the login page
 */
export function shouldRedirectToLogin(request) {
    return ENABLE_ACCOUNTS && !request.user;
}

/**
 * Tries auto-login if there is only one user and it's not password protected.
 * or another configured method such authlia or basic
 * @param {import('express').Request} request Request object
 * @param {boolean} basicAuthMode If Basic auth mode is enabled
 * @returns {Promise<boolean>} Whether auto-login was performed
 */
export async function tryAutoLogin(request, basicAuthMode) {
    if (!ENABLE_ACCOUNTS || request.user || !request.session) {
        return false;
    }

    if (!request.query.noauto) {
        if (await singleUserLogin(request)) {
            return true;
        }

        if (AUTHELIA_AUTH && await autheliaUserLogin(request)) {
            return true;
        }

        if (AUTHENTIK_AUTH && await authentikUserLogin(request)) {
            return true;
        }

        if (basicAuthMode && PER_USER_BASIC_AUTH && await basicUserLogin(request)) {
            return true;
        }
    }

    return false;
}

/**
 * Tries auto-login if there is only one user and it's not password protected.
 * @param {import('express').Request} request Request object
 * @returns {Promise<boolean>} Whether auto-login was performed
 */
async function singleUserLogin(request) {
    if (!request.session) {
        return false;
    }

    const userHandles = await getAllUserHandles();
    if (userHandles.length === 1) {
        const user = await storage.getItem(toKey(userHandles[0]));
        if (user && !user.password) {
            request.session.handle = userHandles[0];
            return true;
        }
    }
    return false;
}

/**
 * Attempts auto-login using an Authelia header.
 * https://www.authelia.com/integration/trusted-header-sso/introduction/
 * @param {import('express').Request} request Request object
 * @returns {Promise<boolean>} Whether auto-login was performed
 */
async function autheliaUserLogin(request) {
    return headerUserLogin(request, 'Remote-User');
}

/**
 * Attempts auto-login using an Authentik header.
 * https://docs.goauthentik.io/add-secure-apps/providers/proxy/forward_auth/
 * @param {import('express').Request} request Request object
 * @returns {Promise<boolean>} Whether auto-login was performed
 */
async function authentikUserLogin(request) {
    return headerUserLogin(request, 'X-Authentik-Username');
}

/**
 * Tries auto-login with a given header.
 * @param {import('express').Request} request Request object
 * @param {string} [header='Remote-User'] The header to use for the trusted user
 * @returns {Promise<boolean>} Whether auto-login was performed
 */
async function headerUserLogin(request, header = 'Remote-User') {
    if (!request.session) {
        return false;
    }

    const remoteUser = request.get(header);
    if (!remoteUser) {
        return false;
    }
    console.debug(`Attempting auto-login for user from header ${header}: ${remoteUser}`);

    const userHandles = await getAllUserHandles();
    for (const userHandle of userHandles) {
        if (remoteUser.toLowerCase() === userHandle) {
            const user = await storage.getItem(toKey(userHandle));
            if (user && user.enabled) {
                request.session.handle = userHandle;
                return true;
            }
        }
    }
    return false;
}

/**
 * Tries auto-login with basic auth username.
 * @param {import('express').Request} request Request object
 * @returns {Promise<boolean>} Whether auto-login was performed
 */
async function basicUserLogin(request) {
    if (!request.session) {
        return false;
    }

    const authHeader = request.headers.authorization;

    if (!authHeader) {
        return false;
    }

    const [scheme, credentials] = authHeader.split(' ');

    if (scheme !== 'Basic' || !credentials) {
        return false;
    }

    const [username, ...passwordParts] = Buffer.from(credentials, 'base64')
        .toString('utf8')
        .split(':');
    const password = passwordParts.join(':');

    const userHandles = await getAllUserHandles();
    for (const userHandle of userHandles) {
        if (username === userHandle) {
            const user = await storage.getItem(toKey(userHandle));
            // Verify pass again here just to be sure
            if (user && user.enabled && user.password && user.password === getPasswordHash(password, user.salt)) {
                request.session.handle = userHandle;
                return true;
            }
        }
    }

    return false;
}

/**
 * Middleware to add user data to the request object.
 * @param {import('express').Request} request Request object
 * @param {import('express').Response} response Response object
 * @param {import('express').NextFunction} next Next function
 */
export async function setUserDataMiddleware(request, response, next) {
    // If user accounts are disabled, use the default user
    if (!ENABLE_ACCOUNTS) {
        const handle = DEFAULT_USER.handle;
        const directories = getUserDirectories(handle);
        request.user = {
            profile: DEFAULT_USER,
            directories: directories,
        };
        return next();
    }

    if (!request.session) {
        console.error('Session not available');
        return response.sendStatus(500);
    }

    // If user accounts are enabled, get the user from the session
    let handle = request.session?.handle;

    // If we have the only user and it's not password protected, use it
    if (!handle) {
        return next();
    }

    /** @type {import('../users.js').User} */
    const user = await storage.getItem(toKey(handle));

    if (!user) {
        console.error('User not found:', handle);
        return next();
    }

    if (!user.enabled) {
        console.error('User is disabled:', handle);
        return next();
    }

    const directories = getUserDirectories(handle);
    request.user = {
        profile: user,
        directories: directories,
    };

    // Touch the session if loading the home page
    if (request.method === 'GET' && request.path === '/') {
        request.session.touch = Date.now();
    }

    return next();
}

/**
 * Middleware to add user data to the request object.
 * @param {import('express').Request} request Request object
 * @param {import('express').Response} response Response object
 * @param {import('express').NextFunction} next Next function
 */
export function requireLoginMiddleware(request, response, next) {
    if (!request.user) {
        return response.sendStatus(403);
    }

    return next();
}

/**
 * Middleware to host the login page.
 * @param {import('express').Request} request Request object
 * @param {import('express').Response} response Response object
 */
export async function loginPageMiddleware(request, response) {
    if (!ENABLE_ACCOUNTS) {
        console.log('User accounts are disabled. Redirecting to index page.');
        return response.redirect('/');
    }

    try {
        const { basicAuthMode } = globalThis.COMMAND_LINE_ARGS;
        const autoLogin = await tryAutoLogin(request, basicAuthMode);

        if (autoLogin) {
            return response.redirect('/');
        }
    } catch (error) {
        console.error('Error during auto-login:', error);
    }

    return response.sendFile('login.html', { root: path.join(serverDirectory, 'public') });
}

/**
 * Verifies that the current user is an admin.
 * @param {import('express').Request} request Request object
 * @param {import('express').Response} response Response object
 * @param {import('express').NextFunction} next Next function
 * @returns {any}
 */
export function requireAdminMiddleware(request, response, next) {
    if (!request.user) {
        return response.sendStatus(403);
    }

    if (request.user.profile.admin) {
        return next();
    }

    console.warn('Unauthorized access to admin endpoint:', request.originalUrl);
    return response.sendStatus(403);
}
