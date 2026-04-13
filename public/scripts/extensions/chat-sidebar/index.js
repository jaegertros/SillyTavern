/**
 * Chat Sidebar Extension
 *
 * Discord-style flyout on the left edge showing character & group avatars.
 * Completely independent DOM — does not touch #top-settings-holder,
 * #left-nav-panel, or any drawer/cabinet z-index layers.
 *
 * z-index: 1500 (safely below drawers at 3000 and Nemo Discord theme at 10000)
 */

import {
    eventSource,
    event_types,
    saveSettingsDebounced,
    selectCharacterById,
    this_chid,
    getThumbnailUrl,
    characters,
} from '../../../script.js';

import {
    extension_settings,
    getContext,
    renderExtensionTemplateAsync,
} from '../../extensions.js';

import { openGroupById } from '../../group-chats.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EXTENSION_NAME = 'chat-sidebar';

const defaultSettings = {
    enabled: true,
    showDots: true,
    favsFirst: true,
    maxItems: 0,
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
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

// Tooltip removed — names are now visible inline in the wider panel.
// CSS for .csb-tooltip is retained in style.css in case it's needed later.

// ---------------------------------------------------------------------------
// Build sidebar items
// ---------------------------------------------------------------------------

/**
 * Builds the ordered list of sidebar entries from characters + groups.
 * @returns {Array<{type: string, id: any, name: string, avatarUrl: string, fav: boolean, lastActive: number, memberAvatars?: string[]}>}
 */
function buildEntries() {
    const ctx = getContext();
    const chars = ctx.characters ?? characters ?? [];
    const groups = ctx.groups ?? [];
    const settings = getSettings();
    const entries = [];

    // Characters
    chars.forEach((char, index) => {
        if (!char || !char.avatar) return;
        entries.push({
            type: 'character',
            id: index,
            name: char.name || 'Unknown',
            avatarUrl: getThumbnailUrl('avatar', char.avatar),
            fav: !!char.fav,
            lastActive: char.date_last_chat || 0,
        });
    });

    // Groups
    groups.forEach(group => {
        if (!group || !group.id) return;
        const memberAvatars = (group.members ?? []).slice(0, 4).map(avatar => {
            return getThumbnailUrl('avatar', avatar);
        });
        entries.push({
            type: 'group',
            id: group.id,
            name: group.name || 'Group',
            avatarUrl: group.avatar_url || null,
            fav: !!group.fav,
            lastActive: group.date_last_chat || 0,
            memberAvatars,
        });
    });

    // Sort: favorites first (if enabled), then by last active (descending)
    entries.sort((a, b) => {
        if (settings.favsFirst) {
            if (a.fav && !b.fav) return -1;
            if (!a.fav && b.fav) return 1;
        }
        return b.lastActive - a.lastActive;
    });

    // Clamp
    if (settings.maxItems > 0) {
        entries.length = Math.min(entries.length, settings.maxItems);
    }

    return entries;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

let sidebarEl = null;
let railEl = null;

function ensureSidebar() {
    if (sidebarEl) return;

    sidebarEl = document.createElement('div');
    sidebarEl.id = 'chat-sidebar';

    // Rail (the icon strip)
    railEl = document.createElement('div');
    railEl.id = 'chat-sidebar-rail';

    // Handle (the toggle tab)
    const handle = document.createElement('div');
    handle.id = 'chat-sidebar-handle';
    handle.innerHTML = '<span class="handle-icon fa-solid fa-chevron-right"></span>';
    handle.addEventListener('click', toggleSidebar);

    sidebarEl.appendChild(railEl);
    sidebarEl.appendChild(handle);
    document.body.appendChild(sidebarEl);

    // Restore collapsed state
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
 * Gets the current active character index or group ID.
 */
function getActiveIds() {
    const ctx = getContext();
    return {
        charId: ctx.characterId ?? this_chid,
        groupId: ctx.groupId ?? null,
    };
}

/**
 * Creates a sidebar row element: avatar + name + optional dot.
 */
function createItemElement(entry, settings) {
    const row = document.createElement('div');
    row.className = 'csb-item';

    // Check if this is the active chat
    const active = getActiveIds();
    if (entry.type === 'character' && active.groupId == null && entry.id === active.charId) {
        row.classList.add('csb-active');
    } else if (entry.type === 'group' && entry.id === active.groupId) {
        row.classList.add('csb-active');
    }

    // Avatar wrapper (holds image + green dot)
    const avatarWrap = document.createElement('div');
    avatarWrap.className = 'csb-avatar-wrap';

    if (entry.type === 'group' && !entry.avatarUrl && entry.memberAvatars?.length > 0) {
        // Group collage
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

    // Green dot
    if (settings.showDots) {
        const dot = document.createElement('div');
        dot.className = 'csb-online-dot';
        avatarWrap.appendChild(dot);
    }

    row.appendChild(avatarWrap);

    // Text info (name + type)
    const info = document.createElement('div');
    info.className = 'csb-info';

    const nameEl = document.createElement('div');
    nameEl.className = 'csb-name';
    nameEl.textContent = entry.name;
    info.appendChild(nameEl);

    if (entry.type === 'group') {
        const badge = document.createElement('div');
        badge.className = 'csb-type-badge';
        const memberCount = entry.memberAvatars?.length ?? 0;
        badge.textContent = `Group · ${memberCount} members`;
        info.appendChild(badge);
    }

    row.appendChild(info);

    // Click handler
    row.addEventListener('click', async () => {
        if (entry.type === 'character') {
            await selectCharacterById(entry.id);
        } else {
            await openGroupById(entry.id);
        }
    });

    return row;
}

/**
 * Full re-render of the rail contents.
 */
function renderRail() {
    if (!railEl) return;
    const settings = getSettings();

    if (!settings.enabled) {
        if (sidebarEl) sidebarEl.style.display = 'none';
        return;
    }
    if (sidebarEl) sidebarEl.style.display = '';

    railEl.innerHTML = '';

    const entries = buildEntries();
    const active = getActiveIds();

    // Separate favorites from non-favorites for visual grouping
    const favs = entries.filter(e => e.fav);
    const rest = entries.filter(e => !e.fav);

    // Favorites section
    if (settings.favsFirst && favs.length > 0) {
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

    // Recent section
    const recentItems = settings.favsFirst ? rest : entries;
    if (recentItems.length > 0) {
        if (settings.favsFirst && favs.length > 0) {
            const label = document.createElement('div');
            label.className = 'csb-section-label';
            label.textContent = 'RECENT';
            railEl.appendChild(label);
        }

        for (const entry of recentItems) {
            railEl.appendChild(createItemElement(entry, settings));
        }
    }

    if (entries.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'csb-section-label';
        empty.textContent = 'NO CHATS';
        railEl.appendChild(empty);
    }
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
    eventSource.on(event_types.CHAT_CHANGED, () => renderRail());
    eventSource.on(event_types.CHARACTER_EDITED, () => renderRail());
    eventSource.on(event_types.GROUP_UPDATED, () => renderRail());
    eventSource.on(event_types.APP_READY, () => renderRail());

    console.log('[Chat Sidebar] Extension loaded');
});
