// ============================================================
// Claude ↔ SillyTavern Bridge — claude.ai Content Script
// ============================================================
//
// Watches for new assistant messages on a claude.ai chat page.
// When one appears (or is updated via streaming), extracts the
// text and sends it to the background script for relay to ST.
//
// ============================================================

console.log('[Bridge/claude] Content script loaded on', location.href);

const looksLikeChat = /\/chat\/[0-9a-f-]{36}/i.test(location.pathname);

if (looksLikeChat) {
    console.log('[Bridge/claude] Detected a chat URL. Registering with background...');

    chrome.runtime.sendMessage({ type: 'register', side: 'claude' }, (response) => {
        if (chrome.runtime.lastError) {
            console.warn('[Bridge/claude] Registration failed:', chrome.runtime.lastError.message);
            return;
        }
        if (response?.ok) {
            console.log('[Bridge/claude] Registered. Tab ID:', response.tabId);
            watchForResponses();
        } else {
            console.warn('[Bridge/claude] Registration rejected:', response?.reason);
        }
    });
} else {
    console.log('[Bridge/claude] Not a chat URL — bridge will stay idle here.');
}

// ── User message injection ───────────────────────────
//
// Receives user messages relayed from the ST tab via background.
// Types the text into claude.ai's composer and clicks Send.
//
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type === 'user-send' && msg.text) {
        console.log('[Bridge/claude] Received user message to inject:', msg.text.length, 'chars');
        injectUserMessage(msg.text);
        sendResponse({ ok: true });
    }
});

function injectUserMessage(text) {
    // Claude.ai uses a ProseMirror contenteditable as its composer.
    // Direct innerHTML writes don't update ProseMirror's internal state,
    // so the send button stays disabled. Instead we:
    //   1. Focus the composer
    //   2. Select all existing content
    //   3. Use execCommand('insertText') to paste — this goes through
    //      ProseMirror's input handling and updates React state properly
    //   4. Find and click the send button
    const composer =
        document.querySelector('.ProseMirror[contenteditable="true"]') ||
        document.querySelector('[contenteditable="true"]') ||
        document.querySelector('div[data-placeholder]');

    if (!composer) {
        console.warn('[Bridge/claude] No composer element found — cannot inject message');
        return;
    }

    // Focus and select all existing content
    composer.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(composer);
    selection.removeAllRanges();
    selection.addRange(range);

    // Insert text via execCommand — ProseMirror handles this as real user input
    document.execCommand('insertText', false, text);

    console.log('[Bridge/claude] Text inserted into composer via execCommand');

    // Wait for ProseMirror/React to process the input and enable the send button
    setTimeout(() => findAndClickSend(composer, 0), 300);
}

function findAndClickSend(composer, attempt) {
    // Strategy 1: Find send button by aria-label
    let sendBtn = document.querySelector('button[aria-label="Send Message"]')
        || document.querySelector('button[aria-label="Send message"]');

    // Strategy 2: data-testid
    if (!sendBtn) {
        sendBtn = document.querySelector('button[data-testid="send-button"]');
    }

    // Strategy 3: Find the button near the composer that contains an SVG
    // (the send arrow icon). Look within the composer's parent fieldset/form.
    if (!sendBtn) {
        const composerContainer = composer.closest('fieldset, form, [class*="composer"], [class*="input"]');
        if (composerContainer) {
            const buttons = composerContainer.querySelectorAll('button');
            // The send button is typically the last enabled button with an SVG
            for (const btn of buttons) {
                if (btn.querySelector('svg') && !btn.disabled) {
                    sendBtn = btn;
                }
            }
        }
    }

    // Strategy 4: Broader search — any button with an SVG arrow-like icon
    // near the bottom of the page (composer area)
    if (!sendBtn) {
        const allButtons = [...document.querySelectorAll('button')];
        sendBtn = allButtons.find(btn => {
            if (btn.disabled) return false;
            const svg = btn.querySelector('svg');
            if (!svg) return false;
            // Check if it's near the composer vertically
            const btnRect = btn.getBoundingClientRect();
            const composerRect = composer.getBoundingClientRect();
            return Math.abs(btnRect.bottom - composerRect.bottom) < 100;
        });
    }

    if (sendBtn && !sendBtn.disabled) {
        sendBtn.click();
        console.log('[Bridge/claude] Send button clicked:', sendBtn.getAttribute('aria-label') || sendBtn.className);
        return;
    }

    // Retry a few times — React may need a moment to enable the button
    if (attempt < 5) {
        console.log(`[Bridge/claude] Send button not ready, retry ${attempt + 1}/5...`);
        setTimeout(() => findAndClickSend(composer, attempt + 1), 300);
        return;
    }

    // Final fallback: simulate Enter key via keyboard events with full properties
    // React checks keyCode/which for compatibility
    console.warn('[Bridge/claude] Send button not found after retries, trying Enter key');
    const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
    });
    composer.dispatchEvent(enterEvent);
}

