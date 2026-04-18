#!/usr/bin/env node
/**
 * Phase 4: Migrate consumer imports from script.js to core/generation-controller.js.
 */

const fs = require('fs');
const path = require('path');

const ROOT = '/sessions/admiring-relaxed-goldberg/mnt/SillyTavern/public';

// All exported names from generation-controller.js
const GC_EXPORTS = new Set([
    'isGenerating',
    'isStreamingEnabled',
    'StreamingProcessor',
    'createRawPrompt',
    'generateRaw',
    'Generate',
    'stopGeneration',
    'shouldAutoContinue',
    'triggerAutoContinue',
    'removeMacros',
    'getMaxContextSize',
    'sendGenerationRequest',
    'sendStreamingRequest',
    'getGenerateUrl',
    'getGeneratingApi',
    'getGeneratingModel',
    'setExternalAbortController',
    'flushWIInjections',
    'saveImageToMessage',
]);

// Files to skip (they ARE the module or they re-export)
const SKIP = new Set([
    path.join(ROOT, 'script.js'),
    path.join(ROOT, 'scripts/core/generation-controller.js'),
    path.join(ROOT, 'scripts/core/state.js'),
    path.join(ROOT, 'scripts/core/chat-engine.js'),
    path.join(ROOT, 'scripts/core/settings-manager.js'),
    path.join(ROOT, 'scripts/core/character-manager.js'),
    path.join(ROOT, 'scripts/core/debounced.js'),
]);

// Gather all JS files
function walk(dir) {
    let results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'lib' || entry.name === 'node_modules' || entry.name === 'vue-dist' || entry.name === 'vue-src') continue;
            results = results.concat(walk(full));
        } else if (entry.name.endsWith('.js') && !SKIP.has(full)) {
            results.push(full);
        }
    }
    return results;
}

const files = walk(ROOT);
let totalRedirects = 0;
let filesModified = 0;

for (const filePath of files) {
    let source = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Match import lines from script.js (various relative paths)
    // Pattern: import { ... } from '...script.js';
    const importRegex = /^(import\s*\{[^}]+\}\s*from\s*['"])([^'"]*script\.js)(['"];?\s*)$/gm;
    let match;
    const replacements = [];

    while ((match = importRegex.exec(source)) !== null) {
        const fullMatch = match[0];
        const importPath = match[2];

        // Verify this is actually pointing to the main script.js
        const rel = path.relative(path.dirname(filePath), ROOT);
        const expectedPaths = [
            rel ? rel + '/script.js' : './script.js',
            '../script.js',
            '../../script.js',
            '../../../script.js',
        ];

        // Normalize paths for comparison
        const normalizedImport = importPath.replace(/\\/g, '/');
        const isMainScript = expectedPaths.some(p => {
            const normalized = p.replace(/\\/g, '/');
            return normalizedImport === normalized || normalizedImport === './' + normalized;
        });

        if (!isMainScript) {
            // Also check by resolving
            try {
                const resolved = path.resolve(path.dirname(filePath), importPath);
                if (resolved !== path.join(ROOT, 'script.js')) continue;
            } catch { continue; }
        }

        // Extract imported names
        const braceContent = fullMatch.match(/\{([^}]+)\}/)?.[1];
        if (!braceContent) continue;

        const names = braceContent.split(',').map(n => {
            const trimmed = n.trim();
            // Handle 'name as alias'
            const parts = trimmed.split(/\s+as\s+/);
            return { original: parts[0]?.trim(), alias: parts[1]?.trim(), raw: n };
        }).filter(n => n.original);

        const gcNames = names.filter(n => GC_EXPORTS.has(n.original));
        const remainNames = names.filter(n => !GC_EXPORTS.has(n.original));

        if (gcNames.length === 0) continue;

        // Compute path to generation-controller.js from this file
        const gcAbsolute = path.join(ROOT, 'scripts/core/generation-controller.js');
        let gcRel = path.relative(path.dirname(filePath), gcAbsolute).replace(/\\/g, '/');
        if (!gcRel.startsWith('.')) gcRel = './' + gcRel;

        // Build new import for generation-controller
        const gcImportNames = gcNames.map(n => {
            return n.alias ? `${n.original} as ${n.alias}` : n.original;
        });

        const gcImport = gcImportNames.length <= 3
            ? `import { ${gcImportNames.join(', ')} } from '${gcRel}';`
            : `import {\n    ${gcImportNames.join(',\n    ')},\n} from '${gcRel}';`;

        let replacement = '';
        if (remainNames.length > 0) {
            // Rebuild remaining import
            const remainImportNames = remainNames.map(n => {
                return n.alias ? `${n.original} as ${n.alias}` : n.original;
            });
            const remainImport = remainImportNames.length <= 3
                ? `import { ${remainImportNames.join(', ')} } from '${importPath}';`
                : `import {\n    ${remainImportNames.map(n => n).join(',\n    ')},\n} from '${importPath}';`;
            replacement = remainImport + '\n' + gcImport;
        } else {
            replacement = gcImport;
        }

        replacements.push({ start: match.index, end: match.index + fullMatch.length, replacement });

        console.log(`  ${path.relative(ROOT, filePath)}: ${gcNames.map(n => n.original).join(', ')}`);
        totalRedirects += gcNames.length;
    }

    // Apply replacements in reverse order
    for (const r of replacements.reverse()) {
        source = source.slice(0, r.start) + r.replacement + source.slice(r.end);
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, source);
        filesModified++;
    }
}

console.log(`\nMigrated ${totalRedirects} imports across ${filesModified} files.`);
