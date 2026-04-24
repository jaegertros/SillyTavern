import { createApp } from 'vue';
import { saveSettingsDebounced } from '../../../scripts/core/debounced.js';
import { characters } from '../../../scripts/core/state.js';
import { eventSource, event_types } from '../../../scripts/events.js';
import { getRequestHeaders } from '../../../scripts/request-utils.js';
import { getThumbnailUrl } from '../../../scripts/thumbnail-url.js';
import { openCharacterChat } from '../../../script.js';
import { setActiveCharacter, setActiveGroup } from '../../../scripts/core/settings-manager.js';
import { selectCharacterById } from '../../../scripts/core/character-manager.js';
import { getCurrentChatId } from '../../../scripts/core/chat-engine.js';
import { extension_settings, getContext } from '../../../scripts/extensions.js';
import { openGroupById, openGroupChat } from '../../../scripts/group-chats.js';
import ChatSidebarSettings from './ChatSidebarSettings.vue';

const EXTENSION_NAME = 'chat-sidebar';

const defaultSettings = {
    enabled: true,
    showDots: true,
    favsFirst: true,
    maxItems: 50,
    collapsed: false,
};

let sidebarEl = null;
let railEl = null;
let renderTimeout = null;

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

    if (!extension_settings[EXTENSION_NAME].maxItems) {
        extension_settings[EXTENSION_NAME].maxItems = defaultSettings.maxItems;
    }
}

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

function chatToEntry(chat) {
    const ctx = getContext();
    const chars = ctx.characters ?? characters ?? [];
    const groups = ctx.groups ?? [];

    const isGroup = !!chat.group;
    const chatFileName = chat.file_name || '';
    const chatId = chat.file_id || chatFileName.replace('.jsonl', '');

    let sessionLabel = chatId;
    const timestampMatch = chatId.match(/^(\d{4}-\d{2}-\d{2})@(\d{2})h(\d{2})m/);
    if (timestampMatch) {
        const [, date, hour, min] = timestampMatch;
        sessionLabel = `${date} ${hour}:${min}`;
    }

    const branchMatch = chatId.match(/- (Branch #\d+)/i);
    if (branchMatch) {
        sessionLabel += ` (${branchMatch[1]})`;
    }

    if (isGroup) {
        const group = groups.find(g => g.id === chat.group);
        const memberAvatars = (group?.members ?? []).slice(0, 4).map(avatar => getThumbnailUrl('avatar', avatar));

        return {
            type: 'group',
            id: chat.group,
            chatId,
            chatFileName,
            name: group?.name || 'Group',
            sessionLabel,
            avatarUrl: group?.avatar_url || null,
            fav: !!group?.fav,
            lastActive: chat.last_mes || 0,
            messageCount: chat.chat_items || 0,
            memberAvatars,
        };
    }

    const charIndex = chars.findIndex(c => c.avatar === chat.avatar);
    const char = charIndex >= 0 ? chars[charIndex] : null;

    return {
        type: 'character',
        id: charIndex,
        chatId,
        chatFileName,
        name: char?.name || chat.avatar?.replace('.png', '') || 'Unknown',
        sessionLabel,
        avatarUrl: char ? getThumbnailUrl('avatar', char.avatar) : '/img/ai4.png',
        fav: !!char?.fav,
        lastActive: chat.last_mes || 0,
        messageCount: chat.chat_items || 0,
    };
}

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

function createItemElement(entry, settings) {
    const row = document.createElement('div');
    row.className = 'csb-item';

    const activeChatId = getCurrentChatId();
    if (activeChatId && entry.chatId === activeChatId) {
        row.classList.add('csb-active');
    }

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
        img.onerror = () => {
            img.src = '/img/ai4.png';
        };
        avatarWrap.appendChild(img);
    }

    if (settings.showDots) {
        const dot = document.createElement('div');
        dot.className = 'csb-online-dot';
        avatarWrap.appendChild(dot);
    }

    row.appendChild(avatarWrap);

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

    const sessionEl = document.createElement('div');
    sessionEl.className = 'csb-session';
    sessionEl.textContent = entry.sessionLabel;
    info.appendChild(sessionEl);

    const previewEl = document.createElement('div');
    previewEl.className = 'csb-preview';
    const msgCount = entry.messageCount ? `${entry.messageCount} msgs` : '';
    previewEl.textContent = msgCount;
    info.appendChild(previewEl);

    row.appendChild(info);

    row.addEventListener('click', async () => {
        try {
            const currentChatId = getCurrentChatId();
            if (currentChatId === entry.chatId) {
                return;
            }

            if (entry.type === 'character') {
                await selectCharacterById(entry.id);
                setActiveCharacter(entry.avatarUrl);
                saveSettingsDebounced();

                if (getCurrentChatId() === entry.chatId) {
                    return;
                }

                await openCharacterChat(entry.chatId);
            } else {
                await openGroupById(entry.id);
                setActiveGroup(entry.id);
                saveSettingsDebounced();

                if (getCurrentChatId() === entry.chatId) {
                    return;
                }

                await openGroupChat(entry.id, entry.chatId);
            }
        } catch (error) {
            console.error('[Chat Sidebar] Error switching chat:', error);
        }
    });

    return row;
}

async function renderRail() {
    if (!railEl) return;

    const settings = getSettings();
    if (!settings.enabled) {
        if (sidebarEl) sidebarEl.style.display = 'none';
        return;
    }

    if (sidebarEl) sidebarEl.style.display = '';

    railEl.innerHTML = '';

    const loading = document.createElement('div');
    loading.className = 'csb-section-label';
    loading.textContent = 'Loading...';
    railEl.appendChild(loading);

    const recentChats = await fetchRecentChats();
    const entries = recentChats.map(chatToEntry);

    railEl.innerHTML = '';

    if (entries.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'csb-section-label';
        empty.textContent = 'NO CHATS';
        railEl.appendChild(empty);
        return;
    }

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

function debouncedRender() {
    clearTimeout(renderTimeout);
    renderTimeout = setTimeout(() => renderRail(), 300);
}

function onSettingsChange(nextSettings) {
    const settings = getSettings();
    settings.enabled = Boolean(nextSettings.enabled);
    settings.showDots = Boolean(nextSettings.showDots);
    settings.favsFirst = Boolean(nextSettings.favsFirst);
    settings.maxItems = Number(nextSettings.maxItems) || 0;

    saveSettingsDebounced();
    renderRail();
}

function mountSettings() {
    const target = document.getElementById('extensions_settings2');
    if (!target) return;

    const root = document.createElement('div');
    target.append(root);

    createApp(ChatSidebarSettings, {
        settings: getSettings(),
        onSettingsChange,
    }).mount(root);
}

export function init() {
    initSettings();
    ensureSidebar();
    mountSettings();
    renderRail();

    eventSource.on(event_types.CHAT_CHANGED, debouncedRender);
    eventSource.on(event_types.CHARACTER_EDITED, debouncedRender);
    eventSource.on(event_types.GROUP_UPDATED, debouncedRender);
    eventSource.on(event_types.APP_READY, debouncedRender);

    console.log('[Chat Sidebar] Extension loaded');
}
