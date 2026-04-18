/**
 * Chat Sidebar Extension
 *
 * Discord-style flyout on the left edge showing all chat sessions
 * (including branches) sorted by most recent activity.
 *
 * z-index: 1500 (safely below drawers at 3000 and Nemo Discord theme at 10000)
 */

import { saveSettingsDebounced } from '../../core/debounced.js';
import { this_chid, characters } from '../../core/state.js';
import { eventSource, event_types } from '../../events.js';
import { getRequestHeaders } from '../../request-utils.js';
import { getThumbnailUrl } from '../../thumbnail-url.js';
import { openCharacterChat } from '../../../script.js';
import { setActiveCharacter, setActiveGroup } from '../../core/settings-manager.js';
import { selectCharacterById } from '../../core/character-manager.js';
import { saveChatConditional, getCurrentChatId } from '../../core/chat-engine.js';

import {
    extension_settings,
    getContext,
    renderExtensionTemplateAsync,
} from '../../extensions.js';

import { openGroupById, openGroupChat } from '../../group-chats.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EXTENSION_NAME = 'chat-sidebar';

const defaultSettings = {
    enabled: true,
    showDots: true,
    favsFirst: true,
    maxItems: 50,
    collapsed: false,
};

// ---------------------------------------------------------------------------
// Settings helpers
// ---------------------------------------------------------------------------

function getSettings() {
    return extension_settings[EXTENSION_NAME];
}

function initSettings() {
    if (!extension_settings[EXTENSION_NAME]) {
        extension_settings[EXTENSION_NAME] = structuredClone(defaultSettings);
    }
    for (const [key, value] of Object.entries(defaultSettings)) {
        if (!(key in extension_settings[EXTENSION_NAME])) {
            extension_settings[EXTENSION_NAME][key] = value;
        }
    }
    // Fix invalid maxItems (0 means nothing would load)
    if (!extension_settings[EXTENSION_NAME].maxItems) {
        extension_settings[EXTENSION_NAME].maxItems = defaultSettings.maxItems;
    }
}

// ---------------------------------------------------------------------------
// Fetch recent chats from server
// ---------------------------------------------------------------------------

/**
 * Fetches all recent chat sessions across characters and groups.
 * Each chat session (including branches) is a separate entry.
 * @returns {Promise<Array>} Array of chat info objects
 */
async function fetchRecentChats() {
    try {
        const response = await fetch('/api/chats/recent', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({
                max: getSettings().maxItems || 50,
                metadata: true,
                pinned: [],
            }),
        });

        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('[Chat Sidebar] Failed to fetch recent chats:', error);
        return [];
    }
}

// ---------------------------------------------------------------------------
// Build sidebar items from recent chats
// ---------------------------------------------------------------------------

/**
 * Resolves a chat entry into a displayable sidebar item.
 * @param {Object} chat - Chat info from the API
 * @returns {Object} Sidebar entry
 */
