// ============================================================
// Claude ↔ SillyTavern Bridge — ST Content Script (MV3, universal)
// ============================================================
//
// Two jobs:
//   1. Capture user sends and forward to background → Claude
//   2. Receive Claude responses from background → post to page for Pip-Boy
//
// ============================================================

console.log('[Bridge/st] Loaded on', location.href);

// ── Registration ──────────────────────────────────────────

function register() {
    console.log('[Bridge/st] Registering with background...');

    browserAPI.runtime.sendMessage({ type: 'register', side: 'st' }, (response) => {
        const err = typeof browser !== 'undefined' ? null : (typeof chrome !== 'undefined' ? chrome.runtime?.lastError : null);
        if (err) {
            console.warn('[Bridge/st] Registration failed:', err.message);
            return;
        }
        if (response?.ok) {
            console.log('[Bridge/st] Registered, tab', response.tabId);
            attachSendListeners();
            listenForRelays();
        } else {
            console.warn('[Bridge/st] Rejected:', response?.reason);
        }
    });
}

// ── Send interception ──────────────────────────────────────

let interceptorActive = false;

function attachSendListeners() {
    const textarea = document.getElementById('send_textarea');
    const sendBtn  = document.getElementById('send_but');

    if (!textarea) {
        console.warn('[Bridge/st] #send_textarea not found');
        return;
    }

    // Enter key — fallback only (disabled when interceptor is active)
    textarea.addEventListener('keydown', (e) => {
        if (interceptorActive) return;
        if (e.key === 'Enter' && !e.shiftKey) {
            const text = textarea.value;
            if (text.trim()) {
                captureSend(text, 'enter-key');
            }
        }
    }, true);

    // Send button click — fallback only
    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            if (interceptorActive) return;
            const text = textarea.value;
            if (text.trim()) {
                captureSend(text, 'send-button');
            }
        }, true);
    }

    console.log('[Bridge/st] Send listeners attached');
}

function captureSend(text, source) {
    console.log(`[Bridge/st] Send (${source}):`, text.length, 'chars');

    browserAPI.runtime.sendMessage({
        type: 'user-send',
        text: text,
        source: source,
    });
}

// ── Relay listener ────────────────────────────────────────

function listenForRelays() {
    // ── Incoming: background → page (Claude responses + status)
    browserAPI.runtime.onMessage.addListener((msg) => {
        // Claude response → post to page for Pip-Boy
        if (msg?.type === 'claude-response' && msg.text) {
            console.log('[Bridge/st] Relaying response:', msg.text.length, 'chars');

            window.postMessage({
                type: 'PIPBOY_RAW_MESSAGE',
                text: msg.text,
                source: 'claude-st-bridge',
            }, '*');
        }

        // Bridge status → post to page for UI overlay
        if (msg?.type === 'bridge-status') {
            window.postMessage({
                type: msg.connected ? 'PIPBOY_BRIDGE_CONNECTED' : 'PIPBOY_BRIDGE_DISCONNECTED',
                source: 'claude-st-bridge',
            }, '*');

            // Also send as BRIDGE_CONNECTION for the indicator lights
            window.postMessage({
                type: 'BRIDGE_CONNECTION',
                claude: msg.claude,
                st: msg.st,
            }, '*');
        }

        // Pipeline state (sending/waiting/received/idle)
        if (msg?.type === 'BRIDGE_STATE') {
            window.postMessage(msg, '*');
        }
    });

    // ── Outgoing: page → background (from Pip-Boy interceptor + pings)
    window.addEventListener('message', (event) => {
        const data = event.data;
        if (!data || typeof data !== 'object') return;

        // Pip-Boy interceptor sends user messages
        if (data.type === 'PIPBOY_USER_SEND' && data.text) {
            interceptorActive = true; // disable fallback listeners
            console.log('[Bridge/st] Interceptor send:', data.text.length, 'chars');

            browserAPI.runtime.sendMessage({
                type: 'user-send',
                text: data.text,
                source: 'pipboy-interceptor',
            });
        }

        // Pip-Boy discovery ping
        if (data.type === 'PIPBOY_BRIDGE_PING') {
            console.log('[Bridge/st] PING → PONG');
            window.postMessage({
                type: 'PIPBOY_BRIDGE_PONG',
                source: 'claude-st-bridge',
            }, '*');
        }
    });

    // Announce connection
    window.postMessage({
        type: 'PIPBOY_BRIDGE_CONNECTED',
        source: 'claude-st-bridge',
    }, '*');

    console.log('[Bridge/st] Relay listener active');
}

// ── Inject UI overlay ──────────────────────────────────────

try {
    const script = document.createElement('script');
    script.src = browserAPI.runtime.getURL('bridge-ui.js');
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
} catch (err) {
    console.warn('[Bridge/st] UI injection failed:', err);
}

// ── Composer detection polling ─────────────────────────────

let attempts = 0;
const maxAttempts = 25;
const poll = setInterval(() => {
    attempts++;
    if (document.getElementById('send_textarea')) {
        clearInterval(poll);
        register();
    } else if (attempts >= maxAttempts) {
        clearInterval(poll);
        console.log('[Bridge/st] No composer found after 5s — idle');
    }
}, 200);
