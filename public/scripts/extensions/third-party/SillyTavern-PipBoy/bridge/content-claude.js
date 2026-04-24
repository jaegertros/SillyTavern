// ============================================================
// Claude ↔ SillyTavern Bridge — Claude Content Script (MV3, universal)
// ============================================================
//
// Two jobs:
//   1. Receive user messages from background → type into composer → click send
//   2. Watch for assistant responses → extract text → send to background
//
// Tab-throttling mitigation:
//   Response detection uses a MutationObserver watching the data-is-streaming
//   attribute directly. The observer callback fires immediately even in
//   background tabs — no setTimeout chain that browsers can throttle.
// ============================================================

console.log('[Bridge/claude] Loaded on', location.href);

// Only activate on actual chat pages, not the homepage or project list
const looksLikeChat = /\/chat\/[0-9a-f-]{36}/i.test(location.pathname);

if (looksLikeChat) {
    console.log('[Bridge/claude] Chat URL detected, registering...');

    browserAPI.runtime.sendMessage({ type: 'register', side: 'claude' }, (response) => {
        const err = typeof browser !== 'undefined' ? null : (typeof chrome !== 'undefined' ? chrome.runtime?.lastError : null);
        if (err) {
            console.warn('[Bridge/claude] Registration failed:', err.message);
            return;
        }
        if (response?.ok) {
            console.log('[Bridge/claude] Registered, tab', response.tabId);
            watchForResponses();
        } else {
            console.warn('[Bridge/claude] Rejected:', response?.reason);
        }
    });
} else {
    console.log('[Bridge/claude] Not a chat URL — idle.');
}

// ── Context extraction ─────────────────────────────────────

function extractClaudeContext() {
    try {
        const projectLink = document.querySelector('header a.truncate')
            || document.querySelector('a[href^="/project/"]');
        const chatTitle = document.querySelector('header div.truncate.font-base-bold');

        return {
            chat: chatTitle?.innerText?.trim() || 'Unknown Chat',
            project: projectLink?.innerText?.trim() || 'Unknown Project',
        };
    } catch {
        return { chat: 'Unknown Chat', project: 'Unknown Project' };
    }
}

function sendContextToUI() {
    const ctx = extractClaudeContext();
    window.postMessage({
        type: 'BRIDGE_CONTEXT',
        side: 'claude',
        chat: ctx.chat,
        project: ctx.project,
    }, '*');
}

setTimeout(sendContextToUI, 1500);
setInterval(sendContextToUI, 5000);

// Inject bridge UI overlay
try {
    const script = document.createElement('script');
    script.src = browserAPI.runtime.getURL('bridge-ui.js');
    document.documentElement.appendChild(script);
} catch (err) {
    console.warn('[Bridge/claude] UI injection failed:', err);
}

// ── User message injection ─────────────────────────────────

browserAPI.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type === 'user-send' && msg.text) {
        console.log('[Bridge/claude] Injecting user message:', msg.text.length, 'chars');
        injectUserMessage(msg.text);
        if (sendResponse) sendResponse({ ok: true });
    }

    // Forward bridge-status and BRIDGE_STATE to UI overlay
    if (msg?.type === 'bridge-status' || msg?.type === 'BRIDGE_STATE') {
        window.postMessage(msg, '*');
    }

    // Convert bridge-status to BRIDGE_CONNECTION for the UI overlay
    if (msg?.type === 'bridge-status') {
        window.postMessage({
            type: 'BRIDGE_CONNECTION',
            claude: msg.claude,
            st: msg.st,
        }, '*');
    }
});

function injectUserMessage(text) {
    const composer =
        document.querySelector('fieldset [contenteditable="true"]') ||
        document.querySelector('.ProseMirror[contenteditable="true"]') ||
        document.querySelector('[contenteditable="true"]') ||
        document.querySelector('div[data-placeholder]');

    if (!composer) {
        console.warn('[Bridge/claude] No composer found');
        return;
    }

    // Focus and select all existing content
    composer.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(composer);
    selection.removeAllRanges();
    selection.addRange(range);

    // Insert via execCommand — ProseMirror handles this as real user input
    document.execCommand('insertText', false, text);
    console.log('[Bridge/claude] Text inserted');

    // Click send after ProseMirror processes the input
    setTimeout(() => findAndClickSend(composer, 0), 300);
}

function findAndClickSend(composer, attempt) {
    // Strategy 1: aria-label
    let sendBtn = document.querySelector('button[aria-label="Send Message"]')
        || document.querySelector('button[aria-label="Send message"]')
        || document.querySelector('button[data-testid="send-button"]');

    // Strategy 2: fieldset scan — last enabled icon-only button
    if (!sendBtn) {
        const container = composer.closest('fieldset, form');
        if (container) {
            for (const btn of container.querySelectorAll('button')) {
                if (btn.querySelector('svg') && !btn.disabled) {
                    sendBtn = btn;
                }
            }
        }
    }

    // Strategy 3: proximity — button with SVG near the composer
    if (!sendBtn) {
        const composerRect = composer.getBoundingClientRect();
        sendBtn = [...document.querySelectorAll('button')].find(btn => {
            if (btn.disabled || !btn.querySelector('svg')) return false;
            const r = btn.getBoundingClientRect();
            return Math.abs(r.bottom - composerRect.bottom) < 100;
        });
    }

    if (sendBtn && !sendBtn.disabled) {
        // Full pointer event sequence for React compatibility
        const rect = sendBtn.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const props = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y };

        sendBtn.dispatchEvent(new PointerEvent('pointerdown', { ...props, pointerId: 1 }));
        sendBtn.dispatchEvent(new MouseEvent('mousedown', props));
        sendBtn.dispatchEvent(new PointerEvent('pointerup', { ...props, pointerId: 1 }));
        sendBtn.dispatchEvent(new MouseEvent('mouseup', props));
        sendBtn.dispatchEvent(new MouseEvent('click', props));

        console.log('[Bridge/claude] Send button clicked');
        return;
    }

    // Retry — React may need time to enable the button
    if (attempt < 5) {
        console.log(`[Bridge/claude] Send not ready, retry ${attempt + 1}/5`);
        setTimeout(() => findAndClickSend(composer, attempt + 1), 300);
        return;
    }

    // Final fallback: Enter key
    console.warn('[Bridge/claude] No send button, trying Enter');
    composer.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
        bubbles: true, cancelable: true,
    }));
}

