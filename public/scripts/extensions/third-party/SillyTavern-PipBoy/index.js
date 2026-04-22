/**
 * Pip-Boy 3000 Mk IV — Vault 83 state display panel for SillyTavern
 *
 * Pure display layer. Receives game state from an external source
 * (bridge extension, auto-parsed messages, slash command) and renders
 * it in a draggable CRT-style Pip-Boy panel.
 *
 * Parses both <!-- STATE --> blocks and [Tracker]/[Pip-Boy] bracket
 * lines from the narrator's output.
 */

import { animation_duration, saveSettingsDebounced } from '../../../../script.js';
import { getMessageTimeStamp } from '../../../../scripts/RossAscends-mods.js';
import { getContext } from '../../../../scripts/extensions.js';
import { eventSource, event_types } from '../../../../scripts/events.js';
import { setOnlineStatus } from '../../../../scripts/core/settings-manager.js';
import { main_api } from '../../../../scripts/core/state.js';
import { SlashCommand } from '../../../../scripts/slash-commands/SlashCommand.js';
import { SlashCommandParser } from '../../../../scripts/slash-commands/SlashCommandParser.js';
import { ARGUMENT_TYPE, SlashCommandArgument } from '../../../../scripts/slash-commands/SlashCommandArgument.js';

const EXTENSION_NAME = 'SillyTavern-PipBoy';
const SETTINGS_KEY = 'pipboy';

// ── Day labels (Vault 83: 7-day cycle) ────────────────
const DAY_LABELS = {
    1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
    4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday',
};

const DAY_SHORT = {
    1: 'MON', 2: 'TUE', 3: 'WED',
    4: 'THU', 5: 'FRI', 6: 'SAT', 7: 'SUN',
};

// ── Known item token mappings ─────────────────────────
const ITEM_MAPPINGS = {
    jumpsuit: 'Gray Liaison jumpsuit',
    keycard: 'Liaison keycard',
    watch: 'Brass wristwatch',
    stimpak: 'Stimpak',
    journal: 'Pocket journal',
    pipboy: 'Pip-Boy 3000 Mk IV',
};

// ── Default state (Vault 83 opening loadout) ──────────
const DEFAULT_STATE = {
    day: 1,
    time: '06:42',
    location: 'Liaison corridor',
    scrip: 150,
    items: [
        'Gray Liaison jumpsuit',
        'Pip-Boy 3000 Mk IV',
        'Liaison keycard',
        'Brass wristwatch',
        'Stimpak x2',
        'Pocket journal',
    ],
    quests: [],
    depth: 0,           // Internal — never displayed in UI
    speakers: [],
    primary_speaker: null,
    scene: null,
    lastSync: null,
    custom: {},
};

let currentState = { ...DEFAULT_STATE, items: [...DEFAULT_STATE.items], quests: [] };
let panelVisible = false;
let bridgeConnected = false;
let bridgeEnabled = false;
let pendingUserMessage = null;    // Stores user text when interceptor aborts generation

// ── Known character cards (rebuilt on chat load) ─────
// Maps lowercase name → { name, avatar } from the group's member list.
// Characters NOT in this map are "narratively invented" (no card).
let knownCharacterCards = new Map();

// ── Generate interceptor ──────────────────────────────
//
// Declared in manifest.json as "generate_interceptor": "pipboyBridgeInterceptor".
// ST calls this global function during generation. When bridge mode is active
// and connected, we:
//   1. Call abort(true) to prevent the normal API call
//   2. Capture the user's message text
//   3. Post it to the page via window.postMessage so the Chrome bridge
//      extension (content-st.js) can relay it to claude.ai
//
// The response comes back via PIPBOY_RAW_MESSAGE and gets injected into
// ST's chat by injectBridgeResponse().
//
globalThis.pipboyBridgeInterceptor = async function (chat, contextSize, abort, type) {
    // Intercept when either: (a) Pip-Boy is the selected API, or (b) bridge mode
    // is manually enabled in extension settings. Must also be connected.
    const isPipboyApi = main_api === 'pipboy';
    if ((!isPipboyApi && !bridgeEnabled) || !bridgeConnected) return;

    // Only intercept normal generation (not swipes, impersonation, etc.)
    if (type !== 'normal' && type !== 'group') return;

    console.log('[Pip-Boy 3000] Bridge interceptor: aborting API call, routing through bridge');

    // Grab the last user message from the chat array (coreChat uses ChatMessage shape)
    const lastUserMsg = [...chat].reverse().find(m => m.is_user);
    const userText = lastUserMsg?.mes || '';

    if (userText) {
        pendingUserMessage = userText;

        // Post to the page so the Chrome bridge content script picks it up
        window.postMessage({
            type: 'PIPBOY_USER_SEND',
            text: userText,
            source: 'pipboy-interceptor',
        }, '*');

        console.log('[Pip-Boy 3000] User message forwarded to bridge:', userText.length, 'chars');
    }

    abort(true);
};

// ── Settings ───────────────────────────────────────────
function getSettings() {
    const context = getContext();
    if (!context.extensionSettings[SETTINGS_KEY]) {
        context.extensionSettings[SETTINGS_KEY] = {
            enabled: true,
            bridgeEnabled: false,
            autoParseMessages: true,
            showOnLoad: false,
            autoConnect: false,
        };
    }
    // Backfill new keys for existing installs
    if (context.extensionSettings[SETTINGS_KEY].autoConnect === undefined) {
        context.extensionSettings[SETTINGS_KEY].autoConnect = false;
    }
    return context.extensionSettings[SETTINGS_KEY];
}

// ── Item token prettifier ─────────────────────────────
function prettifyItemToken(tok) {
    const countMatch = tok.match(/^(.+):(\d+)$/);
    let base = countMatch ? countMatch[1] : tok;
    const count = countMatch ? parseInt(countMatch[2], 10) : 1;

    base = ITEM_MAPPINGS[base] ||
        base.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    return count > 1 ? `${base} x${count}` : base;
}

// ── State management ───────────────────────────────────

