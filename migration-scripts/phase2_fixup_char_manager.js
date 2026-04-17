#!/usr/bin/env node
/**
 * Post-process character-manager.js to replace late-bound function references
 * with their underscore-prefixed counterparts.
 */

const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const CHAR_MGR_PATH = path.join(__dirname, 'mnt/SillyTavern/public/scripts/core/character-manager.js');

let content = fs.readFileSync(CHAR_MGR_PATH, 'utf8');

// Late-bound replacements: original name -> underscore name
// Only replace CALL sites, not the bind declarations themselves
const lateBoundMap = {
    'cancelTtsPlay': '_cancelTtsPlay',
    'setMenuType': '_setMenuType',
    'selectRightMenuWithAnimation': '_selectRightMenuWithAnimation',
    'getFirstMessage': '_getFirstMessage',
    'setActiveCharacter': '_setActiveCharacter',
    'setActiveGroup': '_setActiveGroup',
    'changeMainAPI': '_changeMainAPI',
    'saveSettings': '_saveSettings',
    'getSettings': '_getSettings',
    'Generate': '_Generate',
    'isGenerating': '_isGenerating',
    'openCharacterChat': '_openCharacterChat',
    'setCharacterSettingsOverrides': '_setCharacterSettingsOverrides',
    'characterGroupOverlay': '_characterGroupOverlay',
    'callPopup': '_callPopup',
    'setGenerationParamsFromPreset': '_setGenerationParamsFromPreset',
};

// Split content into header (imports + late-bind declarations + private state) and body (functions)
const marker = '// Extracted functions';
const markerIdx = content.indexOf(marker);
if (markerIdx === -1) {
    console.error('Could not find marker "// Extracted functions"');
    process.exit(1);
}

// Find end of the marker section (next line after the === divider)
const afterMarker = content.indexOf('\n\n', markerIdx);
const header = content.slice(0, afterMarker + 2);
let body = content.slice(afterMarker + 2);

// Replace late-bound function calls in the body ONLY
// Use word boundaries to avoid replacing partial matches
for (const [original, replacement] of Object.entries(lateBoundMap)) {
    // Match the function name when it appears as a call or reference, but NOT:
    // - In import statements
    // - As part of bind_cm_* names
    // - In string literals
    // - As a function declaration name
    const regex = new RegExp(`(?<!bind_cm_)(?<!\\.)\\b${original}\\b(?!\\s*[:=]\\s*function)`, 'g');

    const before = body;
    body = body.replace(regex, (match, offset) => {
        // Don't replace in comments
        const lineStart = body.lastIndexOf('\n', offset) + 1;
        const line = body.slice(lineStart, offset);
        if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) {
            return match;
        }
        return replacement;
    });

    const count = (before.length - body.length) / (original.length - replacement.length);
    if (count !== 0 && !isNaN(count)) {
        // Count actual replacements
        const origMatches = (before.match(new RegExp(`(?<!bind_cm_)(?<!\\.)\\b${original}\\b`, 'g')) || []).length;
        const newMatches = (body.match(new RegExp(`(?<!bind_cm_)(?<!\\.)\\b${original}\\b`, 'g')) || []).length;
        const replaced = origMatches - newMatches;
        if (replaced > 0) {
            console.log(`  ${original} → ${replacement}: ${replaced} replacements`);
        }
    }
}

// Special cases that need careful handling:

// 1. `saveSettings` appears in `saveSettingsDebounced` — should NOT be replaced there
//    The regex with word boundaries should handle this, but verify
body = body.replace(/_saveSettingsDebounced/g, 'saveSettingsDebounced');

// 2. `callPopup` should not affect `callGenericPopup`
body = body.replace(/_callGenericPopup/g, 'callGenericPopup');

// 3. `Generate` should not affect `generateQuietPrompt`, `is_group_generating`, etc.
// Word boundary should handle this, but let's verify common false positives
body = body.replace(/_isGenerating/g, (match, offset) => {
    // Only keep as _isGenerating for standalone calls
    return match;
});

content = header + body;

// Validate parse
try {
    acorn.parse(content, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        locations: true,
    });
    console.log('\n✓ character-manager.js still parses after fixup');
} catch (e) {
    console.error(`\n✗ Parse error after fixup: ${e.message} at line ${e.loc?.line}`);
    // Write anyway so we can debug
}

fs.writeFileSync(CHAR_MGR_PATH, content);
console.log('Wrote updated character-manager.js');
