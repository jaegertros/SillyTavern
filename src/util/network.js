/**
 * Network and HTTP utilities — extracted from util.js
 */
import http2 from 'node:http2';
import { Readable } from 'node:stream';
import { Buffer } from 'node:buffer';
import { promises as dnsPromise } from 'node:dns';
import os from 'node:os';

/**
 * Encodes the Basic Auth header value for the given user and password.
 * @param {string} auth username:password
 * @returns {string} Basic Auth header value
 */
export function getBasicAuthHeader(auth) {
    const encoded = Buffer.from(`${auth}`).toString('base64');
    return `Basic ${encoded}`;
}

/**
 * Pipe a fetch() response to an Express.js Response, including status code.
 * @param {import('node-fetch').Response} from The Fetch API response to pipe from.
 * @param {import('express').Response} to The Express response to pipe to.
 */
export function forwardFetchResponse(from, to) {
    let statusCode = from.status;
    let statusText = from.statusText;

    if (!from.ok) {
        console.warn(`Streaming request failed with status ${statusCode} ${statusText}`);
    }

    // Avoid sending 401 responses as they reset the client Basic auth.
    // This can produce an interesting artifact as "400 Unauthorized", but it's not out of spec.
    // https://www.rfc-editor.org/rfc/rfc9110.html#name-overview-of-status-codes
    // "The reason phrases listed here are only recommendations -- they can be replaced by local
    //  equivalents or left out altogether without affecting the protocol."
    if (statusCode === 401) {
        statusCode = 400;
    }

    to.statusCode = statusCode;
    to.statusMessage = statusText;

    if (from.body && to.socket) {
        from.body.pipe(to);

        to.socket.on('close', function () {
            if (from.body instanceof Readable) from.body.destroy(); // Close the remote stream

            to.end(); // End the Express response
        });

        from.body.on('end', function () {
            console.info('Streaming request finished');
            to.end();
        });
    } else {
        to.end();
    }
}

/**
 * Makes an HTTP/2 request to the specified endpoint.
 *
 * @deprecated Use `node-fetch` if possible.
 * @param {string} endpoint URL to make the request to
 * @param {string} method HTTP method to use
 * @param {string} body Request body
 * @param {object} headers Request headers
 * @returns {Promise<string>} Response body
 */
export function makeHttp2Request(endpoint, method, body, headers) {
    return new Promise((resolve, reject) => {
        try {
            const url = new URL(endpoint);
            const client = http2.connect(url.origin);

            const req = client.request({
                ':method': method,
                ':path': url.pathname,
                ...headers,
            });
            req.setEncoding('utf8');

            req.on('response', (headers) => {
                const status = Number(headers[':status']);

                if (status < 200 || status >= 300) {
                    reject(new Error(`Request failed with status ${status}`));
                }

                let data = '';

                req.on('data', (chunk) => {
                    data += chunk;
                });

                req.on('end', () => {
                    console.debug(data);
                    resolve(data);
                });
            });

            req.on('error', (err) => {
                reject(err);
            });

            if (body) {
                req.write(body);
            }

            req.end();
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Checks if the string is a valid URL.
 * @param {string} url String to check
 * @returns {boolean} If the URL is valid
 */
export function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * removes starting `[` or ending `]` from hostname.
 * @param {string} hostname hostname to use
 * @returns {string} hostname plus the modifications
 */
export function urlHostnameToIPv6(hostname) {
    if (hostname.startsWith('[')) {
        hostname = hostname.slice(1);
    }
    if (hostname.endsWith(']')) {
        hostname = hostname.slice(0, -1);
    }
    return hostname;
}

/**
 * Test if can resolve a dns name.
 * @param {string} name Domain name to use
 * @param {boolean} useIPv6 If use IPv6
 * @param {boolean} useIPv4 If use IPv4
 * @returns Promise<boolean> If the URL is valid
 */
export async function canResolve(name, useIPv6 = true, useIPv4 = true) {
    try {
        let v6Resolved = false;
        let v4Resolved = false;

        if (useIPv6) {
            try {
                await dnsPromise.resolve6(name);
                v6Resolved = true;
            } catch (error) {
                v6Resolved = false;
            }
        }

        if (useIPv4) {
            try {
                await dnsPromise.resolve(name);
                v4Resolved = true;
            } catch (error) {
                v4Resolved = false;
            }
        }

        return v6Resolved || v4Resolved;

    } catch (error) {
        return false;
    }
}

/**
 * Checks the network interfaces to determine the presence of IPv6 and IPv4 addresses.
 *
 * @typedef {object} IPQueryResult
 * @property {boolean} hasIPv6Any - Whether the computer has any IPv6 address, including (`::1`).
 * @property {boolean} hasIPv4Any - Whether the computer has any IPv4 address, including (`127.0.0.1`).
 * @property {boolean} hasIPv6Local - Whether the computer has local IPv6 address (`::1`).
 * @property {boolean} hasIPv4Local - Whether the computer has local IPv4 address (`127.0.0.1`).
 * @returns {Promise<IPQueryResult>} A promise that resolves to an array containing:
 */
export async function getHasIP() {
    let hasIPv6Any = false;
    let hasIPv6Local = false;

    let hasIPv4Any = false;
    let hasIPv4Local = false;

    const interfaces = os.networkInterfaces();

    for (const iface of Object.values(interfaces)) {
        if (iface === undefined) {
            continue;
        }

        for (const info of iface) {
            if (info.family === 'IPv6') {
                hasIPv6Any = true;
                if (info.address === '::1') {
                    hasIPv6Local = true;
                }
            }

            if (info.family === 'IPv4') {
                hasIPv4Any = true;
                if (info.address === '127.0.0.1') {
                    hasIPv4Local = true;
                }
            }
            if (hasIPv6Any && hasIPv4Any && hasIPv6Local && hasIPv4Local) break;
        }
        if (hasIPv6Any && hasIPv4Any && hasIPv6Local && hasIPv4Local) break;
    }

    return { hasIPv6Any, hasIPv4Any, hasIPv6Local, hasIPv4Local };
}

/**
 * Checks if the given request is a file URL.
 * @param {string | URL | Request} request The request to check
 * @return {boolean} Returns true if the request is a file URL, false otherwise
 */
export function isFileURL(request) {
    if (typeof request === 'string') {
        return request.startsWith('file://');
    }
    if (request instanceof URL) {
        return request.protocol === 'file:';
    }
    if (request instanceof Request) {
        return request.url.startsWith('file://');
    }
    return false;
}

/**
 * Gets the URL from the request.
 * @param {string | URL | Request} request The request to get the URL from
 * @return {string} The URL of the request
 */
export function getRequestURL(request) {
    if (typeof request === 'string') {
        return request;
    }
    if (request instanceof URL) {
        return request.href;
    }
    if (request instanceof Request) {
        return request.url;
    }
    throw new TypeError('Invalid request type');
}