/**
 * Update the Pip-Boy state. Merges partial updates.
 * Handles both the JSX tracker format (items as strings)
 * and the STATE block format (inventory as token array).
 */
function updateState(newState) {
    // Normalize inventory/items — support both field names
    if (newState.inventory && Array.isArray(newState.inventory)) {
        newState.items = newState.inventory.map(tok =>
            typeof tok === 'string' ? prettifyItemToken(tok) : (tok.name || 'Unknown'),
        );
        delete newState.inventory;
    }

    // Handle quest from STATE block (singular → add to quests array)
    if (newState.quest && typeof newState.quest === 'string') {
        const questName = newState.quest.replace(/_/g, ' ');
        if (!currentState.quests.some(q => q.toLowerCase() === questName.toLowerCase())) {
            newState.quests = [...currentState.quests, questName];
        }
        delete newState.quest;
    }

    // Normalize location from snake_case
    if (newState.location && typeof newState.location === 'string') {
        newState.location = newState.location
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    }

    newState.lastSync = new Date().toISOString();
    currentState = { ...currentState, ...newState };
    renderPanel();

    // Emit event for other extensions to listen
    eventSource.emit('pipboy_state_updated', currentState);
}

function resetState() {
    currentState = { ...DEFAULT_STATE, items: [...DEFAULT_STATE.items], quests: [] };
    renderPanel();
}

function getState() {
    return { ...currentState };
}

// ── Parse <!-- STATE --> block ─────────────────────────
function parseStateBlock(messageText) {
    if (!messageText) return null;

    const match = messageText.match(/<!--\s*STATE\s*([\s\S]*?)-->/);
    if (!match) return null;

    const body = match[1];
    const result = {};

    for (const line of body.split('\n')) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;
        const key = line.slice(0, colonIdx).trim().toLowerCase();
        const rawVal = line.slice(colonIdx + 1).trim();
        if (!rawVal) continue;

        if (key === 'day') {
            const n = parseInt(rawVal, 10);
            if (!isNaN(n) && n >= 1 && n <= 7) result.day = n;
        } else if (key === 'time') {
            if (/^\d{1,2}:\d{2}$/.test(rawVal)) result.time = rawVal;
        } else if (key === 'location') {
            result.location = rawVal;
        } else if (key === 'scrip') {
            const n = parseInt(rawVal, 10);
            if (!isNaN(n)) result.scrip = n;
        } else if (key === 'inventory') {
            const listMatch = rawVal.match(/\[(.*)\]/);
            if (listMatch) {
                result.inventory = listMatch[1]
                    .split(',').map(s => s.trim()).filter(Boolean);
            }
        } else if (key === 'quest') {
            if (rawVal && rawVal !== 'null') result.quest = rawVal;
        } else if (key === 'depth') {
            const n = parseInt(rawVal, 10);
            if (!isNaN(n)) result.depth = n;
        } else if (key === 'speakers') {
            const listMatch = rawVal.match(/\[(.*)\]/);
            if (listMatch) {
                result.speakers = listMatch[1]
                    .split(',').map(s => s.trim()).filter(Boolean);
            }
        } else if (key === 'primary_speaker') {
            result.primary_speaker = rawVal;
        } else if (key === 'scene') {
            result.scene = rawVal;
        }
    }

    return Object.keys(result).length > 0 ? result : null;
}

// ── Fallback: parse [Tracker] and [Pip-Boy] bracket lines
function parseBracketLines(messageText) {
    if (!messageText) return null;
    const result = {};

    // [Tracker: Day 3 (Wednesday), 17:45 | ...]
    const trackerMatch = messageText.match(
        /\[Tracker:\s*Day\s*(\d+)\s*\([^)]+\),?\s*(\d{1,2}:\d{2})/i,
    );
    if (trackerMatch) {
        result.day = parseInt(trackerMatch[1], 10);
        result.time = trackerMatch[2];
    }

    // [Pip-Boy: 128 scrip | items... | Quest: ... | Location: ...]
    const pipboyMatch = messageText.match(/\[Pip-Boy:([^\]]+)\]/i);
    if (pipboyMatch) {
        const parts = pipboyMatch[1].split('|').map(s => s.trim());

        for (const part of parts) {
            const scripMatch = part.match(/^(\d+)\s*scrip/i);
            if (scripMatch) {
                result.scrip = parseInt(scripMatch[1], 10);
                continue;
            }
            const questMatch = part.match(/^Quest:\s*(.+)$/i);
            if (questMatch) {
                result.quest = questMatch[1].trim();
                continue;
            }
            const locMatch = part.match(/^Location:\s*(.+)$/i);
            if (locMatch) {
                result.location = locMatch[1].trim();
                continue;
            }
            // Comma-separated list = inventory
            if (part.includes(',')) {
                result.items = part.split(',').map(s => s.trim()).filter(Boolean);
            }
        }
    }

    return Object.keys(result).length > 0 ? result : null;
}

/**
 * Parse state from a message. Tries STATE block first, falls back to brackets.
 */
function parseStateFromMessage(messageText) {
    return parseStateBlock(messageText) || parseBracketLines(messageText);
}

// ── Speaker segment parser ───────────────────────────
/**
 * Parse narrator output into typed segments for display formatting.
 *
 * Identifies three segment types:
 *   - narrator: Prose without a speaker tag (muted, no avatar)
 *   - known:   **Name:** dialogue where Name matches a character card (green)
 *   - unknown: **Name:** dialogue where Name has no card (amber, bolded)
 *
 * @param {string} text Raw message text (before markdown rendering)
 * @returns {Array<{type: string, text: string, speaker?: string, avatar?: string}>}
 */