// ── Response watcher ──────────────────────────────────────
//
// Claude's chat DOM renders assistant messages inside elements
// with [data-is-streaming] attributes during generation, then
// finalizes them. We use a MutationObserver on the chat
// container to detect when streaming ends (the attribute is
// removed or set to "false") and then extract the full text.

let lastSentText = '';
let debounceTimer = null;
let initialSnapshotTaken = false;   // true once we've captured the page's existing messages
let lastMessageCount = 0;           // track assistant message count to detect new messages
let pendingText = '';               // track text growth to detect active streaming

function watchForResponses() {
    // Claude.ai renders the conversation in a scrollable container.
    // The actual selector may change across deploys, so we look for
    // common structural markers.
    const findChatContainer = () => {
        // Primary: the main conversation thread
        return document.querySelector('[class*="conversation-turn"]')?.closest('[class*="thread"]')
            || document.querySelector('main')
            || document.body;
    };

    const observer = new MutationObserver(() => {
        // Debounce: wait for streaming to settle before extracting.
        // During streaming, mutations fire rapidly. We wait 500ms of
        // quiet, then extractLatestResponse requires one more stable
        // cycle before actually sending — so effective wait is ~1s.
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => extractLatestResponse(), 500);
    });

    // Observe the whole main area for subtree changes (new messages,
    // streaming text appends, attribute changes on streaming markers).
    const container = findChatContainer();
    observer.observe(container, {
        childList: true,
        subtree: true,
        characterData: true,
    });

    // Take an initial snapshot of existing messages so we don't relay
    // the pre-existing last response when the page loads.
    setTimeout(() => {
        const existing = findAssistantMessages();
        lastMessageCount = existing.length;
        if (existing.length > 0) {
            lastSentText = (existing[existing.length - 1].innerText || '').trim();
        }
        initialSnapshotTaken = true;
        console.log('[Bridge/claude] Initial snapshot:', lastMessageCount, 'assistant messages,', lastSentText.length, 'chars in last');
    }, 1500);  // Wait for page to settle

    console.log('[Bridge/claude] Response watcher active on', container.tagName);
}

/**
 * Find all assistant message elements on the page.
 * Shared between snapshot and extraction so selectors stay in sync.
 */
function findAssistantMessages() {
    let divs = document.querySelectorAll(
        '[data-testid*="assistant"], ' +
        '.font-claude-message, ' +
        '[class*="claude-message"]',
    );

    // Fallback: message-like blocks
    if (divs.length === 0) {
        divs = document.querySelectorAll('[class*="message"], [class*="response"]');
    }

    return divs;
}

function extractLatestResponse() {
    // Don't relay anything until we've snapshotted the existing messages
    if (!initialSnapshotTaken) return;

    const messageDivs = findAssistantMessages();
    if (messageDivs.length === 0) return;

    const lastAssistantEl = messageDivs[messageDivs.length - 1];

    // Don't grab text while still streaming — check multiple indicators
    const isStreaming = lastAssistantEl.closest('[data-is-streaming="true"]')
        || lastAssistantEl.getAttribute('data-is-streaming') === 'true';
    if (isStreaming) return;

    // Also check for a stop/cancel button being visible — indicates active generation
    const stopBtn = document.querySelector('button[aria-label="Stop Response"]')
        || document.querySelector('button[aria-label="Stop response"]')
        || document.querySelector('button[data-testid="stop-button"]');
    if (stopBtn && stopBtn.offsetParent !== null) return;  // visible stop button = still streaming

    const text = (lastAssistantEl.innerText || lastAssistantEl.textContent || '').trim();
    if (!text) return;

    // Only send if the text changed since last time
    if (text === lastSentText) return;

    // Check if text is still growing — wait for it to stabilize.
    // If the text changed from our last peek, record it and schedule
    // a re-check. If it matches on the re-check, it's done streaming.
    if (text !== pendingText) {
        pendingText = text;
        // Schedule a stabilization re-check since the MutationObserver
        // won't fire again if streaming just finished (no more mutations)
        setTimeout(() => extractLatestResponse(), 600);
        return;
    }

    // Text matches pendingText — it stabilized. Send it.
    lastSentText = text;
    pendingText = '';
    lastMessageCount = messageDivs.length;

    console.log('[Bridge/claude] New response detected:', text.length, 'chars');
    console.log('[Bridge/claude] Preview:', text.slice(0, 150));

    chrome.runtime.sendMessage({
        type: 'claude-response',
        text: text,
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.warn('[Bridge/claude] Forward failed:', chrome.runtime.lastError.message);
        }
    });
}
