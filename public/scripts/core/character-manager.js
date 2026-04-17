/**
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
import { favsToHotswap, humanizedDateTime, isMobile } from '../RossAscends-mods.js';
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

/**
 * Switches the currently selected character to the one with the given ID. (character index, not the character key!)
 *
 * If the character ID doesn't exist, if the chat is being saved, or if a group is being generated, this function does nothing.
 * If the character is different from the currently selected one, it will clear the chat and reset any selected character or group.
 * @param {number} id The ID of the character to switch to.
 * @param {object} [options] Options for the switch.
 * @param {boolean} [options.switchMenu=true] Whether to switch the right menu to the character edit menu if the character is already selected.
 * @returns {Promise<void>} A promise that resolves when the character is switched.
 */
export async function selectCharacterById(id, { switchMenu = true } = {}) { stTrack('selectCharacterById'); // @st-tracked
    if (characters[id] === undefined) {
        return;
    }

    if (isChatSaving) {
        toastr.info(t`Please wait until the chat is saved before switching characters.`, t`Your chat is still saving...`);
        return;
    }

    if (selected_group && is_group_generating) {
        return;
    }

    if (selected_group || String(this_chid) !== String(id)) {
        //if clicked on a different character from what was currently selected
        if (!is_send_press) {
            setCharacterId(undefined);
            setCharacterName('');
            resetSelectedGroup();
            await clearChat({ clearData: true });
            _cancelTtsPlay();
            _set_ce_this_edit_mes_id(undefined);
            _set_selected_button('character_edit');
            setCharacterId(id);
            _set_chat_metadata({});
            await getChat();
        }
    } else {
        //if clicked on character that was already selected
        _set_selected_button('character_edit');
        await unshallowCharacter(this_chid);
        select_selected_character(this_chid, { switchMenu });
    }
}

function getBackBlock() {
    const template = $('#bogus_folder_back_template .bogus_folder_select').clone();
    return template;
}

async function getEmptyBlock() {
    const icons = ['fa-dragon', 'fa-otter', 'fa-kiwi-bird', 'fa-crow', 'fa-frog'];
    const texts = [t`Here be dragons`, t`Otterly empty`, t`Kiwibunga`, t`Pump-a-Rum`, t`Croak it`];
    const roll = new Date().getMinutes() % icons.length;
    const params = {
        text: texts[roll],
        icon: icons[roll],
    };
    const emptyBlock = await renderTemplateAsync('emptyBlock', params);
    return $(emptyBlock);
}

/**
 * @param {number} hidden Number of hidden characters
 */
async function getHiddenBlock(hidden) {
    const params = {
        text: (hidden > 1 ? t`${hidden} characters hidden.` : t`${hidden} character hidden.`),
    };
    const hiddenBlock = await renderTemplateAsync('hiddenBlock', params);
    return $(hiddenBlock);
}

function getCharacterBlock(item, id) {
    let this_avatar = default_avatar;
    if (item.avatar != 'none') {
        this_avatar = getThumbnailUrl('avatar', item.avatar);
    }
    // Populate the template
    const template = $('#character_template .character_select').clone();
    template.attr({ 'data-chid': id, 'id': `CharID${id}` });
    template.find('img').attr('src', this_avatar).attr('alt', item.name);
    template.find('.avatar').attr('title', `[Character] ${item.name}\nFile: ${item.avatar}`);
    template.find('.ch_name').text(item.name).attr('title', `[Character] ${item.name}`);
    if (power_user.show_card_avatar_urls) {
        template.find('.ch_avatar_url').text(item.avatar);
    }
    template.find('.ch_fav_icon').css('display', 'none');
    template.toggleClass('is_fav', item.fav || item.fav == 'true');
    template.find('.ch_fav').val(item.fav);

    const isAssistant = item.avatar === getPermanentAssistantAvatar();
    if (!isAssistant) {
        template.find('.ch_assistant').remove();
    }

    const description = item.data?.creator_notes || '';
    if (description) {
        template.find('.ch_description').text(description);
    }
    else {
        template.find('.ch_description').hide();
    }

    const auxFieldName = power_user.aux_field || 'character_version';
    const auxFieldValue = (item.data && item.data[auxFieldName]) || '';
    if (auxFieldValue) {
        template.find('.character_version').text(auxFieldValue);
    }
    else {
        template.find('.character_version').hide();
    }

    // Display inline tags
    const tagsElement = template.find('.tags');
    printTagList(tagsElement, { forEntityOrKey: id, tagOptions: { isCharacterList: true } });

    // Add to the list
    return template;
}

/**
 * Prints the global character list, optionally doing a full refresh of the list
 * Use this function whenever the reprinting of the character list is the primary focus, otherwise using `printCharactersDebounced` is preferred for a cleaner, non-blocking experience.
 *
 * The printing will also always reprint all filter options of the global list, to keep them up to date.
 *
 * @param {boolean} fullRefresh - If true, the list is fully refreshed and the navigation is being reset
 */
export async function printCharacters(fullRefresh = false) { stTrack('printCharacters'); // @st-tracked
    const storageKey = 'Characters_PerPage';
    const listId = '#rm_print_characters_block';

    let currentScrollTop = $(listId).scrollTop();

    if (fullRefresh) {
        saveCharactersPage = 0;
        currentScrollTop = 0;
        await delay(1);
    }

    // Before printing the personas, we check if we should enable/disable search sorting
    verifyCharactersSearchSortRule();

    // We are actually always reprinting filters, as it "doesn't hurt", and this way they are always up to date
    printTagFilters(tag_filter_type.character);
    printTagFilters(tag_filter_type.group_members_list);
    printTagFilters(tag_filter_type.group_candidates_list);

    // We are also always reprinting the lists on character/group edit window, as these ones doesn't get updated otherwise
    applyTagsOnCharacterSelect();
    applyTagsOnGroupSelect();

    const entities = getEntitiesList({ doFilter: true });

    const pageSize = Number(accountStorage.getItem(storageKey)) || per_page_default;
    const sizeChangerOptions = [10, 25, 50, 100, 250, 500, 1000];
    $('#rm_print_characters_pagination').pagination({
        dataSource: entities,
        pageSize,
        pageRange: 1,
        pageNumber: saveCharactersPage || 1,
        position: 'top',
        showPageNumbers: false,
        showSizeChanger: true,
        prevText: '<',
        nextText: '>',
        formatNavigator: PAGINATION_TEMPLATE,
        formatSizeChanger: renderPaginationDropdown(pageSize, sizeChangerOptions),
        showNavigator: true,
        callback: async function (/** @type {Entity[]} */ data) {
            $(listId).empty();
            if (power_user.bogus_folders && isBogusFolderOpen()) {
                $(listId).append(getBackBlock());
            }
            if (!data.length) {
                const emptyBlock = await getEmptyBlock();
                $(listId).append(emptyBlock);
            }
            let displayCount = 0;
            for (const i of data) {
                switch (i.type) {
                    case 'character':
                        $(listId).append(getCharacterBlock(i.item, i.id));
                        displayCount++;
                        break;
                    case 'group':
                        $(listId).append(getGroupBlock(i.item));
                        displayCount++;
                        break;
                    case 'tag':
                        $(listId).append(getTagBlock(i.item, i.entities, i.hidden, i.isUseless));
                        break;
                }
            }

            const hidden = (characters.length + groups.length) - displayCount;
            if (hidden > 0 && entitiesFilter.hasAnyFilter()) {
                const hiddenBlock = await getHiddenBlock(hidden);
                $(listId).append(hiddenBlock);
            }
            localizePagination($('#rm_print_characters_pagination'));

            eventSource.emit(event_types.CHARACTER_PAGE_LOADED);
        },
        afterSizeSelectorChange: function (e, size) {
            accountStorage.setItem(storageKey, e.target.value);
            paginationDropdownChangeHandler(e, size);
        },
        afterPaging: function (e) {
            saveCharactersPage = e;
        },
        afterRender: function () {
            $(listId).scrollTop(currentScrollTop);
        },
    });

    favsToHotswap();
    updatePersonaConnectionsAvatarList();
}

/** Checks the state of the current search, and adds/removes the search sorting option accordingly */
function verifyCharactersSearchSortRule() {
    const searchTerm = entitiesFilter.getFilterData(FILTER_TYPES.SEARCH);
    const searchOption = $('#character_sort_order option[data-field="search"]');
    const selector = $('#character_sort_order');
    const isHidden = searchOption.attr('hidden') !== undefined;

    // If we have a search term, we are displaying the sorting option for it
    if (searchTerm && isHidden) {
        searchOption.removeAttr('hidden');
        searchOption.prop('selected', true);
        flashHighlight(selector);
    }
    // If search got cleared, we make sure to hide the option and go back to the one before
    if (!searchTerm && !isHidden) {
        searchOption.attr('hidden', '');
        $(`#character_sort_order option[data-order="${power_user.sort_order}"][data-field="${power_user.sort_field}"]`).prop('selected', true);
    }
}

