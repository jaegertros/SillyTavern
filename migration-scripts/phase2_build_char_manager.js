#!/usr/bin/env node
/**
 * Phase 2: Build core/character-manager.js from script.js
 *
 * Steps:
 * 1. Read extract results (function boundaries from acorn)
 * 2. Extract function source code from script.js
 * 3. Build character-manager.js with imports, late-binds, extracted functions
 * 4. Remove extracted code from script.js
 * 5. Add imports + re-exports + bind calls to script.js
 */

const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const ROOT = path.join(__dirname, 'mnt/SillyTavern/public');
const SCRIPT_PATH = path.join(ROOT, 'script.js');
const CHAR_MGR_PATH = path.join(ROOT, 'scripts/core/character-manager.js');
const EXTRACT_JSON = path.join(__dirname, 'char_manager_extract.json');

// ============================================================
// 1. Load extraction data
// ============================================================
const extractData = JSON.parse(fs.readFileSync(EXTRACT_JSON, 'utf8'));
const { exported: EXPORTED, private: PRIVATE, functions } = extractData;
const EXPORTED_SET = new Set(EXPORTED);

const source = fs.readFileSync(SCRIPT_PATH, 'utf8');
const lines = source.split('\n');

// ============================================================
// 2. Extract function source code
// ============================================================
const extractedFunctions = [];
for (const fn of functions) {
    // Lines are 1-indexed in extract data
    const fnLines = lines.slice(fn.startLine - 1, fn.endLine);
    let code = fnLines.join('\n');

    // For exported functions, strip 'export ' from the function declaration line
    // (NOT the first line, which might be a JSDoc comment)
    if (fn.isExported) {
        // Use multiline flag to match 'export ' at start of the declaration line
        code = code.replace(/^export (async )?function /m, '$1function ');
    }

    extractedFunctions.push({
        ...fn,
        code,
    });
}

console.log(`Extracted ${extractedFunctions.length} functions`);

// ============================================================
// 3. Build character-manager.js
// ============================================================