function parseSpeakerSegments(text) {
    if (!text) return [];

    // Strip the <!-- STATE --> block from display text — it's machine data
    const cleanText = text.replace(/<!--\s*STATE[\s\S]*?-->/g, '').trim();
    if (!cleanText) return [];

    const segments = [];
    const speakerPattern = /\*\*([A-Z][^*:]*?)(?:\*\*\s*\*+\([^)]*\)\*+)?:\*\*\s*/g;

    let lastIndex = 0;
    let match;

    while ((match = speakerPattern.exec(cleanText)) !== null) {
        // Everything before this match is narrator prose
        const beforeText = cleanText.slice(lastIndex, match.index).trim();
        if (beforeText) {
            segments.push({ type: 'narrator', text: beforeText });
        }

        const speakerName = match[1].trim();
        const speakerLower = speakerName.toLowerCase();
        const cardInfo = knownCharacterCards.get(speakerLower) || null;
        const hasCard = cardInfo !== null;

        // Find the end of this speaker's content:
        // runs until the next **Name:** or end of text
        const contentStart = match.index + match[0].length;
        const peekPattern = /\*\*([A-Z][^*:]*?)(?:\*\*\s*\*+\([^)]*\)\*+)?:\*\*\s*/g;
        peekPattern.lastIndex = contentStart;
        const nextMatch = peekPattern.exec(cleanText);

        const contentEnd = nextMatch ? nextMatch.index : cleanText.length;
        let content = cleanText.slice(contentStart, contentEnd).trim();

        // If this is the LAST speaker segment (no next **Name:**), check for
        // trailing narrator prose separated by a blank line. Split it off so
        // environmental narration after the last character's dialogue gets
        // its own narrator segment.
        let trailingNarrator = null;
        if (!nextMatch && content.includes('\n\n')) {
            const lastBlank = content.lastIndexOf('\n\n');
            const afterBlank = content.slice(lastBlank + 2).trim();
            const beforeBlank = content.slice(0, lastBlank).trim();
            if (afterBlank && beforeBlank) {
                content = beforeBlank;
                trailingNarrator = afterBlank;
            }
        }

        segments.push({
            type: hasCard ? 'known' : 'unknown',
            speaker: speakerName,
            text: content,
            avatar: cardInfo?.avatar || null,
        });

        if (trailingNarrator) {
            segments.push({ type: 'narrator', text: trailingNarrator });
        }

        lastIndex = contentEnd;
        speakerPattern.lastIndex = contentEnd;
    }

    // Any remaining text after the last speaker is narrator prose
    if (lastIndex < cleanText.length) {
        const remaining = cleanText.slice(lastIndex).trim();
        if (remaining) {
            segments.push({ type: 'narrator', text: remaining });
        }
    }

    // If no speaker tags found at all, return empty (not worth formatting)
    if (segments.length <= 1 && segments[0]?.type === 'narrator') {
        return [];
    }

    return segments;
}

/**
 * Rebuild the known character cards map from the current group members.
 * Called on chat load and group selection.
 */
function rebuildKnownCharacters() {
    knownCharacterCards.clear();
    const context = getContext();

    if (!context.groupId) return;

    const group = context.groups?.find(g => g.id === context.groupId);
    if (!group) return;

    const characters = context.characters || [];
    for (const memberId of group.members) {
        const char = characters.find(c => c.avatar === memberId);
        if (!char) continue;
        knownCharacterCards.set(char.name.toLowerCase(), {
            name: char.name,
            avatar: char.avatar,
        });
    }

    console.log(`[Pip-Boy 3000] Known character cards: ${[...knownCharacterCards.keys()].join(', ')}`);
}

/**
 * Build styled HTML from speaker segments.
 * Replaces the message body's inner HTML with colored/formatted segments.
 */
function buildSegmentHTML(segments) {
    const parts = [];

    for (const seg of segments) {
        const escapedText = escapeHtml(seg.text);
        // Convert basic markdown bold back since we escaped it
        const formattedText = escapedText
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');

        if (seg.type === 'narrator') {
            parts.push(
                `<div class="pipboy-seg pipboy-seg-narrator"><p>${formattedText}</p></div>`,
            );
        } else if (seg.type === 'known') {
            parts.push(
                `<div class="pipboy-seg pipboy-seg-known">` +
                `<span class="pipboy-seg-speaker">${escapeHtml(seg.speaker)}</span>` +
                `<p>${formattedText}</p>` +
                `</div>`,
            );
        } else {
            // unknown — narratively invented character, no card
            parts.push(
                `<div class="pipboy-seg pipboy-seg-unknown">` +
                `<span class="pipboy-seg-speaker">${escapeHtml(seg.speaker)}</span>` +
                `<p>${formattedText}</p>` +
                `</div>`,
            );
        }
    }

    return parts.join('');
}

/**
 * Post-process a rendered message to apply speaker segment formatting.
 * Hooks into CHARACTER_MESSAGE_RENDERED.
 */
function formatRenderedMessage(messageIndex) {
    const settings = getSettings();
    if (!settings.enabled || !settings.autoParseMessages) return;

    // Only format if we have known characters (i.e. we're in a group chat)
    if (knownCharacterCards.size === 0) return;

    const context = getContext();
    const message = context.chat?.[messageIndex];
    if (!message || message.is_user) return;

    // Get the raw message text (before markdown rendering)
    const rawText = message.mes;
    if (!rawText) return;

    // Only process messages with speaker tags
    const segments = parseSpeakerSegments(rawText);
    if (segments.length === 0) return;

    // Find the rendered DOM element
    const mesElement = document.querySelector(`#chat .mes[mesid="${messageIndex}"] .mes_text`);
    if (!mesElement) return;

    // Replace the rendered content with our styled segments
    mesElement.innerHTML = buildSegmentHTML(segments);
    mesElement.classList.add('pipboy-formatted');
}

// ── Format day display ────────────────────────────────
function formatDay(day) {
    if (!day) return '';
    const name = DAY_LABELS[day] || '';
    return name ? `Day ${day} (${name})` : `Day ${day}`;
}

function formatDayShort(day) {
    return DAY_SHORT[day] || '';
}