/**
 * Converts the given character to its entity representation
 *
 * @param {Character} character - The character
 * @param {string|number} id - The id of this character
 * @returns {Entity} The entity for this character
 */
export function characterToEntity(character, id) { stTrack('characterToEntity'); // @st-tracked
    return { item: character, id, type: 'character' };
}

/**
 * Converts the given group to its entity representation
 *
 * @param {Group} group - The group
 * @returns {Entity} The entity for this group
 */
export function groupToEntity(group) { stTrack('groupToEntity'); // @st-tracked
    return { item: group, id: group.id, type: 'group' };
}

/**
 * Converts the given tag to its entity representation
 *
 * @param {import('./scripts/tags.js').Tag} tag - The tag
 * @returns {Entity} The entity for this tag
 */
export function tagToEntity(tag) { stTrack('tagToEntity'); // @st-tracked
    return { item: structuredClone(tag), id: tag.id, type: 'tag', entities: [] };
}

/**
 * Builds the full list of all entities available
 *
 * They will be correctly marked and filtered.
 *
 * @param {object} param0 - Optional parameters
 * @param {boolean} [param0.doFilter] - Whether this entity list should already be filtered based on the global filters
 * @param {boolean} [param0.doSort] - Whether the entity list should be sorted when returned
 * @returns {Entity[]} All entities
 */
export function getEntitiesList({ doFilter = false, doSort = true } = {}) { stTrack('getEntitiesList'); // @st-tracked
    let entities = [
        ...characters.map((item, index) => characterToEntity(item, index)),
        ...groups.map(item => groupToEntity(item)),
        ...(power_user.bogus_folders ? tags.filter(isBogusFolder).sort(compareTagsForSort).map(item => tagToEntity(item)) : []),
    ];

    // We need to do multiple filter runs in a specific order, otherwise different settings might override each other
    // and screw up tags and search filter, sub lists or similar.
    // The specific filters are written inside the "filterByTagState" method and its different parameters.
    // Generally what we do is the following:
    //   1. First swipe over the list to remove the most obvious things
    //   2. Build sub entity lists for all folders, filtering them similarly to the second swipe
    //   3. We do the last run, where global filters are applied, and the search filters last

    // First run filters, that will hide what should never be displayed
    if (doFilter) {
        entities = filterByTagState(entities);
    }

    // Run over all entities between first and second filter to save some states
    for (const entity of entities) {
        // For folders, we remember the sub entities so they can be displayed later, even if they might be filtered
        // Those sub entities should be filtered and have the search filters applied too
        if (entity.type === 'tag') {
            let subEntities = filterByTagState(entities, { subForEntity: entity, filterHidden: false });
            const subCount = subEntities.length;
            subEntities = filterByTagState(entities, { subForEntity: entity });
            if (doFilter) {
                // sub entities filter "hacked" because folder filter should not be applied there, so even in "only folders" mode characters show up
                subEntities = entitiesFilter.applyFilters(subEntities, { clearScoreCache: false, tempOverrides: { [FILTER_TYPES.FOLDER]: FILTER_STATES.UNDEFINED }, clearFuzzySearchCaches: false });
            }
            if (doSort) {
                sortEntitiesList(subEntities, false);
            }
            entity.entities = subEntities;
            entity.hidden = subCount - subEntities.length;
        }
    }

    // Second run filters, hiding whatever should be filtered later
    if (doFilter) {
        const beforeFinalEntities = filterByTagState(entities, { globalDisplayFilters: true });
        entities = entitiesFilter.applyFilters(beforeFinalEntities, { clearFuzzySearchCaches: false });

        // Magic for folder filter. If that one is enabled, and no folders are display anymore, we remove that filter to actually show the characters.
        if (isFilterState(entitiesFilter.getFilterData(FILTER_TYPES.FOLDER), FILTER_STATES.SELECTED) && entities.filter(x => x.type == 'tag').length == 0) {
            entities = entitiesFilter.applyFilters(beforeFinalEntities, { tempOverrides: { [FILTER_TYPES.FOLDER]: FILTER_STATES.UNDEFINED }, clearFuzzySearchCaches: false });
        }
    }

    // Final step, updating some properties after the last filter run
    const nonTagEntitiesCount = entities.filter(entity => entity.type !== 'tag').length;
    for (const entity of entities) {
        if (entity.type === 'tag') {
            if (entity.entities?.length == nonTagEntitiesCount) entity.isUseless = true;
        }
    }

    // Sort before returning if requested
    if (doSort) {
        sortEntitiesList(entities, false);
    }
    entitiesFilter.clearFuzzySearchCaches();
    return entities;
}

export async function getOneCharacter(avatarUrl) { stTrack('getOneCharacter'); // @st-tracked
    const response = await fetch('/api/characters/get', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({
            avatar_url: avatarUrl,
        }),
    });

    if (response.ok) {
        const getData = await response.json();
        getData.name = DOMPurify.sanitize(getData.name);
        getData.chat = String(getData.chat);

        const indexOf = characters.findIndex(x => x.avatar === avatarUrl);

        if (indexOf !== -1) {
            characters[indexOf] = getData;
        } else {
            toastr.error(t`Character ${avatarUrl} not found in the list`, t`Error`, { timeOut: 5000, preventDuplicates: true });
        }
    }
}

export function getCharacterSource(chId = this_chid) { stTrack('getCharacterSource'); // @st-tracked
    const character = characters[chId];

    if (!character) {
        return '';
    }

    const chubId = characters[chId]?.data?.extensions?.chub?.full_path;

    if (chubId) {
        return `https://chub.ai/characters/${chubId}`;
    }

    const pygmalionId = characters[chId]?.data?.extensions?.pygmalion_id;

    if (pygmalionId) {
        return `https://pygmalion.chat/${pygmalionId}`;
    }

    const githubRepo = characters[chId]?.data?.extensions?.github_repo;

    if (githubRepo) {
        return `https://github.com/${githubRepo}`;
    }

    const sourceUrl = characters[chId]?.data?.extensions?.source_url;

    if (sourceUrl) {
        return sourceUrl;
    }

    const risuId = characters[chId]?.data?.extensions?.risuai?.source;

    if (Array.isArray(risuId) && risuId.length && typeof risuId[0] === 'string' && risuId[0].startsWith('risurealm:')) {
        const realmId = risuId[0].split(':')[1];
        return `https://realm.risuai.net/character/${realmId}`;
    }

    const perchanceSlug = characters[chId]?.data?.extensions?.perchance_data?.slug;

    if (perchanceSlug) {
        return `https://perchance.org/ai-character-chat?data=${perchanceSlug}`;
    }

    return '';
}

export async function getCharacters() { stTrack('getCharacters'); // @st-tracked
    const response = await fetch('/api/characters/all', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({}),
    });
    if (response.ok) {
        const previousAvatar = this_chid !== undefined ? characters[this_chid]?.avatar : null;
        characters.splice(0, characters.length);
        const getData = await response.json();
        for (let i = 0; i < getData.length; i++) {
            characters[i] = getData[i];
            characters[i].name = DOMPurify.sanitize(characters[i].name);

            // For dropped-in cards
            if (!characters[i].chat) {
                characters[i].chat = `${characters[i].name} - ${humanizedDateTime()}`;
            }

            characters[i].chat = String(characters[i].chat);
        }

        if (previousAvatar) {
            const newCharacterId = characters.findIndex(x => x.avatar === previousAvatar);
            if (newCharacterId >= 0) {
                setCharacterId(newCharacterId);
                await selectCharacterById(newCharacterId, { switchMenu: false });
            } else {
                await Popup.show.text(t`ERROR: The active character is no longer available.`, t`The page will be refreshed to prevent data loss. Press "OK" to continue.`);
                return location.reload();
            }
        }

        await getGroups();
        await printCharacters(true);
    } else {
        console.error('Failed to fetch characters:', response.statusText);
        const errorData = await response.json();
        if (errorData?.overflow) {
            await Popup.show.text(t`Character data length limit reached`, t`To resolve this, set "performance.lazyLoadCharacters" to "true" in config.yaml and restart the server.`);
        }
    }
}

