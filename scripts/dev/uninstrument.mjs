/**
 * uninstrument.mjs
 *
 * Removes all tracking added by instrument.mjs from public/script.js,
 * restoring it to its original state.
 *
 * Usage: node scripts/dev/uninstrument.mjs
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

const SCRIPT_PATH = resolve('public/script.js');
const BACKUP_PATH = resolve('public/script.js.bak');

let src = readFileSync(SCRIPT_PATH, 'utf8');

if (!src.includes('@st-tracker')) {
    console.log('script.js does not appear to be instrumented. Nothing to do.');
    process.exit(0);
}

// Remove tracker import line
src = src.replace(/^import \{ track as stTrack \} from '\.\/scripts\/dev\/tracker\.js'; \/\/ @st-tracker\n/m, '');

// Remove all injected stTrack calls  (handles any whitespace before the call)
src = src.replace(/ stTrack\('[^']+'\); \/\/ @st-tracked/g, '');

writeFileSync(SCRIPT_PATH, src);
console.log('✅ Removed instrumentation from public/script.js');

// Clean up backup if it exists (may be read-only on Windows mounts — non-fatal)
if (existsSync(BACKUP_PATH)) {
    try {
        unlinkSync(BACKUP_PATH);
        console.log('   Deleted public/script.js.bak');
    } catch {
        console.log('   Note: could not delete public/script.js.bak (likely read-only on Windows mount) — safe to ignore.');
    }
}
