#!/usr/bin/env node
/**
 * Extension & Core Update Checker
 *
 * Runs on every launch. For each tracked repo (main SillyTavern + all third-party extensions):
 *   1. Reads the "baseline" commit from .extension-baselines.json (the upstream commit
 *      that was current when you last acknowledged/checked it)
 *   2. Fetches the remote to see the latest upstream commit
 *   3. Compares: if upstream HEAD has moved past the baseline, reports commits behind
 *   4. Writes results to updates-available.txt
 *
 * The baseline file (.extension-baselines.json) is updated ONLY when you run:
 *   node check-updates.js --acknowledge [name]    (acknowledge one repo)
 *   node check-updates.js --acknowledge-all       (acknowledge all repos)
 *
 * This marks the current upstream HEAD as "seen" so it won't be reported again
 * until the upstream moves further.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const THIRD_PARTY_DIR = path.join(ROOT, 'public', 'scripts', 'extensions', 'third-party');
const BASELINES_FILE = path.join(ROOT, '.extension-baselines.json');
const REPORT_FILE = path.join(ROOT, 'updates-available.txt');

/**
 * Discovers all third-party extension repos.
 * @returns {{ name: string, dir: string }[]}
 */
function discoverExtensions() {
    const extensions = [];
    if (!fs.existsSync(THIRD_PARTY_DIR)) return extensions;

    const entries = fs.readdirSync(THIRD_PARTY_DIR, { withFileTypes: true });
    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const extDir = path.join(THIRD_PARTY_DIR, entry.name);
        const gitDir = path.join(extDir, '.git');
        if (fs.existsSync(gitDir)) {
            extensions.push({ name: entry.name, dir: extDir });
        }
    }
    return extensions.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Runs a git command in a directory, returns trimmed stdout or null on failure.
 */