/**
 * Returns the URL of the avatar for the given character Id.
 * @param {number|string} characterId Character Id
 * @returns {string} Avatar URL
 */
export function getCharacterAvatar(characterId) { stTrack('getCharacterAvatar'); // @st-tracked
    const character = characters[characterId];
    const avatarImg = character?.avatar;

    if (!avatarImg || avatarImg === 'none') {
        return default_avatar;
    }

    return formatCharacterAvatar(avatarImg);
}

export function formatCharacterAvatar(characterAvatar) { stTrack('formatCharacterAvatar'); // @st-tracked
    return `characters/${characterAvatar}`;
}

export async function duplicateCharacter() { stTrack('duplicateCharacter'); // @st-tracked
    if (this_chid === undefined || !characters[this_chid]) {
        toastr.warning(t`You must first select a character to duplicate!`);
        return '';
    }

    const confirmMessage = $(await renderTemplateAsync('duplicateConfirm'));
    const confirm = await callGenericPopup(confirmMessage, POPUP_TYPE.CONFIRM);

    if (!confirm) {
        console.log('User cancelled duplication');
        return '';
    }

    const body = { avatar_url: characters[this_chid].avatar };
    const response = await fetch('/api/characters/duplicate', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify(body),
    });
    if (response.ok) {
        toastr.success(t`Character Duplicated`);
        const data = await response.json();
        await eventSource.emit(event_types.CHARACTER_DUPLICATED, { oldAvatar: body.avatar_url, newAvatar: data.path });
        await getCharacters();
    }

    return '';
}

/**
 * Sets a character array index.
 * @param {number|string|undefined} value
 */
export function setCharacterId(value) { stTrack('setCharacterId'); // @st-tracked
    switch (typeof value) {
        case 'bigint':
        case 'number':
            _set_this_chid(String(value));
            break;
        case 'string':
            _set_this_chid(!isNaN(parseInt(value)) ? value : undefined);
            break;
        case 'object':
            _set_this_chid(characters.indexOf(value) !== -1 ? String(characters.indexOf(value)) : undefined);
            break;
        case 'undefined':
            _set_this_chid(undefined);
            break;
        default:
            console.error('Invalid character ID type:', value);
            break;
    }
}

export function setCharacterName(value) { stTrack('setCharacterName'); // @st-tracked
    _set_name2(value);
}

/**
 * Renames the currently selected character, updating relevant references and optionally renaming past chats.
 *
 * If no name is provided, a popup prompts for a new name. If the new name matches the current name,
 * the renaming process is aborted. The function sends a request to the server to rename the character
 * and handles updates to other related fields such as tags, lore, and author notes.
 *
 * If the renaming is successful, the character list is reloaded and the renamed character is selected.
 * Optionally, past chats can be renamed to reflect the new character name.
 *
 * @param {string?} [name=null] - The new name for the character. If not provided, a popup will prompt for it.
 * @param {object} [options] - Additional options.
 * @param {boolean} [options.silent=false] - If true, suppresses popups and warnings.
 * @param {boolean?} [options.renameChats=null] - If true, renames past chats to reflect the new character name.
 * @returns {Promise<boolean>} - Returns true if the character was successfully renamed, false otherwise.
 */

export async function renameCharacter(name = null, { silent = false, renameChats = null } = {}) { stTrack('renameCharacter'); // @st-tracked
    if (!name && silent) {
        toastr.warning(t`No character name provided.`, t`Rename Character`);
        return false;
    }
    if (this_chid === undefined) {
        toastr.warning(t`No character selected.`, t`Rename Character`);
        return false;
    }

    const oldAvatar = characters[this_chid].avatar;
    const newValue = name || await callGenericPopup('<h3>' + t`New name:` + '</h3>', POPUP_TYPE.INPUT, characters[this_chid].name);

    if (!newValue) {
        toastr.warning(t`No character name provided.`, t`Rename Character`);
        return false;
    }
    if (newValue === characters[this_chid].name) {
        toastr.info(t`Same character name provided, so name did not change.`, t`Rename Character`);
        return false;
    }

    const body = JSON.stringify({ avatar_url: oldAvatar, new_name: newValue });
    const response = await fetch('/api/characters/rename', {
        method: 'POST',
        headers: getRequestHeaders(),
        body,
    });

    try {
        if (response.ok) {
            const data = await response.json();
            const newAvatar = data.avatar;

            const oldName = getCharaFilename(null, { manualAvatarKey: oldAvatar });
            const newName = getCharaFilename(null, { manualAvatarKey: newAvatar });

            // Replace other auxiliary fields where was referenced by avatar key
            // Tag List
            renameTagKey(oldAvatar, newAvatar);

            // Additional lore books
            const charLore = world_info.charLore?.find(x => x.name == oldName);
            if (charLore) {
                charLore.name = newName;
                saveSettingsDebounced();
            }

            // Char-bound Author's Notes
            const charNote = extension_settings.note.chara?.find(x => x.name == oldName);
            if (charNote) {
                charNote.name = newName;
                saveSettingsDebounced();
            }

            // Update active character, if the current one was the currently active one
            if (active_character === oldAvatar) {
                _set_active_character(newAvatar);
                saveSettingsDebounced();
            }

            await eventSource.emit(event_types.CHARACTER_RENAMED, oldAvatar, newAvatar);

            // Unload current character
            setCharacterId(undefined);
            // Reload characters list
            await getCharacters();

            // Find newly renamed character
            const newChId = characters.findIndex(c => c.avatar == data.avatar);

            if (newChId !== -1) {
                // Select the character after the renaming
                await selectCharacterById(newChId);

                // Async delay to update UI
                await delay(1);

                if (this_chid === undefined) {
                    throw new Error('New character not selected');
                }

                // Also rename as a group member
                await renameGroupMember(oldAvatar, newAvatar, newValue.toString());
                const renamePastChatsConfirm = renameChats !== null
                    ? renameChats
                    : silent
                        ? false
                        : await Popup.show.confirm(
                            t`Character renamed!`,
                            `<p>${t`Past chats will still contain the old character name. Would you like to update the character name in previous chats as well?`}</p>
                            <i><b>${t`Sprites folder (if any) should be renamed manually.`}</b></i>`,
                        ) == POPUP_RESULT.AFFIRMATIVE;

                if (renamePastChatsConfirm) {
                    await renamePastChats(oldAvatar, newAvatar, newValue);
                    await reloadCurrentChat();
                    toastr.success(t`Character renamed and past chats updated!`, t`Rename Character`);
                } else {
                    toastr.success(t`Character renamed!`, t`Rename Character`);
                }
            }
            else {
                throw new Error('Newly renamed character was lost?');
            }
        }
        else {
            throw new Error('Could not rename the character');
        }
    }
    catch (error) {
        // Reloading to prevent data corruption
        if (!silent) await Popup.show.text(t`Rename Character`, t`Something went wrong. The page will be reloaded.`);
        else toastr.error(t`Something went wrong. The page will be reloaded.`, t`Rename Character`);

        console.log('Renaming character error:', error);
        location.reload();
        return false;
    }

    return true;
}

async function renamePastChats(oldAvatar, newAvatar, newName) {
    const pastChats = await getPastCharacterChats();

    for (const { file_name } of pastChats) {
        try {
            const fileNameWithoutExtension = file_name.replace('.jsonl', '');
            const getChatResponse = await fetch('/api/chats/get', {
                method: 'POST',
                headers: getRequestHeaders(),
                body: JSON.stringify({
                    ch_name: newName,
                    file_name: fileNameWithoutExtension,
                    avatar_url: newAvatar,
                }),
                cache: 'no-cache',
            });

            if (getChatResponse.ok) {
                const currentChat = await getChatResponse.json();

                for (const message of currentChat) {
                    if (message.is_user || message.is_system || message.extra?.type == system_message_types.NARRATOR) {
                        continue;
                    }

                    if (message.name !== undefined) {
                        message.name = newName;
                    }
                }

                await eventSource.emit(event_types.CHARACTER_RENAMED_IN_PAST_CHAT, currentChat, oldAvatar, newAvatar);

                const saveChatResponse = await fetch('/api/chats/save', {
                    method: 'POST',
                    headers: getRequestHeaders(),
                    body: JSON.stringify({
                        ch_name: newName,
                        file_name: fileNameWithoutExtension,
                        chat: currentChat,
                        avatar_url: newAvatar,
                    }),
                    cache: 'no-cache',
                });

                if (!saveChatResponse.ok) {
                    throw new Error('Could not save chat');
                }
            }
        } catch (error) {
            toastr.error(t`Past chat could not be updated: ${file_name}`);
            console.error(error);
        }
    }
}