// ── Panel HTML ─────────────────────────────────────────
function createPanelHTML() {
    return `
    <div id="pipboy-panel">
        <div id="pipboy-panelheader">
            <div class="pipboy-title-block">
                <span class="pipboy-title">PIP-BOY 3000 MK IV</span>
                <span class="pipboy-subtitle">ROBCO INDUSTRIES \u00B7 VAULT 83 TERMINAL</span>
            </div>
            <div class="pipboy-header-controls">
                <button class="pipboy-header-btn" id="pipboy-btn-minimize" title="Minimize">
                    <i class="fa-solid fa-minus"></i>
                </button>
                <button class="pipboy-header-btn" id="pipboy-btn-close" title="Close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        </div>
        <div class="pipboy-tabs">
            <button class="pipboy-tab active" data-tab="stat">STAT</button>
            <button class="pipboy-tab" data-tab="inv">INV</button>
            <button class="pipboy-tab" data-tab="quest">QUESTS</button>
            <button class="pipboy-tab" data-tab="data">DATA</button>
        </div>
        <div class="pipboy-content">
            <div class="pipboy-tab-panel active" data-panel="stat">
                <div id="pipboy-stat-content"></div>
            </div>
            <div class="pipboy-tab-panel" data-panel="inv">
                <div id="pipboy-inv-content"></div>
            </div>
            <div class="pipboy-tab-panel" data-panel="quest">
                <div id="pipboy-quest-content"></div>
            </div>
            <div class="pipboy-tab-panel" data-panel="data">
                <div id="pipboy-data-content"></div>
            </div>
        </div>
        <div class="pipboy-status-bar">
            <div class="pipboy-connection">
                <span class="pipboy-connection-dot" id="pipboy-connection-dot"></span>
                <span id="pipboy-connection-label">Standalone</span>
            </div>
            <div id="pipboy-status-time"></div>
        </div>
    </div>`;
}

function createSettingsHTML() {
    return `
    <div id="pipboy-settings" class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
            <b>Pip-Boy 3000 Mk IV</b>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
            <div class="pipboy-settings-row">
                <label for="pipboy-toggle-enabled">Show Pip-Boy panel</label>
                <input type="checkbox" id="pipboy-toggle-enabled" />
            </div>
            <div class="pipboy-settings-row">
                <label for="pipboy-toggle-bridge">Bridge mode (bidirectional)</label>
                <input type="checkbox" id="pipboy-toggle-bridge" />
            </div>
            <div class="pipboy-settings-row">
                <label for="pipboy-toggle-autoparse">Auto-parse STATE / bracket lines</label>
                <input type="checkbox" id="pipboy-toggle-autoparse" />
            </div>
            <hr />
            <div class="pipboy-settings-row">
                <span>Panel</span>
                <div>
                    <button class="menu_button" id="pipboy-btn-show">Show</button>
                    <button class="menu_button" id="pipboy-btn-reset-state">Reset State</button>
                </div>
            </div>
        </div>
    </div>`;
}

// ── Rendering ──────────────────────────────────────────
function renderPanel() {
    renderStatTab();
    renderInvTab();
    renderQuestTab();
    renderDataTab();
    renderStatusBar();
}

function renderStatTab() {
    const el = document.getElementById('pipboy-stat-content');
    if (!el) return;

    const s = currentState;
    const rows = [];

    // Day & Time
    rows.push('<div class="pipboy-section">');
    rows.push('<div class="pipboy-section-header">Status</div>');

    // Day dial (7-day cycle)
    rows.push('<div class="pipboy-day-dial">');
    for (let d = 1; d <= 7; d++) {
        const active = s.day === d;
        rows.push(`<div class="pipboy-day-cell${active ? ' active' : ''}">
            <span class="pipboy-day-num">${d}</span>
            <span class="pipboy-day-name">${DAY_SHORT[d]}</span>
        </div>`);
    }
    rows.push('</div>');

    if (s.time) {
        rows.push(`<div class="pipboy-stat-row">
            <span class="pipboy-stat-label">Time</span>
            <span class="pipboy-stat-value pipboy-glow" style="font-size:18px; letter-spacing:2px;">${escapeHtml(s.time)}</span>
        </div>`);
    }
    rows.push('</div>');

    // Location
    rows.push('<div class="pipboy-section">');
    rows.push('<div class="pipboy-section-header">Location</div>');
    rows.push(`<div class="pipboy-stat-row">
        <span class="pipboy-stat-label">\u25B8</span>
        <span class="pipboy-stat-value pipboy-glow">${escapeHtml(s.location)}</span>
    </div>`);
    rows.push('</div>');

    // Scene (if present)
    if (s.scene) {
        rows.push('<div class="pipboy-section">');
        rows.push('<div class="pipboy-section-header">Scene</div>');
        rows.push(`<div class="pipboy-stat-row">
            <span class="pipboy-stat-label">Active</span>
            <span class="pipboy-stat-value">${escapeHtml(s.scene.replace(/_/g, ' '))}</span>
        </div>`);
        rows.push('</div>');
    }

    // Scrip
    rows.push('<div class="pipboy-section">');
    rows.push('<div class="pipboy-section-header">Scrip</div>');
    rows.push(`<div class="pipboy-stat-row">
        <span class="pipboy-stat-label">\u2B25</span>
        <span class="pipboy-stat-value pipboy-glow" style="font-size:20px;">${s.scrip.toLocaleString()}</span>
    </div>`);
    rows.push('</div>');

    // Custom fields
    const customKeys = Object.keys(s.custom || {});
    if (customKeys.length > 0) {
        rows.push('<div class="pipboy-section">');
        rows.push('<div class="pipboy-section-header">Other</div>');
        for (const key of customKeys) {
            rows.push(`<div class="pipboy-stat-row">
                <span class="pipboy-stat-label">${escapeHtml(key)}</span>
                <span class="pipboy-stat-value">${escapeHtml(String(s.custom[key]))}</span>
            </div>`);
        }
        rows.push('</div>');
    }

    el.innerHTML = rows.join('');
}

