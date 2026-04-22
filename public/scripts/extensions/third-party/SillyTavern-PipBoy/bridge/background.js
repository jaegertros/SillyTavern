// ============================================================
// Claude ↔ SillyTavern Bridge — Background Service Worker
// ============================================================
//
// Manages tab discovery and message relay between:
//   - content-claude.js (watches claude.ai for assistant responses)
//   - content-st.js (posts messages into the SillyTavern page)
//
// Message flow:
//   claude.ai tab → content-claude.js → background.js → content-st.js → ST page
//   ST page (user send) → content-st.js → background.js → (future: content-claude.js)
//
// ============================================================

console.log('[Bridge/bg] Service worker loaded.');

const bridgeTabs = {
    claude: null,
    st: null,
};

// ── Config helpers ─────────────────────────────────────────
async function getConfig() {
    const { claudeUrl, stUrl } = await chrome.storage.local.get(['claudeUrl', 'stUrl']);
    return { claudeUrl: claudeUrl || '', stUrl: stUrl || '' };
}

function urlMatches(candidateUrl, targetUrl) {
    if (!candidateUrl || !targetUrl) return false;
    try {
        const a = new URL(candidateUrl);
        const b = new URL(targetUrl);
        if (a.origin !== b.origin) return false;

        if (b.hostname.endsWith('claude.ai')) {
            return a.pathname === b.pathname;
        }
        return true;
    } catch {
        return false;
    }
}

// ── Tab lookup ─────────────────────────────────────────────
async function findTabs() {
    const { claudeUrl, stUrl } = await getConfig();

    if (!claudeUrl || !stUrl) {
        return {
            ok: false,
            reason: 'Missing URL config. Open the extension options and save both URLs.',
        };
    }

    const tabs = await chrome.tabs.query({});
    const claudeTab = tabs.find(t => urlMatches(t.url, claudeUrl));
    const stTab     = tabs.find(t => urlMatches(t.url, stUrl));

    return {
        ok: !!(claudeTab && stTab),
        claudeTab: claudeTab || null,
        stTab: stTab || null,
        reason: !claudeTab ? 'No claude.ai tab matching the saved URL is open.'
              : !stTab     ? 'No SillyTavern tab matching the saved URL is open.'
              : null,
    };
}

// ── Icon-click liveness test ──────────────────────────────
chrome.action.onClicked.addListener(async () => {
    const status = await findTabs();
    if (status.ok) {
        console.log('[Bridge/bg] Both tabs found:');
        console.log('  claude.ai →', status.claudeTab.id, status.claudeTab.url);
        console.log('  SillyTavern →', status.stTab.id, status.stTab.url);
    } else {
        console.warn('[Bridge/bg]', status.reason);
    }
    console.log('[Bridge/bg] Registered tab IDs:', bridgeTabs);
});

// ── Message handler ──────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    // Content-script registration
    if (msg?.type === 'register' && (msg.side === 'claude' || msg.side === 'st')) {
        const tabId = sender.tab?.id;
        if (tabId) {
            bridgeTabs[msg.side] = tabId;
            console.log(`[Bridge/bg] Registered ${msg.side} tab:`, tabId);
            sendResponse({ ok: true, tabId });

            // If both sides are now registered, notify the ST tab
            if (bridgeTabs.claude && bridgeTabs.st) {
                chrome.tabs.sendMessage(bridgeTabs.st, {
                    type: 'bridge-status',
                    connected: true,
                }).catch(() => {});
            }
        } else {
            sendResponse({ ok: false, reason: 'No tab ID on sender.' });
        }
        return true;
    }

    // Claude response — relay to ST tab
    if (msg?.type === 'claude-response') {
        console.log('[Bridge/bg] Claude response:', msg.text?.length, 'chars');

        if (bridgeTabs.st) {
            chrome.tabs.sendMessage(bridgeTabs.st, {
                type: 'claude-response',
                text: msg.text,
            }).then(() => {
                console.log('[Bridge/bg] Relayed to ST tab:', bridgeTabs.st);
            }).catch((err) => {
                console.warn('[Bridge/bg] Relay to ST failed:', err.message);
            });
        } else {
            console.warn('[Bridge/bg] No ST tab registered — cannot relay.');
        }

        sendResponse({ ok: true });
        return true;
    }

    // User send from ST — relay to claude.ai tab
    if (msg?.type === 'user-send') {
        console.log('[Bridge/bg] User send captured:');
        console.log('  source:', msg.source);
        console.log('  length:', msg.text?.length, 'chars');
        console.log('  preview:', (msg.text || '').slice(0, 200));

        if (bridgeTabs.claude) {
            chrome.tabs.sendMessage(bridgeTabs.claude, {
                type: 'user-send',
                text: msg.text,
            }).then(() => {
                console.log('[Bridge/bg] Relayed user message to claude.ai tab:', bridgeTabs.claude);
            }).catch((err) => {
                console.warn('[Bridge/bg] Relay to claude.ai failed:', err.message);
            });
        } else {
            console.warn('[Bridge/bg] No claude.ai tab registered — cannot relay user message.');
        }

        sendResponse({ ok: true });
        return true;
    }
});

// ── Clean up when tabs close ──────────────────────────────
chrome.tabs.onRemoved.addListener((tabId) => {
    for (const side of ['claude', 'st']) {
        if (bridgeTabs[side] === tabId) {
            console.log(`[Bridge/bg] ${side} tab closed, deregistered.`);
            bridgeTabs[side] = null;

            // Notify the other side about disconnection
            const otherSide = side === 'claude' ? 'st' : 'claude';
            if (bridgeTabs[otherSide]) {
                chrome.tabs.sendMessage(bridgeTabs[otherSide], {
                    type: 'bridge-status',
                    connected: false,
                }).catch(() => {});
            }
        }
    }
});

// ── Log storage changes ──────────────────────────────────
chrome.storage.onChanged.addListener((changes, area) => {
    console.log('[Bridge/bg] Storage changed in', area, changes);
});