/**
 * Processes the avatar image from the input element, allowing the user to crop it if necessary.
 * @param {HTMLInputElement} input - The input element containing the avatar file.
 * @returns {Promise<void>}
 */
export async function read_avatar_load(input) {
    if (input.files && input.files[0]) {
        if (selected_button == 'create') {
            create_save.avatar = input.files;
        }

        crop_data = undefined;
        const file = input.files[0];
        const fileData = await getBase64Async(file);

        if (!power_user.never_resize_avatars) {
            const dlg = new Popup('Set the crop position of the avatar image', POPUP_TYPE.CROP, '', { cropImage: fileData });
            const croppedImage = await dlg.show();

            if (!croppedImage) {
                return;
            }

            crop_data = dlg.cropData;
            $('#avatar_load_preview').attr('src', String(croppedImage));
        } else {
            $('#avatar_load_preview').attr('src', fileData);
        }

        if (menu_type == 'create') {
            return;
        }

        await createOrEditCharacter();
        await delay(DEFAULT_SAVE_EDIT_TIMEOUT);

        const formData = new FormData(/** @type {HTMLFormElement} */($('#form_create').get(0)));
        await fetch(getThumbnailUrl('avatar', formData.get('avatar_url').toString()), {
            method: 'GET',
            cache: 'reload',
        });

        const messages = $('.mes').toArray();
        for (const el of messages) {
            const $el = $(el);
            const nameMatch = $el.attr('ch_name') == formData.get('ch_name');
            if ($el.attr('is_system') == 'true' && !nameMatch) continue;
            if ($el.attr('is_user') == 'true') continue;

            if (nameMatch) {
                const previewSrc = $('#avatar_load_preview').attr('src');
                const avatar = $el.find('.avatar img');
                avatar.attr('src', default_avatar);
                await delay(1);
                avatar.attr('src', previewSrc);
            }
        }

        console.log('Avatar refreshed');
    }
}

export function buildAvatarList(block, entities, { templateId = 'inline_avatar_template', empty = true, interactable = false, highlightFavs = true } = {}) { stTrack('buildAvatarList'); // @st-tracked
    if (empty) {
        block.empty();
    }

    for (const entity of entities) {
        const id = entity.id;

        // Populate the template
        const avatarTemplate = $(`#${templateId} .avatar`).clone();

        let this_avatar = default_avatar;
        if (entity.item.avatar !== undefined && entity.item.avatar != 'none') {
            this_avatar = getThumbnailUrl('avatar', entity.item.avatar);
        }

        avatarTemplate.attr('data-type', entity.type);
        avatarTemplate.attr('data-chid', id);
        avatarTemplate.find('img').attr('src', this_avatar).attr('alt', entity.item.name);
        avatarTemplate.attr('title', `[Character] ${entity.item.name}\nFile: ${entity.item.avatar}`);
        if (highlightFavs) {
            avatarTemplate.toggleClass('is_fav', entity.item.fav || entity.item.fav == 'true');
            avatarTemplate.find('.ch_fav').val(entity.item.fav);
        }

        // If this is a group, we need to hack slightly. We still want to keep most of the css classes and layout, but use a group avatar instead.
        if (entity.type === 'group') {
            const grpTemplate = getGroupAvatar(entity.item);

            avatarTemplate.addClass(grpTemplate.attr('class'));
            avatarTemplate.empty();
            avatarTemplate.append(grpTemplate.children());
            avatarTemplate.attr({ 'data-grid': id, 'data-chid': null });
            avatarTemplate.attr('title', `[Group] ${entity.item.name}`);
        }
        else if (entity.type === 'persona') {
            avatarTemplate.attr({ 'data-pid': id, 'data-chid': null });
            avatarTemplate.find('img').attr('src', getThumbnailUrl('persona', entity.item.avatar));
            avatarTemplate.attr('title', `[Persona] ${entity.item.name}\nFile: ${entity.item.avatar}`);
        }

        if (interactable) {
            avatarTemplate.addClass(INTERACTABLE_CONTROL_CLASS);
            avatarTemplate.toggleClass('character_select', entity.type === 'character');
            avatarTemplate.toggleClass('group_select', entity.type === 'group');
        }

        block.append(avatarTemplate);
    }
}

/**
 * Loads all the data of a shallow character.
 * @param {string|undefined} characterId Array index
 * @returns {Promise<void>} Promise that resolves when the character is unshallowed
 */
export async function unshallowCharacter(characterId) { stTrack('unshallowCharacter'); // @st-tracked
    if (characterId === undefined) {
        console.debug('Undefined character cannot be unshallowed');
        return;
    }

    /** @type {Character} */
    const character = characters[characterId];
    if (!character) {
        console.debug('Character not found:', characterId);
        return;
    }

    // Character is not shallow
    if (!character.shallow) {
        return;
    }

    const avatar = character.avatar;
    if (!avatar) {
        console.debug('Character has no avatar field:', characterId);
        return;
    }

    await getOneCharacter(avatar);
}

/**
 * Fetches the metadata of all past chats related to a specific character based on its avatar URL.
 * The function sends a POST request to the server to retrieve all chats for the character. It then
 * processes the received data, sorts it by the file name, and returns the sorted data.
 *
 * @param {null|number} [characterId=null] - When set, the function will use this character id instead of this_chid.
 *
 * @returns {Promise<Array>} - An array containing metadata of all past chats of the character, sorted
 * in descending order by file name. Returns an empty array if the fetch request is unsuccessful or the
 * response is an object with an `error` property set to `true`.
 */
export async function getPastCharacterChats(characterId = null) { stTrack('getPastCharacterChats'); // @st-tracked
    characterId = characterId ?? parseInt(this_chid);
    if (!characters[characterId]) return [];

    const response = await fetch('/api/characters/chats', {
        method: 'POST',
        body: JSON.stringify({ avatar_url: characters[characterId].avatar }),
        headers: getRequestHeaders(),
    });

    if (!response.ok) {
        return [];
    }

    const data = await response.json();
    if (typeof data === 'object' && data.error === true) {
        return [];
    }

    const chats = Object.values(data);
    return chats.sort((a, b) => a.file_name.localeCompare(b.file_name)).reverse();
}

export function select_rm_info(type, charId, previousCharId = null) { stTrack('select_rm_info'); // @st-tracked
    if (!type) {
        toastr.error(t`Invalid process (no 'type')`);
        return;
    }
    if (type !== 'group_create') {
        var displayName = String(charId).replace('.png', '');
    }

    if (type === 'char_delete') {
        toastr.warning(t`Character Deleted: ${displayName}`);
    }
    if (type === 'char_create') {
        toastr.success(t`Character Created: ${displayName}`);
    }
    if (type === 'group_create') {
        toastr.success(t`Group Created`);
    }
    if (type === 'group_delete') {
        toastr.warning(t`Group Deleted`);
    }

    if (type === 'char_import') {
        toastr.success(t`Character Imported: ${displayName}`);
    }

    _selectRightMenuWithAnimation('rm_characters_block');

    // Set a timeout so multiple flashes don't overlap
    clearTimeout(importFlashTimeout);
    importFlashTimeout = setTimeout(function () {
        if (type === 'char_import' || type === 'char_create' || type === 'char_import_no_toast') {
            // Find the page at which the character is located
            const avatarFileName = charId;
            const charData = getEntitiesList({ doFilter: true });
            const charIndex = charData.findIndex((x) => x?.item?.avatar?.startsWith(avatarFileName));

            if (charIndex === -1) {
                console.log(`Could not find character ${charId} in the list`);
                return;
            }

            try {
                const perPage = Number(accountStorage.getItem('Characters_PerPage')) || per_page_default;
                const page = Math.floor(charIndex / perPage) + 1;
                const selector = `#rm_print_characters_block [title*="${avatarFileName}"]`;
                $('#rm_print_characters_pagination').pagination('go', page);

                waitUntilCondition(() => document.querySelector(selector) !== null).then(() => {
                    const element = $(selector).parent();

                    if (element.length === 0) {
                        console.log(`Could not find element for character ${charId}`);
                        return;
                    }

                    const scrollOffset = element.offset().top - element.parent().offset().top;
                    element.parent().scrollTop(scrollOffset);
                    flashHighlight(element, 5000);
                });
            } catch (e) {
                console.error(e);
            }
        }

        if (type === 'group_create') {
            // Find the page at which the character is located
            const charData = getEntitiesList({ doFilter: true });
            const charIndex = charData.findIndex((x) => String(x?.item?.id) === String(charId));

            if (charIndex === -1) {
                console.log(`Could not find group ${charId} in the list`);
                return;
            }

            const perPage = Number(accountStorage.getItem('Characters_PerPage')) || per_page_default;
            const page = Math.floor(charIndex / perPage) + 1;
            $('#rm_print_characters_pagination').pagination('go', page);
            const selector = `#rm_print_characters_block [grid="${charId}"]`;
            try {
                waitUntilCondition(() => document.querySelector(selector) !== null).then(() => {
                    const element = $(selector);
                    const scrollOffset = element.offset().top - element.parent().offset().top;
                    element.parent().scrollTop(scrollOffset);
                    flashHighlight(element, 5000);
                });
            } catch (e) {
                console.error(e);
            }
        }
    }, 250);

    if (previousCharId) {
        const newId = characters.findIndex((x) => x.avatar == previousCharId);
        if (newId >= 0) {
            setCharacterId(newId);
        }
    }
}

