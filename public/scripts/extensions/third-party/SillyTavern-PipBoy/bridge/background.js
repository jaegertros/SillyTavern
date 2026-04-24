// ============================================================
// Claude ↔ SillyTavern Bridge — Background Script (MV3, universal)
// ============================================================
//
// Message flow:
//   claude.ai tab → content-claude.js → background → content-st.js → ST page
//   ST page (user send) → content-st.js → background → content-claude.js → claude.ai
//
// Tab discovery: content scripts register on load. No tab scanning.
// ============================================================

// Load browser-api.js in service worker context (Chrome MV3).
// In Firefox MV3, it's loaded via manifest "scripts" array — this is a no-op.
if (typeof importScripts === 'function') {
    try { importScripts('browser-api.js'); } catch (e) { /* loaded via scripts array */ }
}

console.log('[Bridge/bg] Background loaded.');

const bridgeTabs = { claude: null, st: null };

// ── Config ─────────────────────────────────────────────────

let config = { claudeUrl: '', stUrl: '' };

async function loadConfig() {
    const data = await browserAPI.storage.local.get(['claudeUrl', 'stUrl']);
    config.claudeUrl = data.claudeUrl || '';
    config.stUrl = data.stUrl || '';
    console.log('[Bridge/bg] Config:',
        'claude=' + (config.claudeUrl || '(not set)'),
        'st=' + (config.stUrl || '(not set)'));
}

// Reload config when options page saves
if (browserAPI.storage?.onChanged) {
    browserAPI.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            loadConfig().then(() => {
                console.log('[Bridge/bg] Config updated');
            });
        }
    });
}

// ── URL matching ───────────────────────────────────────────

function urlMatchesClaude(url) {
    if (!url) return false;
    try {
        const u = new URL(url);
        if (!u.hostname.includes('claude.ai')) return false;

        // If a specific chat URL is configured, require exact path match
        if (config.claudeUrl) {
            const c = new URL(config.claudeUrl);
            return u.origin === c.origin && u.pathname === c.pathname;
        }

        // No config — accept any claude.ai chat page
        return true;
    } catch { return false; }
}

function urlMatchesST(url) {
    if (!url) return false;
    try {
        const u = new URL(url);

        // If configured, match by origin
        if (config.stUrl) {
            return u.origin === new URL(config.stUrl).origin;
        }

        // No config — accept localhost / 127.0.0.1
        return u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    } catch { return false; }
}

// ── Tab registration ───────────────────────────────────────

function registerTab(side, tabId, url) {
    if (!tabId) return false;
    const old = bridgeTabs[side];
    bridgeTabs[side] = tabId;
    if (old !== tabId) {
        console.log(`[Bridge/bg] Registered ${side}: tab ${tabId} (${url || '?'})`);
        broadcastConnection();
        return true;
    }
    return false;
}

// ── Broadcasting ───────────────────────────────────────────

function broadcastConnection() {
    const msg = {
        type: 'bridge-status',
        connected: !!(bridgeTabs.claude && bridgeTabs.st),
        claude: !!bridgeTabs.claude,
        st: !!bridgeTabs.st,
    };

    console.log('[Bridge/bg] Status:',
        msg.claude ? 'Claude:YES' : 'Claude:NO',
        msg.st ? 'ST:YES' : 'ST:NO');

    [bridgeTabs.claude, bridgeTabs.st].forEach(id => {
        if (id) browserAPI.tabs.sendMessage(id, msg).catch(() => {});
    });
}

function broadcastState(state, color) {
    const msg = { type: 'BRIDGE_STATE', state, color };
    [bridgeTabs.claude, bridgeTabs.st].forEach(id => {
        if (id) browserAPI.tabs.sendMessage(id, msg).catch(() => {});
    });
}

// ── Event bindings ─────────────────────────────────────────

// Toolbar icon — manual diagnostic + rescan
if (browserAPI.action?.onClicked) {
    browserAPI.action.onClicked.addListener(async () => {
        console.log('[Bridge/bg] Toolbar click — scanning tabs');
        await loadConfig();

        if (browserAPI.tabs?.query) {
            const tabs = await browserAPI.tabs.query({});
            for (const t of tabs) {
                if (!t.url) continue;
                if (urlMatchesClaude(t.url)) bridgeTabs.claude = t.id;
                if (urlMatchesST(t.url))     bridgeTabs.st = t.id;
            }
        }

        console.log('[Bridge/bg] Scan:', JSON.stringify(bridgeTabs));
        broadcastConnection();
    });
}

