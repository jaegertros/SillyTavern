// ============================================================
// Claude ↔ SillyTavern Bridge — SillyTavern Content Script
// ============================================================
//
// Injected into the SillyTavern page. Two jobs:
//
// 1. Capture user sends (textarea + send button) and forward
//    them to the background script (future: relay to claude.ai).
//
// 2. Receive claude.ai responses relayed via the background
//    script and post them into the page via window.postMessage
//    so the Pip-Boy extension can pick them up.
//
// ============================================================

console.log('[Bridge/st] Content script loaded on', location.href);

// ── Registration ──────────────────────────────────────────
function register() {
    console.log('[Bridge/st] Detected SillyTavern composer. Registering with background...');

    chrome.runtime.sendMessage({ type: 'register', side: 'st' }, (response) => {
        if (chrome.runtime.lastError) {
            console.warn('[Bridge/st] Registration failed:', chrome.runtime.lastError.message);
            return;
        }
        if (response?.ok) {
            console.log('[Bridge/st] Registered. Tab ID:', response.tabId);
            attachSendListeners();
            listenForRelays();
        } else {
            console.warn('[Bridge/st] Registration rejected:', response?.reason);
        }
    });
}

// ── Send interception ──────────────────────────────────────
function attachSendListeners() {
    const textarea = document.getElementById('send_textarea');
    const sendBtn  = document.getElementById('send_but');

    if (!textarea) {
        console.warn('[Bridge/st] #send_textarea not found at attach time.');
        return;
    }
    if (!sendBtn) {
        console.warn('[Bridge/st] #send_but not found — click capture disabled (Enter still works).');
    }

    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            const text = textarea.value;
            if (text.trim()) {
                captureSend(text, 'enter-key');
            }
        }
    }, true);

    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            const text = textarea.value;
            if (text.trim()) {
                captureSend(text, 'send-button');
            }
        }, true);
    }

    console.log('[Bridge/st] Send listeners attached.');
}

function captureSend(text, source) {
    console.log(`[Bridge/st] Captured send (via ${source}):`, text.slice(0, 120));

    chrome.runtime.sendMessage({
        type: 'user-send',
        text: text,
        source: source,
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.warn('[Bridge/st] Forward failed:', chrome.runtime.lastError.message);
        }
    });
}

// ── Relay listener ────────────────────────────────────────
//
// Receives messages from the background script (relayed from
// the claude.ai tab) and posts them into the page so the
// Pip-Boy extension's bridge handler can pick them up.
//
// The Pip-Boy listens for:
//   - PIPBOY_RAW_MESSAGE  → raw narrator text, parsed by the extension
//   - PIPBOY_BRIDGE_CONNECTED / PIPBOY_BRIDGE_DISCONNECTED
//
function listenForRelays() {
    // ── Incoming: background → page (claude.ai responses)
    chrome.runtime.onMessage.addListener((msg) => {
        // Claude response — post raw text into the page for Pip-Boy
        if (msg?.type === 'claude-response' && msg.text) {
            console.log('[Bridge/st] Relaying claude response to page:', msg.text.length, 'chars');

            window.postMessage({
                type: 'PIPBOY_RAW_MESSAGE',
                text: msg.text,
                source: 'claude-st-bridge',
            }, '*');
        }

        // Bridge connection status updates
        if (msg?.type === 'bridge-status') {
            window.postMessage({
                type: msg.connected ? 'PIPBOY_BRIDGE_CONNECTED' : 'PIPBOY_BRIDGE_DISCONNECTED',
                source: 'claude-st-bridge',
            }, '*');
        }
    });

    // ── Outgoing: page → background (user messages from Pip-Boy interceptor)
    // The Pip-Boy's generate_interceptor posts PIPBOY_USER_SEND when it
    // aborts the normal API call. We pick it up here and forward it to
    // the background script, which will relay it to the claude.ai tab.
    //
    // Also responds to PIPBOY_BRIDGE_PING probes — the Pip-Boy extension
    // may load after this content script, missing the initial CONNECTED
    // message. The PONG lets it discover us on demand.
    window.addEventListener('message', (event) => {
        if (event.data?.type === 'PIPBOY_USER_SEND' && event.data.text) {
            console.log('[Bridge/st] Forwarding user message to background:', event.data.text.length, 'chars');

            chrome.runtime.sendMessage({
                type: 'user-send',
                text: event.data.text,
                source: 'pipboy-interceptor',
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('[Bridge/st] Forward to background failed:', chrome.runtime.lastError.message);
                }
            });
        }

        // Respond to pings from the Pip-Boy extension
        if (event.data?.type === 'PIPBOY_BRIDGE_PING') {
            console.log('[Bridge/st] Received PING, sending PONG');
            window.postMessage({
                type: 'PIPBOY_BRIDGE_PONG',
                source: 'claude-st-bridge',
            }, '*');
        }
    });

    // Announce connection to the Pip-Boy
    window.postMessage({
        type: 'PIPBOY_BRIDGE_CONNECTED',
        source: 'claude-st-bridge',
    }, '*');

    console.log('[Bridge/st] Relay listener active. Pip-Boy bridge connected.');
}

// ── Composer detection polling ─────────────────────────────
let attempts = 0;
const maxAttempts = 25;
const pollInterval = setInterval(() => {
    attempts++;
    const composer = document.getElementById('send_textarea');
    if (composer) {
        clearInterval(pollInterval);
        register();
    } else if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        console.log('[Bridge/st] No ST composer found after 5s — bridge will stay idle here.');
    }
}, 200);