function renderInvTab() {
    const el = document.getElementById('pipboy-inv-content');
    if (!el) return;

    const items = currentState.items || [];
    if (items.length === 0) {
        el.innerHTML = '<div class="pipboy-empty">[ INVENTORY EMPTY ]</div>';
        return;
    }

    const itemsHtml = items.map(item =>
        `<li class="pipboy-inv-item">
            <span class="pipboy-inv-marker">\u25B8</span>
            <span class="pipboy-inv-name">${escapeHtml(item)}</span>
        </li>`,
    ).join('');

    el.innerHTML = `
        <div class="pipboy-section">
            <div class="pipboy-section-header">Items (${items.length})</div>
            <ul class="pipboy-inv-list">${itemsHtml}</ul>
        </div>`;
}

function renderQuestTab() {
    const el = document.getElementById('pipboy-quest-content');
    if (!el) return;

    const quests = currentState.quests || [];
    if (quests.length === 0) {
        el.innerHTML = '<div class="pipboy-empty">[ NO ACTIVE QUESTS ]</div>';
        return;
    }

    const questsHtml = quests.map((q, i) =>
        `<div class="pipboy-quest${i === quests.length - 1 ? ' pipboy-quest-active' : ''}">
            <div class="pipboy-quest-name${i === quests.length - 1 ? ' pipboy-glow' : ''}">${escapeHtml(q)}</div>
        </div>`,
    ).join('');

    el.innerHTML = `
        <div class="pipboy-section">
            <div class="pipboy-section-header">Quest Log (${quests.length})</div>
            ${questsHtml}
        </div>`;
}

function renderDataTab() {
    const el = document.getElementById('pipboy-data-content');
    if (!el) return;

    const s = currentState;
    const rows = [];

    // Speakers
    if (s.speakers && s.speakers.length > 0) {
        rows.push('<div class="pipboy-section">');
        rows.push('<div class="pipboy-section-header">Speakers</div>');
        for (const speaker of s.speakers) {
            const isPrimary = speaker === s.primary_speaker;
            const displayName = speaker.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            rows.push(`<div class="pipboy-stat-row">
                <span class="pipboy-stat-label">${isPrimary ? '\u25B8 ' : '  '}${escapeHtml(displayName)}</span>
                ${isPrimary ? '<span class="pipboy-stat-value pipboy-glow">ACTIVE</span>' : ''}
            </div>`);
        }
        rows.push('</div>');
    }

    // Last sync
    if (s.lastSync) {
        rows.push('<div class="pipboy-section">');
        rows.push('<div class="pipboy-section-header">Sync</div>');
        rows.push(`<div class="pipboy-stat-row">
            <span class="pipboy-stat-label">Last</span>
            <span class="pipboy-stat-value">${new Date(s.lastSync).toLocaleTimeString()}</span>
        </div>`);
        rows.push('</div>');
    }

    // Debug: raw state (depth excluded from display per V83 rules)
    const displayState = { ...s };
    delete displayState.depth;  // DEPTH is never shown in UI
    rows.push('<div class="pipboy-section">');
    rows.push('<div class="pipboy-section-header">Terminal Dump</div>');
    rows.push(`<pre style="color: #0e8c3a; font-size: 10px; white-space: pre-wrap; word-break: break-all; margin: 0;">${escapeHtml(JSON.stringify(displayState, null, 2))}</pre>`);
    rows.push('</div>');

    el.innerHTML = rows.join('');
}

function renderStatusBar() {
    const dot = document.getElementById('pipboy-connection-dot');
    const label = document.getElementById('pipboy-connection-label');
    const timeEl = document.getElementById('pipboy-status-time');

    if (dot) {
        dot.className = `pipboy-connection-dot ${bridgeConnected ? 'connected' : 'disconnected'}`;
    }
    if (label) {
        label.textContent = bridgeConnected ? 'Bridge Connected' : (bridgeEnabled ? 'Awaiting Bridge' : 'Standalone');
    }
    if (timeEl) {
        const d = currentState.day ? formatDay(currentState.day) : '';
        const t = currentState.time || '';
        timeEl.textContent = [d, t].filter(Boolean).join(' \u2014 ') || 'LIAISON TEAGUE';
    }
}

// ── Panel visibility ───────────────────────────────────
function showPanel() {
    const panel = document.getElementById('pipboy-panel');
    if (!panel) return;
    panel.classList.add('pipboy-visible');
    panelVisible = true;
    renderPanel();
}

function hidePanel() {
    const panel = document.getElementById('pipboy-panel');
    if (!panel) return;
    panel.classList.remove('pipboy-visible');
    panelVisible = false;
}

function togglePanel() {
    if (panelVisible) hidePanel();
    else showPanel();
}

// ── Tab switching ──────────────────────────────────────
function initTabs() {
    document.querySelectorAll('.pipboy-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetPanel = tab.getAttribute('data-tab');
            document.querySelectorAll('.pipboy-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.pipboy-tab-panel').forEach(p => p.classList.remove('active'));
            const panel = document.querySelector(`.pipboy-tab-panel[data-panel="${targetPanel}"]`);
            if (panel) panel.classList.add('active');
        });
    });
}

// ── Bridge response injection ─────────────────────────
//
// When a claude.ai response arrives through the Chrome bridge, inject it
// into ST's chat as an assistant message. This makes the bridge behave
// like any other API connection — the response appears in the chat log,
// gets saved, and triggers CHARACTER_MESSAGE_RENDERED for formatting.
//
async function injectBridgeResponse(text) {
    const context = getContext();
    if (!context.chat) {
        console.warn('[Pip-Boy 3000] No active chat — cannot inject bridge response');
        return;
    }

    // Determine the character name for the message.
    // In group chats, use the primary speaker from STATE data if available.
    // In solo chats, use the character's name.
    let charName = 'Narrator';
    if (context.groupId) {
        // Group chat — use primary_speaker from the latest STATE, or 'Narrator'
        const parsed = parseStateFromMessage(text);
        if (parsed?.primary_speaker) {
            const speakerName = parsed.primary_speaker
                .replace(/_/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase());
            charName = speakerName;
        }
    } else if (context.characters?.[context.characterId]) {
        charName = context.characters[context.characterId].name;
    }

    /** @type {import('../../../../script.js').ChatMessage} */
    const message = {
        name: charName,
        is_user: false,
        send_date: getMessageTimeStamp(),
        mes: text,
        extra: {
            api: 'pipboy-bridge',
            model: 'claude.ai (bridge)',
        },
    };

    context.chat.push(message);
    const messageId = context.chat.length - 1;
    await eventSource.emit(event_types.MESSAGE_RECEIVED, messageId, 'extension');
    context.addOneMessage(message);
    await eventSource.emit(event_types.CHARACTER_MESSAGE_RENDERED, messageId, 'extension');
    await context.saveChat();

    pendingUserMessage = null;
    console.log('[Pip-Boy 3000] Bridge response injected as message #' + messageId);
}