/**
 * Selects the right menu for displaying the character editor.
 * @param {string} chid Character array index
 * @param {object} [param1] Options for the switch
 * @param {boolean} [param1.switchMenu=true] Whether to switch the menu
 */
export function select_selected_character(chid, { switchMenu = true } = {}) { stTrack('select_selected_character'); // @st-tracked
    //character select
    //console.log('select_selected_character() -- starting with input of -- ' + chid + ' (name:' + characters[chid].name + ')');
    select_rm_create({ switchMenu });
    switchMenu && _setMenuType('character_edit');
    $('#delete_button').css('display', 'flex');
    $('#export_button').css('display', 'flex');

    //create text poles
    $('#rm_button_back').css('display', 'none');
    //$("#character_import_button").css("display", "none");
    $('#create_button').attr('value', 'Save');              // what is the use case for this?
    $('#dupe_button').show();
    $('#create_button_label').css('display', 'none');
    $('#char_connections_button').show();

    // Hide the chat scenario button if we're peeking the group member defs
    $('#set_chat_character_settings').toggle(!selected_group);

    // Don't update the navbar name if we're peeking the group member defs
    if (!selected_group) {
        $('#rm_button_selected_ch').children('h2').text(characters[chid].name);
    }

    $('#add_avatar_button').val('');

    $('#character_popup-button-h3').text(characters[chid].name);
    $('#character_name_pole').val(characters[chid].name);
    $('#description_textarea').val(characters[chid].description);
    $('#character_world').val(characters[chid].data?.extensions?.world || '');
    $('#creator_notes_textarea').val(characters[chid].data?.creator_notes || characters[chid].creatorcomment);
    $('#creator_notes_spoiler').html(formatCreatorNotes(characters[chid].data?.creator_notes || characters[chid].creatorcomment, characters[chid].avatar));
    $('#character_version_textarea').val(characters[chid].data?.character_version || '');
    $('#system_prompt_textarea').val(characters[chid].data?.system_prompt || '');
    $('#post_history_instructions_textarea').val(characters[chid].data?.post_history_instructions || '');
    $('#tags_textarea').val(Array.isArray(characters[chid].data?.tags) ? characters[chid].data.tags.join(', ') : '');
    $('#creator_textarea').val(characters[chid].data?.creator);
    $('#character_version_textarea').val(characters[chid].data?.character_version || '');
    $('#personality_textarea').val(characters[chid].personality);
    $('#firstmessage_textarea').val(characters[chid].first_mes);
    $('#scenario_pole').val(characters[chid].scenario);
    $('#depth_prompt_prompt').val(characters[chid].data?.extensions?.depth_prompt?.prompt ?? '');
    $('#depth_prompt_depth').val(characters[chid].data?.extensions?.depth_prompt?.depth ?? depth_prompt_depth_default);
    $('#depth_prompt_role').val(characters[chid].data?.extensions?.depth_prompt?.role ?? depth_prompt_role_default);
    $('#talkativeness_slider').val(characters[chid].talkativeness || talkativeness_default);
    $('#mes_example_textarea').val(characters[chid].mes_example);
    $('#selected_chat_pole').val(characters[chid].chat);
    $('#create_date_pole').val(timestampToMoment(characters[chid].create_date).toISOString());
    $('#avatar_url_pole').val(characters[chid].avatar);
    $('#chat_import_avatar_url').val(characters[chid].avatar);
    $('#chat_import_character_name').val(characters[chid].name);
    $('#character_json_data').val(characters[chid].json_data);

    updateFavButtonState(characters[chid].fav || characters[chid].fav == 'true');

    const avatarUrl = characters[chid].avatar != 'none' ? getThumbnailUrl('avatar', characters[chid].avatar) : default_avatar;
    $('#avatar_load_preview').attr('src', avatarUrl);
    $('.open_alternate_greetings').data('chid', chid);
    $('#set_character_world').data('chid', chid);
    setWorldInfoButtonClass(chid);
    checkEmbeddedWorld(chid);

    $('#name_div').removeClass('displayBlock');
    $('#name_div').addClass('displayNone');
    $('#renameCharButton').css('display', '');

    $('#form_create').attr('actiontype', 'editcharacter');
    $('.form_create_bottom_buttons_block .chat_lorebook_button').show();

    const externalMediaState = isExternalMediaAllowed();
    $('#character_open_media_overrides').toggle(!selected_group);
    $('#character_media_allowed_icon').toggle(externalMediaState);
    $('#character_media_forbidden_icon').toggle(!externalMediaState);

    // Update some stuff about the char management dropdown
    $('#character_source').attr('disabled', !getCharacterSource(chid) ? '' : null);

    eventSource.emit(event_types.CHARACTER_EDITOR_OPENED, chid);

    saveSettingsDebounced();
}

/**
 * Selects the right menu for creating a new character.
 * @param {object} [options] Options for the switch
 * @param {boolean} [options.switchMenu=true] Whether to switch the menu
 */
export function select_rm_create({ switchMenu = true } = {}) {
    switchMenu && _setMenuType('create');

    //console.log('select_rm_Create() -- selected button: '+selected_button);
    if (selected_button == 'create' && create_save.avatar) {
        const addAvatarInput = /** @type {HTMLInputElement} */ ($('#add_avatar_button').get(0));
        addAvatarInput.files = create_save.avatar;
        read_avatar_load(addAvatarInput);
    }

    switchMenu && _selectRightMenuWithAnimation('rm_ch_create_block');

    $('#set_chat_character_settings').hide();
    $('#delete_button_div').css('display', 'none');
    $('#delete_button').css('display', 'none');
    $('#export_button').css('display', 'none');
    $('#create_button_label').css('display', '');
    $('#create_button').attr('value', 'Create');
    $('#dupe_button').hide();
    $('#char_connections_button').hide();

    //create text poles
    $('#rm_button_back').css('display', '');
    $('#character_import_button').css('display', '');
    $('#character_popup-button-h3').text('Create character');
    $('#character_name_pole').val(create_save.name);
    $('#description_textarea').val(create_save.description);
    $('#character_world').val(create_save.world);
    $('#creator_notes_textarea').val(create_save.creator_notes);
    $('#creator_notes_spoiler').html(formatCreatorNotes(create_save.creator_notes, ''));
    $('#post_history_instructions_textarea').val(create_save.post_history_instructions);
    $('#system_prompt_textarea').val(create_save.system_prompt);
    $('#tags_textarea').val(create_save.tags);
    $('#creator_textarea').val(create_save.creator);
    $('#character_version_textarea').val(create_save.character_version);
    $('#personality_textarea').val(create_save.personality);
    $('#firstmessage_textarea').val(create_save.first_message);
    $('#talkativeness_slider').val(create_save.talkativeness);
    $('#scenario_pole').val(create_save.scenario);
    $('#depth_prompt_prompt').val(create_save.depth_prompt_prompt);
    $('#depth_prompt_depth').val(create_save.depth_prompt_depth);
    $('#depth_prompt_role').val(create_save.depth_prompt_role);
    $('#mes_example_textarea').val(create_save.mes_example);
    $('#character_json_data').val('');
    $('#avatar_div').css('display', 'flex');
    $('#avatar_load_preview').attr('src', default_avatar);
    $('#renameCharButton').css('display', 'none');
    $('#name_div').removeClass('displayNone');
    $('#name_div').addClass('displayBlock');
    $('.open_alternate_greetings').data('chid', -1);
    $('#set_character_world').data('chid', -1);
    setWorldInfoButtonClass(undefined, !!create_save.world);
    updateFavButtonState(false);
    checkEmbeddedWorld();

    $('#form_create').attr('actiontype', 'createcharacter');
    $('.form_create_bottom_buttons_block .chat_lorebook_button').hide();
    $('#character_open_media_overrides').hide();
}