// Clean up closed tabs
if (browserAPI.tabs?.onRemoved) {
    browserAPI.tabs.onRemoved.addListener((tabId) => {
        for (const side of ['claude', 'st']) {
            if (bridgeTabs[side] === tabId) {
                console.log(`[Bridge/bg] ${side} tab closed`);
                bridgeTabs[side] = null;

                // Notify the surviving side
                const other = side === 'claude' ? 'st' : 'claude';
                if (bridgeTabs[other]) {
                    browserAPI.tabs.sendMessage(bridgeTabs[other], {
                        type: 'bridge-status',
                        connected: false,
                        claude: side !== 'claude',
                        st: side !== 'st',
                    }).catch(() => {});
                }
            }
        }
    });
}

// ── Message handler ────────────────────────────────────────

let lastUserSend = '';
let lastUserSendTime = 0;
let lastClaudeResponse = '';
let lastClaudeResponseTime = 0;

browserAPI.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    const tabId = sender?.tab?.id;
    const tabUrl = sender?.tab?.url || '';

    // ── Registration ───────────────────────────────────
    if (msg?.type === 'register') {
        const side = msg.side;
        if ((side === 'claude' && urlMatchesClaude(tabUrl)) ||
            (side === 'st' && urlMatchesST(tabUrl))) {
            registerTab(side, tabId, tabUrl);
            if (sendResponse) sendResponse({ ok: true, tabId });

            // If both sides connected, notify
            if (bridgeTabs.claude && bridgeTabs.st) {
                broadcastConnection();
            }
        } else {
            console.warn(`[Bridge/bg] Registration rejected: ${side} URL doesn't match config:`, tabUrl);
            if (sendResponse) sendResponse({ ok: false, reason: 'URL does not match config' });
        }
        return true; // keep sendResponse channel open
    }

    // ── Auto-register from any message ─────────────────
    if (tabId) {
        if (urlMatchesClaude(tabUrl)) registerTab('claude', tabId, tabUrl);
        if (urlMatchesST(tabUrl))     registerTab('st', tabId, tabUrl);
    }

    // ── User send: ST → Claude ─────────────────────────
    if (msg?.type === 'user-send' && msg.text) {
        const now = Date.now();
        if (msg.text === lastUserSend && now - lastUserSendTime < 3000) {
            console.log('[Bridge/bg] Duplicate user-send ignored');
            if (sendResponse) sendResponse({ ok: true });
            return true;
        }
        lastUserSend = msg.text;
        lastUserSendTime = now;

        broadcastState('sending', '#4af');

        if (bridgeTabs.claude) {
            console.log('[Bridge/bg] → Claude:', msg.text.length, 'chars');
            browserAPI.tabs.sendMessage(bridgeTabs.claude, {
                type: 'user-send',
                text: msg.text,
            }).catch(err => {
                console.warn('[Bridge/bg] Failed to reach Claude:', err);
            });
        } else {
            console.warn('[Bridge/bg] No Claude tab — message dropped');
        }

        broadcastState('waiting', '#a4f');
        if (sendResponse) sendResponse({ ok: true });
        return true;
    }

    // ── Claude response: Claude → ST ───────────────────
    if (msg?.type === 'claude-response' && msg.text) {
        const now = Date.now();
        if (msg.text === lastClaudeResponse && now - lastClaudeResponseTime < 3000) {
            console.log('[Bridge/bg] Duplicate response ignored');
            if (sendResponse) sendResponse({ ok: true });
            return true;
        }
        lastClaudeResponse = msg.text;
        lastClaudeResponseTime = now;

        broadcastState('received', '#4f4');

        if (bridgeTabs.st) {
            console.log('[Bridge/bg] → ST:', msg.text.length, 'chars');
            browserAPI.tabs.sendMessage(bridgeTabs.st, {
                type: 'claude-response',
                text: msg.text,
            }).catch(err => {
                console.warn('[Bridge/bg] Failed to reach ST:', err);
            });
        } else {
            console.warn('[Bridge/bg] No ST tab — response dropped');
        }

        broadcastState('idle', '#aaa');
        if (sendResponse) sendResponse({ ok: true });
        return true;
    }
});

// ── Init ───────────────────────────────────────────────────
loadConfig();
