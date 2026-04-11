/**
 * ST Call Tracker — dev-only runtime instrumentation for script.js exports.
 *
 * Usage (browser console):
 *   __stReport()          — print a sorted summary of all recorded calls
 *   __stReport('raw')     — return raw data as a plain object
 *   __stClear()           — reset all recorded data
 *   __stTop(n)            — show the top N most-called functions (default 20)
 *   __stCallers('name')   — show all unique call sites for a specific function
 */

const calls = new Map(); // name -> { count, callers: Map<callerSig, hitCount> }

/**
 * Record a single call. Called automatically by instrumented functions.
 * @param {string} name - exported function name
 */
export function track(name) {
    if (!calls.has(name)) {
        calls.set(name, { count: 0, callers: new Map() });
    }

    const entry = calls.get(name);
    entry.count++;

    // Pull the most useful frame from the stack — skip track() itself and
    // the instrumented function, land on whoever actually called it.
    const raw = new Error().stack ?? '';
    const frames = raw.split('\n').slice(3); // skip Error, track(), instrumented fn
    const caller = frames.find(f => f.includes('.js')) ?? frames[0] ?? 'unknown';
    const sig = caller.trim();

    entry.callers.set(sig, (entry.callers.get(sig) ?? 0) + 1);
}

// ─── Console helpers ────────────────────────────────────────────────────────

function toRaw() {
    return Object.fromEntries(
        [...calls.entries()].map(([name, { count, callers }]) => [
            name,
            { count, callers: Object.fromEntries(callers) },
        ]),
    );
}

window.__stReport = function (mode = 'print') {
    if (!calls.size) {
        console.log('[ST Tracker] No calls recorded yet. Use the app then run __stReport().');
        return;
    }

    if (mode === 'raw') return toRaw();

    const sorted = [...calls.entries()].sort((a, b) => b[1].count - a[1].count);

    console.group(`📊 script.js call tracker — ${sorted.length} functions called`);
    for (const [name, { count, callers }] of sorted) {
        console.groupCollapsed(`${name}  ×${count}`);
        for (const [site, hits] of [...callers.entries()].sort((a, b) => b[1] - a[1])) {
            console.log(`  ×${hits}  ${site}`);
        }
        console.groupEnd();
    }
    console.groupEnd();
    return toRaw();
};

window.__stTop = function (n = 20) {
    const sorted = [...calls.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, n);

    console.table(
        Object.fromEntries(sorted.map(([name, { count, callers }]) => [
            name,
            { calls: count, uniqueCallers: callers.size },
        ])),
    );
};

window.__stCallers = function (name) {
    const entry = calls.get(name);
    if (!entry) {
        console.warn(`[ST Tracker] No calls recorded for "${name}"`);
        return;
    }
    console.group(`📍 Callers of ${name} (${entry.count} total calls)`);
    for (const [site, hits] of [...entry.callers.entries()].sort((a, b) => b[1] - a[1])) {
        console.log(`×${hits}  ${site}`);
    }
    console.groupEnd();
};

window.__stClear = function () {
    calls.clear();
    console.log('[ST Tracker] Cleared.');
};

console.log('[ST Tracker] Ready. Use __stReport(), __stTop(), __stCallers(name), __stClear().');