/**
 * Updates the state of the favorite button based on the provided state.
 * @param {boolean} state Whether the favorite button should be on or off.
 */
export function updateFavButtonState(state) {
    // Update global state of the flag
    // TODO: This is bad and needs to be refactored.
    fav_ch_checked = state;
    $('#fav_checkbox').prop('checked', state);
    $('#favorite_button').toggleClass('fav_on', state);
    $('#favorite_button').toggleClass('fav_off', !state);
}

function updateAlternateGreetingsHintVisibility(root) {
    const numberOfGreetings = root.find('.alternate_greetings_list .alternate_greeting').length;
    $(root).find('.alternate_grettings_hint').toggle(numberOfGreetings == 0);
}

export async function openCharacterWorldPopup() {
    const chid = $('#set_character_world').data('chid');
    if (menu_type != 'create' && chid === undefined) {
        toastr.error('Does not have an Id for this character in world select menu.');
        return;
    }

    // TODO: Maybe make this utility function not use the window context?
    const fileName = getCharaFilename(chid);
    const charName = (menu_type == 'create' ? create_save.name : characters[chid]?.data?.name) || 'Nameless';
    const worldId = (menu_type == 'create' ? create_save.world : characters[chid]?.data?.extensions?.world) || '';
    const template = $('#character_world_template .character_world').clone();
    template.find('.character_name').text(charName);

    // --- Event Handlers ---
    async function handlePrimaryWorldSelect() {
        const selectedValue = $(this).val();
        const worldIndex = selectedValue !== '' ? Number(selectedValue) : NaN;
        const name = !isNaN(worldIndex) ? world_names[worldIndex] : '';
        await charUpdatePrimaryWorld(name);
    }

    function handleExtrasWorldSelect(evt) {
        const el = evt?.currentTarget ?? this;
        const selectedValues = $(el).val();
        const selected = Array.isArray(selectedValues) ? selectedValues : [];
        const fileName = getCharaFilename(null, {});
        const nextList = selected.map(i => world_names[i]).filter(Boolean);
        charSetAuxWorlds(fileName, nextList);
    }

    // --- Populate Dropdowns ---
    // Append to primary dropdown.
    const primarySelect = template.find('.character_world_info_selector');
    world_names.forEach((item, i) => {
        primarySelect.append(new Option(item, String(i), item === worldId, item === worldId));
    });

    // Append to extras dropdown.
    const extrasSelect = template.find('.character_extra_world_info_selector');
    const existingCharLore = world_info.charLore?.find((e) => e.name === fileName);
    world_names.forEach((item, i) => {
        const array = (menu_type == 'create' ? create_save.extra_books : existingCharLore?.extraBooks);
        const isSelected = !!array?.includes(item);
        extrasSelect.append(new Option(item, String(i), isSelected, isSelected));
    });

    const popup = new Popup(template, POPUP_TYPE.TEXT, '', {
        onOpen: function (popup) {
            const popupDialog = $(popup.dlg);

            primarySelect.on('change', handlePrimaryWorldSelect);
            extrasSelect.on('change', handleExtrasWorldSelect);

            // Not needed on mobile.
            if (!isMobile()) {
                extrasSelect.select2({
                    width: '100%',
                    placeholder: t`No auxiliary Lorebooks set. Click here to select.`,
                    allowClear: true,
                    closeOnSelect: false,
                    dropdownParent: popupDialog,
                });
            }
        },
    });

    await popup.show();
}

export function openAlternateGreetings() {
    const chid = $('.open_alternate_greetings').data('chid');

    if (menu_type != 'create' && chid === undefined) {
        toastr.error('Does not have an Id for this character in editor menu.');
        return;
    } else {
        // If the character does not have alternate greetings, create an empty array
        if (characters[chid] && !Array.isArray(characters[chid].data.alternate_greetings)) {
            characters[chid].data.alternate_greetings = [];
        }
    }

    const template = $('#alternate_greetings_template .alternate_grettings').clone();
    const getArray = () => menu_type == 'create' ? create_save.alternate_greetings : characters[chid].data.alternate_greetings;
    const popup = new Popup(template, POPUP_TYPE.TEXT, '', {
        wide: true,
        large: true,
        allowVerticalScrolling: true,
        onClose: async () => {
            if (menu_type !== 'create') {
                await createOrEditCharacter();
            }
        },
    });

    for (let index = 0; index < getArray().length; index++) {
        addAlternateGreeting(template, getArray()[index], index, getArray, popup);
    }

    template.find('.add_alternate_greeting').on('click', function () {
        const array = getArray();
        const index = array.length;
        array.push('');
        addAlternateGreeting(template, '', index, getArray, popup);
        updateAlternateGreetingsHintVisibility(template);
        const list = template.find('.alternate_greetings_list');
        list.scrollTop(list.prop('scrollHeight'));
    });

    popup.show();
    updateAlternateGreetingsHintVisibility(template);
}

/**
 * Adds an alternate greeting to the template.
 * @param {JQuery<HTMLElement>} template
 * @param {string} greeting
 * @param {number} index
 * @param {() => any[]} getArray
 * @param {Popup} popup
 */
function addAlternateGreeting(template, greeting, index, getArray, popup) {
    const greetingBlock = $('#alternate_greeting_form_template .alternate_greeting').clone();
    greetingBlock.attr('data-index', index);
    greetingBlock.find('.alternate_greeting_text')
        .attr('id', `alternate_greeting_${index}`)
        .on('input', async function () {
            const value = $(this).val();
            const array = getArray();
            array[index] = value;
        }).val(greeting);
    greetingBlock.find('.editor_maximize').attr('data-for', `alternate_greeting_${index}`);
    greetingBlock.find('.greeting_index').text(index + 1);
    greetingBlock.find('.delete_alternate_greeting').on('click', async function (event) {
        event.preventDefault();
        event.stopPropagation();

        const confirm = await callGenericPopup(t`Are you sure you want to delete this alternate greeting?`, POPUP_TYPE.CONFIRM);
        if (!confirm) {
            return;
        }

        const array = getArray();
        array.splice(index, 1);

        // We need to reopen the popup to update the index numbers
        await popup.complete(POPUP_RESULT.AFFIRMATIVE);
        openAlternateGreetings();
    });
    greetingBlock.find('.move_up_alternate_greeting').on('click', function (event) {
        handleMoveAlternateGreeting(event, -1);
    });
    greetingBlock.find('.move_down_alternate_greeting').on('click', function (event) {
        handleMoveAlternateGreeting(event, 1);
    });

    /**
     * Handles moving an alternate greeting up or down in the list.
     * @param {JQuery.ClickEvent} event - The click event
     * @param {number} direction - Direction to move: -1 for up, 1 for down
     */
    function handleMoveAlternateGreeting(event, direction) {
        event.preventDefault();
        event.stopPropagation();

        const array = getArray();
        const index = Number(greetingBlock.attr('data-index'));
        const newIndex = index + direction;

        // Check bounds
        if (direction === -1 && index <= 0) {
            return;
        }
        if (direction === 1 && index >= array.length - 1) {
            return;
        }

        // Swap the greetings
        [array[index], array[newIndex]] = [array[newIndex], array[index]];

        // Update current greeting
        greetingBlock.find('.alternate_greeting_text').val(array[index]);

        // Update adjacent greeting
        const adjacentGreetingBlock = template.find(`.alternate_greeting[data-index="${newIndex}"]`);
        adjacentGreetingBlock.find('.alternate_greeting_text').val(array[newIndex]);
    }

    template.find('.alternate_greetings_list').append(greetingBlock);
}

/**
 * Creates or edits a character based on the form data.
 * @param {Event} [e] Event that triggered the function call.
 */
