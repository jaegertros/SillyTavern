/**
 * Chat Portraits Extension
 *
 * Shows persona + character portraits to the left of the chat column.
 * Positioned via CSS calc() against --sheldWidth so it tracks the chat area.
 * z-index 25 keeps it behind chat (30) and well below panels (3000).
 */

import {
    eventSource,
    event_types,
    saveSettingsDebounced,
    getThumbnailUrl,
    characters,
    this_chid,
} from '../../../script.js';

import {
    extension_settings,
    getContext,
    renderExtensionTemplateAsync,
} from '../../extensions.js';

import { user_avatar } from '../../personas.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EXTENSION_NAME = 'chat-portraits';

const defaultSettings = {
    enabled: true,
    showPersona: true,
    showAllGroup: true,
};

// ---------------------------------------------------------------------------
// Settings
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
// DOM
// ---------------------------------------------------------------------------

let containerEl = null;

function ensureContainer() {
    if (containerEl) return;
    containerEl = document.createElement('div');
    containerEl.id = 'chat-portraits';
    document.body.appendChild(containerEl);
}

/**
 * Creates a portrait card element.
 * @param {object} opts
 * @param {string} opts.name
 * @param {string} opts.avatarUrl
 * @param {string} [opts.role]       - e.g. "You", "Speaking"
 * @param {boolean} [opts.active]    - highlight border
 * @param {boolean} [opts.isGroup]   - smaller size for group members
 * @returns {HTMLElement}
 */
function createPortraitCard({ name, avatarUrl, role, active, isGroup }) {
    const card = document.createElement('div');
    card.className = 'portrait-card';
    if (active) card.classList.add('portrait-active');
    if (isGroup) card.classList.add('portrait-group');

    const img = document.createElement('img');
    img.className = 'portrait-avatar';
    img.src = avatarUrl || '/img/ai4.png';
    img.alt = name;
    img.loading = 'lazy';
    img.onerror = () => { img.src = '/img/ai4.png'; };
    card.appendChild(img);

    const nameEl = document.createElement('div');
    nameEl.className = 'portrait-name';
    nameEl.textContent = name;
    card.appendChild(nameEl);

    if (role) {
        const roleEl = document.createElement('div');
        roleEl.className = 'portrait-role';
        roleEl.textContent = role;
        card.appendChild(roleEl);
    }

    return card;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function render() {
    if (!containerEl) return;
    const settings = getSettings();

    if (!settings.enabled) {
        containerEl.style.display = 'none';
        return;
    }
    containerEl.style.display = '';
    containerEl.innerHTML = '';

    const ctx = getContext();
    const charId = ctx.characterId ?? this_chid;
    const groupId = ctx.groupId ?? null;

    // ---- Persona ----
    if (settings.showPersona && user_avatar) {
        const personaUrl = getThumbnailUrl('persona', user_avatar);
        const personaName = ctx.name1 || 'You';
        containerEl.appendChild(createPortraitCard({
            name: personaName,
            avatarUrl: personaUrl,
            role: 'You',
        }));
    }

    // ---- Divider ----
    if (settings.showPersona && user_avatar && (charId != null || groupId)) {
        const div = document.createElement('div');
        div.className = 'portrait-divider';
        containerEl.appendChild(div);
    }

    // ---- Single character chat ----
    if (!groupId && charId != null && charId >= 0) {
        const char = characters[charId];
        if (char) {
            containerEl.appendChild(createPortraitCard({
                name: char.name,
                avatarUrl: getThumbnailUrl('avatar', char.avatar),
                active: true,
            }));
        }
        return;
    }

    // ---- Group chat ----
    if (groupId) {
        const group = ctx.groups?.find(g => g.id === groupId);
        if (!group) return;

        const enabledAvatars = (group.members ?? [])
            .filter(a => !(group.disabled_members ?? []).includes(a));

        // Find who spoke last (for the "Speaking" badge)
        const lastCharMessage = [...(ctx.chat ?? [])]
            .reverse()
            .find(m => !m.is_user && !m.is_system);
        const lastSpeaker = lastCharMessage?.name;

        if (settings.showAllGroup) {
            // Show all enabled members
            for (const avatar of enabledAvatars) {
                const char = characters.find(c => c.avatar === avatar);
                if (!char) continue;
                const isSpeaking = char.name === lastSpeaker;
                containerEl.appendChild(createPortraitCard({
                    name: char.name,
                    avatarUrl: getThumbnailUrl('avatar', avatar),
                    role: isSpeaking ? 'Speaking' : undefined,
                    active: isSpeaking,
                    isGroup: true,
                }));
            }
        } else {
            // Just show the last speaker
            if (lastSpeaker) {
                const char = characters.find(c => c.name === lastSpeaker);
                if (char) {
                    containerEl.appendChild(createPortraitCard({
                        name: char.name,
                        avatarUrl: getThumbnailUrl('avatar', char.avatar),
                        role: 'Speaking',
                        active: true,
                    }));
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Settings UI
// ---------------------------------------------------------------------------

function loadSettingsUI() {
    const s = getSettings();
    $('#portraits_enabled').prop('checked', s.enabled);
    $('#portraits_show_persona').prop('checked', s.showPersona);
    $('#portraits_show_all_group').prop('checked', s.showAllGroup);
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

jQuery(async () => {
    initSettings();

    const html = await renderExtensionTemplateAsync('chat-portraits', 'index');
    $('#extensions_settings2').append(html);
    loadSettingsUI();

    $('#portraits_enabled').on('change', function () {
        getSettings().enabled = !!$(this).prop('checked');
        saveSettingsDebounced();
        render();
    });

    $('#portraits_show_persona').on('change', function () {
        getSettings().showPersona = !!$(this).prop('checked');
        saveSettingsDebounced();
        render();
    });

    $('#portraits_show_all_group').on('change', function () {
        getSettings().showAllGroup = !!$(this).prop('checked');
        saveSettingsDebounced();
        render();
    });

    ensureContainer();
    render();

    // Re-render on relevant events
    eventSource.on(event_types.CHAT_CHANGED, render);
    eventSource.on(event_types.CHARACTER_EDITED, render);
    eventSource.on(event_types.GROUP_UPDATED, render);
    eventSource.on(event_types.MESSAGE_RECEIVED, render);
    eventSource.on(event_types.GROUP_MEMBER_DRAFTED, render);
    eventSource.on(event_types.APP_READY, render);

    console.log('[Chat Portraits] Extension loaded');
});
