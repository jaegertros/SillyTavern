// ============================================================
// SAFE browser API wrapper (works in ALL contexts:
//   content scripts, background scripts, service workers)
// ============================================================

(function () {
    const raw = typeof browser !== 'undefined'
        ? browser
        : (typeof chrome !== 'undefined' ? chrome : null);

    if (!raw) {
        console.error('[browser-api] No browser API found');
        return;
    }

    // Firefox APIs are Promise-based natively.
    // Chrome MV3 APIs are mostly Promise-based too.
    // This wrapper normalizes the few remaining callback-based APIs.
    function promisify(fn, ctx) {
        if (!fn) return undefined;

        return (...args) => {
            try {
                const result = fn.apply(ctx, args);

                // Already a Promise (Firefox, Chrome MV3)
                if (result && typeof result.then === 'function') {
                    return result;
                }

                // Chrome callback-based fallback
                return new Promise((resolve, reject) => {
                    fn.call(ctx, ...args, (res) => {
                        const err = raw.runtime?.lastError;
                        if (err) reject(err);
                        else resolve(res);
                    });
                });

            } catch (err) {
                console.error('[browser-api] call failed:', err);
                return Promise.reject(err);
            }
        };
    }

    const api = {
        runtime: raw.runtime || {},
        storage: {
            local: raw.storage?.local
                ? {
                    get: promisify(raw.storage.local.get, raw.storage.local),
                    set: promisify(raw.storage.local.set, raw.storage.local),
                }
                : {},
        },
    };

    // Storage change events — pass through directly
    if (raw.storage?.onChanged) {
        api.storage.onChanged = raw.storage.onChanged;
    }

    // Tabs — promisified calls + raw event passthroughs
    if (raw.tabs) {
        api.tabs = {};
        if (raw.tabs.query)       api.tabs.query = promisify(raw.tabs.query, raw.tabs);
        if (raw.tabs.sendMessage) api.tabs.sendMessage = promisify(raw.tabs.sendMessage, raw.tabs);
        if (raw.tabs.onUpdated)   api.tabs.onUpdated = raw.tabs.onUpdated;
        if (raw.tabs.onRemoved)   api.tabs.onRemoved = raw.tabs.onRemoved;
    }

    // Action (MV3) or browserAction (MV2) — exposed as "action"
    const rawAction = raw.action || raw.browserAction;
    if (rawAction) {
        api.action = {};
        if (rawAction.onClicked) api.action.onClicked = rawAction.onClicked;
        if (rawAction.setIcon)   api.action.setIcon = promisify(rawAction.setIcon, rawAction);
        if (rawAction.setBadgeText) api.action.setBadgeText = promisify(rawAction.setBadgeText, rawAction);
        if (rawAction.setBadgeBackgroundColor) {
            api.action.setBadgeBackgroundColor = promisify(rawAction.setBadgeBackgroundColor, rawAction);
        }
    }

    // Use globalThis so it works in service workers (no `window`)
    const target = typeof globalThis !== 'undefined' ? globalThis : self;
    target.browserAPI = api;

    console.log('[browser-api] Loaded safely:', Object.keys(api));
})();
