import { track as stTrack } from '../dev/tracker.js'; // @st-tracker

// ============================================================
// settings-manager.js — Phase 3 extraction from script.js
// Core settings persistence, connection/status helpers,
// UI state setters, extension prompt helpers, and misc utilities.
// ============================================================

import {
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
} from './state.js';

import { saveSettingsDebounced } from './debounced.js';

import {
    showSwipeButtons,
    hideSwipeButtons,
    refreshSwipeButtons,
    swipes,
    _set_ce_swipes,
    TempResponseLength,
} from './chat-engine.js';

import { event_types, eventSource } from '../events.js';

import { getRequestHeaders } from '../request-utils.js';
import { t } from '../i18n.js';
import { delay } from '../utils.js';
import { AbortReason } from '../util/AbortReason.js';
import { inject_ids } from '../constants.js';
import { getTagKeyForEntity, tags, tag_map, loadTagsSettings } from '../tags.js';
import { groups, selected_group } from '../group-chats.js';
import { getThumbnailUrl } from '../thumbnail-url.js';
import { accountStorage } from '../util/AccountStorage.js';
import { power_user, persona_description_positions, MAX_CONTEXT_DEFAULT, MAX_RESPONSE_DEFAULT, loadPowerUserSettings, applyPowerUserSettings, forceCharacterEditorTokenize } from '../power-user.js';
import { currentUser, setUserControls } from '../user.js';
import { POPUP_TYPE, callGenericPopup } from '../popup.js';
import { user_avatar, initUserAvatar, setPersonaDescription, isPersonaPanelOpen } from '../personas.js';
import {
    oai_settings,
    loadOpenAISettings,
    setupChatCompletionPromptManager,
    proxies,
    loadProxyPresets,
    selected_proxy,
} from '../openai.js';
import { kai_settings, loadKoboldSettings } from '../kai-settings.js';
import { nai_settings, loadNovelSettings } from '../nai-settings.js';
import {
    textgenerationwebui_settings as textgen_settings,
    loadTextGenSettings,
    textgen_types,
} from '../textgen-settings.js';
import { horde_settings, loadHordeSettings, getStatusHorde, getHordeModels } from '../horde.js';
import { extension_settings, loadExtensionSettings } from '../extensions.js';
import { loadBackgroundSettings, background_settings } from '../backgrounds.js';
import { getWorldInfoSettings, setWorldInfoSettings } from '../world-info.js';
import { initMacros } from '../macros.js';
import { validateDisabledSamplers } from '../samplerSelect.js';
import { hideLoader } from '../loader.js';

// ---- Private state co-extracted from script.js ----
let firstRun = false;

// Setter for firstRun (needed by remaining script.js debug function)
export function _set_sm_firstRun(val) { firstRun = val; }
export { firstRun };

// ---- Co-extracted private state ----
// currentVersion is set once at startup by script.js's getClientVersion()
let currentVersion = '0.0.0';
export function _set_sm_currentVersion(val) { currentVersion = val; }
export { currentVersion as sm_currentVersion };


// ============================================================
// Extracted functions
// ============================================================

export function getSlideToggleOptions() { stTrack('getSlideToggleOptions'); // @st-tracked
    return {
        miliseconds: animation_duration * 1.5,
        transitionFunction: animation_duration > 0 ? 'ease-in-out' : 'step-start',
    };
}

/**
 * Pings the STserver to check if it is reachable.
 * @returns {Promise<boolean>} True if the server is reachable, false otherwise.
 */