export async function createOrEditCharacter(e) { stTrack('createOrEditCharacter'); // @st-tracked
    if (!settingsReady) {
        console.warn('Settings not ready, aborting character creation/editing.');
        return;
    }

    $('#rm_info_avatar').html('');
    const formData = new FormData(/** @type {HTMLFormElement} */($('#form_create').get(0)));
    formData.set('fav', String(fav_ch_checked));
    const isNewChat = e instanceof CustomEvent && e.type === 'newChat';

    const rawFile = formData.get('avatar');
    if (rawFile instanceof File) {
        const convertedFile = await ensureImageFormatSupported(rawFile);
        formData.set('avatar', convertedFile);
    }

    const headers = getRequestHeaders({ omitContentType: true });

    if ($('#form_create').attr('actiontype') == 'createcharacter') {
        if (String($('#character_name_pole').val()).length === 0) {
            toastr.error(t`Name is required`);
            return;
        }
        if (is_group_generating || is_send_press) {
            toastr.error(t`Cannot create characters while generating. Stop the request and try again.`, t`Creation aborted`);
            return;
        }
        try {
            //if the character name text area isn't empty (only posible when creating a new character)
            let url = '/api/characters/create';

            if (crop_data != undefined) {
                url += `?crop=${encodeURIComponent(JSON.stringify(crop_data))}`;
            }

            formData.delete('alternate_greetings');
            for (const value of create_save.alternate_greetings) {
                formData.append('alternate_greetings', value);
            }

            formData.append('extensions', JSON.stringify(create_save.extensions));

            const fetchResult = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: formData,
                cache: 'no-cache',
            });

            if (!fetchResult.ok) {
                throw new Error('Fetch result is not ok');
            }

            const avatarId = await fetchResult.text();

            $('#character_cross').trigger('click'); //closes the advanced character editing popup
            const fields = [
                { id: '#character_name_pole', callback: value => create_save.name = value },
                { id: '#description_textarea', callback: value => create_save.description = value },
                { id: '#creator_notes_textarea', callback: value => create_save.creator_notes = value },
                { id: '#character_version_textarea', callback: value => create_save.character_version = value },
                { id: '#post_history_instructions_textarea', callback: value => create_save.post_history_instructions = value },
                { id: '#system_prompt_textarea', callback: value => create_save.system_prompt = value },
                { id: '#tags_textarea', callback: value => create_save.tags = value },
                { id: '#creator_textarea', callback: value => create_save.creator = value },
                { id: '#personality_textarea', callback: value => create_save.personality = value },
                { id: '#firstmessage_textarea', callback: value => create_save.first_message = value },
                { id: '#talkativeness_slider', callback: value => create_save.talkativeness = value, defaultValue: talkativeness_default },
                { id: '#scenario_pole', callback: value => create_save.scenario = value },
                { id: '#depth_prompt_prompt', callback: value => create_save.depth_prompt_prompt = value },
                { id: '#depth_prompt_depth', callback: value => create_save.depth_prompt_depth = value, defaultValue: depth_prompt_depth_default },
                { id: '#depth_prompt_role', callback: value => create_save.depth_prompt_role = value, defaultValue: depth_prompt_role_default },
                { id: '#mes_example_textarea', callback: value => create_save.mes_example = value },
                { id: '#character_json_data', callback: () => { } },
                { id: '#alternate_greetings_template', callback: value => create_save.alternate_greetings = value, defaultValue: [] },
                { id: '#character_world', callback: value => create_save.world = value },
                { id: '#_character_extensions_fake', callback: value => create_save.extensions = {} },
            ];

            fields.forEach(field => {
                const fieldValue = field.defaultValue !== undefined ? field.defaultValue : '';
                $(field.id).val(fieldValue);
                field.callback && field.callback(fieldValue);
            });

            if (Array.isArray(create_save.extra_books) && create_save.extra_books.length > 0) {
                const fileName = getCharaFilename(null, { manualAvatarKey: avatarId });
                const charLore = world_info.charLore ?? [];
                charLore.push({ name: fileName, extraBooks: create_save.extra_books });
                Object.assign(world_info, { charLore: charLore });
                saveSettingsDebounced();
            }
            create_save.extra_books = [];

            $('#character_popup-button-h3').text('Create character');

            create_save.avatar = null;

            $('#add_avatar_button').replaceWith(
                $('#add_avatar_button').val('').clone(true),
            );

            let oldSelectedChar = null;
            if (this_chid !== undefined) {
                oldSelectedChar = characters[this_chid].avatar;
            }

            console.log(`new avatar id: ${avatarId}`);
            createTagMapFromList('#tagList', avatarId);
            await getCharacters();

            select_rm_info('char_create', avatarId, oldSelectedChar);

            crop_data = undefined;

        } catch (error) {
            console.error('Error creating character', error);
            toastr.error(t`Failed to create character`);
        }
    } else {
        try {
            let url = '/api/characters/edit';

            if (crop_data != undefined) {
                url += `?crop=${encodeURIComponent(JSON.stringify(crop_data))}`;
            }

            formData.delete('alternate_greetings');
            const chid = $('.open_alternate_greetings').data('chid');
            if (characters[chid] && Array.isArray(characters[chid]?.data?.alternate_greetings)) {
                for (const value of characters[chid].data.alternate_greetings) {
                    formData.append('alternate_greetings', value);
                }
            }

            const fetchResult = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: formData,
                cache: 'no-cache',
            });

            if (!fetchResult.ok) {
                throw new Error('Fetch result is not ok');
            }

            await getOneCharacter(formData.get('avatar_url'));
            favsToHotswap(); // Update fav state

            $('#add_avatar_button').replaceWith(
                $('#add_avatar_button').val('').clone(true),
            );
            $('#create_button').attr('value', 'Save');
            crop_data = undefined;
            await eventSource.emit(event_types.CHARACTER_EDITED, { detail: { id: this_chid, character: characters[this_chid] } });

            // Recreate the chat if it hasn't been used at least once (i.e. with continue).
            const message = _getFirstMessage();
            const shouldRegenerateMessage =
                !isNewChat &&
                message.mes &&
                !selected_group &&
                !chat_metadata.tainted &&
                (chat.length === 0 || (chat.length === 1 && !chat[0].is_user && !chat[0].is_system));

            if (shouldRegenerateMessage) {
                chat.splice(0, chat.length, message);
                const messageId = (chat.length - 1);
                await eventSource.emit(event_types.MESSAGE_RECEIVED, messageId, 'first_message');
                await clearChat();
                await printMessages();
                await eventSource.emit(event_types.CHARACTER_MESSAGE_RENDERED, messageId, 'first_message');
                await saveChatConditional();
            }
        } catch (error) {
            console.log(error);
            toastr.error(t`Something went wrong while saving the character, or the image file provided was in an invalid format. Double check that the image is not a webp.`);
        }
    }
}

/**
 * Imports supported files dropped into the app window.
 * @param {File[]} files Array of files to process
 * @param {Map<File, string>} [data] Extra data to pass to the import function
 * @returns {Promise<void>}
 */
export async function processDroppedFiles(files, data = new Map()) { stTrack('processDroppedFiles'); // @st-tracked
    const allowedMimeTypes = [
        'application/json',
        'image/png',
        'application/yaml',
        'application/x-yaml',
        'text/yaml',
        'text/x-yaml',
    ];

    const allowedExtensions = [
        'charx',
        'byaf',
    ];

    const avatarFileNames = [];
    for (const file of files) {
        const extension = file.name.split('.').pop().toLowerCase();
        if (allowedMimeTypes.some(x => file.type.startsWith(x)) || allowedExtensions.includes(extension)) {
            const preservedName = data instanceof Map && data.get(file);
            const avatarFileName = await importCharacter(file, { preserveFileName: preservedName });
            if (avatarFileName !== undefined) {
                avatarFileNames.push(avatarFileName);
            }
        } else {
            toastr.warning(t`Unsupported file type: ` + file.name);
        }
    }

    if (avatarFileNames.length > 0) {
        await importCharactersTags(avatarFileNames);
        selectImportedChar(avatarFileNames[avatarFileNames.length - 1]);
    }
}

/**
 * Imports tags for the given characters
 * @param {string[]} avatarFileNames character avatar filenames whose tags are to import
 */
export async function importCharactersTags(avatarFileNames) {
    await getCharacters();
    for (let i = 0; i < avatarFileNames.length; i++) {
        if (power_user.tag_import_setting !== tag_import_setting.NONE) {
            const importedCharacter = characters.find(character => character.avatar === avatarFileNames[i]);
            await importTags(importedCharacter);
        }
    }
}

/**
 * Selects the given imported char
 * @param {string} charId char to select
 */
export function selectImportedChar(charId) {
    let oldSelectedChar = null;
    if (this_chid !== undefined) {
        oldSelectedChar = characters[this_chid].avatar;
    }
    select_rm_info('char_import_no_toast', charId, oldSelectedChar);
}

/**
 * Imports a character from a file.
 * @param {File} file File to import
 * @param {object} [options] - Options
 * @param {string} [options.preserveFileName] Whether to preserve original file name
 * @param {Boolean} [options.importTags=false] Whether to import tags
 * @returns {Promise<string>}
 */
