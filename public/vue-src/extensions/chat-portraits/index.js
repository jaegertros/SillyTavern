import { createApp } from 'vue';
import {
    eventSource,
    event_types,
    saveSettingsDebounced,
    getThumbnailUrl,
    characters,
    this_chid,
} from '../../../script.js';
import { extension_settings, getContext } from '../../../scripts/extensions.js';
import { user_avatar } from '../../../scripts/personas.js';
import ChatPortraitsSettings from './ChatPortraitsSettings.vue';

const EXTENSION_NAME = 'chat-portraits';

const defaultSettings = {
    enabled: true,
    showPersona: true,
    showAllGroup: true,
};

let containerEl = null;

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

function ensureContainer() {
    if (containerEl) return;
    containerEl = document.createElement('div');
    containerEl.id = 'chat-portraits';
    document.body.appendChild(containerEl);
}

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
    img.onerror = () => {
        img.src = '/img/ai4.png';
    };
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

    if (settings.showPersona && user_avatar) {
        const personaUrl = getThumbnailUrl('persona', user_avatar);
        const personaName = ctx.name1 || 'You';
        containerEl.appendChild(createPortraitCard({
            name: personaName,
            avatarUrl: personaUrl,
            role: 'You',
        }));
    }

    if (settings.showPersona && user_avatar && (charId != null || groupId)) {
        const divider = document.createElement('div');
        divider.className = 'portrait-divider';
        containerEl.appendChild(divider);
    }

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

    if (!groupId) {
        return;
    }

    const group = ctx.groups?.find(g => g.id === groupId);
    if (!group) return;

    const enabledAvatars = (group.members ?? [])
        .filter(avatar => !(group.disabled_members ?? []).includes(avatar));

    const lastCharMessage = [...(ctx.chat ?? [])]
        .reverse()
        .find(message => !message.is_user && !message.is_system);
    const lastSpeaker = lastCharMessage?.name;

    if (settings.showAllGroup) {
        for (const avatar of enabledAvatars) {
            const char = characters.find(character => character.avatar === avatar);
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

        return;
    }

    if (!lastSpeaker) {
        return;
    }

    const char = characters.find(character => character.name === lastSpeaker);
    if (!char) {
        return;
    }

    containerEl.appendChild(createPortraitCard({
        name: char.name,
        avatarUrl: getThumbnailUrl('avatar', char.avatar),
        role: 'Speaking',
        active: true,
    }));
}

function onSettingsChange(nextSettings) {
    const settings = getSettings();

    settings.enabled = Boolean(nextSettings.enabled);
    settings.showPersona = Boolean(nextSettings.showPersona);
    settings.showAllGroup = Boolean(nextSettings.showAllGroup);

    saveSettingsDebounced();
    render();
}

function mountSettings() {
    const target = document.getElementById('extensions_settings2');
    if (!target) return;

    const root = document.createElement('div');
    target.append(root);

    createApp(ChatPortraitsSettings, {
        settings: getSettings(),
        onSettingsChange,
    }).mount(root);
}

export function init() {
    initSettings();
    ensureContainer();
    mountSettings();
    render();

    eventSource.on(event_types.CHAT_CHANGED, render);
    eventSource.on(event_types.CHARACTER_EDITED, render);
    eventSource.on(event_types.GROUP_UPDATED, render);
    eventSource.on(event_types.MESSAGE_RECEIVED, render);
    eventSource.on(event_types.GROUP_MEMBER_DRAFTED, render);
    eventSource.on(event_types.APP_READY, render);

    console.log('[Chat Portraits] Extension loaded');
}