export async function pingServer() { stTrack('pingServer'); // @st-tracked
    try {
        const result = await fetch('api/ping', {
            method: 'POST',
            headers: getRequestHeaders({ omitContentType: true }),
        });

        if (!result.ok) {
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error pinging server', error);
        return false;
    }
}

export function cancelStatusCheck(reason = 'Manually cancelled status check') { stTrack('cancelStatusCheck'); // @st-tracked
    abortStatusCheck?.abort(new AbortReason(reason));
    _set_abortStatusCheck(new AbortController());
    setOnlineStatus('no_connection');
}

export function displayOnlineStatus() { stTrack('displayOnlineStatus'); // @st-tracked
    if (online_status == 'no_connection') {
        $('.online_status_indicator').removeClass('success');
        $('.online_status_text').text($('#API-status-top').attr('no_connection_text'));
    } else {
        $('.online_status_indicator').addClass('success');
        $('.online_status_text').text(online_status);
    }
}

/**
 * Sets the duration of JS animations.
 * @param {number} ms Duration in milliseconds. Resets to default if null.
 */
export function setAnimationDuration(ms = null) { stTrack('setAnimationDuration'); // @st-tracked
    _set_animation_duration(ms ?? ANIMATION_DURATION_DEFAULT);
    // Set CSS variable to document
    document.documentElement.style.setProperty('--animation-duration', `${animation_duration}ms`);
}

/**
 * Sets the currently active character
 * @param {object|number|string} [entityOrKey] - An entity with id property (character, group, tag), or directly an id or tag key. If not provided, the active character is reset to `null`.
 */
export function setActiveCharacter(entityOrKey) { stTrack('setActiveCharacter'); // @st-tracked
    _set_active_character(entityOrKey ? getTagKeyForEntity(entityOrKey) : null);
    _set_active_group(null);
}

/**
 * Sets the currently active group.
 * @param {object|number|string} [entityOrKey] - An entity with id property (character, group, tag), or directly an id or tag key. If not provided, the active group is reset to `null`.
 */
export function setActiveGroup(entityOrKey) { stTrack('setActiveGroup'); // @st-tracked
    _set_active_group(entityOrKey ? getTagKeyForEntity(entityOrKey) : null);
    _set_active_character(null);
}

export function startStatusLoading() { stTrack('startStatusLoading'); // @st-tracked
    $('.api_loading').show();
    $('.api_button').addClass('disabled');
}

export function stopStatusLoading() { stTrack('stopStatusLoading'); // @st-tracked
    $('.api_loading').hide();
    $('.api_button').removeClass('disabled');
}

export function resultCheckStatus() { stTrack('resultCheckStatus'); // @st-tracked
    displayOnlineStatus();
    stopStatusLoading();
}

export function showStopButton() {
    $('#mes_stop').css({ 'display': 'flex' });
}

export function hideStopButton() {
    // prevent NOOP, because hideStopButton() gets called multiple times
    if ($('#mes_stop').css('display') !== 'none') {
        $('#mes_stop').css({ 'display': 'none' });
        eventSource.emit(event_types.GENERATION_ENDED, chat.length);
    }
}

/**
 * A function mainly used to switch 'generating' state - setting it to false and activating the buttons again
 */
export function activateSendButtons() { stTrack('activateSendButtons'); // @st-tracked
    _set_is_send_press(false);
    hideStopButton();
    showSwipeButtons();
    delete document.body.dataset.generating;
}

/**
 * A function mainly used to switch 'generating' state - setting it to true and deactivating the buttons
 */
export function deactivateSendButtons() { stTrack('deactivateSendButtons'); // @st-tracked
    showStopButton();
    hideSwipeButtons();
    document.body.dataset.generating = 'true';
}

/**
 *
 * @param {'characters' | 'character_edit' | 'create' | 'group_edit' | 'group_create'} value
 */
export function setMenuType(value) { stTrack('setMenuType'); // @st-tracked
    _set_menu_type(value);
    // Allow custom CSS to see which menu type is active
    document.getElementById('right-nav-panel').dataset.menuType = menu_type;
}


/**
 * Sets the API connection status of the application
 * @param {string|'no_connection'} value Connection status value
 */
export function setOnlineStatus(value) { stTrack('setOnlineStatus'); // @st-tracked
    const previousStatus = online_status;
    _set_online_status(value);
    displayOnlineStatus();
    if (previousStatus !== online_status) {
        eventSource.emitAndWait(event_types.ONLINE_STATUS_CHANGED, online_status);
    }
}

export function setSendButtonState(value) { stTrack('setSendButtonState'); // @st-tracked
    _set_is_send_press(value);
}

export function changeMainAPI(api = null) { stTrack('changeMainAPI'); // @st-tracked
    const selectedVal = api ?? $('#main_api').val();
    //console.log(selectedVal);
    const apiElements = {
        'koboldhorde': {
            apiStreaming: $('#NULL_SELECTOR'),
            apiSettings: $('#kobold_api-settings'),
            apiConnector: $('#kobold_horde'),
            apiPresets: $('#kobold_api-presets'),
            apiRanges: $('#range_block'),
            maxContextElem: $('#max_context_block'),
            amountGenElem: $('#amount_gen_block'),
        },
        'kobold': {
            apiStreaming: $('#streaming_kobold_block'),
            apiSettings: $('#kobold_api-settings'),
            apiConnector: $('#kobold_api'),
            apiPresets: $('#kobold_api-presets'),
            apiRanges: $('#range_block'),
            maxContextElem: $('#max_context_block'),
            amountGenElem: $('#amount_gen_block'),
        },
        'textgenerationwebui': {
            apiStreaming: $('#streaming_textgenerationwebui_block'),
            apiSettings: $('#textgenerationwebui_api-settings'),
            apiConnector: $('#textgenerationwebui_api'),
            apiPresets: $('#textgenerationwebui_api-presets'),
            apiRanges: $('#range_block_textgenerationwebui'),
            maxContextElem: $('#max_context_block'),
            amountGenElem: $('#amount_gen_block'),
        },
        'novel': {
            apiStreaming: $('#streaming_novel_block'),
            apiSettings: $('#novel_api-settings'),
            apiConnector: $('#novel_api'),
            apiPresets: $('#novel_api-presets'),
            apiRanges: $('#range_block_novel'),
            maxContextElem: $('#max_context_block'),
            amountGenElem: $('#amount_gen_block'),
        },
        'openai': {
            apiStreaming: $('#NULL_SELECTOR'),
            apiSettings: $('#openai_settings'),
            apiConnector: $('#openai_api'),
            apiPresets: $('#openai_api-presets'),
            apiRanges: $('#range_block_openai'),
            maxContextElem: $('#max_context_block'),
            amountGenElem: $('#amount_gen_block'),
        },
    };
    //console.log('--- apiElements--- ');
    //console.log(apiElements);

    //first, disable everything so the old elements stop showing
    for (const apiName in apiElements) {
        const apiObj = apiElements[apiName];
        //do not hide items to then proceed to immediately show them.
        if (selectedVal === apiName) {
            continue;
        }
        apiObj.apiSettings.css('display', 'none');
        apiObj.apiConnector.css('display', 'none');
        apiObj.apiRanges.css('display', 'none');
        apiObj.apiPresets.css('display', 'none');
        apiObj.apiStreaming.css('display', 'none');
    }

    //then, find and enable the active item.
    //This is split out of the loop so that different apis can share settings divs
    let activeItem = apiElements[selectedVal];

    activeItem.apiStreaming.css('display', 'block');
    activeItem.apiSettings.css('display', 'block');
    activeItem.apiConnector.css('display', 'block');
    activeItem.apiRanges.css('display', 'block');
    activeItem.apiPresets.css('display', 'block');

    if (selectedVal === 'openai') {
        activeItem.apiPresets.css('display', 'flex');
    }

    if (selectedVal === 'textgenerationwebui' || selectedVal === 'novel') {
        console.debug('enabling amount_gen for ooba/novel');
        activeItem.amountGenElem.find('input').prop('disabled', false);
        activeItem.amountGenElem.css('opacity', 1.0);
    }

    //custom because streaming has been moved up under response tokens, which exists inside common settings block
    if (selectedVal === 'novel') {
        $('#ai_module_block_novel').css('display', 'block');
    } else {
        $('#ai_module_block_novel').css('display', 'none');
    }

    $('#prompt_cost_block').toggle(selectedVal === 'textgenerationwebui' && textgen_settings.type === textgen_types.OPENROUTER);

    // Hide common settings for OpenAI
    console.debug('value?', selectedVal);
    if (selectedVal == 'openai') {
        console.debug('hiding settings?');
        $('#common-gen-settings-block').css('display', 'none');
    } else {
        $('#common-gen-settings-block').css('display', 'block');
    }

    _set_main_api(selectedVal);
    setOnlineStatus('no_connection');

    if (main_api == 'koboldhorde') {
        getStatusHorde();
        getHordeModels(true);
    }
    validateDisabledSamplers();
    setupChatCompletionPromptManager(oai_settings);
    forceCharacterEditorTokenize();
}

export function setUserName(value, { toastPersonaNameChange = true } = {}) { stTrack('setUserName'); // @st-tracked
    _set_name1(value);
    if (name1 === undefined || name1 == '')
        _set_name1(default_user_name);
    console.log(`User name changed to ${name1}`);
    $('#your_name').text(name1);
    if (toastPersonaNameChange && power_user.persona_show_notifications && !isPersonaPanelOpen()) {
        toastr.success(t`Your messages will now be sent as ${name1}`, t`Persona Changed`);
    }
    saveSettingsDebounced();
}

async function doOnboarding(avatarId) {
    const template = $('#onboarding_template .onboarding');
    let userName = await callGenericPopup(template, POPUP_TYPE.INPUT, currentUser?.name || name1, { wider: true, cancelButton: false });

    if (userName) {
        userName = String(userName).replace('\n', ' ');
        setUserName(userName);
        console.log(`Binding persona ${avatarId} to name ${userName}`);
        power_user.personas[avatarId] = userName;
        power_user.persona_descriptions[avatarId] = {
            description: '',
            position: persona_description_positions.IN_PROMPT,
        };
    }
}

function reloadLoop() {
    const MAX_RELOADS = 5;
    let reloads = Number(sessionStorage.getItem('reloads') || 0);
    if (reloads < MAX_RELOADS) {
        reloads++;
        sessionStorage.setItem('reloads', String(reloads));
        window.location.reload();
    }
}

export async function getSettings() { stTrack('getSettings'); // @st-tracked
    const response = await fetch('/api/settings/get', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({}),
        cache: 'no-cache',
    });

    if (!response.ok) {
        reloadLoop();
        toastr.error(t`Settings could not be loaded after multiple attempts. Please try again later.`);
        throw new Error('Error getting settings');
    }

    const data = await response.json();
    if (data.result != 'file not find' && data.settings) {
        _set_settings(JSON.parse(data.settings));
        if (settings.username !== undefined && settings.username !== '') {
            _set_name1(settings.username);
            $('#your_name').text(name1);
        }

        accountStorage.init(settings?.accountStorage);
        await setUserControls(data.enable_accounts);

        // Allow subscribers to mutate settings
        await eventSource.emit(event_types.SETTINGS_LOADED_BEFORE, settings);

        //Load AI model config settings
        _set_amount_gen(settings.amount_gen);
        if (settings.max_context !== undefined)
            _set_max_context(parseInt(settings.max_context));

        _set_ce_swipes(settings.swipes !== undefined ? !!settings.swipes : true); // enable swipes by default
        $('#swipes-checkbox').prop('checked', swipes); /// swipecode
        refreshSwipeButtons();

        // Kobold
        loadKoboldSettings(data, settings.kai_settings ?? settings, settings);

        // Novel
        loadNovelSettings(data, settings.nai_settings ?? settings);

        // TextGen
        await loadTextGenSettings(data, settings);

        // OpenAI
        loadOpenAISettings(data, settings.oai_settings ?? settings);

        // Horde
        loadHordeSettings(settings);

        // Load power user settings
        await loadPowerUserSettings(settings, data);

        // Apply theme toggles from power user settings
        applyPowerUserSettings();

        // Load character tags
        loadTagsSettings(settings);

        // Load background
        loadBackgroundSettings(settings);

        // Load proxy presets
        loadProxyPresets(settings);

        // Allow subscribers to mutate settings
        await eventSource.emit(event_types.SETTINGS_LOADED_AFTER, settings);

        // Set context size after loading power user (may override the max value)
        $('#max_context').val(max_context);
        $('#max_context_counter').val(max_context);

        $('#amount_gen').val(amount_gen);
        $('#amount_gen_counter').val(amount_gen);

        //Load which API we are using
        if (settings.main_api == undefined) {
            settings.main_api = 'kobold';
        }

        if (settings.main_api == 'poe') {
            settings.main_api = 'openai';
        }

        _set_main_api(settings.main_api);
        $('#main_api').val(main_api);
        $(`#main_api option[value=${main_api}]`).attr('selected', 'true');
        changeMainAPI();

        //Load User's Name and Avatar
        initUserAvatar(settings.user_avatar);
        setPersonaDescription();

        //Load the active character and group
        _set_active_character(settings.active_character);
        _set_active_group(settings.active_group);

        setWorldInfoSettings(settings.world_info_settings ?? settings, data);

        _set_selected_button(settings.selected_button);

        // TODO: Move me into firstLoadInit when experimental toggle is removed
        // power_user.experimental_macro_engine
        initMacros();

        if (data.enable_extensions) {
            const enableAutoUpdate = Boolean(data.enable_extensions_auto_update);
            const isVersionChanged = settings.currentVersion !== currentVersion;
            await loadExtensionSettings(settings, isVersionChanged, enableAutoUpdate);
            await eventSource.emit(event_types.EXTENSION_SETTINGS_LOADED);
        }

        firstRun = !!settings.firstRun;

        if (firstRun) {
            hideLoader();
            await doOnboarding(user_avatar);
            firstRun = false;
        }
    }
    await validateDisabledSamplers();
    _set_settingsReady(true);
    await eventSource.emit(event_types.SETTINGS_LOADED);
}