function chatToEntry(chat) {
    const ctx = getContext();
    const chars = ctx.characters ?? characters ?? [];
    const groups = ctx.groups ?? [];

    const isGroup = !!chat.group;
    const chatFileName = chat.file_name || '';
    const chatId = chat.file_id || chatFileName.replace('.jsonl', '');

    // Format the chat session label
    let sessionLabel = chatId;
    // Clean up timestamp-style names: "2026-04-12@17h51m37s187ms" -> shorter
    const timestampMatch = chatId.match(/^(\d{4}-\d{2}-\d{2})@(\d{2})h(\d{2})m/);
    if (timestampMatch) {
        const [, date, hour, min] = timestampMatch;
        sessionLabel = `${date} ${hour}:${min}`;
    }
    // Show branch info prominently
    const branchMatch = chatId.match(/- (Branch #\d+)/i);
    if (branchMatch) {
        sessionLabel += ` (${branchMatch[1]})`;
    }

    if (isGroup) {
        const group = groups.find(g => g.id === chat.group);
        const memberAvatars = (group?.members ?? []).slice(0, 4).map(avatar => {
            return getThumbnailUrl('avatar', avatar);
        });

        return {
            type: 'group',
            id: chat.group,
            chatId: chatId,
            chatFileName: chatFileName,
            name: group?.name || 'Group',
            sessionLabel,
            avatarUrl: group?.avatar_url || null,
            fav: !!group?.fav,
            lastActive: chat.last_mes || 0,
            messageCount: chat.chat_items || 0,
            lastMessage: chat.mes || '',
            memberAvatars,
        };
    } else {
        const charIndex = chars.findIndex(c => c.avatar === chat.avatar);
        const char = charIndex >= 0 ? chars[charIndex] : null;

        return {
            type: 'character',
            id: charIndex,
            chatId: chatId,
            chatFileName: chatFileName,
            name: char?.name || chat.avatar?.replace('.png', '') || 'Unknown',
            sessionLabel,
            avatarUrl: char ? getThumbnailUrl('avatar', char.avatar) : '/img/ai4.png',
            fav: !!char?.fav,
            lastActive: chat.last_mes || 0,
            messageCount: chat.chat_items || 0,
            lastMessage: chat.mes || '',
        };
    }
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

let sidebarEl = null;
let railEl = null;
let cachedEntries = [];

function ensureSidebar() {
    if (sidebarEl) return;

    sidebarEl = document.createElement('div');
    sidebarEl.id = 'chat-sidebar';

    railEl = document.createElement('div');
    railEl.id = 'chat-sidebar-rail';

    const handle = document.createElement('div');
    handle.id = 'chat-sidebar-handle';
    handle.innerHTML = '<span class="handle-icon fa-solid fa-chevron-right"></span>';
    handle.addEventListener('click', toggleSidebar);

    sidebarEl.appendChild(railEl);
    sidebarEl.appendChild(handle);
    document.body.appendChild(sidebarEl);

    if (!getSettings().collapsed) {
        sidebarEl.classList.add('open');
    }
}

function toggleSidebar() {
    if (!sidebarEl) return;
    sidebarEl.classList.toggle('open');
    const settings = getSettings();
    settings.collapsed = !sidebarEl.classList.contains('open');
    saveSettingsDebounced();
}

/**
 * Gets the current active chat ID.
 */
function getActiveChatId() {
    try {
        return getCurrentChatId();
    } catch {
        return null;
    }
}

/**
 * Formats a relative time string.
 */
function formatRelativeTime(timestamp) {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;
    return `${Math.floor(days / 30)}mo`;
}

/**
 * Creates a sidebar row element for a chat session.
 */
function createItemElement(entry, settings) {
    const row = document.createElement('div');
    row.className = 'csb-item';

    // Check if this is the active chat
    const activeChatId = getActiveChatId();
    if (activeChatId && entry.chatId === activeChatId) {
        row.classList.add('csb-active');
    }

    // Avatar wrapper
    const avatarWrap = document.createElement('div');
    avatarWrap.className = 'csb-avatar-wrap';

    if (entry.type === 'group' && !entry.avatarUrl && entry.memberAvatars?.length > 0) {
        const collage = document.createElement('div');
        const count = Math.min(entry.memberAvatars.length, 4);
        collage.className = `csb-group-collage members-${count}`;
        for (let i = 0; i < count; i++) {
            const img = document.createElement('img');
            img.src = entry.memberAvatars[i];
            img.alt = '';
            img.loading = 'lazy';
            collage.appendChild(img);
        }
        avatarWrap.appendChild(collage);
    } else {
        const img = document.createElement('img');
        img.src = entry.avatarUrl || '/img/ai4.png';
        img.alt = '';
        img.loading = 'lazy';
        img.onerror = () => { img.src = '/img/ai4.png'; };
        avatarWrap.appendChild(img);
    }

    if (settings.showDots) {
        const dot = document.createElement('div');
        dot.className = 'csb-online-dot';
        avatarWrap.appendChild(dot);
    }

    row.appendChild(avatarWrap);

    // Text info
    const info = document.createElement('div');
    info.className = 'csb-info';

    const nameRow = document.createElement('div');
    nameRow.className = 'csb-name-row';

    const nameEl = document.createElement('div');
    nameEl.className = 'csb-name';
    nameEl.textContent = entry.name;
    nameRow.appendChild(nameEl);

    const timeEl = document.createElement('div');
    timeEl.className = 'csb-time';
    timeEl.textContent = formatRelativeTime(entry.lastActive);
    nameRow.appendChild(timeEl);

    info.appendChild(nameRow);

    // Session label (shows branch info, date, etc.)
    const sessionEl = document.createElement('div');
    sessionEl.className = 'csb-session';
    sessionEl.textContent = entry.sessionLabel;
    info.appendChild(sessionEl);

    // Message count + preview
    const previewEl = document.createElement('div');
    previewEl.className = 'csb-preview';
    const msgCount = entry.messageCount ? `${entry.messageCount} msgs` : '';
    previewEl.textContent = msgCount;
    info.appendChild(previewEl);

    row.appendChild(info);

    // Click handler — switch to this specific chat session
    // Mirrors the pattern from welcome-screen.js for safe chat switching
    row.addEventListener('click', async () => {
        try {
            // If this chat is already open, do nothing
            const currentChatId = getCurrentChatId();
            if (currentChatId === entry.chatId) {
                console.debug('[Chat Sidebar] Chat already open:', entry.chatId);
                return;
            }

            if (entry.type === 'character') {
                // Select the character (loads their default chat)
                await selectCharacterById(entry.id);
                setActiveCharacter(entry.avatarUrl);
                saveSettingsDebounced();

                // If selectCharacterById already loaded the right chat, stop
                if (getCurrentChatId() === entry.chatId) {
                    console.debug('[Chat Sidebar] Default chat matches target');
                    return;
                }

                // Switch to the specific chat file
                await openCharacterChat(entry.chatId);
            } else {
                // Open the group (loads default group chat)
                await openGroupById(entry.id);
                setActiveGroup(entry.id);
                saveSettingsDebounced();

                // If the default group chat is already the right one, stop
                if (getCurrentChatId() === entry.chatId) {
                    console.debug('[Chat Sidebar] Default group chat matches target');
                    return;
                }

                // Switch to the specific group chat
                await openGroupChat(entry.id, entry.chatId);
            }
        } catch (error) {
            console.error('[Chat Sidebar] Error switching chat:', error);
        }
    });

    return row;
}

/**
 * Full re-render of the rail contents.
 */
async function renderRail() {
    if (!railEl) return;
    const settings = getSettings();

    if (!settings.enabled) {
        if (sidebarEl) sidebarEl.style.display = 'none';
        return;
    }
    if (sidebarEl) sidebarEl.style.display = '';

    railEl.innerHTML = '';

    // Show loading state
    const loading = document.createElement('div');
    loading.className = 'csb-section-label';
    loading.textContent = 'Loading...';
    railEl.appendChild(loading);

    // Fetch all recent chats
    const recentChats = await fetchRecentChats();
    const entries = recentChats.map(chatToEntry);
    cachedEntries = entries;

    railEl.innerHTML = '';

    if (entries.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'csb-section-label';
        empty.textContent = 'NO CHATS';
        railEl.appendChild(empty);
        return;
    }

    // Separate favorites from non-favorites
    const favs = settings.favsFirst ? entries.filter(e => e.fav) : [];
    const rest = settings.favsFirst ? entries.filter(e => !e.fav) : entries;

    if (favs.length > 0) {
        const label = document.createElement('div');
        label.className = 'csb-section-label';
        label.textContent = 'FAVS';
        railEl.appendChild(label);

        for (const entry of favs) {
            railEl.appendChild(createItemElement(entry, settings));
        }

        if (rest.length > 0) {
            const sep = document.createElement('div');
            sep.className = 'csb-separator';
            railEl.appendChild(sep);
        }
    }

    if (rest.length > 0) {
        if (favs.length > 0) {
            const label = document.createElement('div');
            label.className = 'csb-section-label';
            label.textContent = 'RECENT';
            railEl.appendChild(label);
        }

        for (const entry of rest) {
            railEl.appendChild(createItemElement(entry, settings));
        }
    }
}

// Debounce renders to avoid hammering the API
let renderTimeout = null;
function debouncedRender() {
    clearTimeout(renderTimeout);
    renderTimeout = setTimeout(() => renderRail(), 300);
}

// ---------------------------------------------------------------------------
// Settings UI
// ---------------------------------------------------------------------------

function loadSettingsIntoUI() {
    const s = getSettings();
    $('#csb_enabled').prop('checked', s.enabled);
    $('#csb_show_dots').prop('checked', s.showDots);
    $('#csb_favs_first').prop('checked', s.favsFirst);
    $('#csb_max_items').val(s.maxItems);
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

jQuery(async () => {
    initSettings();

    const html = await renderExtensionTemplateAsync('chat-sidebar', 'index');
    $('#extensions_settings2').append(html);

    loadSettingsIntoUI();

    // Settings bindings
    $('#csb_enabled').on('change', function () {
        getSettings().enabled = !!$(this).prop('checked');
        saveSettingsDebounced();
        renderRail();
    });

    $('#csb_show_dots').on('change', function () {
        getSettings().showDots = !!$(this).prop('checked');
        saveSettingsDebounced();
        renderRail();
    });

    $('#csb_favs_first').on('change', function () {
        getSettings().favsFirst = !!$(this).prop('checked');
        saveSettingsDebounced();
        renderRail();
    });

    $('#csb_max_items').on('input', function () {
        const v = parseInt($(this).val(), 10);
        if (!isNaN(v) && v >= 0) {
            getSettings().maxItems = v;
            saveSettingsDebounced();
            renderRail();
        }
    });

    // Build DOM
    ensureSidebar();
    renderRail();

    // Refresh when state changes
    eventSource.on(event_types.CHAT_CHANGED, () => debouncedRender());
    eventSource.on(event_types.CHARACTER_EDITED, () => debouncedRender());
    eventSource.on(event_types.GROUP_UPDATED, () => debouncedRender());
    eventSource.on(event_types.APP_READY, () => debouncedRender());

    console.log('[Chat Sidebar] Extension loaded');
});
