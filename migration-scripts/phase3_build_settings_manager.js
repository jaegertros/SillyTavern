#!/usr/bin/env node
/**
 * Phase 3: Build core/settings-manager.js from extracted functions.
 * Reads the extraction JSON and script.js source to assemble the module.
 */

const fs = require('fs');
const path = require('path');

const ROOT = '/sessions/admiring-relaxed-goldberg/mnt/SillyTavern/public';
const SCRIPT_PATH = path.join(ROOT, 'script.js');
const EXTRACT_PATH = '/sessions/admiring-relaxed-goldberg/settings_manager_extract.json';
const OUTPUT_PATH = path.join(ROOT, 'scripts/core/settings-manager.js');

const source = fs.readFileSync(SCRIPT_PATH, 'utf8');
const lines = source.split('\n');
const data = JSON.parse(fs.readFileSync(EXTRACT_PATH, 'utf8'));

// Build the module
const parts = [];

parts.push(`import { track as stTrack } from '../dev/tracker.js'; // @st-tracker`);
parts.push('');
parts.push('// ============================================================');
parts.push('// settings-manager.js — Phase 3 extraction from script.js');
parts.push('// Core settings persistence, connection/status helpers,');
parts.push('// UI state setters, extension prompt helpers, and misc utilities.');
parts.push('// ============================================================');
parts.push('');

// Imports from state.js
parts.push(`import {
    name1,
    chat,
    characters,
    this_chid,
    settingsReady,
    settings,
    amount_gen,
    max_context,
    main_api,
    online_status,
    menu_type,
    animation_duration,
    animation_easing,
    extension_prompts,
    extension_prompt_roles,
    abortStatusCheck,
    active_character,
    active_group,
    selected_button,
    token,
    is_send_press,
    ANIMATION_DURATION_DEFAULT,
    MAX_INJECTION_DEPTH,
    _set_name1,
    _set_online_status,
    _set_is_send_press,
    _set_menu_type,
    _set_animation_duration,
    _set_abortStatusCheck,
    _set_active_character,
    _set_active_group,
    _set_main_api,
    _set_settings,
    _set_settingsReady,
    _set_amount_gen,
    _set_max_context,
    _set_selected_button,
} from './state.js';`);
parts.push('');

// Imports from debounced.js
parts.push(`import { saveSettingsDebounced } from './debounced.js';`);
parts.push('');

// Imports from chat-engine.js
parts.push(`import {
    showSwipeButtons,
    hideSwipeButtons,
    refreshSwipeButtons,
    swipes,
    _set_ce_swipes,
    TempResponseLength,
} from './chat-engine.js';`);
parts.push('');

// Imports from events.js
parts.push(`import { event_types, eventSource } from '../events.js';`);
parts.push('');

// Imports from other modules
parts.push(`import { getRequestHeaders } from '../request-utils.js';`);
parts.push(`import { t } from '../i18n.js';`);
parts.push(`import { delay } from '../utils.js';`);
parts.push(`import { AbortReason } from '../util/AbortReason.js';`);
parts.push(`import { inject_ids } from '../constants.js';`);
parts.push(`import { getTagKeyForEntity } from '../tags.js';`);
parts.push(`import { groups, selected_group } from '../group-chats.js';`);
parts.push(`import { getThumbnailUrl } from '../thumbnail-url.js';`);
parts.push(`import { accountStorage } from '../util/AccountStorage.js';`);
parts.push(`import { power_user, persona_description_positions, MAX_CONTEXT_DEFAULT, MAX_RESPONSE_DEFAULT, loadPowerUserSettings, applyPowerUserSettings, forceCharacterEditorTokenize } from '../power-user.js';`);
parts.push(`import { currentUser, setUserControls } from '../user.js';`);
parts.push(`import { POPUP_TYPE, callGenericPopup } from '../popup.js';`);
parts.push(`import { user_avatar, initUserAvatar, setPersonaDescription, isPersonaPanelOpen } from '../personas.js';`);
parts.push(`import {
    oai_settings,
    loadOpenAISettings,
    setupChatCompletionPromptManager,
    proxies,
    loadProxyPresets,
    selected_proxy,
} from '../openai.js';`);
parts.push(`import { kai_settings, loadKoboldSettings } from '../kai-settings.js';`);
parts.push(`import { nai_settings, loadNovelSettings } from '../nai-settings.js';`);
parts.push(`import {
    textgenerationwebui_settings as textgen_settings,
    loadTextGenSettings,
    textgen_types,
} from '../textgen-settings.js';`);
parts.push(`import { horde_settings, loadHordeSettings, getStatusHorde, getHordeModels } from '../horde.js';`);
parts.push(`import { extension_settings, loadExtensionSettings } from '../extensions.js';`);
parts.push(`import { tags, tag_map, loadTagsSettings } from '../tags.js';`);
parts.push(`import { loadBackgroundSettings, background_settings } from '../backgrounds.js';`);
parts.push(`import { getWorldInfoSettings, setWorldInfoSettings } from '../world-info.js';`);
parts.push(`import { initMacros } from '../macros.js';`);
parts.push(`import { validateDisabledSamplers } from '../samplerSelect.js';`);
parts.push(`import { hideLoader } from '../loader.js';`);
parts.push('');

// Private state co-extracted from script.js
parts.push('// ---- Private state co-extracted from script.js ----');
parts.push('let firstRun = false;');
parts.push('');
parts.push('// Setter for firstRun (needed by remaining script.js debug function)');
parts.push('export function _set_sm_firstRun(val) { firstRun = val; }');
parts.push('export { firstRun };');
parts.push('');

// Late-bound dependencies (functions that live in script.js and can\'t be imported directly)
parts.push('// ---- Late-bound dependencies (wired from script.js) ----');
parts.push('let _changeMainAPI;');
parts.push('export function bind_sm_changeMainAPI(fn) { _changeMainAPI = fn; }');
parts.push('');
parts.push('let _hideLoader;');
parts.push('export function bind_sm_hideLoader(fn) { _hideLoader = fn; }');
parts.push('');

// Note: we actually import hideLoader above, but getSettings calls it directly.
// Let me re-check - hideLoader is from loader.js, which we can import. Remove late-bind.

// Actually let me just extract the functions directly. Let me emit them.
parts.push('');
parts.push('// ============================================================');
parts.push('// Extracted functions');
parts.push('// ============================================================');
parts.push('');

const exportedSet = new Set(data.exported);
const privateSet = new Set(data.private);

for (const fn of data.functions) {
    const startIdx = fn.startLine - 1; // 0-indexed
    const endIdx = fn.endLine;          // exclusive
    let code = lines.slice(startIdx, endIdx).join('\n');

    // Strip existing 'export' keyword if present — we'll re-add for exported functions
    code = code.replace(/^export (async )?function /m, '$1function ');

    // Add export for functions that should be exported
    if (exportedSet.has(fn.name)) {
        code = code.replace(/^(async )?function /m, 'export $1function ');
    }

    parts.push(code);
    parts.push('');
}

const output = parts.join('\n');
fs.writeFileSync(OUTPUT_PATH, output);
console.log(`Wrote ${OUTPUT_PATH} (${output.split('\n').length} lines)`);