export async function saveSettings(loopCounter = 0) { stTrack('saveSettings'); // @st-tracked
    if (!settingsReady) {
        console.warn('Settings not ready, scheduling another save');
        saveSettingsDebounced();
        return;
    }

    const MAX_RETRIES = 3;
    if (TempResponseLength.isCustomized()) {
        if (loopCounter < MAX_RETRIES) {
            console.warn('Response length is currently being overridden, scheduling another save');
            saveSettingsDebounced(++loopCounter);
            return;
        }
        console.error('Response length is currently being overridden, but the save loop has reached the maximum number of retries');
        TempResponseLength.restore(null);
    }

    const payload = {
        firstRun: firstRun,
        accountStorage: accountStorage.getState(),
        currentVersion: currentVersion,
        username: name1,
        active_character: active_character,
        active_group: active_group,
        user_avatar: user_avatar,
        amount_gen: amount_gen,
        max_context: max_context,
        main_api: main_api,
        world_info_settings: getWorldInfoSettings(),
        textgenerationwebui_settings: textgen_settings,
        swipes: swipes,
        horde_settings: horde_settings,
        power_user: power_user,
        extension_settings: extension_settings,
        tags: tags,
        tag_map: tag_map,
        nai_settings: nai_settings,
        kai_settings: kai_settings,
        oai_settings: oai_settings,
        background: background_settings,
        proxies: proxies,
        selected_proxy: selected_proxy,
    };

    try {
        const result = await fetch('/api/settings/save', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify(payload),
            cache: 'no-cache',
        });

        if (!result.ok) {
            throw new Error(`Failed to save settings: ${result.statusText}`);
        }

        _set_settings(payload);
        await eventSource.emit(event_types.SETTINGS_UPDATED);
    } catch (error) {
        console.error('Error saving settings:', error);
        toastr.error(t`Check the server connection and reload the page to prevent data loss.`, t`Settings could not be saved`);
    }
}