// ── Bridge communication ───────────────────────────────
function initBridge() {
    window.addEventListener('message', (event) => {
        // Pre-parsed state object from bridge or other extension
        if (event.data?.type === 'PIPBOY_STATE_UPDATE') {
            bridgeConnected = true;
            updateState(event.data.state);
        }
        // Raw narrator text from Chrome bridge — parse it here
        // so the parsing logic stays in one place (the Pip-Boy).
        if (event.data?.type === 'PIPBOY_RAW_MESSAGE') {
            bridgeConnected = true;
            renderStatusBar();
            updateApiConnectionStatus();
            const rawText = event.data.text;
            if (rawText) {
                // Update Pip-Boy panel state from STATE blocks / bracket lines
                const parsed = parseStateFromMessage(rawText);
                if (parsed) {
                    updateState(parsed);
                    if (!panelVisible) showPanel();
                }
                // When bridge mode is active (either via API selection or settings toggle),
                // inject the response into ST's chat as a normal assistant message.
                if (bridgeEnabled || main_api === 'pipboy') {
                    injectBridgeResponse(rawText);
                }
            }
        }
        if (event.data?.type === 'PIPBOY_BRIDGE_CONNECTED') {
            bridgeConnected = true;
            renderStatusBar();
            updateApiConnectionStatus();
        }
        if (event.data?.type === 'PIPBOY_BRIDGE_DISCONNECTED') {
            bridgeConnected = false;
            renderStatusBar();
            updateApiConnectionStatus();
        }
    });

    document.addEventListener('pipboy:update', (event) => {
        if (event.detail) updateState(event.detail);
    });

    // ── Active bridge probe ──────────────────────────────
    // The Chrome bridge content script may have posted PIPBOY_BRIDGE_CONNECTED
    // before the Pip-Boy extension loaded. We probe for it by posting a ping
    // that content-st.js will respond to, and also by checking if the bridge
    // content script left a marker on the page.
    //
    // Additionally, we listen for a PIPBOY_BRIDGE_PONG response to our probe.
    window.addEventListener('message', (event) => {
        if (event.data?.type === 'PIPBOY_BRIDGE_PONG') {
            bridgeConnected = true;
            renderStatusBar();
            updateApiConnectionStatus();
            console.log('[Pip-Boy 3000] Bridge probe: connection confirmed via PONG');
        }
    });

    // Send probe — content-st.js will respond with PONG if it's active
    window.postMessage({ type: 'PIPBOY_BRIDGE_PING', source: 'pipboy-extension' }, '*');
}

// ── Auto-parse messages ────────────────────────────────
function initAutoParser() {
    eventSource.on(event_types.MESSAGE_RECEIVED, (messageIndex) => {
        const settings = getSettings();
        if (!settings.autoParseMessages) return;

        const context = getContext();
        const message = context.chat?.[messageIndex];
        if (!message?.mes) return;

        const parsed = parseStateFromMessage(message.mes);
        if (parsed) {
            updateState(parsed);
            if (!panelVisible) showPanel();
        }
    });

    eventSource.on(event_types.MESSAGE_EDITED, (messageIndex) => {
        const settings = getSettings();
        if (!settings.autoParseMessages) return;

        const context = getContext();
        const message = context.chat?.[messageIndex];
        if (!message?.mes) return;

        const parsed = parseStateFromMessage(message.mes);
        if (parsed) updateState(parsed);
    });
}

// ── Slash commands ─────────────────────────────────────
function registerCommands() {
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'pipboy',
        callback: async (_args, value) => {
            if (!value) {
                togglePanel();
                return panelVisible ? 'Panel shown' : 'Panel hidden';
            }

            const sub = value.trim().toLowerCase();
            if (sub === 'show') { showPanel(); return 'Panel shown'; }
            if (sub === 'hide') { hidePanel(); return 'Panel hidden'; }
            if (sub === 'reset') { resetState(); return 'State reset'; }
            if (sub === 'state') { return JSON.stringify(currentState); }

            // Try parsing as JSON state update
            try {
                const state = JSON.parse(value);
                updateState(state);
                if (!panelVisible) showPanel();
                return 'State updated';
            } catch {
                // Try parsing as narrator output (STATE block or brackets)
                const parsed = parseStateFromMessage(value);
                if (parsed) {
                    updateState(parsed);
                    if (!panelVisible) showPanel();
                    return 'Synced from narrator output';
                }
                return 'Unknown command. Use: show, hide, reset, state, or pass JSON/narrator output.';
            }
        },
        returns: 'string',
        helpString: 'Control the Pip-Boy panel. Subcommands: show, hide, reset, state. Pass JSON or narrator output to sync.',
        unnamedArgumentList: [
            SlashCommandArgument.fromProps({
                description: 'Subcommand, JSON state, or narrator output',
                typeList: [ARGUMENT_TYPE.STRING],
                isRequired: false,
            }),
        ],
    }));

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'pipboy-sync',
        callback: async (_args, value) => {
            if (!value) return 'Paste narrator output or JSON to sync';

            // Try JSON first
            try {
                const state = JSON.parse(value);
                updateState(state);
                if (!panelVisible) showPanel();
                return 'Synced from JSON';
            } catch {
                // Fall through to narrator parse
            }

            const parsed = parseStateFromMessage(value);
            if (parsed) {
                updateState(parsed);
                if (!panelVisible) showPanel();
                return 'Synced from narrator output';
            }
            return 'No STATE block or bracket lines found in input.';
        },
        returns: 'string',
        helpString: 'Sync Pip-Boy state from narrator output or JSON. Parses <!-- STATE --> blocks and [Tracker]/[Pip-Boy] bracket lines.',
        unnamedArgumentList: [
            SlashCommandArgument.fromProps({
                description: 'Narrator output or JSON state',
                typeList: [ARGUMENT_TYPE.STRING],
                isRequired: true,
            }),
        ],
    }));
}

