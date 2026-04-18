/**
 * Core state module — pure variable declarations.
 * This module has NO imports from SCC member files,
 * breaking the 101-file circular dependency.
 * @module core/state
 */

import { SWIPE_STATE, SWIPE_DIRECTION, debounce_timeout } from '../constants.js';

// ============================================================
// Constants
// ============================================================

export const systemUserName = 'SillyTavern System';
export const neutralCharacterName = 'Assistant';
export const default_user_name = 'User';
export const default_avatar = 'img/ai4.png';
export const system_avatar = 'img/five.png';
export const comment_avatar = 'img/quill.png';
export const default_user_avatar = 'img/user-default.png';
export const ANIMATION_DURATION_DEFAULT = 125;
export const talkativeness_default = 0.5;
export const depth_prompt_depth_default = 4;
export const depth_prompt_role_default = 'system';
export const MAX_INJECTION_DEPTH = 10000;

/** @type {debounce_timeout} The debounce timeout used for chat/settings save. debounce_timeout.long: 1.000 ms */
export const DEFAULT_SAVE_EDIT_TIMEOUT = debounce_timeout.relaxed;
/** @type {debounce_timeout} The debounce timeout used for printing. debounce_timeout.quick: 100 ms */
export const DEFAULT_PRINT_TIMEOUT = debounce_timeout.quick;

/**
 * @enum {number} Extension prompt types
 */
export const extension_prompt_types = {
    NONE: -1,
    IN_PROMPT: 0,
    IN_CHAT: 1,
    BEFORE_PROMPT: 2,
};

/**
 * @enum {number} Extension prompt roles
 */
export const extension_prompt_roles = {
    SYSTEM: 0,
    USER: 1,
    ASSISTANT: 2,
};

// ============================================================
// Mutable state
// ============================================================

/** @type {import('showdown').Converter} */
export let converter;
export let name1 = default_user_name;
export let name2 = systemUserName;
/** @type {ChatMessage[]} */
export let chat = [];
/** @type {import('../constants.js').SWIPE_STATE} */
export let swipeState = SWIPE_STATE.NONE;
export let isChatSaving = false;
export let settingsReady = false;
export let displayVersion = 'SillyTavern';
/** @type {Character[]} */
export let characters = [];
/** @type {string|undefined} */
export let this_chid;
export let CLIENT_VERSION = 'SillyTavern:UNKNOWN:Cohee#1207';

// Saved here for performance reasons
export const chatElement = typeof $ !== 'undefined' ? $('#chat') : null;

/** @type {ChatMetadata} */
export let chat_metadata = {};
/** @type {StreamingProcessor} */
export let streamingProcessor = null;
export let abortStatusCheck = new AbortController();
export let charDragDropHandler = null;
export let chatDragDropHandler = null;

/** @type {MenuType} */
export let menu_type = '';
export let selected_button = '';

export let create_save = {
    name: '',
    description: '',
    creator_notes: '',
    post_history_instructions: '',
    character_version: '',
    system_prompt: '',
    tags: '',
    creator: '',
    personality: '',
    first_message: '',
    /** @type {FileList|null} */
    avatar: null,
    scenario: '',
    mes_example: '',
    world: '',
    talkativeness: talkativeness_default,
    alternate_greetings: [],
    depth_prompt_prompt: '',
    depth_prompt_depth: depth_prompt_depth_default,
    depth_prompt_role: depth_prompt_role_default,
    extensions: {},
    extra_books: [],
};

export let animation_duration = ANIMATION_DURATION_DEFAULT;
export let animation_easing = 'ease-in-out';
export let online_status = 'no_connection';
export let is_send_press = false;

export let settings;
export let amount_gen = 80;
export let max_context = 2048;

export let swipesHidden = false;
/** @type {{ now: number, direction: string }} */
export let lastSwipeInfo = { now: performance.now(), direction: SWIPE_DIRECTION.RIGHT };
export let recentSwipes = 0;

export let extension_prompts = {};
export let main_api;
export let token;

/** The tag of the active character. (NOT the id) */
export let active_character = '';
/** The tag of the active group. (Coincidentally also the id) */
export let active_group = '';

// ============================================================
// Setter functions (ES module imports are read-only; only the
// declaring module can reassign exported let bindings)
// ============================================================

export function _set_converter(val) { converter = val; }
export function _set_name1(val) { name1 = val; }
export function _set_name2(val) { name2 = val; }
export function _set_chat(val) { chat = val; }
export function _set_swipeState(val) { swipeState = val; }
export function _set_isChatSaving(val) { isChatSaving = val; }
export function _set_settingsReady(val) { settingsReady = val; }
export function _set_displayVersion(val) { displayVersion = val; }
export function _set_characters(val) { characters = val; }
export function _set_this_chid(val) { this_chid = val; }
export function _set_CLIENT_VERSION(val) { CLIENT_VERSION = val; }
export function _set_chat_metadata(val) { chat_metadata = val; }
export function _set_streamingProcessor(val) { streamingProcessor = val; }
export function _set_abortStatusCheck(val) { abortStatusCheck = val; }
export function _set_charDragDropHandler(val) { charDragDropHandler = val; }
export function _set_chatDragDropHandler(val) { chatDragDropHandler = val; }
export function _set_menu_type(val) { menu_type = val; }
export function _set_selected_button(val) { selected_button = val; }
export function _set_create_save(val) { create_save = val; }
export function _set_animation_duration(val) { animation_duration = val; }
export function _set_animation_easing(val) { animation_easing = val; }
export function _set_online_status(val) { online_status = val; }
export function _set_is_send_press(val) { is_send_press = val; }
export function _set_settings(val) { settings = val; }
export function _set_amount_gen(val) { amount_gen = val; }
export function _set_max_context(val) { max_context = val; }
export function _set_swipesHidden(val) { swipesHidden = val; }
export function _set_lastSwipeInfo(val) { lastSwipeInfo = val; }
export function _set_recentSwipes(val) { recentSwipes = val; }
export function _set_extension_prompts(val) { extension_prompts = val; }
export function _set_main_api(val) { main_api = val; }
export function _set_token(val) { token = val; }
export function _set_active_character(val) { active_character = val; }
export function _set_active_group(val) { active_group = val; }

export let scrollLock = false;
export function _set_scrollLock(val) { scrollLock = val; }

/** Append to displayVersion (used during init). */
export function _append_displayVersion(suffix) { displayVersion += suffix; }