/**
 * Sets the generation parameters from a preset object.
 * @param {{ genamt?: number, max_length?: number }} preset Preset object
 */
export function setGenerationParamsFromPreset(preset) { stTrack('setGenerationParamsFromPreset'); // @st-tracked
    const needsUnlock = (preset.max_length ?? max_context) > MAX_CONTEXT_DEFAULT || (preset.genamt ?? amount_gen) > MAX_RESPONSE_DEFAULT;
    $('#max_context_unlocked').prop('checked', needsUnlock).trigger('change');

    if (preset.genamt !== undefined) {
        _set_amount_gen(preset.genamt);
        $('#amount_gen').val(amount_gen);
        $('#amount_gen_counter').val(amount_gen);
    }

    if (preset.max_length !== undefined) {
        _set_max_context(preset.max_length);
        $('#max_context').val(max_context);
        $('#max_context_counter').val(max_context);
    }
}

/**
 * Helper for `displayPastChats`, to make the same info consistently available for other functions
 */
export function getCurrentChatDetails() { stTrack('getCurrentChatDetails'); // @st-tracked
    if (!characters[this_chid] && !selected_group) {
        return { sessionName: '', group: null, characterName: '', avatarImgURL: '' };
    }

    const group = selected_group ? groups.find(x => x.id === selected_group) : null;
    const currentChat = selected_group ? group?.chat_id : characters[this_chid].chat;
    const displayName = selected_group ? group?.name : characters[this_chid].name;
    const avatarImg = selected_group ? group?.avatar_url : getThumbnailUrl('avatar', characters[this_chid].avatar);
    return { sessionName: currentChat, group: group, characterName: displayName, avatarImgURL: avatarImg };
}