function git(dir, args) {
    try {
        return execSync(`git ${args}`, { cwd: dir, encoding: 'utf8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    } catch {
        return null;
    }
}

/**
 * Gets repo info: remote URL, current branch, local HEAD.
 */
function getRepoInfo(dir) {
    const remote = git(dir, 'remote get-url origin');
    const branch = git(dir, 'rev-parse --abbrev-ref HEAD') || 'main';
    const localHead = git(dir, 'rev-parse HEAD');
    return { remote, branch, localHead };
}

/**
 * Fetches and returns the remote HEAD commit for the tracking branch.
 */
function fetchRemoteHead(dir, branch) {
    // Fetch silently
    git(dir, 'fetch origin --quiet');
    // Get the remote tracking branch HEAD
    const remoteHead = git(dir, `rev-parse origin/${branch}`);
    return remoteHead;
}

/**
 * Counts commits between two refs.
 */
function countCommitsBehind(dir, baselineCommit, remoteHead) {
    if (!baselineCommit || !remoteHead) return null;
    if (baselineCommit === remoteHead) return 0;
    const count = git(dir, `rev-list --count ${baselineCommit}..${remoteHead}`);
    return count !== null ? parseInt(count, 10) : null;
}

/**
 * Loads or initializes the baselines file.
 */
function loadBaselines() {
    if (fs.existsSync(BASELINES_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(BASELINES_FILE, 'utf8'));
        } catch {
            return {};
        }
    }
    return {};
}

function saveBaselines(baselines) {
    fs.writeFileSync(BASELINES_FILE, JSON.stringify(baselines, null, 2) + '\n', 'utf8');
}

/**
 * Main check routine.
 */
async function checkUpdates() {
    const baselines = loadBaselines();
    const extensions = discoverExtensions();
    const results = [];
    const timestamp = new Date().toISOString();

    // Check main SillyTavern repo
    const mainInfo = getRepoInfo(ROOT);
    if (mainInfo.remote) {
        const remoteHead = fetchRemoteHead(ROOT, mainInfo.branch);
        const baseline = baselines['SillyTavern']?.commit || mainInfo.localHead;

        // Initialize baseline if missing
        if (!baselines['SillyTavern']) {
            baselines['SillyTavern'] = {
                commit: mainInfo.localHead,
                remote: mainInfo.remote,
                branch: mainInfo.branch,
                lastChecked: timestamp,
            };
        }

        const behind = countCommitsBehind(ROOT, baseline, remoteHead);
        baselines['SillyTavern'].lastChecked = timestamp;
        baselines['SillyTavern'].remoteHead = remoteHead;

        results.push({
            name: 'SillyTavern (core)',
            behind,
            baseline: baseline?.substring(0, 10),
            remoteHead: remoteHead?.substring(0, 10),
            branch: mainInfo.branch,
        });
    }

    // Check each extension
    for (const ext of extensions) {
        const info = getRepoInfo(ext.dir);
        if (!info.remote) continue;

        const remoteHead = fetchRemoteHead(ext.dir, info.branch);
        const baseline = baselines[ext.name]?.commit || info.localHead;

        // Initialize baseline if missing
        if (!baselines[ext.name]) {
            baselines[ext.name] = {
                commit: info.localHead,
                remote: info.remote,
                branch: info.branch,
                lastChecked: timestamp,
            };
        }

        const behind = countCommitsBehind(ext.dir, baseline, remoteHead);
        baselines[ext.name].lastChecked = timestamp;
        baselines[ext.name].remoteHead = remoteHead;

        results.push({
            name: ext.name,
            behind,
            baseline: baseline?.substring(0, 10),
            remoteHead: remoteHead?.substring(0, 10),
            branch: info.branch,
        });
    }

    // Save baselines
    saveBaselines(baselines);

    // Build report
    const updatesAvailable = results.filter(r => r.behind > 0);
    const errors = results.filter(r => r.behind === null);
    const upToDate = results.filter(r => r.behind === 0);

    let report = `Update Check — ${timestamp}\n`;
    report += '='.repeat(60) + '\n\n';

    if (updatesAvailable.length > 0) {
        report += `UPDATES AVAILABLE (${updatesAvailable.length}):\n`;
        report += '-'.repeat(40) + '\n';
        for (const r of updatesAvailable) {
            report += `  ${r.name}\n`;
            report += `    ${r.behind} commit${r.behind === 1 ? '' : 's'} behind (${r.baseline} → ${r.remoteHead}) [${r.branch}]\n`;
        }
        report += '\n';
    }

    if (upToDate.length > 0) {
        report += `UP TO DATE (${upToDate.length}):\n`;
        report += '-'.repeat(40) + '\n';
        for (const r of upToDate) {
            report += `  ${r.name} @ ${r.baseline} [${r.branch}]\n`;
        }
        report += '\n';
    }

    if (errors.length > 0) {
        report += `ERRORS (${errors.length}):\n`;
        report += '-'.repeat(40) + '\n';
        for (const r of errors) {
            report += `  ${r.name} — could not determine status\n`;
        }
        report += '\n';
    }

    report += '-'.repeat(60) + '\n';
    report += 'To acknowledge updates (reset baseline to current upstream):\n';
    report += '  node check-updates.js --acknowledge <name>\n';
    report += '  node check-updates.js --acknowledge-all\n';

    // Write report
    fs.writeFileSync(REPORT_FILE, report, 'utf8');

    // Console summary
    if (updatesAvailable.length > 0) {
        console.log(`\x1b[33m[Update Checker] ${updatesAvailable.length} repo${updatesAvailable.length === 1 ? '' : 's'} with upstream updates available. See updates-available.txt\x1b[0m`);
        for (const r of updatesAvailable) {
            console.log(`  \x1b[33m${r.name}: ${r.behind} commit${r.behind === 1 ? '' : 's'} behind\x1b[0m`);
        }
    } else {
        console.log('\x1b[32m[Update Checker] All repos up to date with upstream.\x1b[0m');
    }
}

/**
 * Acknowledge mode — resets baseline to current remote HEAD.
 */
function acknowledge(name) {
    const baselines = loadBaselines();

    if (name === '--acknowledge-all') {
        let count = 0;
        for (const key of Object.keys(baselines)) {
            if (baselines[key].remoteHead) {
                baselines[key].commit = baselines[key].remoteHead;
                count++;
            }
        }
        saveBaselines(baselines);
        console.log(`Acknowledged ${count} repos. Baselines updated to current upstream.`);
        return;
    }

    // Strip --acknowledge prefix
    const repoName = process.argv[3];
    if (!repoName) {
        console.error('Usage: node check-updates.js --acknowledge <repo-name>');
        process.exit(1);
    }

    if (!baselines[repoName]) {
        console.error(`Unknown repo: ${repoName}. Run without flags first to discover repos.`);
        process.exit(1);
    }

    if (baselines[repoName].remoteHead) {
        baselines[repoName].commit = baselines[repoName].remoteHead;
        saveBaselines(baselines);
        console.log(`Acknowledged ${repoName}. Baseline set to ${baselines[repoName].commit.substring(0, 10)}.`);
    } else {
        console.error(`No remote HEAD cached for ${repoName}. Run a check first.`);
    }
}

// CLI handling
const args = process.argv.slice(2);
if (args.includes('--acknowledge') || args.includes('--acknowledge-all')) {
    acknowledge(args[0]);
} else {
    checkUpdates().catch(err => {
        console.error('[Update Checker] Error:', err.message);
    });
}