export async function importCharacter(file, { preserveFileName = '', importTags = false } = {}) {
    if (is_group_generating || is_send_press) {
        toastr.error(t`Cannot import characters while generating. Stop the request and try again.`, t`Import aborted`);
        throw new Error('Cannot import character while generating');
    }

    const ext = file.name.match(/\.(\w+)$/);
    if (!ext || !(['json', 'png', 'yaml', 'yml', 'charx', 'byaf'].includes(ext[1].toLowerCase()))) {
        return;
    }

    const exists = preserveFileName ? characters.find(character => character.avatar === preserveFileName) : undefined;

    const format = ext[1].toLowerCase();
    $('#character_import_file_type').val(format);
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('file_type', format);
    formData.append('user_name', name1);
    if (preserveFileName) formData.append('preserved_name', preserveFileName);

    try {
        const result = await fetch('/api/characters/import', {
            method: 'POST',
            body: formData,
            headers: getRequestHeaders({ omitContentType: true }),
            cache: 'no-cache',
        });

        if (!result.ok) {
            throw new Error(`Failed to import character: ${result.statusText}`);
        }

        const data = await result.json();

        if (data.error) {
            throw new Error(`Server returned an error: ${data.error}`);
        }

        if (data.file_name !== undefined) {
            let avatarFileName = `${data.file_name}.png`;

            // Refresh existing thumbnail
            if (exists && this_chid !== undefined) {
                await fetch(getThumbnailUrl('avatar', avatarFileName), { cache: 'reload' });
            }

            $('#character_search_bar').val('').trigger('input');

            if (exists) {
                toastr.success(t`Character Replaced: ${String(data.file_name).replace('.png', '')}`);
            } else {
                toastr.success(t`Character Created: ${String(data.file_name).replace('.png', '')}`);
            }
            if (importTags) {
                await importCharactersTags([avatarFileName]);
                selectImportedChar(data.file_name);
            }
            return avatarFileName;
        }
    } catch (error) {
        console.error('Error importing character', error);
        toastr.error(t`The file is likely invalid or corrupted.`, t`Could not import character`);
    }
}

export async function importFromURL(items, files) {
    for (const item of items) {
        if (item.type === 'text/uri-list') {
            const uriList = await new Promise((resolve) => {
                item.getAsString((uriList) => { resolve(uriList); });
            });
            const uris = uriList.split('\n').filter(uri => uri.trim() !== '');
            try {
                for (const uri of uris) {
                    const request = await fetch(uri);
                    const data = await request.blob();
                    const fileName = request.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || uri.split('/').pop() || 'file.png';
                    const file = new File([data], fileName, { type: data.type });
                    files.push(file);
                }
            } catch (error) {
                console.error('Failed to import from URL', error);
            }
        }
    }
}

export function doCharListDisplaySwitch() {
    power_user.charListGrid = !power_user.charListGrid;
    document.body.classList.toggle('charListGrid', power_user.charListGrid);
    saveSettingsDebounced();
}

/**
 * Function to handle the deletion of a character, given a specific popup type and character ID.
 * If popup type equals "del_ch", it will proceed with deletion otherwise it will exit the function.
 * It fetches the delete character route, sending necessary parameters, and in case of success,
 * it proceeds to delete character from UI and saves settings.
 * In case of error during the fetch request, it logs the error details.
 *
 * @param {string} this_chid - The character ID to be deleted.
 * @param {boolean} delete_chats - Whether to delete chats or not.
 */
export async function handleDeleteCharacter(this_chid, delete_chats) { stTrack('handleDeleteCharacter'); // @st-tracked
    if (!characters[this_chid]) {
        return;
    }

    await deleteCharacter(characters[this_chid].avatar, { deleteChats: delete_chats });
}

/**
 * Deletes a character completely, including associated chats if specified
 *
 * @param {string|string[]} characterKey - The key (avatar) of the character to be deleted
 * @param {Object} [options] - Optional parameters for the deletion
 * @param {boolean} [options.deleteChats=true] - Whether to delete associated chats or not
 * @return {Promise<void>} - A promise that resolves when the character is successfully deleted
 */
export async function deleteCharacter(characterKey, { deleteChats = true } = {}) { stTrack('deleteCharacter'); // @st-tracked
    if (!Array.isArray(characterKey)) {
        characterKey = [characterKey];
    }

    const inTempChat = this_chid === undefined && name2 === neutralCharacterName;
    if (inTempChat) {
        const confirmClose = await Popup.show.confirm(
            t`You are currently in a temporary chat.`,
            t`Deleting this character will close the chat and you will lose any unsaved messages. Do you want to proceed?`,
        );
        if (!confirmClose) {
            return;
        }
    }

    const closeChatResult = await closeCurrentChat();
    if (!closeChatResult) {
        return;
    }

    for (const key of characterKey) {
        const character = characters.find(x => x.avatar == key);
        if (!character) {
            toastr.warning(t`Character ${key} not found. Skipping deletion.`);
            continue;
        }

        const chid = characters.indexOf(character);
        const pastChats = await getPastCharacterChats(chid);

        const msg = { avatar_url: character.avatar, delete_chats: deleteChats };

        const response = await fetch('/api/characters/delete', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify(msg),
            cache: 'no-cache',
        });

        if (!response.ok) {
            toastr.error(`${response.status} ${response.statusText}`, t`Failed to delete character`);
            continue;
        }

        accountStorage.removeItem(`AlertWI_${character.avatar}`);
        accountStorage.removeItem(`AlertRegex_${character.avatar}`);
        accountStorage.removeItem(`mediaWarningShown:${character.avatar}`);
        delete tag_map[character.avatar];
        select_rm_info('char_delete', character.name);

        if (deleteChats) {
            for (const chat of pastChats) {
                const name = chat.file_name.replace('.jsonl', '');
                await eventSource.emit(event_types.CHAT_DELETED, name);
            }
        }

        await eventSource.emit(event_types.CHARACTER_DELETED, { id: chid, character: character });
    }

    await removeCharacterFromUI();
}

/**
 * Function to delete a character from UI after character deletion API success.
 * It manages necessary UI changes such as closing advanced editing popup, unsetting
 * character ID, resetting characters array and chat metadata, deselecting character's tab
 * panel, removing character name from navigation tabs, clearing chat, fetching updated list of characters.
 * It also ensures to save the settings after all the operations.
 */
async function removeCharacterFromUI() {
    preserveNeutralChat();
    await clearChat();
    $('#character_cross').trigger('click');
    resetChatState();
    $(document.getElementById('rm_button_selected_ch')).children('h2').text('');
    restoreNeutralChat();
    await getCharacters();
    await printMessages();
    saveSettingsDebounced();
    await eventSource.emit(event_types.CHAT_CHANGED, getCurrentChatId());
}

/**
 * Creates a new assistant chat.
 * @param {object} params - Parameters for the new assistant chat
 * @param {boolean} [params.temporary=false] I need a temporary secretary
 * @returns {Promise<void>} - A promise that resolves when the new assistant chat is created
 */
export async function newAssistantChat({ temporary = false } = {}) { stTrack('newAssistantChat'); // @st-tracked
    await clearChat();
    if (!temporary) {
        return openPermanentAssistantChat();
    }
    chat.splice(0, chat.length);
    _set_chat_metadata({});
    setCharacterName(neutralCharacterName);
    sendSystemMessage(system_message_types.ASSISTANT_NOTE);
}

function initCharacterSearch() {
    const debouncedCharacterSearch = debounce((searchQuery) => {
        entitiesFilter.setFilterData(FILTER_TYPES.SEARCH, searchQuery);
    });

    const searchForm = $('#form_character_search_form');
    const searchInput = $('#character_search_bar');
    const searchButton = $('#rm_button_search');

    const storageKey = 'characterSearchFormVisible';

    searchInput.on('input', function () {
        const searchQuery = String($(this).val());
        debouncedCharacterSearch(searchQuery);
    });

    searchButton.on('click', function () {
        const newVisibility = !searchForm.is(':visible');
        searchForm.toggle(newVisibility);
        searchButton.toggleClass('active', newVisibility);
        accountStorage.setItem(storageKey, String(newVisibility));
        if (newVisibility) {
            searchInput.trigger('focus');
        }
    });

    eventSource.on(event_types.APP_READY, () => {
        const isVisible = accountStorage.getItem(storageKey) === 'true';
        searchForm.toggle(isVisible);
        searchButton.toggleClass('active', isVisible);
    });
}