export function selectRightMenuWithAnimation(selectedMenuId) { stTrack('selectRightMenuWithAnimation'); // @st-tracked
    const displayModes = {
        'rm_group_chats_block': 'flex',
        'rm_api_block': 'grid',
        'rm_characters_block': 'flex',
    };
    $('#result_info').toggle(selectedMenuId === 'rm_ch_create_block');
    document.querySelectorAll('#right-nav-panel .right_menu').forEach((menu) => {
        $(menu).css('display', 'none');

        if (selectedMenuId && selectedMenuId.replace('#', '') === menu.id) {
            const mode = displayModes[menu.id] ?? 'block';
            $(menu).css('display', mode);
            $(menu).css('opacity', 0.0);
            $(menu).transition({
                opacity: 1.0,
                duration: animation_duration,
                easing: animation_easing,
                complete: function () { },
            });
        }
    });
}

/**
 * Sets a prompt injection to insert custom text into any outgoing prompt. For use in UI extensions.
 * @param {string} key Prompt injection id.
 * @param {string} value Prompt injection value.
 * @param {number} position Insertion position. 0 is after story string, 1 is in-chat with custom depth.
 * @param {number} depth Insertion depth. 0 represets the last message in context. Expected values up to MAX_INJECTION_DEPTH.
 * @param {number} role Extension prompt role. Defaults to SYSTEM.
 * @param {boolean} scan Should the prompt be included in the world info scan.
 * @param {(function(): Promise<boolean>|boolean)} filter Filter function to determine if the prompt should be injected.
 */
