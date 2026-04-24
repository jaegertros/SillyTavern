import { createApp } from 'vue';
import { saveSettingsDebounced } from '../../../../script.js';
import { extension_settings } from '../../../../scripts/extensions.js';
import { getTokenCount, guesstimate } from '../../../../scripts/tokenizers.js';
import CacheChunkerSettings from './CacheChunkerSettings.vue';

const MODULE_NAME = 'CacheChunker';
const SETTINGS_KEY = 'cache_chunker';

const settings = {
    enabled: true,
    chunkSize: 2,
    maxMessageHistoryContext: 2000,
};

let initialized = false;

function trimContext(chat) {
    if (!settings.enabled) {
        return;
    }

    console.debug(`[${MODULE_NAME}] Trimming context, message count before:`, chat.length);

    const startingPoint = getStartingPoint(chat, settings.maxMessageHistoryContext, settings.chunkSize);
    console.debug(`[${MODULE_NAME}] Starting point:`, startingPoint);
    chat.splice(0, startingPoint);

    while (getTokenCount(renderChat(chat)) > settings.maxMessageHistoryContext) {
        chat.splice(0, settings.chunkSize);
    }

    console.debug(`[${MODULE_NAME}] Trimming context, message count after:`, chat.length);
}

function renderChat(chat) {
    return chat.map(message => message.mes).join('\n');
}

function getStartingPoint(chat, maxTokens, chunkSize, tolerance = 0.1) {
    const totalTokens = guesstimate(renderChat(chat));
    const target = maxTokens + (maxTokens * tolerance);

    if (totalTokens <= target) {
        return 0;
    }

    const targetAsPercentage = target / totalTokens;
    const targetWithTolerance = targetAsPercentage + tolerance;
    const index = Math.floor(chat.length * targetWithTolerance);
    return index - (index % chunkSize);
}

function ensureSettings() {
    if (!extension_settings[SETTINGS_KEY]) {
        extension_settings[SETTINGS_KEY] = structuredClone(settings);
    }

    Object.assign(settings, extension_settings[SETTINGS_KEY]);
}

function onSettingsChange(nextSettings) {
    settings.enabled = Boolean(nextSettings.enabled);
    settings.chunkSize = Number(nextSettings.chunkSize) > 0 ? Number(nextSettings.chunkSize) : 1;
    settings.maxMessageHistoryContext = Number(nextSettings.maxMessageHistoryContext) > 0
        ? Number(nextSettings.maxMessageHistoryContext)
        : 1;

    Object.assign(extension_settings[SETTINGS_KEY], settings);
    saveSettingsDebounced();
}

function mountSettings() {
    const target = document.getElementById('extensions_settings2');
    if (!target) return;

    const root = document.createElement('div');
    target.append(root);

    createApp(CacheChunkerSettings, {
        settings,
        onSettingsChange,
    }).mount(root);
}

window.CacheChunker_trimContext = trimContext;

export function init() {
    if (initialized) return;
    initialized = true;

    jQuery(() => {
        ensureSettings();
        mountSettings();
    });
}
