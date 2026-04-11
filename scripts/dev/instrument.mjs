/**
 * instrument.mjs
 *
 * Adds runtime call-tracking to every exported function in public/script.js.
 * Inserts a stTrack('name') call as the first statement inside each function body,
 * and adds the tracker import at the top of the file.
 *
 * Fully reversible — run uninstrument.mjs to restore the original.
 *
 * Usage: node scripts/dev/instrument.mjs
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SCRIPT_PATH  = resolve('public/script.js');
const BACKUP_PATH  = resolve('public/script.js.bak');
const TRACKER_IMPORT = "import { track as stTrack } from './scripts/dev/tracker.js'; // @st-tracker\n";
const TRACK_CALL   = (name) => ` stTrack('${name}'); // @st-tracked`;
const ALREADY_DONE = '@st-tracker';

// ─── Safety check ────────────────────────────────────────────────────────────

let src = readFileSync(SCRIPT_PATH, 'utf8');

if (src.includes(ALREADY_DONE)) {
    console.log('script.js is already instrumented. Run uninstrument.mjs first if you want to re-instrument.');
    process.exit(0);
}

// Back up original
copyFileSync(SCRIPT_PATH, BACKUP_PATH);
console.log(`Backed up original → public/script.js.bak`);

// ─── Find all exported functions ─────────────────────────────────────────────

// Matches:  export function name(   OR   export async function name(
const EXPORT_FN = /^export\s+(?:async\s+)?function\s+(\w+)\s*\(/gm;

const matches = [];
let m;
while ((m = EXPORT_FN.exec(src)) !== null) {
    matches.push({ name: m[1], matchEnd: m.index + m[0].length });
}

console.log(`Found ${matches.length} exported functions to instrument.`);

// ─── Insert tracking calls ────────────────────────────────────────────────────
// Work backwards so character offsets stay valid as we insert text.

let result = src;

for (const { name, matchEnd } of [...matches].reverse()) {
    // Find the opening brace of the function body, scanning forward from the
    // end of the function signature (past parameters and return type annotations).
    let pos = matchEnd;
    // The regex matched up to and including the opening '(' of the param list,
    // so we're already one level deep in parentheses — start depth at 1.
    let depth = 1;
    while (pos < result.length) {
        const ch = result[pos];
        if (ch === '(') depth++;
        if (ch === ')') { depth--; }
        if (ch === '{' && depth <= 0) {
            // Found the opening brace of the function body
            pos++; // move past '{'
            break;
        }
        pos++;
    }

    const trackLine = TRACK_CALL(name);
    result = result.slice(0, pos) + trackLine + result.slice(pos);
}

// ─── Add tracker import at top ────────────────────────────────────────────────
// Insert after the opening comment block / any leading blank lines,
// right before the first import statement.

const firstImport = result.search(/^import /m);
if (firstImport !== -1) {
    result = result.slice(0, firstImport) + TRACKER_IMPORT + result.slice(firstImport);
} else {
    result = TRACKER_IMPORT + result;
}

writeFileSync(SCRIPT_PATH, result);
console.log(`✅ Instrumented ${matches.length} functions in public/script.js`);
console.log(`   Start SillyTavern, use the app, then run __stReport() in the browser console.`);