export function setExtensionPrompt(key, value, position, depth, scan = false, role = extension_prompt_roles.SYSTEM, filter = null) { stTrack('setExtensionPrompt'); // @st-tracked
    extension_prompts[key] = {
        value: String(value),
        position: Number(position),
        depth: Number(depth),
        scan: !!scan,
        role: Number(role ?? extension_prompt_roles.SYSTEM),
        filter: filter,
    };
}

/**
 * Gets a enum value of the extension prompt role by its name.
 * @param {string} roleName The name of the extension prompt role.
 * @returns {number} The role id of the extension prompt.
 */
export function getExtensionPromptRoleByName(roleName) { stTrack('getExtensionPromptRoleByName'); // @st-tracked
    // If the role is already a valid number, return it
    if (typeof roleName === 'number' && Object.values(extension_prompt_roles).includes(roleName)) {
        return roleName;
    }

    switch (roleName) {
        case 'system':
            return extension_prompt_roles.SYSTEM;
        case 'user':
            return extension_prompt_roles.USER;
        case 'assistant':
            return extension_prompt_roles.ASSISTANT;
    }

    // Skill issue?
    return extension_prompt_roles.SYSTEM;
}

/**
 * Removes all char A/N prompt injections from the chat.
 * To clean up when switching from groups to solo and vice versa.
 */
export function removeDepthPrompts() { stTrack('removeDepthPrompts'); // @st-tracked
    for (const key of Object.keys(extension_prompts)) {
        if (key.startsWith(inject_ids.DEPTH_PROMPT)) {
            delete extension_prompts[key];
        }
    }
}

export function setGenerationProgress(progress) { stTrack('setGenerationProgress'); // @st-tracked
    if (!progress) {
        $('#send_textarea').css({ 'background': '', 'transition': '' });
    }
    else {
        $('#send_textarea').css({
            'background': `linear-gradient(90deg, #008000d6 ${progress}%, transparent ${progress}%)`,
            'transition': '0.25s ease-in-out',
        });
    }
}