// ── API connector panel ───────────────────────────────
//
// Injected into ST's API connection area so the Pip-Boy Bridge
// appears as a selectable API with a connection status indicator.
//
function createConnectorHTML() {
    return `
    <div id="pipboy_api" style="display: none; position: relative;">
        <div class="flex-container flexFlowColumn" style="gap: 8px; padding: 8px 0;">
            <h4 class="margin0">Pip-Boy Bridge</h4>
            <p style="margin: 0; font-size: 0.9em; opacity: 0.8;">
                Routes messages through the Chrome bridge extension to claude.ai.
                No API key required.
            </p>
            <div class="flex-container" style="gap: 8px; align-items: center;">
                <span id="pipboy-api-status-dot" style="
                    width: 10px; height: 10px; border-radius: 50%;
                    background: #c44; display: inline-block;
                "></span>
                <span id="pipboy-api-status-text" style="font-size: 0.9em;">
                    Waiting for Chrome bridge extension...
                </span>
                <button id="pipboy-api-connect-btn" class="menu_button" style="margin-left: auto; font-size: 0.85em;">
                    Connect
                </button>
            </div>
            <p style="margin: 4px 0 0; font-size: 0.8em; opacity: 0.6;">
                Install the Pip-Boy 3000 Bridge Chrome extension and open both
                your claude.ai chat and SillyTavern in Chrome tabs.
            </p>
            <hr style="border: 0; border-top: 1px solid var(--SmartThemeBorderColor, #3f4147); margin: 6px 0;" />
            <div class="flex-container flexFlowColumn" style="gap: 6px;">
                <div class="flex-container" style="align-items: center; justify-content: space-between;">
                    <label for="pipboy-api-toggle-enabled" style="margin: 0; cursor: pointer;">Show Pip-Boy panel</label>
                    <input type="checkbox" id="pipboy-api-toggle-enabled" />
                </div>
                <div class="flex-container" style="align-items: center; justify-content: space-between;">
                    <label for="pipboy-api-toggle-bridge" style="margin: 0; cursor: pointer;">Bridge mode (bidirectional)</label>
                    <input type="checkbox" id="pipboy-api-toggle-bridge" />
                </div>
                <div class="flex-container" style="align-items: center; justify-content: space-between;">
                    <label for="pipboy-api-toggle-autoparse" style="margin: 0; cursor: pointer;">Auto-parse STATE / bracket lines</label>
                    <input type="checkbox" id="pipboy-api-toggle-autoparse" />
                </div>
                <div class="flex-container" style="gap: 6px; margin-top: 4px;">
                    <button class="menu_button" id="pipboy-api-btn-show" style="flex: 1; font-size: 0.85em;">
                        <i class="fa-solid fa-display" style="margin-right: 4px;"></i>Show
                    </button>
                    <button class="menu_button" id="pipboy-api-btn-reset" style="flex: 1; font-size: 0.85em;">
                        <i class="fa-solid fa-rotate-left" style="margin-right: 4px;"></i>Reset State
                    </button>
                </div>
            </div>
            <label class="checkbox_label" for="pipboy-api-auto-connect" style="margin-top: 4px; font-size: 0.9em;">
                <input type="checkbox" id="pipboy-api-auto-connect" />
                <span data-i18n="Auto-connect to Last Server">Auto-connect to Last Server</span>
            </label>
        </div>
    </div>`;
}

/**
 * Update ST's online status indicator when the bridge connects/disconnects
 * and the Pip-Boy API is selected.
 */
function updateApiConnectionStatus() {
    const dot = document.getElementById('pipboy-api-status-dot');
    const text = document.getElementById('pipboy-api-status-text');

    if (dot) {
        dot.style.background = bridgeConnected ? '#4ae080' : '#c44';
    }
    if (text) {
        text.textContent = bridgeConnected
            ? 'Chrome bridge connected'
            : 'Waiting for Chrome bridge extension...';
    }

    // Only touch ST's global status if Pip-Boy is the selected API
    if (main_api === 'pipboy') {
        setOnlineStatus(bridgeConnected ? 'Pip-Boy Bridge' : 'no_connection');
    }
}

// ── Self-contained drag (independent of ST MovingUI) ──
function initPipboyDrag() {
    const panel = document.getElementById('pipboy-panel');
    const header = document.getElementById('pipboy-panelheader');
    if (!panel || !header) return;

    let dragging = false;
    let offsetX = 0, offsetY = 0;

    // Restore saved position
    const saved = getSettings()._panelPos;
    if (saved) {
        panel.style.top = saved.top;
        panel.style.left = saved.left;
        panel.style.right = 'unset';
        panel.style.bottom = 'unset';
    }

    header.addEventListener('mousedown', (e) => {
        if (e.target.closest('button, .fa-xmark, .fa-minus')) return;
        dragging = true;
        offsetX = e.clientX - panel.getBoundingClientRect().left;
        offsetY = e.clientY - panel.getBoundingClientRect().top;
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const x = Math.max(0, Math.min(e.clientX - offsetX, window.innerWidth - 60));
        const y = Math.max(0, Math.min(e.clientY - offsetY, window.innerHeight - 40));
        panel.style.left = x + 'px';
        panel.style.top = y + 'px';
        panel.style.right = 'unset';
        panel.style.bottom = 'unset';
    });

    document.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        // Persist position
        const settings = getSettings();
        settings._panelPos = {
            top: panel.style.top,
            left: panel.style.left,
        };
        saveSettingsDebounced();
    });
}