const charManagerContent = `/**
 * Character Manager module — character CRUD, selection, display, import/export.
 * Extracted from script.js for modularization (Phase 2).
 * @module core/character-manager
 */

import { track as stTrack } from '../dev/tracker.js'; // @st-tracker

// ============================================================
// Imports from core modules (cycle-free)
// ============================================================
import {
    characters,
    this_chid,
    default_avatar,
    chat,
    chat_metadata,
    name1,
    name2,
    is_send_press,
    isChatSaving,
    selected_button,
    create_save,
    menu_type,
    active_character,
    active_group,
    settingsReady,
    neutralCharacterName,
    talkativeness_default,
    depth_prompt_depth_default,
    depth_prompt_role_default,
    DEFAULT_SAVE_EDIT_TIMEOUT,
    animation_duration,
    animation_easing,
    online_status,
    main_api,
    token,
    _set_this_chid,
    _set_name2,
    _set_selected_button,
    _set_chat_metadata,
    _set_active_character,
    _set_menu_type,
    _set_characters,
} from './state.js';

import {
    saveSettingsDebounced,
    entitiesFilter,
    printCharactersDebounced,
    saveCharacterDebounced,
} from './debounced.js';

// ============================================================
// Imports from chat-engine (no cycle — chat-engine does not import character-manager)
// ============================================================
import {
    clearChat,
    getChat,
    reloadCurrentChat,
    closeCurrentChat,
    resetChatState,
    printMessages,
    saveChatConditional,
    getCurrentChatId,
    _set_ce_this_edit_mes_id,
} from './chat-engine.js';

// ============================================================
// Imports from other modules (no cycle risk)
// ============================================================
import {
    groups,
    selected_group,
    is_group_generating,
    resetSelectedGroup,
    getGroups,
    renameGroupMember,
    getGroupAvatar,
    getGroupBlock,
} from '../group-chats.js';

import {
    tags,
    tag_map,
    filterByTagState,
    isBogusFolder,
    isBogusFolderOpen,
    getTagBlock,
    printTagFilters,
    printTagList,
    createTagMapFromList,
    renameTagKey,
    importTags,
    tag_filter_type,
    compareTagsForSort,
    applyTagsOnCharacterSelect,
    applyTagsOnGroupSelect,
    tag_import_setting,
} from '../tags.js';

import {
    world_info,
    world_names,
    checkEmbeddedWorld,
    setWorldInfoButtonClass,
    charUpdatePrimaryWorld,
    charSetAuxWorlds,
    importEmbeddedWorldInfo,
} from '../world-info.js';

import {
    power_user,
    sortEntitiesList,
    forceCharacterEditorTokenize,
} from '../power-user.js';

import {
    debounce,
    delay,
    timestampToMoment,
    getCharaFilename,
    PAGINATION_TEMPLATE,
    waitUntilCondition,
    getBase64Async,
    ensureImageFormatSupported,
    flashHighlight,
    localizePagination,
    renderPaginationDropdown,
    paginationDropdownChangeHandler,
    importFromExternalUrl,
} from '../utils.js';

import { FILTER_STATES, FILTER_TYPES, isFilterState } from '../filters.js';
import { POPUP_RESULT, POPUP_TYPE, Popup, callGenericPopup } from '../popup.js';
import { renderTemplate, renderTemplateAsync } from '../templates.js';
import { t } from '../i18n.js';
import { eventSource, event_types } from '../events.js';
import { updatePersonaConnectionsAvatarList } from '../personas.js';
import { favsToHotswap, humanizedDateTime } from '../RossAscends-mods.js';
import { isExternalMediaAllowed, preserveNeutralChat, restoreNeutralChat, formatCreatorNotes } from '../chats.js';
import { extension_settings } from '../extensions.js';
import { INTERACTABLE_CONTROL_CLASS } from '../keyboard.js';
import { openPermanentAssistantChat, getPermanentAssistantAvatar } from '../welcome-screen.js';
import { sendSystemMessage, system_message_types, system_messages } from '../system-messages.js';
import { getThumbnailUrl } from '../thumbnail-url.js';
import { getRequestHeaders } from '../request-utils.js';
import { accountStorage } from '../util/AccountStorage.js';
import { DOMPurify } from '../../lib.js';
import { getTokenCount, getTokenCountAsync } from '../tokenizers.js';
import { BulkEditOverlay } from '../BulkEditOverlay.js';
import { getContext } from '../st-context.js';
import { debounce_timeout } from '../constants.js';

// ============================================================
// Late-bound dependencies (functions remaining in script.js)
// These are wired at init time to avoid circular imports.
// ============================================================
let _cancelTtsPlay;
export function bind_cm_cancelTtsPlay(fn) { _cancelTtsPlay = fn; }

let _setMenuType;
export function bind_cm_setMenuType(fn) { _setMenuType = fn; }

let _selectRightMenuWithAnimation;
export function bind_cm_selectRightMenuWithAnimation(fn) { _selectRightMenuWithAnimation = fn; }

let _getFirstMessage;
export function bind_cm_getFirstMessage(fn) { _getFirstMessage = fn; }

let _setActiveCharacter;
export function bind_cm_setActiveCharacter(fn) { _setActiveCharacter = fn; }

let _setActiveGroup;
export function bind_cm_setActiveGroup(fn) { _setActiveGroup = fn; }

let _changeMainAPI;
export function bind_cm_changeMainAPI(fn) { _changeMainAPI = fn; }

let _saveSettings;
export function bind_cm_saveSettings(fn) { _saveSettings = fn; }

let _getSettings;
export function bind_cm_getSettings(fn) { _getSettings = fn; }

let _Generate;
export function bind_cm_Generate(fn) { _Generate = fn; }

let _isGenerating;
export function bind_cm_isGenerating(fn) { _isGenerating = fn; }

let _openCharacterChat;
export function bind_cm_openCharacterChat(fn) { _openCharacterChat = fn; }

let _setCharacterSettingsOverrides;
export function bind_cm_setCharacterSettingsOverrides(fn) { _setCharacterSettingsOverrides = fn; }

let _characterGroupOverlay;
export function bind_cm_characterGroupOverlay(fn) { _characterGroupOverlay = fn; }

let _callPopup;
export function bind_cm_callPopup(fn) { _callPopup = fn; }

let _setGenerationParamsFromPreset;
export function bind_cm_setGenerationParamsFromPreset(fn) { _setGenerationParamsFromPreset = fn; }

// ============================================================
// Private state (co-extracted from script.js)
// ============================================================
let crop_data = undefined;
let fav_ch_checked = false;
let saveCharactersPage = 0;
const per_page_default = 50;
let importFlashTimeout;
var is_advanced_char_open = false;

// Exported getters/setters for private state still referenced by script.js
export { crop_data, fav_ch_checked, saveCharactersPage, per_page_default, importFlashTimeout, is_advanced_char_open };
export function _set_cm_crop_data(val) { crop_data = val; }
export function _set_cm_fav_ch_checked(val) { fav_ch_checked = val; }
export function _set_cm_saveCharactersPage(val) { saveCharactersPage = val; }
export function _set_cm_importFlashTimeout(val) { importFlashTimeout = val; }
export function _set_cm_is_advanced_char_open(val) { is_advanced_char_open = val; }

// ============================================================
// Extracted functions
// ============================================================

`;

// Now append all extracted function code
// Export was already stripped from source; re-add it on the function declaration line
const functionBodies = extractedFunctions.map(fn => {
    let code = fn.code;
    if (EXPORTED_SET.has(fn.name)) {
        // Insert 'export ' before the function declaration line (may be preceded by JSDoc)
        code = code.replace(/^(async )?function /m, 'export $1function ');
    }
    return code;
}).join('\n\n');

const fullCharManager = charManagerContent + functionBodies + '\n';

// ============================================================
// 4. Write character-manager.js
// ============================================================
fs.writeFileSync(CHAR_MGR_PATH, fullCharManager);
console.log(`Wrote ${CHAR_MGR_PATH} (${fullCharManager.split('\n').length} lines)`);

// ============================================================
// 5. Validate with acorn parse
// ============================================================
try {
    acorn.parse(fullCharManager, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        locations: true,
    });
    console.log('✓ character-manager.js parses successfully');
} catch (e) {
    console.error(`✗ Parse error in character-manager.js: ${e.message} at line ${e.loc?.line}`);
    process.exit(1);
}

console.log('\nPhase 2 character-manager.js build complete.');
console.log('Next steps:');
console.log('  1. Remove extracted functions from script.js');
console.log('  2. Add imports + re-exports + bind calls to script.js');
console.log('  3. Migrate consumer imports');
