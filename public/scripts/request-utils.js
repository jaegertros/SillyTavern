/**
 * request-utils.js
 *
 * Shared HTTP request utilities.
 * Extracted from script.js to allow importing without pulling in the full monolith.
 *
 * NOTE: imports `token` from script.js — circular dep is safe because `token`
 * is only read inside the function body, never at module init time.
 */

// Circular import — intentional and safe (read at call time, not init time)
import { token } from './core/state.js';

/**
 * Returns the standard headers object for authenticated API requests.
 * @param {object} [options={}]
 * @param {boolean} [options.omitContentType=false] Set true for multipart / non-JSON requests
 * @returns {Record<string, string>}
 */
export function getRequestHeaders({ omitContentType = false } = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token,
    };

    if (omitContentType) {
        delete headers['Content-Type'];
    }

    return headers;
}