// ── Utility ────────────────────────────────────────────
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ── Initialization ─────────────────────────────────────
(function init() {
    const settings = getSettings();

    // Inject settings panel
    $('#extensions_settings2').append(createSettingsHTML());

    // Inject main panel into movingDivs
    $('#movingDivs').append(createPanelHTML());

    // Inject API connector panel (shown when "Pip-Boy Bridge" is selected in API dropdown)
    $('#openai_api').after(createConnectorHTML());

    // Connect button — sends a PING probe to discover the bridge
    $('#pipboy-api-connect-btn').on('click', () => {
        console.log('[Pip-Boy 3000] Manual connection probe triggered');
        window.postMessage({ type: 'PIPBOY_BRIDGE_PING', source: 'pipboy-extension' }, '*');
    });

    // Wire up settings — extension panel (primary)
    const $enabled = $('#pipboy-toggle-enabled');
    const $bridge = $('#pipboy-toggle-bridge');
    const $autoparse = $('#pipboy-toggle-autoparse');

    // Wire up settings — API connector panel (mirror)
    const $apiEnabled = $('#pipboy-api-toggle-enabled');
    const $apiBridge = $('#pipboy-api-toggle-bridge');
    const $apiAutoparse = $('#pipboy-api-toggle-autoparse');

    // Set initial state on both panels
    $enabled.prop('checked', settings.enabled);
    $bridge.prop('checked', settings.bridgeEnabled);
    $autoparse.prop('checked', settings.autoParseMessages);
    $apiEnabled.prop('checked', settings.enabled);
    $apiBridge.prop('checked', settings.bridgeEnabled);
    $apiAutoparse.prop('checked', settings.autoParseMessages);
    bridgeEnabled = settings.bridgeEnabled;

    // Extension panel handlers (sync to API panel)
    $enabled.on('change', function () {
        settings.enabled = this.checked;
        $apiEnabled.prop('checked', this.checked);
        saveSettingsDebounced();
        if (this.checked && settings.showOnLoad) showPanel();
        else if (!this.checked) hidePanel();
    });

    $bridge.on('change', function () {
        settings.bridgeEnabled = this.checked;
        $apiBridge.prop('checked', this.checked);
        bridgeEnabled = this.checked;
        saveSettingsDebounced();
        renderStatusBar();
    });

    $autoparse.on('change', function () {
        settings.autoParseMessages = this.checked;
        $apiAutoparse.prop('checked', this.checked);
        saveSettingsDebounced();
    });

    // API connector panel handlers (sync to extension panel)
    $apiEnabled.on('change', function () {
        settings.enabled = this.checked;
        $enabled.prop('checked', this.checked);
        saveSettingsDebounced();
        if (this.checked && settings.showOnLoad) showPanel();
        else if (!this.checked) hidePanel();
    });

    $apiBridge.on('change', function () {
        settings.bridgeEnabled = this.checked;
        $bridge.prop('checked', this.checked);
        bridgeEnabled = this.checked;
        saveSettingsDebounced();
        renderStatusBar();
    });

    $apiAutoparse.on('change', function () {
        settings.autoParseMessages = this.checked;
        $autoparse.prop('checked', this.checked);
        saveSettingsDebounced();
    });

    // Auto-connect checkbox
    const $autoConnect = $('#pipboy-api-auto-connect');
    $autoConnect.prop('checked', settings.autoConnect);
    $autoConnect.on('change', function () {
        settings.autoConnect = this.checked;
        saveSettingsDebounced();
    });

    // API connector panel buttons
    $('#pipboy-api-btn-show').on('click', () => showPanel());
    $('#pipboy-api-btn-reset').on('click', () => resetState());

    // Extension panel buttons
    $('#pipboy-btn-show').on('click', () => showPanel());
    $('#pipboy-btn-reset-state').on('click', () => resetState());
    $('#pipboy-btn-close').on('click', () => hidePanel());
    $('#pipboy-btn-minimize').on('click', () => hidePanel());

    // Make draggable — self-contained, independent of ST's MovingUI setting
    initPipboyDrag();

    // Init subsystems
    initTabs();
    initBridge();
    initAutoParser();
    registerCommands();

    // Update bridge status when API selection changes
    eventSource.on(event_types.MAIN_API_CHANGED, () => {
        updateApiConnectionStatus();
        // Re-probe in case bridge connected before we checked
        if (main_api === 'pipboy' && !bridgeConnected) {
            window.postMessage({ type: 'PIPBOY_BRIDGE_PING', source: 'pipboy-extension' }, '*');
        }
    });

    // Build known characters on chat load / group change
    eventSource.on(event_types.CHAT_LOADED, rebuildKnownCharacters);

    // Post-process rendered messages for speaker segment formatting
    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, formatRenderedMessage);

    // Render initial state
    renderPanel();
    rebuildKnownCharacters();

    if (settings.enabled && settings.showOnLoad) {
        showPanel();
    }

    // Auto-connect: probe for bridge on load if enabled
    if (settings.autoConnect) {
        setTimeout(() => {
            console.log('[Pip-Boy 3000] Auto-connect: probing for bridge...');
            window.postMessage({ type: 'PIPBOY_BRIDGE_PING', source: 'pipboy-extension' }, '*');
        }, 1500);
    }

    // Expose API globally for bridge/other extensions
    window.PipBoy = {
        updateState,
        getState,
        resetState,
        showPanel,
        hidePanel,
        togglePanel,
        parseStateFromMessage,
        parseStateBlock,
        parseBracketLines,
        parseSpeakerSegments,
        rebuildKnownCharacters,
        getKnownCharacters: () => new Map(knownCharacterCards),
        injectBridgeResponse,
        isBridgeActive: () => (bridgeEnabled || main_api === 'pipboy') && bridgeConnected,
        isBridgeConnected: () => bridgeConnected,
    };

    console.log('[Pip-Boy 3000 Mk IV] Vault 83 terminal loaded');
})();