// ── Response watcher ───────────────────────────────────────
//
// PRIMARY: watch for data-is-streaming attribute changes.
//   When it transitions to "false", streaming is done and text
//   is final. The MutationObserver callback fires IMMEDIATELY
//   even in background tabs — no setTimeout throttling.
//
// FALLBACK: general subtree observer for DOM structures that
//   don't use data-is-streaming.

let lastSentText = '';
let initialSnapshotTaken = false;
let lastMessageCount = 0;

function watchForResponses() {
    const container = document.querySelector('main') || document.body;

    // ── Primary: attribute watcher (not throttled) ─────
    const attrObserver = new MutationObserver((mutations) => {
        if (!initialSnapshotTaken) return;

        for (const m of mutations) {
            if (m.type !== 'attributes' || m.attributeName !== 'data-is-streaming') continue;

            const el = m.target;
            if (el.getAttribute('data-is-streaming') !== 'false') continue;

            // Streaming just ended — extract immediately via microtask
            // Microtasks are NOT subject to background-tab throttling
            Promise.resolve().then(() => {
                // Double-check stop button isn't visible
                const stopBtn = document.querySelector('button[aria-label*="Stop"]')
                    || document.querySelector('button[data-testid="stop-button"]');
                if (stopBtn && stopBtn.offsetParent !== null) return;

                const text = extractTextFromElement(el);
                if (text && text !== lastSentText) {
                    lastSentText = text;
                    lastMessageCount = document.querySelectorAll('[data-is-streaming]').length;

                    console.log('[Bridge/claude] Response captured:', text.length, 'chars');

                    browserAPI.runtime.sendMessage({
                        type: 'claude-response',
                        text: text,
                    });
                }
            });
        }
    });

    attrObserver.observe(container, {
        attributes: true,
        attributeFilter: ['data-is-streaming'],
        subtree: true,
    });

    // ── Fallback: general observer (for non-streaming content) ──
    let fallbackTimer = null;
    const fallbackObserver = new MutationObserver(() => {
        if (!initialSnapshotTaken) return;
        clearTimeout(fallbackTimer);
        fallbackTimer = setTimeout(() => extractLatestResponse(), 800);
    });

    fallbackObserver.observe(container, {
        childList: true,
        subtree: true,
        characterData: true,
    });

    // ── Initial snapshot ───────────────────────────────
    // Capture existing messages so we don't re-send the last response on page load
    setTimeout(() => {
        const existing = findAssistantMessages();
        lastMessageCount = existing.length;
        if (existing.length > 0) {
            lastSentText = extractTextFromElement(existing[existing.length - 1]);
        }
        initialSnapshotTaken = true;
        console.log('[Bridge/claude] Snapshot:', lastMessageCount, 'messages,',
            lastSentText.length, 'chars in last');
    }, 2000);

    console.log('[Bridge/claude] Watcher active on', container.tagName);
}

// ── Message finding & text extraction ──────────────────────

function findAssistantMessages() {
    let divs = document.querySelectorAll('[data-is-streaming]');
    if (divs.length > 0) return divs;

    divs = document.querySelectorAll('.font-claude-response');
    if (divs.length > 0) return divs;

    divs = document.querySelectorAll('[data-testid*="assistant"]');
    if (divs.length > 0) return divs;

    divs = document.querySelectorAll('.font-claude-message');
    return divs;
}

function extractTextFromElement(el) {
    const inner = el.querySelector('.font-claude-response');
    const source = inner || el;
    let text = (source.innerText || source.textContent || '').trim();
    // Strip accessibility prefix
    text = text.replace(/^Claude responded:\s*/i, '');
    return text;
}

function extractLatestResponse() {
    if (!initialSnapshotTaken) return;

    const msgs = findAssistantMessages();
    if (msgs.length === 0) return;

    const last = msgs[msgs.length - 1];

    // Don't extract while streaming
    if (last.getAttribute?.('data-is-streaming') === 'true') return;
    const isStreaming = last.closest?.('[data-is-streaming="true"]');
    if (isStreaming) return;

    const stopBtn = document.querySelector('button[aria-label*="Stop"]')
        || document.querySelector('button[data-testid="stop-button"]');
    if (stopBtn && stopBtn.offsetParent !== null) return;

    const text = extractTextFromElement(last);
    if (!text || text === lastSentText) return;

    lastSentText = text;
    lastMessageCount = msgs.length;

    console.log('[Bridge/claude] Response (fallback):', text.length, 'chars');

    browserAPI.runtime.sendMessage({
        type: 'claude-response',
        text: text,
    });
}
