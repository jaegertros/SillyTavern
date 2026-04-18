import { track as stTrack } from './scripts/dev/tracker.js'; // @st-tracker
import {
    showdown,
    moment,
    DOMPurify,
    hljs,
    Handlebars,
    SVGInject,
    Popper,
    initLibraryShims,
    default as libs,
    lodash,
} from './lib.js';

import { humanizedDateTime, favsToHotswap, getMessageTimeStamp, dragElement, isMobile, initRossMods } from './scripts/RossAscends-mods.js';
import { userStatsHandler, statMesProcess, initStats } from './scripts/stats.js';
import {
    generateKoboldWithStreaming,
    kai_settings,
    loadKoboldSettings,
    getKoboldGenerationData,
    kai_flags,
    koboldai_settings,
    koboldai_setting_names,
    initKoboldSettings,
} from './scripts/kai-settings.js';

import {
    textgenerationwebui_settings as textgen_settings,
    loadTextGenSettings,
    generateTextGenWithStreaming,
    getTextGenGenerationData,
    textgen_types,
    parseTextgenLogprobs,
    parseTabbyLogprobs,
    initTextGenSettings,
} from './scripts/textgen-settings.js';

import {
    world_info,
    getWorldInfoPrompt,
    getWorldInfoSettings,
    setWorldInfoSettings,
    world_names,
    importEmbeddedWorldInfo,
    checkEmbeddedWorld,
    setWorldInfoButtonClass,
    wi_anchor_position,
    world_info_include_names,
    initWorldInfo,
    charUpdatePrimaryWorld,
    charSetAuxWorlds,
} from './scripts/world-info.js';

import {
    groups,
    selected_group,
    saveGroupChat,
    getGroups,
    generateGroupWrapper,
    is_group_generating,
    resetSelectedGroup,
    select_group_chats,
    regenerateGroup,
    group_generation_id,
    getGroupChat,
    renameGroupMember,
    createNewGroupChat,
    getGroupAvatar,
    deleteGroupChat,
    renameGroupChat,
    importGroupChat,
    getGroupBlock,
    getGroupCharacterCardsLazy,
    getGroupDepthPrompts,
} from './scripts/group-chats.js';

import {
    collapseNewlines,
    loadPowerUserSettings,
    playMessageSound,
    fixMarkdown,
    power_user,
    persona_description_positions,
    loadMovingUIState,
    getCustomStoppingStrings,
    MAX_CONTEXT_DEFAULT,
    MAX_RESPONSE_DEFAULT,
    renderStoryString,
    sortEntitiesList,
    registerDebugFunction,
    flushEphemeralStoppingStrings,
    resetMovableStyles,
    forceCharacterEditorTokenize,
    applyPowerUserSettings,
    generatedTextFiltered,
    applyStylePins,
} from './scripts/power-user.js';

import {
    setOpenAIMessageExamples,
    setOpenAIMessages,
    setupChatCompletionPromptManager,
    prepareOpenAIMessages,
    sendOpenAIRequest,
    loadOpenAISettings,
    oai_settings,
    openai_messages_count,
    chat_completion_sources,
    getChatCompletionModel,
    proxies,
    loadProxyPresets,
    selected_proxy,
    initOpenAI,
} from './scripts/openai.js';

import {
    generateNovelWithStreaming,
    getNovelGenerationData,
    getKayraMaxContextTokens,
    loadNovelSettings,
    nai_settings,
    adjustNovelInstructionPrompt,
    parseNovelAILogprobs,
    novelai_settings,
    novelai_setting_names,
    initNovelAISettings,
} from './scripts/nai-settings.js';

import {
    initBookmarks,
    showBookmarksButtons,
    updateBookmarkDisplay,
} from './scripts/bookmarks.js';

import {
    horde_settings,
    loadHordeSettings,
    generateHorde,
    getStatusHorde,
    getHordeModels,
    adjustHordeGenerationParams,
    isHordeGenerationNotAllowed,
    MIN_LENGTH,
    initHorde,
} from './scripts/horde.js';

import {
    debounce,
    delay,
    trimToEndSentence,
    countOccurrences,
    isOdd,
    sortMoments,
    timestampToMoment,
    download,
    isDataURL,
    getCharaFilename,
    PAGINATION_TEMPLATE,
    waitUntilCondition,
    escapeRegex,
    resetScrollHeight,
    onlyUnique,
    getBase64Async,
    humanFileSize,
    Stopwatch,
    isValidUrl,
    ensureImageFormatSupported,
    flashHighlight,
    toggleDrawer,
    isElementInViewport,
    copyText,
    escapeHtml,
    saveBase64AsFile,
    uuidv4,
    equalsIgnoreCaseAndAccents,
    localizePagination,
    renderPaginationDropdown,
    paginationDropdownChangeHandler,
    importFromExternalUrl,
    shiftUpByOne,
    shiftDownByOne,
    canUseNegativeLookbehind,
    trimSpaces,
    clamp,
    shakeElement,
    createTimeout,
} from './scripts/utils.js';
import { debounce_timeout, GENERATION_TYPE_TRIGGERS, IGNORE_SYMBOL, inject_ids, MEDIA_DISPLAY, MEDIA_SOURCE, MEDIA_TYPE, OVERSWIPE_BEHAVIOR, SCROLL_BEHAVIOR, SWIPE_DIRECTION, SWIPE_SOURCE, SWIPE_STATE } from './scripts/constants.js';

import { cancelDebouncedMetadataSave, doDailyExtensionUpdatesCheck, extension_settings, initExtensions, loadExtensionSettings, runGenerationInterceptors } from './scripts/extensions.js';
import { COMMENT_NAME_DEFAULT, CONNECT_API_MAP, executeSlashCommandsOnChatInput, initDefaultSlashCommands, initSlashCommandAutoComplete, isExecutingCommandsFromChatInput, pauseScriptExecution, stopScriptExecution, UNIQUE_APIS } from './scripts/slash-commands.js';
import { initMacroAutoComplete } from './scripts/autocomplete/MacroAutoComplete.js';
import {
    tag_map,
    tags,
    filterByTagState,
    isBogusFolder,
    isBogusFolderOpen,
    chooseBogusFolder,
    getTagBlock,
    loadTagsSettings,
    printTagFilters,
    getTagKeyForEntity,
    printTagList,
    createTagMapFromList,
    renameTagKey,
    importTags,
    tag_filter_type,
    compareTagsForSort,
    initTags,
    applyTagsOnCharacterSelect,
    applyTagsOnGroupSelect,
    tag_import_setting,
    applyCharacterTagsToMessageDivs,
} from './scripts/tags.js';
import { initSecrets, readSecretState } from './scripts/secrets.js';
import { markdownExclusionExt } from './scripts/showdown-exclusion.js';
import { markdownUnderscoreExt } from './scripts/showdown-underscore.js';
import { NOTE_MODULE_NAME, initAuthorsNote, metadata_keys, setFloatingPrompt, shouldWIAddPrompt } from './scripts/authors-note.js';
import { registerPromptManagerMigration } from './scripts/PromptManager.js';
import { getRegexedString, regex_placement } from './scripts/extensions/regex/engine.js';
import { initLogprobs, saveLogprobsForActiveMessage } from './scripts/logprobs.js';
import { FILTER_STATES, FILTER_TYPES, FilterHelper, isFilterState } from './scripts/filters.js';
import { getCfgPrompt, getGuidanceScale, initCfg } from './scripts/cfg-scale.js';
import {
    force_output_sequence,
    formatInstructModeChat,
    formatInstructModePrompt,
    formatInstructModeExamples,
    formatInstructModeStoryString,
    getInstructStoppingSequences,
} from './scripts/instruct-mode.js';
import { initLocales, t } from './scripts/i18n.js';
import { getFriendlyTokenizerName, getTokenCount, getTokenCountAsync, initTokenizers, saveTokenCache } from './scripts/tokenizers.js';
import {
    user_avatar,
    getUserAvatars,
    getUserAvatar,
    setUserAvatar,
    initPersonas,
    setPersonaDescription,
    initUserAvatar,
    updatePersonaConnectionsAvatarList,
    isPersonaPanelOpen,
} from './scripts/personas.js';
import { getBackgrounds, initBackgrounds, loadBackgroundSettings, background_settings } from './scripts/backgrounds.js';
import { hideLoader, showLoader } from './scripts/loader.js';
import { BulkEditOverlay } from './scripts/BulkEditOverlay.js';
import { initTextGenModels } from './scripts/textgen-models.js';
import { appendFileContent, hasPendingFileAttachment, populateFileAttachment, decodeStyleTags, encodeStyleTags, isExternalMediaAllowed, preserveNeutralChat, restoreNeutralChat, formatCreatorNotes, initChatUtilities, addDOMPurifyHooks } from './scripts/chats.js';
import { getPresetManager, initPresetManager } from './scripts/preset-manager.js';
import { evaluateMacros, getLastMessageId, initMacros } from './scripts/macros.js';
import { currentUser, setUserControls } from './scripts/user.js';
import { POPUP_RESULT, POPUP_TYPE, Popup, callGenericPopup, fixToastrForDialogs } from './scripts/popup.js';
import { renderTemplate, renderTemplateAsync } from './scripts/templates.js';
import { initScrapers } from './scripts/scrapers.js';
import { initCustomSelectedSamplers, validateDisabledSamplers } from './scripts/samplerSelect.js';
import { DragAndDropHandler } from './scripts/dragdrop.js';
import { INTERACTABLE_CONTROL_CLASS, initKeyboard } from './scripts/keyboard.js';
import { initDynamicStyles } from './scripts/dynamic-styles.js';
import { initInputMarkdown } from './scripts/input-md-formatting.js';
import { AbortReason } from './scripts/util/AbortReason.js';
import { initSystemPrompts } from './scripts/sysprompt.js';
import { registerExtensionSlashCommands as initExtensionSlashCommands } from './scripts/extensions-slashcommands.js';
import { ToolManager } from './scripts/tool-calling.js';
import { addShowdownPatch } from './scripts/util/showdown-patch.js';
import { applyBrowserFixes } from './scripts/browser-fixes.js';
import { initServerHistory } from './scripts/server-history.js';
import { initSettingsSearch } from './scripts/setting-search.js';
import { initBulkEdit } from './scripts/bulk-edit.js';
import { getContext } from './scripts/st-context.js';
import { extractReasoningFromData, extractReasoningSignatureFromData, initReasoning, parseReasoningInSwipes, PromptReasoning, ReasoningHandler, removeReasoningFromString, updateReasoningUI } from './scripts/reasoning.js';
import { accountStorage } from './scripts/util/AccountStorage.js';
import { initWelcomeScreen, openPermanentAssistantChat, openPermanentAssistantCard, getPermanentAssistantAvatar } from './scripts/welcome-screen.js';
import { initDataMaid } from './scripts/data-maid.js';
import { clearItemizedPrompts, deleteItemizedPromptForMessage, deleteItemizedPrompts, findItemizedPromptSet, initItemizedPrompts, itemizedParams, itemizedPrompts, loadItemizedPrompts, promptItemize, replaceItemizedPromptText, saveItemizedPrompts, swapItemizedPrompts } from './scripts/itemized-prompts.js';
import { getSystemMessageByType, initSystemMessages, SAFETY_CHAT, sendSystemMessage, system_message_types, system_messages } from './scripts/system-messages.js';
import { event_types, eventSource } from './scripts/events.js';
import { initAccessibility } from './scripts/a11y.js';
import { applyStreamFadeIn } from './scripts/util/stream-fadein.js';
import { initDomHandlers } from './scripts/dom-handlers.js';
import { SimpleMutex } from './scripts/util/SimpleMutex.js';
import { AudioPlayer } from './scripts/audio-player.js';
import { MacroEnvBuilder } from './scripts/macros/engine/MacroEnvBuilder.js';
import { MacroEngine } from './scripts/macros/engine/MacroEngine.js';
import { addChatBackupsBrowser } from './scripts/chat-backups.js';
import { onboardingExperimentalMacroEngine } from './scripts/macros/engine/MacroDiagnostics.js';
import { getRequestHeaders } from './scripts/request-utils.js';


// Core state and debounced wrappers (extracted from this file for cycle-breaking)
import {
    converter,
    systemUserName,
    neutralCharacterName,
    name1,
    name2,
    chat,
    swipeState,
    isChatSaving,
    settingsReady,
    displayVersion,
    characters,
    this_chid,
    default_avatar,
    system_avatar,
    comment_avatar,
    default_user_avatar,
    CLIENT_VERSION,
    chatElement,
    chat_metadata,
    streamingProcessor,
    abortStatusCheck,
    charDragDropHandler,
    chatDragDropHandler,
    extension_prompt_types,
    extension_prompt_roles,
    MAX_INJECTION_DEPTH,
    talkativeness_default,
    depth_prompt_depth_default,
    depth_prompt_role_default,
    menu_type,
    selected_button,
    create_save,
    ANIMATION_DURATION_DEFAULT,
    animation_duration,
    animation_easing,
    online_status,
    is_send_press,
    settings,
    amount_gen,
    max_context,
    swipesHidden,
    lastSwipeInfo,
    recentSwipes,
    extension_prompts,
    main_api,
    token,
    active_character,
    active_group,
    DEFAULT_SAVE_EDIT_TIMEOUT,
    DEFAULT_PRINT_TIMEOUT,
    default_user_name,
    _set_converter,
    _set_name1,
    _set_name2,
    _set_chat,
    _set_swipeState,
    _set_isChatSaving,
    _set_settingsReady,
    _set_displayVersion,
    _set_characters,
    _set_this_chid,
    _set_CLIENT_VERSION,
    _set_chat_metadata,
    _set_streamingProcessor,
    _set_abortStatusCheck,
    _set_charDragDropHandler,
    _set_chatDragDropHandler,
    _set_menu_type,
    _set_selected_button,
    _set_create_save,
    _set_animation_duration,
    _set_animation_easing,
    _set_online_status,
    _set_is_send_press,
    _set_settings,
    _set_amount_gen,
    _set_max_context,
    _set_swipesHidden,
    _set_lastSwipeInfo,
    _set_recentSwipes,
    _set_extension_prompts,
    _set_main_api,
    _set_token,
    _set_active_character,
    _set_active_group,
    _append_displayVersion,
} from './scripts/core/state.js';
import {
    saveSettingsDebounced,
    saveCharacterDebounced,
    printCharactersDebounced,
    entitiesFilter,
    bindSaveSettings,
    bindPrintCharacters,
} from './scripts/core/debounced.js';

// Chat engine imports
import {
    addCopyToCodeBlocks,
    addOneMessage,
    appendMediaToMessage,
    baseChatReplace,
    cancelDebouncedChatSave,
    cleanUpMessage,
    clearChat,
    closeCurrentChat,
    closeMessageEditor,
    deleteLastMessage,
    deleteMessage,
    deleteSwipe,
    displayPastChats,
    doNewChat,
    ensureMessageMediaIsArray,
    ensureSwipes,
    extractJsonFromData,
    extractMessageBias,
    extractMessageFromData,
    generateQuietPrompt,
    getBiasStrings,
    getChat,
    getChatsFromFiles,
    getCurrentChatId,
    getExtensionPrompt,
    getExtensionPromptByName,
    getExtensionPromptMaxDepth,
    getFirstDisplayedMessageId,
    getMediaDisplay,
    getMediaIndex,
    getNextMessageId,
    getOverswipeBehavior,
    getStoppingStrings,
    hideSwipeButtons,
    importCharacterChat,
    isMessageSwipeable,
    isSwipingAllowed,
    messageEdit,
    parseMesExamples,
    printMessages,
    processCommands,
    redisplayChat,
    refreshSwipeButtons,
    reloadChatMutex,
    reloadCurrentChat,
    reloadCurrentChatUnsafe,
    renameChat,
    renameGroupOrCharacterChat,
    replaceCurrentChat,
    resetChatState,
    saveChat,
    saveChatConditional,
    saveChatDebounced,
    saveMetadata,
    saveReply,
    scrollChatToBottom,
    scrollOnMediaLoad,
    sendMessageAsUser,
    sendTextareaMessage,
    setEditedMessageId,
    showMoreMessages,
    showSwipeButtons,
    substituteParams,
    substituteParamsExtended,
    substituteParamsLegacy,
    swipe,
    swipe_left,
    swipe_right,
    syncMesToSwipe,
    syncSwipeToMes,
    updateChatMetadata,
    updateEditArrowClasses,
    updateMessageBlock,
    updateMessageElement,
    updateRemoteChatName,
    updateSwipeCounter,
    updateViewMessageIds,
    bind_Generate,
    bind_activateSendButtons,
    bind_createOrEditCharacter,
    bind_flushWIInjections,
    bind_getCharacterCardFields,
    bind_getCharacters,
    bind_getFirstMessage,
    bind_getGeneratingApi,
    bind_getGeneratingModel,
    bind_newAssistantChat,
    bind_printCharacters,
    bind_saveImageToMessage,
    bind_selectRightMenuWithAnimation,
    bind_select_selected_character,
    bind_setActiveCharacter,
    bind_setActiveGroup,
    bind_setCharacterId,
    bind_setCharacterName,
    bind_setExtensionPrompt,
    bind_setGenerationProgress,
    bind_setMenuType,
    bind_unshallowCharacter,
    bind_getCurrentChatDetails,
    bind_isGenerating,
    bind_isStreamingEnabled,
    bind_removeMacros,
    // Private vars/helpers still referenced by remaining script.js code
    this_edit_mes_id, _set_ce_this_edit_mes_id,
    this_edit_mes_chname, _set_ce_this_edit_mes_chname,
    is_delete_mode, _set_ce_is_delete_mode,
    generation_started, _set_ce_generation_started,
    swipes, _set_ce_swipes,
    TempResponseLength,
    unblockGeneration, select_rm_characters, processImageAttachment,
    getAllExtensionPrompts, formatGenerationTimer, delChat,
    addPersonaDescriptionExtensionPrompt,
} from './scripts/core/chat-engine.js';

// Character manager imports
import {
    // Exported functions
    selectCharacterById,
    printCharacters,
    characterToEntity,
    groupToEntity,
    tagToEntity,
    getEntitiesList,
    getOneCharacter,
    getCharacterSource,
    getCharacters,
    getCharacterAvatar,
    formatCharacterAvatar,
    duplicateCharacter,
    setCharacterId,
    setCharacterName,
    renameCharacter,
    unshallowCharacter,
    getPastCharacterChats,
    handleDeleteCharacter,
    deleteCharacter,
    select_selected_character,
    select_rm_info,
    buildAvatarList,
    createOrEditCharacter,
    processDroppedFiles,
    newAssistantChat,
    // Late-bind wiring functions
    bind_cm_cancelTtsPlay,
    bind_cm_setMenuType,
    bind_cm_selectRightMenuWithAnimation,
    bind_cm_getFirstMessage,
    // Private state still referenced by script.js
    crop_data as cm_crop_data,
    fav_ch_checked as cm_fav_ch_checked,
    saveCharactersPage as cm_saveCharactersPage,
    per_page_default,
    importFlashTimeout as cm_importFlashTimeout,
    is_advanced_char_open as cm_is_advanced_char_open,
    _set_cm_crop_data,
    _set_cm_fav_ch_checked,
    _set_cm_saveCharactersPage,
    _set_cm_importFlashTimeout,
    _set_cm_is_advanced_char_open,
    // Private helper functions still called from remaining script.js event handlers
    initCharacterSearch,
    updateFavButtonState,
    doCharListDisplaySwitch,
    selectImportedChar,
    importCharacter,
    importFromURL,
    importCharactersTags,
    select_rm_create,
    read_avatar_load,
    openCharacterWorldPopup,
    openAlternateGreetings,
} from './scripts/core/character-manager.js';

// Settings manager imports
import {
    // Exported functions
    getSlideToggleOptions,
    pingServer,
    cancelStatusCheck,
    displayOnlineStatus,
    setAnimationDuration,
    setActiveCharacter,
    setActiveGroup,
    startStatusLoading,
    stopStatusLoading,
    resultCheckStatus,
    activateSendButtons,
    deactivateSendButtons,
    setMenuType,
    setOnlineStatus,
    setSendButtonState,
    changeMainAPI,
    setUserName,
    getSettings,
    saveSettings,
    setGenerationParamsFromPreset,
    getCurrentChatDetails,
    selectRightMenuWithAnimation,
    setExtensionPrompt,
    getExtensionPromptRoleByName,
    removeDepthPrompts,
    setGenerationProgress,
    // Private helpers still referenced by remaining script.js code
    showStopButton,
    hideStopButton,
    // Private state setters
    _set_sm_firstRun,
    _set_sm_currentVersion,
} from './scripts/core/settings-manager.js';


// API OBJECT FOR EXTERNAL WIRING
globalThis.SillyTavern = {
    libs,
    getContext,
};

// ============================================================
// Barrel re-exports for backward compatibility.
// Third-party extensions import from script.js — these ensure
// they continue to work without path changes.
// ============================================================

// Re-exports from other modules (pass-through)
export {
    user_avatar,
    setUserAvatar,
    getUserAvatars,
    getUserAvatar,
    nai_settings,
    isOdd,
    countOccurrences,
    renderTemplate,
    promptItemize,
    itemizedPrompts,
    saveItemizedPrompts,
    loadItemizedPrompts,
    itemizedParams,
    clearItemizedPrompts,
    replaceItemizedPromptText,
    deleteItemizedPrompts,
    findItemizedPromptSet,
    koboldai_settings,
    koboldai_setting_names,
    novelai_settings,
    novelai_setting_names,
    UNIQUE_APIS,
    CONNECT_API_MAP,
    system_messages,
    system_message_types,
    sendSystemMessage,
    getSystemMessageByType,
    event_types,
    eventSource,
    getRequestHeaders,
    /** @deprecated Use setCharacterSettingsOverrides instead. */
    setCharacterSettingsOverrides as setScenarioOverride,
    /** @deprecated Use appendMediaToMessage instead. */
    appendMediaToMessage as appendImageToMessage,
};
export { mesForShowdownParse } from './scripts/message-renderer.js';

// Re-exports from core/state.js (state variables + constants)
export {
    converter, systemUserName, neutralCharacterName, name1, name2,
    chat, swipeState, isChatSaving, settingsReady, displayVersion,
    characters, this_chid, default_avatar, system_avatar, comment_avatar,
    default_user_avatar, CLIENT_VERSION, chatElement, chat_metadata,
    streamingProcessor, abortStatusCheck, charDragDropHandler, chatDragDropHandler,
    extension_prompt_types, extension_prompt_roles, MAX_INJECTION_DEPTH,
    talkativeness_default, depth_prompt_depth_default, depth_prompt_role_default,
    menu_type, selected_button, create_save, ANIMATION_DURATION_DEFAULT,
    animation_duration, animation_easing, online_status, is_send_press,
    settings, amount_gen, max_context, swipesHidden, lastSwipeInfo,
    recentSwipes, extension_prompts, main_api, token,
    active_character, active_group,
    DEFAULT_SAVE_EDIT_TIMEOUT, DEFAULT_PRINT_TIMEOUT,
};

// Re-exports from core/debounced.js
export {
    saveSettingsDebounced, saveCharacterDebounced,
    printCharactersDebounced, entitiesFilter,
};

// Re-exports from core/chat-engine.js
export {
    addCopyToCodeBlocks,
    addOneMessage,
    appendMediaToMessage,
    baseChatReplace,
    cancelDebouncedChatSave,
    cleanUpMessage,
    clearChat,
    closeCurrentChat,
    closeMessageEditor,
    deleteLastMessage,
    deleteMessage,
    deleteSwipe,
    displayPastChats,
    doNewChat,
    ensureMessageMediaIsArray,
    ensureSwipes,
    extractJsonFromData,
    extractMessageBias,
    extractMessageFromData,
    generateQuietPrompt,
    getBiasStrings,
    getChat,
    getChatsFromFiles,
    getCurrentChatId,
    getExtensionPrompt,
    getExtensionPromptByName,
    getExtensionPromptMaxDepth,
    getFirstDisplayedMessageId,
    getMediaDisplay,
    getMediaIndex,
    getNextMessageId,
    getOverswipeBehavior,
    getStoppingStrings,
    hideSwipeButtons,
    importCharacterChat,
    isMessageSwipeable,
    isSwipingAllowed,
    messageEdit,
    parseMesExamples,
    printMessages,
    processCommands,
    redisplayChat,
    refreshSwipeButtons,
    reloadChatMutex,
    reloadCurrentChat,
    reloadCurrentChatUnsafe,
    renameChat,
    renameGroupOrCharacterChat,
    replaceCurrentChat,
    resetChatState,
    saveChat,
    saveChatConditional,
    saveChatDebounced,
    saveMetadata,
    saveReply,
    scrollChatToBottom,
    scrollOnMediaLoad,
    sendMessageAsUser,
    sendTextareaMessage,
    setEditedMessageId,
    showMoreMessages,
    showSwipeButtons,
    substituteParams,
    substituteParamsExtended,
    substituteParamsLegacy,
    swipe,
    swipe_left,
    swipe_right,
    syncMesToSwipe,
    syncSwipeToMes,
    updateChatMetadata,
    updateEditArrowClasses,
    updateMessageBlock,
    updateMessageElement,
    updateRemoteChatName,
    updateSwipeCounter,
    updateViewMessageIds,
};

// Re-exports from core/character-manager.js

// Re-exports from core/settings-manager.js
export {
    getSlideToggleOptions,
    pingServer,
    cancelStatusCheck,
    displayOnlineStatus,
    setAnimationDuration,
    setActiveCharacter,
    setActiveGroup,
    startStatusLoading,
    stopStatusLoading,
    resultCheckStatus,
    activateSendButtons,
    deactivateSendButtons,
    setMenuType,
    setOnlineStatus,
    setSendButtonState,
    changeMainAPI,
    setUserName,
    getSettings,
    saveSettings,
    setGenerationParamsFromPreset,
    getCurrentChatDetails,
    selectRightMenuWithAnimation,
    setExtensionPrompt,
    getExtensionPromptRoleByName,
    removeDepthPrompts,
    setGenerationProgress,
};
export {
    selectCharacterById,
    printCharacters,
    characterToEntity,
    groupToEntity,
    tagToEntity,
    getEntitiesList,
    getOneCharacter,
    getCharacterSource,
    getCharacters,
    getCharacterAvatar,
    formatCharacterAvatar,
    duplicateCharacter,
    setCharacterId,
    setCharacterName,
    renameCharacter,
    unshallowCharacter,
    getPastCharacterChats,
    handleDeleteCharacter,
    deleteCharacter,
    select_selected_character,
    select_rm_info,
    buildAvatarList,
    createOrEditCharacter,
    processDroppedFiles,
    newAssistantChat,
};


/**
 * Wait for page to load before continuing the app initialization.
 */
await new Promise((resolve) => {
    if (document.readyState === 'complete') {
        resolve();
    } else {
        window.addEventListener('load', resolve);
    }
});

// Configure toast library:
toastr.options = {
    positionClass: 'toast-top-center',
    closeButton: false,
    progressBar: false,
    showDuration: 250,
    hideDuration: 250,
    timeOut: 4000,
    extendedTimeOut: 10000,
    showEasing: 'linear',
    hideEasing: 'linear',
    showMethod: 'fadeIn',
    hideMethod: 'fadeOut',
    escapeHtml: true,
    onHidden: function () {
        // If we have any dialog still open, the last "hidden" toastr will remove the toastr-container. We need to keep it alive inside the dialog though
        // so the toasts still show up inside there.
        fixToastrForDialogs();
    },
    onShown: function () {
        // Set tooltip to the notification message
        $(this).attr('title', t`Tap to close`);
    },
};

export const characterGroupOverlay = new BulkEditOverlay();



let optionsPopper = Popper.createPopper(document.getElementById('options_button'), document.getElementById('options'), {
    placement: 'top-start',
});
let exportPopper = Popper.createPopper(document.getElementById('export_button'), document.getElementById('export_format_popup'), {
    placement: 'left',
});
let isExportPopupOpen = false;

// Saved here for performance reasons

let dialogueResolve = null;
let dialogueCloseStop = false;
let scrollLock = false;


async function getClientVersion() {
    try {
        const response = await fetch('/version');
        const data = await response.json();
        _set_CLIENT_VERSION(data.agent);
        _set_displayVersion(`SillyTavern ${data.pkgVersion}`);
        _set_sm_currentVersion(data.pkgVersion);

        if (data.gitRevision && data.gitBranch) {
            _set_displayVersion(displayVersion + ` '${data.gitBranch}' (${data.gitRevision})`);
        }

        $('#version_display').text(displayVersion);
        $('#version_display_welcome').text(displayVersion);
    } catch (err) {
        console.error('Couldn\'t get client version', err);
    }
}

export function reloadMarkdownProcessor() { stTrack('reloadMarkdownProcessor'); // @st-tracked
    _set_converter(new showdown.Converter({
        emoji: true,
        literalMidWordUnderscores: true,
        parseImgDimensions: true,
        tables: true,
        underline: true,
        simpleLineBreaks: true,
        strikethrough: true,
        disableForced4SpacesIndentedSublists: true,
        extensions: [markdownUnderscoreExt()],
    }));

    // Inject the dinkus extension after creating the converter
    // Maybe move this into power_user init?
    converter.addExtension(markdownExclusionExt(), 'exclusion');

    return converter;
}




/**
 * The type of the right menu
 * @typedef {'characters' | 'character_edit' | 'create' | 'group_edit' | 'group_create' | '' } MenuType
 */


let popup_type = '';

export const isGenerating = () => (is_send_press || is_group_generating);

let this_del_mes = -1;

/** @type {string} */
/** @type {number|undefined} */


/** User preference for swipeable messages */


/** @type {AbortController} */
let abortController;

export function setExternalAbortController(controller) { stTrack('setExternalAbortController'); // @st-tracked
    abortController = controller;
}

//css
var css_send_form_display = $('<div id=send_form></div>').css('display');

var kobold_horde_model = '';

$.ajaxPrefilter((options, originalOptions, xhr) => {
    xhr.setRequestHeader('X-CSRF-Token', token);
});

//MARK: firstLoadInit
async function firstLoadInit() {
    try {
        const tokenResponse = await fetch('/csrf-token');
        const tokenData = await tokenResponse.json();
        _set_token(tokenData.token);
    } catch {
        toastr.error(t`Couldn't get CSRF token. Please refresh the page.`, t`Error`, { timeOut: 0, extendedTimeOut: 0, preventDuplicates: true });
        throw new Error('Initialization failed');
    }

    showLoader();
    registerPromptManagerMigration();
    initDomHandlers();
    initStandaloneMode();
    initLibraryShims();
    addShowdownPatch(showdown);
    addDOMPurifyHooks();
    reloadMarkdownProcessor();
    bindSaveSettings(saveSettings);
    bindPrintCharacters(printCharacters);

    // Chat engine late-bind wiring
    bind_Generate(Generate);
    bind_activateSendButtons(activateSendButtons);
    bind_createOrEditCharacter(createOrEditCharacter);
    bind_flushWIInjections(flushWIInjections);
    bind_getCharacterCardFields(getCharacterCardFields);
    bind_getCharacters(getCharacters);
    bind_getFirstMessage(getFirstMessage);
    bind_getGeneratingApi(getGeneratingApi);
    bind_getGeneratingModel(getGeneratingModel);
    bind_newAssistantChat(newAssistantChat);
    bind_printCharacters(printCharacters);
    bind_saveImageToMessage(saveImageToMessage);
    bind_selectRightMenuWithAnimation(selectRightMenuWithAnimation);
    bind_select_selected_character(select_selected_character);
    bind_setActiveCharacter(setActiveCharacter);
    bind_setActiveGroup(setActiveGroup);
    bind_setCharacterId(setCharacterId);
    bind_setCharacterName(setCharacterName);
    bind_setExtensionPrompt(setExtensionPrompt);
    bind_setGenerationProgress(setGenerationProgress);
    bind_setMenuType(setMenuType);
    bind_unshallowCharacter(unshallowCharacter);
    bind_getCurrentChatDetails(getCurrentChatDetails);
    bind_isGenerating(isGenerating);
    bind_isStreamingEnabled(isStreamingEnabled);
    bind_removeMacros(removeMacros);

    // Character manager late-bind wiring
    bind_cm_cancelTtsPlay(cancelTtsPlay);
    bind_cm_setMenuType(setMenuType);
    bind_cm_selectRightMenuWithAnimation(selectRightMenuWithAnimation);
    bind_cm_getFirstMessage(getFirstMessage);
    applyBrowserFixes();
    await getClientVersion();
    await initSecrets();
    await readSecretState();
    await initLocales();
    initChatUtilities();
    initDefaultSlashCommands();
    initTextGenModels();
    initOpenAI();
    initTextGenSettings();
    initKoboldSettings();
    initNovelAISettings();
    initSystemPrompts();
    initExtensions();
    initExtensionSlashCommands();
    ToolManager.initToolSlashCommands();
    await initPresetManager();
    await initSystemMessages();
    await getSettings();
    initKeyboard();
    initDynamicStyles();
    initTags();
    initBookmarks();
    await getUserAvatars(true, user_avatar);
    await getCharacters();
    await getBackgrounds();
    await initTokenizers();
    initBackgrounds();
    initAuthorsNote();
    await initPersonas();
    await initSlashCommandAutoComplete();
    initMacroAutoComplete();
    initWorldInfo();
    initHorde();
    initRossMods();
    initStats();
    initCfg();
    initLogprobs();
    initInputMarkdown();
    initServerHistory();
    initSettingsSearch();
    initBulkEdit();
    initReasoning();
    initWelcomeScreen();
    await initScrapers();
    initCustomSelectedSamplers();
    initDataMaid();
    initItemizedPrompts();
    initAccessibility();
    addDebugFunctions();
    doDailyExtensionUpdatesCheck();
    await eventSource.emit(event_types.APP_INITIALIZED);
    await hideLoader();
    await fixViewport();
    await eventSource.emit(event_types.APP_READY);
}

async function fixViewport() {
    document.body.style.position = 'absolute';
    await delay(1);
    document.body.style.position = '';
}

function initStandaloneMode() {
    const isPwaMode = window.matchMedia('(display-mode: standalone)').matches;
    if (isPwaMode) {
        $('body').addClass('PWA');
    }
}


/**
 * @typedef {object} Entity - Object representing a display entity
 * @property {Character|Group|import('./scripts/tags.js').Tag|*} item - The item
 * @property {string|number} id - The id
 * @property {'character'|'group'|'tag'} type - The type of this entity (character, group, tag)
 * @property {Entity[]?} [entities=null] - An optional list of entities relevant for this item
 * @property {number?} [hidden=null] - An optional number representing how many hidden entities this entity contains
 * @property {boolean?} [isUseless=null] - Specifies if the entity is useless (not relevant, but should still be displayed for consistency) and should be displayed greyed out
 */


/**
 * Deletes a character chat by its name.
 * @param {string} characterId Character ID to delete chat for
 * @param {string} fileName Name of the chat file to delete (without .jsonl extension)
 * @returns {Promise<void>} A promise that resolves when the chat is deleted.
 */
export async function deleteCharacterChatByName(characterId, fileName) { stTrack('deleteCharacterChatByName'); // @st-tracked
    // Make sure all the data is loaded.
    await unshallowCharacter(characterId);

    /** @type {Character} */
    const character = characters[characterId];
    if (!character) {
        console.warn(`Character with ID ${characterId} not found.`);
        return;
    }

    const response = await fetch('/api/chats/delete', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({
            chatfile: `${fileName}.jsonl`,
            avatar_url: character.avatar,
        }),
    });

    if (!response.ok) {
        console.error('Failed to delete chat for character.');
        return;
    }

    if (fileName === character.chat) {
        const chatsResponse = await fetch('/api/characters/chats', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({ avatar_url: character.avatar }),
        });
        const chats = Object.values(await chatsResponse.json());
        chats.sort((a, b) => sortMoments(timestampToMoment(a.last_mes), timestampToMoment(b.last_mes)));
        const newChatName = chats.length && typeof chats[0] === 'object' ? chats[0].file_name.replace('.jsonl', '') : `${character.name} - ${humanizedDateTime()}`;
        await updateRemoteChatName(characterId, newChatName);
    }

    await eventSource.emit(event_types.CHAT_DELETED, fileName);
}


// messageFormatting extracted to ./scripts/message-renderer.js
import { messageFormatting } from './scripts/message-renderer.js';
export { messageFormatting }; // re-exported for backward compat


/** @typedef {import('./scripts/macros/engine/MacroRegistry.js').MacroHandler} MacroHandler */


/**
 * @typedef {Object} CharacterCardFields
 * @property {string} system System prompt
 * @property {string} mesExamples Message examples
 * @property {string} description Description
 * @property {string} personality Personality
 * @property {string} persona Persona
 * @property {string} scenario Scenario
 * @property {string} jailbreak Jailbreak instructions
 * @property {string} version Character version
 * @property {string} charDepthPrompt Character depth note
 * @property {string} creatorNotes Character creator notes
 */

/**
 * Helper to create an object with lazy, memoized getters from a map of field resolvers.
 * @param {Record<string, () => string>} resolvers Map of field names to resolver functions
 * @returns {CharacterCardFields} Object with lazy getters
 */
export function createLazyFields(resolvers) { stTrack('createLazyFields'); // @st-tracked
    const result = /** @type {CharacterCardFields} */ ({});
    for (const [key, resolver] of Object.entries(resolvers)) {
        let cached;
        let resolved = false;
        Object.defineProperty(result, key, {
            get() {
                if (!resolved) {
                    cached = resolver();
                    resolved = true;
                }
                return cached;
            },
            enumerable: true,
            configurable: true,
        });
    }
    return result;
}

/**
 * Returns the character card fields for the current character as lazy getters.
 * Each field is only processed (baseChatReplace) when first accessed.
 * @param {Object} [options={}]
 * @param {number} [options.chid] Optional character index
 * @returns {CharacterCardFields} Character card fields with lazy evaluation
 */
export function getCharacterCardFieldsLazy({ chid = undefined } = {}) { stTrack('getCharacterCardFieldsLazy'); // @st-tracked
    const currentChid = chid ?? this_chid;
    const character = characters[currentChid];

    // For group chats, we need to check if group cards should be used
    const useGroupCards = selected_group && character;
    const groupCardsLazy = useGroupCards ? getGroupCharacterCardsLazy(selected_group, Number(currentChid)) : null;

    /** @type {Record<string, () => string>} */
    const resolvers = {
        persona: () => baseChatReplace(power_user.persona_description?.trim()),
        system: () => {
            if (!character) return '';
            const systemPrompt = chat_metadata.system_prompt || character.data?.system_prompt || '';
            return power_user.prefer_character_prompt ? baseChatReplace(systemPrompt.trim()) : '';
        },
        jailbreak: () => {
            if (!character) return '';
            return power_user.prefer_character_jailbreak ? baseChatReplace(character.data?.post_history_instructions?.trim()) : '';
        },
        version: () => character?.data?.character_version ?? '',
        charDepthPrompt: () => {
            if (!character) return '';
            return baseChatReplace(character.data?.extensions?.depth_prompt?.prompt?.trim());
        },
        creatorNotes: () => {
            if (!character) return '';
            return baseChatReplace(character.data?.creator_notes?.trim());
        },
        // These four fields may be overridden by group cards
        description: () => {
            if (groupCardsLazy) return groupCardsLazy.description;
            if (!character) return '';
            return baseChatReplace(character.description?.trim());
        },
        personality: () => {
            if (groupCardsLazy) return groupCardsLazy.personality;
            if (!character) return '';
            return baseChatReplace(character.personality?.trim());
        },
        scenario: () => {
            if (groupCardsLazy) return groupCardsLazy.scenario;
            if (!character) return '';
            const scenarioText = chat_metadata.scenario || character.scenario || '';
            return baseChatReplace(scenarioText.trim());
        },
        mesExamples: () => {
            if (groupCardsLazy) return groupCardsLazy.mesExamples;
            if (!character) return '';
            const exampleDialog = chat_metadata.mes_example || character.mes_example || '';
            return baseChatReplace(exampleDialog.trim());
        },
    };

    return createLazyFields(resolvers);
}

/**
 * Returns the character card fields for the current character.
 * @param {Object} [options={}]
 * @param {number} [options.chid] Optional character index
 * @returns {CharacterCardFields} Character card fields
 */
export function getCharacterCardFields({ chid = undefined } = {}) { stTrack('getCharacterCardFields'); // @st-tracked
    const lazy = getCharacterCardFieldsLazy({ chid });

    // Resolve all lazy fields into a plain object
    return {
        system: lazy.system,
        mesExamples: lazy.mesExamples,
        description: lazy.description,
        personality: lazy.personality,
        persona: lazy.persona,
        scenario: lazy.scenario,
        jailbreak: lazy.jailbreak,
        version: lazy.version,
        charDepthPrompt: lazy.charDepthPrompt,
        creatorNotes: lazy.creatorNotes,
    };
}


export function isStreamingEnabled() { stTrack('isStreamingEnabled'); // @st-tracked
    return (
        (main_api == 'openai' &&
            oai_settings.stream_openai &&
            !(oai_settings.chat_completion_source == chat_completion_sources.OPENAI && ['o1-2024-12-17', 'o1'].includes(oai_settings.openai_model))
        )
        || (main_api == 'kobold' && kai_settings.streaming_kobold && kai_flags.can_use_streaming)
        || (main_api == 'novel' && nai_settings.streaming_novel)
        || (main_api == 'textgenerationwebui' && textgen_settings.streaming));
}

class StreamingProcessor {
    /**
     * Creates a new streaming processor.
     * @param {string} type Generation type
     * @param {boolean} forceName2 If true, force the use of name2
     * @param {Date} timeStarted Date when generation was started
     * @param {string} continueMessage Previous message if the type is 'continue'
     * @param {PromptReasoning} promptReasoning Prompt reasoning instance
     */
    constructor(type, forceName2, timeStarted, continueMessage, promptReasoning) {
        this.result = '';
        this.messageId = -1;
        /** @type {HTMLElement} */
        this.messageDom = null;
        /** @type {HTMLElement} */
        this.messageTextDom = null;
        /** @type {HTMLElement} */
        this.messageTimerDom = null;
        /** @type {HTMLElement} */
        this.messageTokenCounterDom = null;
        /** @type {HTMLTextAreaElement} */
        this.sendTextarea = document.querySelector('#send_textarea');
        this.type = type;
        this.force_name2 = forceName2;
        this.isStopped = false;
        this.isFinished = false;
        this.generator = this.nullStreamingGeneration;
        this.abortController = new AbortController();
        this.firstMessageText = '...';
        this.timeStarted = timeStarted;
        /** @type {number?} */
        this.timeToFirstToken = null;
        this.createdAt = new Date();
        this.continueMessage = type === 'continue' ? continueMessage : '';
        this.swipes = [];
        /** @type {import('./scripts/logprobs.js').TokenLogprobs[]} */
        this.messageLogprobs = [];
        this.toolCalls = [];
        // Initialize reasoning in its own handler
        this.reasoningHandler = new ReasoningHandler(timeStarted);
        /** @type {PromptReasoning} */
        this.promptReasoning = promptReasoning;
        /** @type {string[]} */
        this.images = [];
        /** @type {string?} */
        this.reasoningSignature = null;
    }

    /**
     * Initializes DOM elements for the current message.
     * @param {number} messageId Current message ID
     * @param {boolean?} continueOnReasoning If continuing on reasoning
     */
    async #checkDomElements(messageId, continueOnReasoning = null) {
        if (this.messageDom === null || this.messageTextDom === null) {
            this.messageDom = document.querySelector(`#chat .mes[mesid="${messageId}"]`);
            this.messageTextDom = this.messageDom?.querySelector('.mes_text');
            this.messageTimerDom = this.messageDom?.querySelector('.mes_timer');
            this.messageTokenCounterDom = this.messageDom?.querySelector('.tokenCounterDisplay');
        }
        if (continueOnReasoning) {
            await this.reasoningHandler.process(messageId, false, this.promptReasoning);
        }
        this.reasoningHandler.updateDom(messageId);
    }

    #updateMessageBlockVisibility() {
        if (this.messageDom instanceof HTMLElement && Array.isArray(this.toolCalls) && this.toolCalls.length > 0) {
            const shouldHide = ['', '...'].includes(this.result) && !this.reasoningHandler.reasoning;
            this.messageDom.classList.toggle('displayNone', shouldHide);
        }
    }

    markUIGenStarted() {
        deactivateSendButtons();
    }

    markUIGenStopped() {
        unblockGeneration();
    }

    async onStartStreaming(text) {
        const continueOnReasoning = !!(this.type === 'continue' && this.promptReasoning.prefixReasoning);
        if (continueOnReasoning) {
            this.reasoningHandler.initContinue(this.promptReasoning);
        }

        let messageId = -1;

        if (this.type == 'impersonate') {
            this.sendTextarea.value = '';
            this.sendTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            await saveReply({ type: this.type, getMessage: text, fromStreaming: true });
            messageId = chat.length - 1;
            await this.#checkDomElements(messageId, continueOnReasoning);
            this.markUIGenStarted();
        }
        hideSwipeButtons({ hideCounters: true });
        scrollChatToBottom({ waitForFrame: true });
        return messageId;
    }

    async onProgressStreaming(messageId, text, isFinal) {
        const isImpersonate = this.type == 'impersonate';
        const isContinue = this.type == 'continue';

        if (!isImpersonate && !isContinue && Array.isArray(this.swipes) && this.swipes.length > 0) {
            for (let i = 0; i < this.swipes.length; i++) {
                this.swipes[i] = cleanUpMessage({
                    getMessage: this.swipes[i],
                    isImpersonate: false,
                    isContinue: false,
                    displayIncompleteSentences: true,
                    stoppingStrings: this.stoppingStrings,
                });
            }
        }

        let processedText = cleanUpMessage({
            getMessage: text,
            isImpersonate: isImpersonate,
            isContinue: isContinue,
            displayIncompleteSentences: !isFinal,
            stoppingStrings: this.stoppingStrings,
        });

        const charsToBalance = ['*', '"', '```', '~~~'];
        for (const char of charsToBalance) {
            if (!isFinal && isOdd(countOccurrences(processedText, char))) {
                const separator = char.length > 1 ? '\n' : '';
                processedText = processedText.trimEnd() + separator + char;
            }
        }

        if (isImpersonate) {
            this.sendTextarea.value = processedText;
            this.sendTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            const mesChanged = chat[messageId].mes !== processedText;
            await this.#checkDomElements(messageId);
            this.#updateMessageBlockVisibility();
            const currentTime = new Date();
            chat[messageId].mes = processedText;
            chat[messageId].gen_started = this.timeStarted;
            chat[messageId].gen_finished = currentTime;
            if (!chat[messageId].extra) {
                chat[messageId].extra = {};
            }
            chat[messageId].extra.time_to_first_token = this.timeToFirstToken;

            // Update reasoning
            await this.reasoningHandler.process(messageId, mesChanged, this.promptReasoning);
            processedText = chat[messageId].mes;

            // Token count update.
            const tokenCountText = this.reasoningHandler.reasoning + processedText;
            const currentTokenCount = isFinal && power_user.message_token_count_enabled ? await getTokenCountAsync(tokenCountText, 0) : 0;
            if (currentTokenCount) {
                chat[messageId].extra.token_count = currentTokenCount;
                if (this.messageTokenCounterDom instanceof HTMLElement) {
                    this.messageTokenCounterDom.textContent = `${currentTokenCount}t`;
                }
            }

            if ((this.type == 'swipe' || this.type === 'continue') && Array.isArray(chat[messageId].swipes)) {
                chat[messageId].swipes[chat[messageId].swipe_id] = processedText;
                chat[messageId].swipe_info[chat[messageId].swipe_id] = {
                    'send_date': chat[messageId].send_date,
                    'gen_started': chat[messageId].gen_started,
                    'gen_finished': chat[messageId].gen_finished,
                    'extra': structuredClone(chat[messageId].extra),
                };
            }

            const formattedText = messageFormatting(
                processedText,
                chat[messageId].name,
                chat[messageId].is_system,
                chat[messageId].is_user,
                messageId,
                {},
                false,
            );
            if (this.messageTextDom instanceof HTMLElement) {
                if (power_user.stream_fade_in) {
                    applyStreamFadeIn(this.messageTextDom, formattedText);
                } else {
                    this.messageTextDom.innerHTML = formattedText;
                }
            }

            const timePassed = formatGenerationTimer(this.timeStarted, currentTime, currentTokenCount, this.reasoningHandler.getDuration(), this.timeToFirstToken);
            if (this.messageTimerDom instanceof HTMLElement) {
                this.messageTimerDom.textContent = timePassed.timerValue;
                this.messageTimerDom.title = timePassed.timerTitle;
            }

            this.setFirstSwipe(messageId);
        }

        if (!scrollLock) {
            scrollChatToBottom({ waitForFrame: true });
        }
    }

    async onFinishStreaming(messageId, text) {
        await this.onProgressStreaming(messageId, text, true);
        const messageElement = chatElement.find(`.mes[mesid="${messageId}"]`);
        const message = chat[messageId];
        addCopyToCodeBlocks(messageElement);

        await this.reasoningHandler.finish(messageId);

        if (Array.isArray(this.swipes) && this.swipes.length > 0) {
            const swipeInfoExtra = structuredClone(message.extra ?? {});
            delete swipeInfoExtra.token_count;
            delete swipeInfoExtra.reasoning;
            delete swipeInfoExtra.reasoning_duration;
            const swipeInfo = {
                send_date: message.send_date,
                gen_started: message.gen_started,
                gen_finished: message.gen_finished,
                extra: swipeInfoExtra,
            };
            const swipeInfoArray = Array(this.swipes.length).fill().map(() => structuredClone(swipeInfo));
            parseReasoningInSwipes(this.swipes, swipeInfoArray, message.extra?.reasoning_duration);
            message.swipes.push(...this.swipes);
            message.swipe_info.push(...swipeInfoArray);
        }

        syncMesToSwipe(messageId);
        saveLogprobsForActiveMessage(this.messageLogprobs.filter(Boolean), this.continueMessage);

        if (Array.isArray(this.images) && this.images.length > 0) {
            await processImageAttachment(message, { imageUrls: this.images });
            appendMediaToMessage(message, $(this.messageDom));
        }

        // Store reasoning signature for models that support multi-turn context
        if (this.reasoningSignature) {
            message.extra = message.extra || {};
            message.extra.reasoning_signature = this.reasoningSignature;
        }

        this.markUIGenStopped();

        if (this.type !== 'impersonate') {
            await eventSource.emit(event_types.MESSAGE_RECEIVED, this.messageId, this.type);
            await eventSource.emit(event_types.CHARACTER_MESSAGE_RENDERED, this.messageId, this.type);
        } else {
            await eventSource.emit(event_types.IMPERSONATE_READY, text);
        }

        updateSwipeCounter(messageId, { message, messageElement });

        const isAborted = this.abortController.signal.aborted;
        if (!isAborted && power_user.auto_swipe && generatedTextFiltered(text)) {
            return await swipe(null, SWIPE_DIRECTION.RIGHT, { source: SWIPE_SOURCE.AUTO_SWIPE, repeated: true, forceMesId: chat.length - 1 });
        }
        await saveChatConditional();

        playMessageSound();
    }

    onErrorStreaming() {
        this.abortController.abort();
        this.isStopped = true;

        this.markUIGenStopped();

        const noEmitTypes = ['swipe', 'impersonate', 'continue'];
        if (!noEmitTypes.includes(this.type)) {
            eventSource.emit(event_types.MESSAGE_RECEIVED, this.messageId, this.type);
            eventSource.emit(event_types.CHARACTER_MESSAGE_RENDERED, this.messageId, this.type);
        }
    }

    setFirstSwipe(messageId) {
        if (this.type !== 'swipe' && this.type !== 'impersonate') {
            if (Array.isArray(chat[messageId].swipes) && chat[messageId].swipes.length === 1 && chat[messageId].swipe_id === 0) {
                chat[messageId].swipes[0] = chat[messageId].mes;
                chat[messageId].swipe_info[0] = {
                    'send_date': chat[messageId].send_date,
                    'gen_started': chat[messageId].gen_started,
                    'gen_finished': chat[messageId].gen_finished,
                    'extra': structuredClone(chat[messageId].extra),
                };
            }
        }
    }

    onStopStreaming() {
        this.abortController.abort();
        this.isFinished = true;
    }

    /**
     * @returns {Generator<{ text: string, swipes: string[], logprobs: import('./scripts/logprobs.js').TokenLogprobs, toolCalls: any[], state: any }, void, void>}
     */
    *nullStreamingGeneration() {
        throw new Error('Generation function for streaming is not hooked up');
    }

    async generate() {
        if (this.messageId == -1) {
            this.messageId = await this.onStartStreaming(this.firstMessageText);
            await delay(1); // delay for message to be rendered
            scrollLock = false;
        }

        // Stopping strings are expensive to calculate, especially with macros enabled. To remove stopping strings
        // when streaming, we cache the result of getStoppingStrings instead of calling it once per token.
        const isImpersonate = this.type == 'impersonate';
        const isContinue = this.type == 'continue';
        this.stoppingStrings = getStoppingStrings(isImpersonate, isContinue);

        try {
            const sw = new Stopwatch(1000 / power_user.streaming_fps);
            const timestamps = [];
            for await (const { text, swipes, logprobs, toolCalls, state } of this.generator()) {
                const now = Date.now();
                timestamps.push(now);
                if (!this.timeToFirstToken) {
                    this.timeToFirstToken = now - this.createdAt.getTime();
                }
                if (this.isStopped || this.abortController.signal.aborted) {
                    return this.result;
                }

                this.toolCalls = toolCalls;
                this.result = text;
                this.swipes = Array.from(swipes ?? []);
                if (logprobs) {
                    this.messageLogprobs.push(...(Array.isArray(logprobs) ? logprobs : [logprobs]));
                }
                // Get the updated reasoning string into the handler
                this.reasoningHandler.updateReasoning(this.messageId, state?.reasoning);
                this.images = state?.images ?? [];
                this.reasoningSignature = state?.signature ?? null;
                await eventSource.emit(event_types.STREAM_TOKEN_RECEIVED, text);
                await sw.tick(async () => await this.onProgressStreaming(this.messageId, this.continueMessage + text));
            }
            const seconds = (timestamps[timestamps.length - 1] - timestamps[0]) / 1000;
            console.warn(`Stream stats: ${timestamps.length} tokens, ${seconds.toFixed(2)} seconds, rate: ${Number(timestamps.length / seconds).toFixed(2)} TPS`);
        }
        catch (err) {
            // in the case of a self-inflicted abort, we have already cleaned up
            if (!this.isFinished) {
                console.error(err);
                this.onErrorStreaming();
            }
            return this.result;
        }

        this.isFinished = true;
        return this.result;
    }
}

/**
 * Constructs a prompt to be used for either Text Completion or Chat Completion. Input is format-agnostic.
 * @param {string | object[]} prompt Input prompt. Can be a string or an array of chat-style messages, i.e. [{role: '', content: ''}, ...]
 * @param {string} api API to use.
 * @param {boolean} instructOverride true to override instruct mode, false to use the default value
 * @param {boolean} quietToLoud true to generate a message in system mode, false to generate a message in character mode
 * @param {string} [systemPrompt] System prompt to use.
 * @param {string} [prefill] Prefill for the prompt.
 * @returns {string | object[]} Prompt ready for use in generation. If using TC, this will be a string. If using CC, this will be an array of chat-style messages.
 */
export function createRawPrompt(prompt, api, instructOverride, quietToLoud, systemPrompt, prefill) { stTrack('createRawPrompt'); // @st-tracked
    const isInstruct = power_user.instruct.enabled && api !== 'openai' && api !== 'novel' && !instructOverride;

    // If the prompt was given as a string, convert to a message-style object assuming user role
    if (typeof prompt === 'string') {
        const message = api === 'openai'
            ? { role: 'user', content: prompt.trim() }
            : { role: 'system', content: prompt };
        prompt = [message];
    } else {  // checks for message-style object
        if (prompt.length === 0 && !systemPrompt) throw Error('No messages provided');
    }

    // Substitute the prefill if provided
    prefill = substituteParams(prefill ?? '');

    // Format each message in the prompt, accounting for the provided roles
    for (const message of prompt) {
        let name = '';
        if (message.role === 'user') name = message.name ?? name1;
        if (message.role === 'assistant') name = message.name ?? name2;
        if (message.role === 'system') name = message.name ?? '';
        const prefix = isInstruct || api === 'openai' ? '' : (name ? `${name}: ` : '');
        message.content = prefix + substituteParams(message.content ?? '');
        if (isInstruct) {  // instruct formatting for text completion
            const isUser = message.role === 'user';
            const isNarrator = message.role === 'system';
            message.content = formatInstructModeChat(name, message.content, isUser, isNarrator, '', name1, name2, false);
        }
    }

    // prepend system prompt, if provided
    if (systemPrompt) {
        systemPrompt = substituteParams(systemPrompt);
        systemPrompt = isInstruct ? (formatInstructModeStoryString(systemPrompt) + '\n') : systemPrompt.trim();
        prompt.unshift({ role: 'system', content: systemPrompt });
    }

    // with Chat Completion, the prefill is an additional assistant message at the end.
    if (api === 'openai' && prefill) {
        prompt.push({ role: 'assistant', content: prefill });
    }

    // if text completion, convert to text prompt by concatenating all message contents and adding the prefill as a promptBias.
    if (api !== 'openai') {
        const joiner = isInstruct ? '' : '\n';
        prompt = prompt.map(message => message.content).join(joiner);
        prompt = api === 'novel' ? adjustNovelInstructionPrompt(prompt) : prompt;
        prompt = prompt + (isInstruct ? formatInstructModePrompt(name2, false, prefill, name1, name2, true, quietToLoud) : `\n${prefill}`);  // add last line
    }

    return prompt;
}

/**
 * Generates a message using the provided prompt.
 * If the prompt is an array of chat-style messages and not using chat completion, it will be converted to a text prompt.
 * @typedef {object} GenerateRawParams
 * @prop {string | object[]} [prompt] Prompt to generate a message from. Can be a string or an array of chat-style messages, i.e. [{role: '', content: ''}, ...]
 * @prop {string} [api] API to use. Main API is used if not specified.
 * @prop {boolean} [instructOverride] true to override instruct mode, false to use the default value
 * @prop {boolean} [quietToLoud] true to generate a message in system mode, false to generate a message in character mode
 * @prop {string} [systemPrompt] System prompt to use.
 * @prop {number} [responseLength] Maximum response length. If unset, the global default value is used.
 * @prop {boolean} [trimNames] Whether to allow trimming "{{user}}:" and "{{char}}:" from the response.
 * @prop {string} [prefill] An optional prefill for the prompt.
 * @prop {object} [jsonSchema] JSON schema to use for the structured generation. Usually requires a special instruction.
 * @param {GenerateRawParams} params Parameters for generating a message
 * @returns {Promise<string>} Generated message
 */
export async function generateRaw({ prompt = '', api = null, instructOverride = false, quietToLoud = false, systemPrompt = '', responseLength = null, trimNames = true, prefill = '', jsonSchema = null } = {}) { stTrack('generateRaw'); // @st-tracked
    if (arguments.length > 0 && typeof arguments[0] !== 'object') {
        console.trace('generateRaw called with positional arguments. Please use an object instead.');
        [prompt, api, instructOverride, quietToLoud, systemPrompt, responseLength, trimNames, prefill, jsonSchema] = arguments;
    }

    if (!api) {
        api = main_api;
    }

    const abortController = new AbortController();
    const responseLengthCustomized = typeof responseLength === 'number' && responseLength > 0;
    let eventHook = () => { };

    // construct final prompt from the input. Can either be a string or an array of chat-style messages.
    prompt = createRawPrompt(prompt, api, instructOverride, quietToLoud, systemPrompt, prefill);

    // Allow extensions to stop generation before it happens
    const eventAbortController = new AbortController();
    const abortHook = () => eventAbortController.abort(new Error('Cancelled by extension'));
    eventSource.on(event_types.GENERATION_STOPPED, abortHook);

    try {
        if (responseLengthCustomized) {
            TempResponseLength.save(api, responseLength);
        }
        /** @type {object|any[]} */
        let generateData = {};

        // Allow extensions to modify the prompt before generation
        // 1. for text completion
        if (typeof prompt === 'string') {
            const eventData = { prompt: prompt, dryRun: false };
            await eventSource.emit(event_types.GENERATE_AFTER_COMBINE_PROMPTS, eventData);
            prompt = eventData.prompt;
        }
        // 2. for chat completion
        if (Array.isArray(prompt)) {
            const eventData = { chat: prompt, dryRun: false };
            await eventSource.emit(event_types.CHAT_COMPLETION_PROMPT_READY, eventData);
            prompt = eventData.chat;
        }

        // Check if the generation was aborted during the event
        eventAbortController.signal.throwIfAborted();

        switch (api) {
            case 'kobold':
            case 'koboldhorde':
                if (kai_settings.preset_settings === 'gui') {
                    generateData = { prompt: prompt, gui_settings: true, max_length: amount_gen, max_context_length: max_context, api_server: kai_settings.api_server };
                } else {
                    const isHorde = api === 'koboldhorde';
                    const koboldSettings = koboldai_settings[koboldai_setting_names[kai_settings.preset_settings]];
                    generateData = getKoboldGenerationData(prompt.toString(), koboldSettings, amount_gen, max_context, isHorde, 'quiet');
                }
                TempResponseLength.restore(api);
                break;
            case 'novel': {
                const novelSettings = novelai_settings[novelai_setting_names[nai_settings.preset_settings_novel]];
                generateData = getNovelGenerationData(prompt, novelSettings, amount_gen, false, false, null, 'quiet');
                TempResponseLength.restore(api);
                break;
            }
            case 'textgenerationwebui':
                generateData = await getTextGenGenerationData(prompt, amount_gen, false, false, null, 'quiet');
                TempResponseLength.restore(api);
                break;
            case 'openai': {
                generateData = prompt;  // generateData is just the chat message object
                eventHook = TempResponseLength.setupEventHook(api);
            } break;
        }

        let data = {};

        if (api === 'koboldhorde') {
            data = await generateHorde(prompt.toString(), generateData, abortController.signal, false);
        } else if (api === 'openai') {
            data = await sendOpenAIRequest('quiet', generateData, abortController.signal, { jsonSchema });
        } else {
            const generateUrl = getGenerateUrl(api);
            const response = await fetch(generateUrl, {
                method: 'POST',
                headers: getRequestHeaders(),
                cache: 'no-cache',
                body: JSON.stringify(generateData),
                signal: abortController.signal,
            });

            if (!response.ok) {
                throw await response.json();
            }

            data = await response.json();
        }

        // should only happen for text completions
        // other frontend paths do not return data if calling the backend fails,
        // they throw things instead
        if (data.error) {
            throw new Error(data.response);
        }

        if (jsonSchema) {
            return extractJsonFromData(data, { mainApi: api });
        }

        // format result, exclude user prompt bias
        const message = cleanUpMessage({
            getMessage: extractMessageFromData(data),
            isImpersonate: false,
            isContinue: false,
            displayIncompleteSentences: true,
            includeUserPromptBias: false,
            trimNames: trimNames,
            trimWrongNames: trimNames,
        });

        if (!message) {
            throw new Error('No message generated');
        }

        return message;
    } finally {
        eventSource.removeListener(event_types.GENERATION_STOPPED, abortHook);
        if (responseLengthCustomized && TempResponseLength.isCustomized()) {
            TempResponseLength.restore(api);
            TempResponseLength.removeEventHook(api, eventHook);
        }
    }
}

/**
 * Removes last message from the chat DOM.
 * @returns {Promise<void>} Resolves when the message is removed.
 */
function removeLastMessage() {
    return new Promise((resolve) => {
        const lastMes = chatElement.children('.mes').last();
        if (lastMes.length === 0) {
            return resolve();
        }
        lastMes.hide(animation_duration, function () {
            $(this).remove();
            resolve();
        });
    });
}

/**
 * @typedef {object} JsonSchema
 * @property {string} name Name of the schema.
 * @property {object} value JSON schema value.
 * @property {string} [description] Description of the schema.
 * @property {boolean} [strict] If true, the schema will be used in strict mode, meaning that only the fields defined in the schema will be allowed.
 *
 * @typedef {object} GenerateOptions
 * @property {boolean} [automatic_trigger] If the generation was triggered automatically (e.g. group auto mode).
 * @property {boolean} [force_name2] If a char name should be forced to add to the prompt's last line (Text Completion, non-Instruct only).
 * @property {string} [quiet_prompt] A system instruction to use for the quiet prompt.
 * @property {boolean} [quietToLoud] Whether the system instruction should be sent in background (quiet) or a foreground (loud) mode.
 * @property {boolean} [skipWIAN] Skip adding World Info and Author's Note to the prompt.
 * @property {number} [force_chid] Force character ID to use for the generation. Only works in groups.
 * @property {AbortSignal} [signal] Abort signal to cancel the generation. If not provided, will create a new AbortController.
 * @property {string} [quietImage] Image URL to use for the quiet prompt (defaults to empty string)
 * @property {string} [quietName] Name to use for the quiet prompt (defaults to "System:")
 * @property {number} [depth] Recursion depth for the generation. Used to prevent infinite loops in tool calls.
 * @property {JsonSchema} [jsonSchema] JSON schema to use for the structured generation. Usually requires a special instruction.
 */

/**
 * MARK:Generate()
 * Runs a generation using the current chat context.
 * @param {string} type Generation type
 * @param {GenerateOptions} options Generation options
 * @param {boolean} dryRun Whether to actually generate a message or just assemble the prompt
 * @returns {Promise<any>} Returns a promise that resolves when the text is done generating.
 */
export async function Generate(type, { automatic_trigger, force_name2, quiet_prompt, quietToLoud, skipWIAN, force_chid, signal, quietImage, quietName, jsonSchema = null, depth = 0 } = {}, dryRun = false) { stTrack('Generate'); // @st-tracked
    console.log('Generate entered');
    setGenerationProgress(0);
    _set_ce_generation_started(new Date());

    // Prevent generation from shallow characters
    await unshallowCharacter(this_chid);

    // Occurs every time, even if the generation is aborted due to slash commands execution
    await eventSource.emit(event_types.GENERATION_STARTED, type, { automatic_trigger, force_name2, quiet_prompt, quietToLoud, skipWIAN, force_chid, signal, quietImage }, dryRun);

    // Don't recreate abort controller if signal is passed
    if (!(abortController && signal)) {
        abortController = new AbortController();
    }

    // OpenAI doesn't need instruct mode. Use OAI main prompt instead.
    const isInstruct = power_user.instruct.enabled && main_api !== 'openai';
    const isImpersonate = type == 'impersonate';

    if (!(dryRun || depth || type == 'regenerate' || type == 'swipe' || type == 'quiet')) {
        const interruptedByCommand = await processCommands(String($('#send_textarea').val()));

        if (interruptedByCommand) {
            //$("#send_textarea").val('')[0].dispatchEvent(new Event('input', { bubbles:true }));
            unblockGeneration(type);
            return Promise.resolve();
        }
    }

    // Occurs only if the generation is not aborted due to slash commands execution
    await eventSource.emit(event_types.GENERATION_AFTER_COMMANDS, type, { automatic_trigger, force_name2, quiet_prompt, quietToLoud, skipWIAN, force_chid, signal, quietImage }, dryRun);

    if (main_api == 'kobold' && kai_settings.streaming_kobold && !kai_flags.can_use_streaming) {
        toastr.error(t`Streaming is enabled, but the version of Kobold used does not support token streaming.`, undefined, { timeOut: 10000, preventDuplicates: true });
        unblockGeneration(type);
        return Promise.resolve();
    }

    if (isHordeGenerationNotAllowed()) {
        unblockGeneration(type);
        return Promise.resolve();
    }

    if (!dryRun) {
        // Ping server to make sure it is still alive
        const pingResult = await pingServer();

        if (!pingResult) {
            unblockGeneration(type);
            toastr.error(t`Verify that the server is running and accessible.`, t`ST Server cannot be reached`);
            throw new Error('Server unreachable');
        }

        // Hide swipes if not in a dry run.
        hideSwipeButtons();
        // If generated any message, set the flag to indicate it can't be recreated again.
        chat_metadata.tainted = true;
    }

    if (selected_group && !is_group_generating) {
        if (!dryRun) {
            // Returns the promise that generateGroupWrapper returns; resolves when generation is done
            return generateGroupWrapper(false, type, { quiet_prompt, force_chid, signal: abortController.signal, quietImage });
        }

        const characterIndexMap = new Map(characters.map((char, index) => [char.avatar, index]));
        const group = groups.find((x) => x.id === selected_group);

        const enabledMembers = group.members.reduce((acc, member) => {
            if (!group.disabled_members.includes(member) && !acc.includes(member)) {
                acc.push(member);
            }
            return acc;
        }, []);

        const memberIds = enabledMembers
            .map((member) => characterIndexMap.get(member))
            .filter((index) => index !== undefined && index !== null);

        if (memberIds.length > 0) {
            if (menu_type != 'character_edit') setCharacterId(memberIds[0]);
            setCharacterName('');
        } else {
            console.log('No enabled members found');
            unblockGeneration(type);
            return Promise.resolve();
        }
    }

    //#########QUIET PROMPT STUFF##############
    //this function just gives special care to novel quiet instruction prompts
    if (quiet_prompt) {
        quiet_prompt = substituteParams(quiet_prompt);
        quiet_prompt = main_api == 'novel' && !quietToLoud ? adjustNovelInstructionPrompt(quiet_prompt) : quiet_prompt;
    }

    const hasBackendConnection = online_status !== 'no_connection';

    // We can't do anything because we're not in a chat right now. (Unless it's a dry run, in which case we need to
    // assemble the prompt so we can count its tokens regardless of whether a chat is active.)
    if (!dryRun && !hasBackendConnection) {
        _set_is_send_press(false);
        return Promise.resolve();
    }

    const lastMessage = chat[chat.length - 1];

    let textareaText;
    if (type !== 'regenerate' && type !== 'swipe' && type !== 'quiet' && !isImpersonate && !dryRun && !depth) {
        _set_is_send_press(true);
        textareaText = String($('#send_textarea').val());
        $('#send_textarea').val('')[0].dispatchEvent(new Event('input', { bubbles: true }));
    } else {
        textareaText = '';
        if (chat.length && lastMessage.is_user) {
            //do nothing? why does this check exist?
        }
        else if (type !== 'quiet' && type !== 'swipe' && !isImpersonate && !dryRun && !depth && chat.length) {
            deleteItemizedPromptForMessage(chat.length - 1);
            chat.length = chat.length - 1;
            await removeLastMessage();
            await eventSource.emit(event_types.MESSAGE_DELETED, chat.length);
        }
    }

    const isContinue = type == 'continue';

    // Rewrite the generation timer to account for the time passed for all the continuations.
    if (isContinue && chat.length) {
        const prevFinished = lastMessage.gen_finished;
        const prevStarted = lastMessage.gen_started;

        if (prevFinished && prevStarted) {
            const timePassed = Number(prevFinished) - Number(prevStarted);
            _set_ce_generation_started(new Date(Date.now() - timePassed));
            lastMessage.gen_started = generation_started;
        }
    }

    if (!dryRun) {
        deactivateSendButtons();
    }

    let { messageBias, promptBias, isUserPromptBias } = getBiasStrings(textareaText, type);

    //*********************************
    //PRE FORMATING STRING
    //*********************************

    // These generation types should not attach pending files to the chat
    const noAttachTypes = [
        'regenerate',
        'swipe',
        'impersonate',
        'quiet',
        'continue',
    ];
    //for normal messages sent from user..
    if ((textareaText != '' || (hasPendingFileAttachment() && !noAttachTypes.includes(type))) && !automatic_trigger && type !== 'quiet' && !dryRun && !depth) {
        // If user message contains no text other than bias - send as a system message
        if (messageBias && !removeMacros(textareaText)) {
            sendSystemMessage(system_message_types.GENERIC, ' ', { bias: messageBias });
        }
        else {
            await sendMessageAsUser(textareaText, messageBias);
        }
    }
    else if (textareaText == '' && !automatic_trigger && !dryRun && [undefined, 'normal'].includes(type) && main_api == 'openai' && oai_settings.send_if_empty.trim().length > 0 && !depth) {
        // Use send_if_empty if set and the user message is empty. Only when sending messages normally
        await sendMessageAsUser(oai_settings.send_if_empty.trim(), messageBias);
    }

    let {
        description,
        personality,
        persona,
        scenario,
        mesExamples,
        system,
        jailbreak,
        charDepthPrompt,
        creatorNotes,
    } = getCharacterCardFields();

    // Depth prompt (character-specific A/N)
    removeDepthPrompts();
    const groupDepthPrompts = getGroupDepthPrompts(selected_group, Number(this_chid));

    if (selected_group && Array.isArray(groupDepthPrompts) && groupDepthPrompts.length > 0) {
        groupDepthPrompts.forEach((value, index) => {
            const role = getExtensionPromptRoleByName(value.role);
            setExtensionPrompt(inject_ids.DEPTH_PROMPT_INDEX(index), value.text, extension_prompt_types.IN_CHAT, value.depth, extension_settings.note.allowWIScan, role);
        });
    } else {
        const depthPromptText = charDepthPrompt || '';
        const depthPromptDepth = characters[this_chid]?.data?.extensions?.depth_prompt?.depth ?? depth_prompt_depth_default;
        const depthPromptRole = getExtensionPromptRoleByName(characters[this_chid]?.data?.extensions?.depth_prompt?.role ?? depth_prompt_role_default);
        setExtensionPrompt(inject_ids.DEPTH_PROMPT, depthPromptText, extension_prompt_types.IN_CHAT, depthPromptDepth, extension_settings.note.allowWIScan, depthPromptRole);
    }

    // First message in fresh 1-on-1 chat reacts to user/character settings changes
    if (chat.length) {
        chat[0].mes = substituteParams(chat[0].mes);
    }

    // Collect messages with usable content
    const canUseTools = ToolManager.isToolCallingSupported();
    const canPerformToolCalls = !dryRun && ToolManager.canPerformToolCalls(type) && depth < ToolManager.RECURSE_LIMIT;
    let coreChat = chat.filter(x => !x.is_system || (canUseTools && Array.isArray(x.extra?.tool_invocations)));
    if (type === 'swipe') {
        coreChat.pop();
    }

    coreChat = await Promise.all(coreChat.map(async (/** @type {ChatMessage} */ chatItem, index) => {
        let message = chatItem.mes;
        let regexType = chatItem.is_user ? regex_placement.USER_INPUT : regex_placement.AI_OUTPUT;
        let options = { isPrompt: true, depth: (coreChat.length - index - (isContinue ? 2 : 1)) };

        let regexedMessage = getRegexedString(message, regexType, options);
        regexedMessage = await appendFileContent(chatItem, regexedMessage);

        const titles = [];
        if (chatItem?.extra?.append_title && chatItem?.extra?.title) {
            titles.push(chatItem.extra.title);
        }
        if (Array.isArray(chatItem?.extra?.media)) {
            for (const mediaItem of chatItem.extra.media) {
                if (mediaItem?.title && mediaItem?.append_title) {
                    titles.push(mediaItem.title);
                }
            }
        }
        if (titles.length > 0) {
            regexedMessage = `${regexedMessage}\n\n${titles.join('\n\n')}`;
        }

        return {
            ...chatItem,
            mes: regexedMessage,
            index,
        };
    }));

    const promptReasoning = new PromptReasoning();
    for (let i = coreChat.length - 1; i >= 0; i--) {
        const depth = coreChat.length - i - (isContinue ? 2 : 1);
        const isPrefix = isContinue && i === coreChat.length - 1;
        coreChat[i] = {
            ...coreChat[i],
            mes: promptReasoning.addToMessage(
                coreChat[i].mes,
                getRegexedString(
                    String(coreChat[i].extra?.reasoning ?? ''),
                    regex_placement.REASONING,
                    { isPrompt: true, depth: depth },
                ),
                isPrefix,
                coreChat[i].extra?.reasoning_duration,
            ),
        };
        if (promptReasoning.isLimitReached()) {
            break;
        }
    }

    // Determine token limit
    let this_max_context = getMaxContextSize();

    if (!dryRun) {
        console.debug('Running extension interceptors');
        const aborted = await runGenerationInterceptors(coreChat, this_max_context, type);

        if (aborted) {
            console.debug('Generation aborted by extension interceptors');
            unblockGeneration(type);
            return Promise.resolve();
        }
    } else {
        console.debug('Skipping extension interceptors for dry run');
    }

    // Adjust token limit for Horde
    let adjustedParams;
    if (main_api == 'koboldhorde' && (horde_settings.auto_adjust_context_length || horde_settings.auto_adjust_response_length)) {
        try {
            adjustedParams = await adjustHordeGenerationParams(max_context, amount_gen);
        }
        catch {
            unblockGeneration(type);
            return Promise.resolve();
        }
        if (horde_settings.auto_adjust_context_length) {
            this_max_context = (adjustedParams.maxContextLength - adjustedParams.maxLength);
        }
    }

    // Fetches the combined prompt for both negative and positive prompts
    const cfgGuidanceScale = getGuidanceScale();
    const useCfgPrompt = cfgGuidanceScale && cfgGuidanceScale.value !== 1;

    // Adjust max context based on CFG prompt to prevent overfitting
    if (useCfgPrompt) {
        const negativePrompt = getCfgPrompt(cfgGuidanceScale, true, true)?.value || '';
        const positivePrompt = getCfgPrompt(cfgGuidanceScale, false, true)?.value || '';
        if (negativePrompt || positivePrompt) {
            const previousMaxContext = this_max_context;
            const [negativePromptTokenCount, positivePromptTokenCount] = await Promise.all([getTokenCountAsync(negativePrompt), getTokenCountAsync(positivePrompt)]);
            const decrement = Math.max(negativePromptTokenCount, positivePromptTokenCount);
            this_max_context -= decrement;
            console.log(`Max context reduced by ${decrement} tokens of CFG prompt (${previousMaxContext} -> ${this_max_context})`);
        }
    }

    console.log(`Core/all messages: ${coreChat.length}/${chat.length}`);

    if ((promptBias && !isUserPromptBias) || power_user.always_force_name2 || main_api == 'novel') {
        force_name2 = true;
    }

    if (isImpersonate) {
        force_name2 = false;
    }

    let mesExamplesArray = parseMesExamples(mesExamples, isInstruct);

    // Set non-WI AN
    setFloatingPrompt();

    // Add WI to prompt (and also inject WI to AN value via hijack)
    // Make quiet prompt available for WIAN
    setExtensionPrompt(inject_ids.QUIET_PROMPT, quiet_prompt || '', extension_prompt_types.IN_PROMPT, 0, true);
    const chatForWI = coreChat.map(x => world_info_include_names ? `${x.name}: ${x.mes}` : x.mes).reverse();
    /** @type {import('./scripts/world-info.js').WIGlobalScanData} */
    const globalScanData = {
        personaDescription: persona,
        characterDescription: description,
        characterPersonality: personality,
        characterDepthPrompt: charDepthPrompt,
        scenario: scenario,
        creatorNotes: creatorNotes,
        trigger: GENERATION_TYPE_TRIGGERS.includes(type) ? type : 'normal',
    };
    const { worldInfoString, worldInfoBefore, worldInfoAfter, worldInfoExamples, worldInfoDepth, outletEntries } = await getWorldInfoPrompt(chatForWI, this_max_context, dryRun, globalScanData);
    setExtensionPrompt(inject_ids.QUIET_PROMPT, '', extension_prompt_types.IN_PROMPT, 0, true);

    // Add message example WI
    for (const example of worldInfoExamples) {
        const exampleMessage = example.content;

        if (exampleMessage.length === 0) {
            continue;
        }

        const formattedExample = baseChatReplace(exampleMessage);
        const cleanedExample = parseMesExamples(formattedExample, isInstruct);

        // Insert depending on before or after position
        if (example.position === wi_anchor_position.before) {
            mesExamplesArray.unshift(...cleanedExample);
        } else {
            mesExamplesArray.push(...cleanedExample);
        }
    }

    // At this point, the raw message examples can be created
    const mesExamplesRawArray = [...mesExamplesArray];

    if (mesExamplesArray && isInstruct) {
        mesExamplesArray = formatInstructModeExamples(mesExamplesArray, name1, name2);
    }

    if (skipWIAN !== true) {
        console.log('skipWIAN not active, adding WIAN');
        // Add all depth WI entries to prompt
        flushWIInjections();
        if (Array.isArray(worldInfoDepth)) {
            worldInfoDepth.forEach((e) => {
                const joinedEntries = e.entries.join('\n');
                setExtensionPrompt(inject_ids.CUSTOM_WI_DEPTH_ROLE(e.depth, e.role), joinedEntries, extension_prompt_types.IN_CHAT, e.depth, false, e.role);
            });
        }
        if (outletEntries && typeof outletEntries === 'object' && Object.keys(outletEntries).length > 0) {
            Object.entries(outletEntries).forEach(([key, value]) => {
                setExtensionPrompt(inject_ids.CUSTOM_WI_OUTLET(key), value.join('\n'), extension_prompt_types.NONE, 0);
            });
        }
    } else {
        console.log('skipping WIAN');
    }

    // Add persona description to prompt
    addPersonaDescriptionExtensionPrompt();

    // Prepare the system prompt for Text Completion APIs
    if (main_api !== 'openai') {
        if (power_user.sysprompt.enabled) {
            system = power_user.prefer_character_prompt && system
                ? substituteParams(system, { original: power_user.sysprompt.content ?? '' })
                : baseChatReplace(power_user.sysprompt.content);
            system = isInstruct ? substituteParams(system, { original: power_user.sysprompt.content ?? '' }) : system;
        } else {
            // Nullify if it's not enabled
            system = '';
        }
    }

    // Collect before / after story string injections
    const beforeScenarioAnchor = await getExtensionPrompt(extension_prompt_types.BEFORE_PROMPT);
    const afterScenarioAnchor = await getExtensionPrompt(extension_prompt_types.IN_PROMPT);

    const storyStringParams = {
        description: description,
        personality: personality,
        persona: power_user.persona_description_position == persona_description_positions.IN_PROMPT ? persona : '',
        scenario: scenario,
        system: system,
        char: name2,
        user: name1,
        wiBefore: worldInfoBefore,
        wiAfter: worldInfoAfter,
        loreBefore: worldInfoBefore,
        loreAfter: worldInfoAfter,
        anchorBefore: beforeScenarioAnchor.trim(),
        anchorAfter: afterScenarioAnchor.trim(),
        mesExamples: mesExamplesArray.join(''),
        mesExamplesRaw: mesExamplesRawArray.join(''),
    };

    // Render the story string and combine with injections
    const storyString = renderStoryString(storyStringParams);
    let combinedStoryString = isInstruct ? formatInstructModeStoryString(storyString) : storyString;

    // Inject the story string as in-chat prompt (if needed)
    const applyStoryStringInject = main_api !== 'openai' && power_user.context.story_string_position === extension_prompt_types.IN_CHAT;
    if (applyStoryStringInject) {
        const depth = power_user.context.story_string_depth ?? 1;
        const role = power_user.context.story_string_role ?? extension_prompt_roles.SYSTEM;
        setExtensionPrompt(inject_ids.STORY_STRING, combinedStoryString, extension_prompt_types.IN_CHAT, depth, false, role);
        // Remove to prevent duplication
        combinedStoryString = '';
    } else {
        setExtensionPrompt(inject_ids.STORY_STRING, '', extension_prompt_types.IN_CHAT, 0);
    }

    // Story string rendered, safe to remove
    if (power_user.strip_examples) {
        mesExamplesArray = [];
    }

    // Inject all Depth prompts. Chat Completion does it separately
    let injectedIndices = [];
    if (main_api !== 'openai') {
        injectedIndices = await doChatInject(coreChat, isContinue);
    }

    if (main_api !== 'openai' && power_user.sysprompt.enabled) {
        jailbreak = power_user.prefer_character_jailbreak && jailbreak
            ? substituteParams(jailbreak, { original: power_user.sysprompt.post_history ?? '' })
            : baseChatReplace(power_user.sysprompt.post_history);

        // Only inject the jb if there is one
        if (jailbreak) {
            // When continuing generation of previous output, last user message precedes the message to continue
            if (isContinue) {
                coreChat.splice(coreChat.length - 1, 0, { mes: jailbreak, is_user: true });
            }
            else {
                // This operation will result in the injectedIndices indexes being off by one
                coreChat.push({ mes: jailbreak, is_user: true });
                // Add +1 to the elements to correct for the new PHI/Jailbreak message.
                injectedIndices.forEach(shiftUpByOne);
            }
        }
    }

    let chat2 = [];
    let continue_mag = '';
    let userMessageIndices = [];
    const lastUserMessageIndex = coreChat.findLastIndex(x => x.is_user);

    for (let i = coreChat.length - 1, j = 0; i >= 0; i--, j++) {
        if (main_api == 'openai') {
            chat2[i] = coreChat[j].mes;
            if (i === 0 && isContinue) {
                chat2[i] = chat2[i].slice(0, chat2[i].lastIndexOf(coreChat[j].mes) + coreChat[j].mes.length);
                continue_mag = coreChat[j].mes;
            }
            continue;
        }

        chat2[i] = formatMessageHistoryItem(coreChat[j], isInstruct, false);

        if (j === 0 && isInstruct) {
            // Reformat with the first output sequence (if any)
            chat2[i] = formatMessageHistoryItem(coreChat[j], isInstruct, force_output_sequence.FIRST);
        }

        if (lastUserMessageIndex >= 0 && j === lastUserMessageIndex && isInstruct) {
            // Reformat with the last input sequence (if any)
            chat2[i] = formatMessageHistoryItem(coreChat[j], isInstruct, force_output_sequence.LAST);
        }

        // Do not suffix the message for continuation
        if (i === 0 && isContinue) {
            // Pick something that's very unlikely to be in a message
            const FORMAT_TOKEN = '\u0000\ufffc\u0000\ufffd';

            if (isInstruct) {
                const originalMessage = String(coreChat[j].mes ?? '');
                coreChat[j].mes = originalMessage.replaceAll(FORMAT_TOKEN, '') + FORMAT_TOKEN;
                // Reformat with the last output sequence (if any)
                chat2[i] = formatMessageHistoryItem(coreChat[j], isInstruct, force_output_sequence.LAST);
                coreChat[j].mes = originalMessage;
            }

            chat2[i] = chat2[i].includes(FORMAT_TOKEN)
                ? chat2[i].slice(0, chat2[i].lastIndexOf(FORMAT_TOKEN))
                : chat2[i].slice(0, chat2[i].lastIndexOf(coreChat[j].mes) + coreChat[j].mes.length);
            continue_mag = coreChat[j].mes;
        }

        if (coreChat[j].is_user) {
            userMessageIndices.push(i);
        }
    }

    let addUserAlignment = isInstruct && power_user.instruct.user_alignment_message;
    let userAlignmentMessage = '';

    if (addUserAlignment) {
        const alignmentMessage = {
            name: name1,
            mes: substituteParams(power_user.instruct.user_alignment_message),
            is_user: true,
        };
        userAlignmentMessage = formatMessageHistoryItem(alignmentMessage, isInstruct, force_output_sequence.FIRST);
    }

    let oaiMessages = [];
    let oaiMessageExamples = [];

    if (main_api === 'openai') {
        oaiMessages = setOpenAIMessages(coreChat);
        oaiMessageExamples = setOpenAIMessageExamples(mesExamplesArray);
    }

    // hack for regeneration of the first message
    if (chat2.length == 0) {
        chat2.push('');
    }

    let examplesString = '';
    let chatString = addChatsPreamble(addChatsSeparator(''));
    let cyclePrompt = '';

    async function getMessagesTokenCount() {
        const encodeString = [
            combinedStoryString,
            examplesString,
            userAlignmentMessage,
            chatString,
            modifyLastPromptLine(''),
            cyclePrompt,
        ].join('').replace(/\r/gm, '');
        return getTokenCountAsync(encodeString, power_user.token_padding);
    }

    // Force pinned examples into the context
    let pinExmString;
    if (power_user.pin_examples) {
        pinExmString = examplesString = mesExamplesArray.join('');
    }

    // Only add the chat in context if past the greeting message
    if (isContinue && (chat2.length > 1 || main_api === 'openai')) {
        cyclePrompt = chat2.shift();
        // Adjust indices to account for the shift
        injectedIndices = injectedIndices.map(shiftDownByOne).filter(x => x >= 0);
        userMessageIndices = userMessageIndices.map(shiftDownByOne).filter(x => x >= 0);
    }

    // Collect enough messages to fill the context
    let arrMes = new Array(chat2.length);
    let tokenCount = await getMessagesTokenCount();
    let lastAddedIndex = 0;

    // Pre-allocate all injections first.
    // If it doesn't fit - user shot himself in the foot
    for (const index of injectedIndices) {
        // not needed for OAI prompting
        if (main_api == 'openai') {
            break;
        }

        const item = chat2[index];

        if (typeof item !== 'string') {
            continue;
        }

        tokenCount += await getTokenCountAsync(item.replace(/\r/gm, ''));
        if (tokenCount < this_max_context) {
            chatString = chatString + item;
            arrMes[index] = item;
            lastAddedIndex = Math.max(lastAddedIndex, index);
        } else {
            break;
        }
    }

    for (let i = 0; i < chat2.length; i++) {
        // not needed for OAI prompting
        if (main_api == 'openai') {
            break;
        }

        // Skip already injected messages
        if (arrMes[i] !== undefined) {
            continue;
        }

        const item = chat2[i];

        if (typeof item !== 'string') {
            continue;
        }

        tokenCount += await getTokenCountAsync(item.replace(/\r/gm, ''));
        if (tokenCount < this_max_context) {
            chatString = chatString + item;
            arrMes[i] = item;
            lastAddedIndex = Math.max(lastAddedIndex, i);
        } else {
            break;
        }
    }

    // Add user alignment message if last message is not a user message
    const stoppedAtUser = userMessageIndices.includes(lastAddedIndex);
    if (addUserAlignment && !stoppedAtUser) {
        tokenCount += await getTokenCountAsync(userAlignmentMessage.replace(/\r/gm, ''));
        chatString = userAlignmentMessage + chatString;
        arrMes.push(userAlignmentMessage);
        injectedIndices.push(arrMes.length - 1);
    }

    // Unsparse the array. Adjust injected indices
    const newArrMes = [];
    const newInjectedIndices = [];
    for (let i = 0; i < arrMes.length; i++) {
        if (arrMes[i] !== undefined) {
            newArrMes.push(arrMes[i]);
            if (injectedIndices.includes(i)) {
                newInjectedIndices.push(newArrMes.length - 1);
            }
        }
    }

    arrMes = newArrMes;
    injectedIndices = newInjectedIndices;

    if (main_api !== 'openai') {
        setInContextMessages(arrMes.length - injectedIndices.length, type);
    }

    // Estimate how many unpinned example messages fit in the context
    tokenCount = await getMessagesTokenCount();
    let count_exm_add = 0;
    if (!power_user.pin_examples) {
        for (let example of mesExamplesArray) {
            tokenCount += await getTokenCountAsync(example.replace(/\r/gm, ''));
            examplesString += example;
            if (tokenCount < this_max_context) {
                count_exm_add++;
            } else {
                break;
            }
        }
    }

    let mesSend = [];
    console.debug('calling runGenerate');

    if (isContinue) {
        // Coping mechanism for OAI spacing
        if (main_api === 'openai' && !cyclePrompt.endsWith(' ')) {
            cyclePrompt += oai_settings.continue_postfix;
            continue_mag += oai_settings.continue_postfix;
        }
    }

    const originalType = type;

    if (!dryRun) {
        _set_is_send_press(true);
    }

    let generatedPromptCache = cyclePrompt || '';
    if (generatedPromptCache.length == 0 || type === 'continue') {
        console.debug('generating prompt');
        chatString = '';
        arrMes = arrMes.reverse();
        arrMes.forEach(function (item, i, arr) {
            // OAI doesn't need all of this
            if (main_api === 'openai') {
                return;
            }

            // Cohee: This removes a newline from the end of the last message in the context
            // Last prompt line will add a newline if it's not a continuation
            // In instruct mode it only removes it if wrap is enabled and it's not a quiet generation
            if (i === arrMes.length - 1 && type !== 'continue') {
                if (!isInstruct || (power_user.instruct.wrap && type !== 'quiet')) {
                    item = item.replace(/\n?$/, '');
                }
            }

            mesSend[mesSend.length] = { message: item, extensionPrompts: [] };
        });
    }

    let mesExmString = '';

    function setPromptString() {
        if (main_api == 'openai') {
            return;
        }

        console.debug('--setting Prompt string');
        mesExmString = pinExmString ?? mesExamplesArray.slice(0, count_exm_add).join('');

        if (mesSend.length) {
            mesSend[mesSend.length - 1].message = modifyLastPromptLine(mesSend[mesSend.length - 1].message);
        }
    }

    function modifyLastPromptLine(lastMesString) {
        //#########QUIET PROMPT STUFF PT2##############

        // Add quiet generation prompt at depth 0
        if (quiet_prompt && quiet_prompt.length) {

            // here name1 is forced for all quiet prompts..why?
            const name = name1;
            //checks if we are in instruct, if so, formats the chat as such, otherwise just adds the quiet prompt
            const quietAppend = isInstruct ? formatInstructModeChat(name, quiet_prompt, false, true, '', name1, name2, false) : `\n${quiet_prompt}`;

            //This begins to fix quietPrompts (particularly /sysgen) for instruct
            //previously instruct input sequence was being appended to the last chat message w/o '\n'
            //and no output sequence was added after the input's content.
            //TODO: respect output_sequence vs last_output_sequence settings
            //TODO: decide how to prompt this to clarify who is talking 'Narrator', 'System', etc.
            if (isInstruct) {
                lastMesString += quietAppend; // + power_user.instruct.output_sequence + '\n';
            } else {
                lastMesString += quietAppend;
            }


            // Ross: bailing out early prevents quiet prompts from respecting other instruct prompt toggles
            // for sysgen, SD, and summary this is desireable as it prevents the AI from responding as char..
            // but for idle prompting, we want the flexibility of the other prompt toggles, and to respect them as per settings in the extension
            // need a detection for what the quiet prompt is being asked for...

            // Bail out early?
            if (!isInstruct && !quietToLoud) {
                return lastMesString;
            }
        }


        // Get instruct mode line
        if (isInstruct && !isContinue) {
            const name = (quiet_prompt && !quietToLoud && !isImpersonate) ? (quietName ?? 'System') : (isImpersonate ? name1 : name2);
            const isQuiet = quiet_prompt && type == 'quiet';
            lastMesString += formatInstructModePrompt(name, isImpersonate, promptBias, name1, name2, isQuiet, quietToLoud);
        }

        // Get non-instruct impersonation line
        if (!isInstruct && isImpersonate && !isContinue) {
            const name = name1;
            if (!lastMesString.endsWith('\n')) {
                lastMesString += '\n';
            }
            lastMesString += name + ':';
        }

        // Add character's name
        // Force name append on continue (if not continuing on user message or first message)
        const isContinuingOnFirstMessage = chat.length === 1 && isContinue;
        if (!isInstruct && force_name2 && !isContinuingOnFirstMessage) {
            if (!lastMesString.endsWith('\n')) {
                lastMesString += '\n';
            }
            if (!isContinue || !(chat[chat.length - 1]?.is_user)) {
                lastMesString += `${name2}:`;
            }
        }

        return lastMesString;
    }

    async function checkPromptSize() {
        console.debug('---checking Prompt size');
        setPromptString();
        const jointMessages = mesSend.map((e) => `${e.extensionPrompts.join('')}${e.message}`).join('');
        const prompt = [
            combinedStoryString,
            mesExmString,
            addChatsPreamble(addChatsSeparator(jointMessages)),
            '\n',
            modifyLastPromptLine(''),
            generatedPromptCache,
        ].join('').replace(/\r/gm, '');
        let thisPromptContextSize = await getTokenCountAsync(prompt, power_user.token_padding);

        if (thisPromptContextSize > this_max_context) {        //if the prepared prompt is larger than the max context size...
            if (count_exm_add > 0) {                            // ..and we have example messages..
                count_exm_add--;                            // remove the example messages...
                await checkPromptSize();                            // and try agin...
            } else if (mesSend.length > 0) {                    // if the chat history is longer than 0
                mesSend.shift();                            // remove the first (oldest) chat entry..
                await checkPromptSize();                            // and check size again..
            } else {
                //end
                console.debug(`---mesSend.length = ${mesSend.length}`);
            }
        }
    }

    if (generatedPromptCache.length > 0 && main_api !== 'openai') {
        console.debug('---Generated Prompt Cache length: ' + generatedPromptCache.length);
        await checkPromptSize();
    } else {
        console.debug('---calling setPromptString ' + generatedPromptCache.length);
        setPromptString();
    }

    // For prompt bit itemization
    let mesSendString = '';

    async function getCombinedPrompt(isNegative) {
        // Only return if the guidance scale doesn't exist or the value is 1
        // Also don't return if constructing the neutral prompt
        if (isNegative && !useCfgPrompt) {
            return;
        }

        // OAI has its own prompt manager. No need to do anything here
        if (main_api === 'openai') {
            return '';
        }

        // Deep clone
        let finalMesSend = structuredClone(mesSend);

        if (useCfgPrompt) {
            const cfgPrompt = getCfgPrompt(cfgGuidanceScale, isNegative);
            if (cfgPrompt.value) {
                if (cfgPrompt.depth === 0) {
                    finalMesSend[finalMesSend.length - 1].message +=
                        /\s/.test(finalMesSend[finalMesSend.length - 1].message.slice(-1))
                            ? cfgPrompt.value
                            : ` ${cfgPrompt.value}`;
                } else {
                    // TODO: Make all extension prompts use an array/splice method
                    const lengthDiff = mesSend.length - cfgPrompt.depth;
                    const cfgDepth = lengthDiff >= 0 ? lengthDiff : 0;
                    const cfgMessage = finalMesSend[cfgDepth];
                    if (cfgMessage) {
                        if (!Array.isArray(finalMesSend[cfgDepth].extensionPrompts)) {
                            finalMesSend[cfgDepth].extensionPrompts = [];
                        }
                        finalMesSend[cfgDepth].extensionPrompts.push(`${cfgPrompt.value}\n`);
                    }
                }
            }
        }

        // Add prompt bias after everything else
        // Always run with continue
        if (!isInstruct && !isImpersonate) {
            if (promptBias.trim().length !== 0) {
                finalMesSend[finalMesSend.length - 1].message +=
                    /\s/.test(finalMesSend[finalMesSend.length - 1].message.slice(-1))
                        ? promptBias.trimStart()
                        : ` ${promptBias.trimStart()}`;
            }
        }

        // Flattens the multiple prompt objects to a string.
        const combine = () => {
            // Right now, everything is suffixed with a newline
            mesSendString = finalMesSend.map((e) => `${e.extensionPrompts.join('')}${e.message}`).join('');

            // add a custom dingus (if defined)
            mesSendString = addChatsSeparator(mesSendString);

            // add chat preamble
            mesSendString = addChatsPreamble(mesSendString);

            let combinedPrompt = [
                combinedStoryString,
                mesExmString,
                mesSendString,
                generatedPromptCache,
            ].join('').replace(/\r/gm, '');

            if (power_user.collapse_newlines) {
                combinedPrompt = collapseNewlines(combinedPrompt);
            }

            return combinedPrompt;
        };

        finalMesSend.forEach((item, i) => {
            item.injected = injectedIndices.includes(finalMesSend.length - i - 1);
        });

        let data = {
            api: main_api,
            combinedPrompt: null,
            description,
            personality,
            persona,
            scenario,
            char: name2,
            user: name1,
            worldInfoBefore,
            worldInfoAfter,
            beforeScenarioAnchor,
            afterScenarioAnchor,
            storyString,
            mesExmString,
            mesSendString,
            finalMesSend,
            generatedPromptCache,
            main: system,
            jailbreak,
            naiPreamble: nai_settings.preamble,
        };

        // Before returning the combined prompt, give available context related information to all subscribers.
        await eventSource.emit(event_types.GENERATE_BEFORE_COMBINE_PROMPTS, data);

        // If one or multiple subscribers return a value, forfeit the responsibillity of flattening the context.
        return !data.combinedPrompt ? combine() : data.combinedPrompt;
    }

    let finalPrompt = await getCombinedPrompt(false);

    const eventData = { prompt: finalPrompt, dryRun: dryRun };
    await eventSource.emit(event_types.GENERATE_AFTER_COMBINE_PROMPTS, eventData);
    finalPrompt = eventData.prompt;

    let maxLength = Number(amount_gen); // how many tokens the AI will be requested to generate
    let thisPromptBits = [];

    let generate_data;
    switch (main_api) {
        case 'koboldhorde':
        case 'kobold':
            if (main_api == 'koboldhorde' && horde_settings.auto_adjust_response_length) {
                maxLength = Math.min(maxLength, adjustedParams.maxLength);
                maxLength = Math.max(maxLength, MIN_LENGTH); // prevent validation errors
            }

            generate_data = {
                prompt: finalPrompt,
                gui_settings: true,
                max_length: maxLength,
                max_context_length: max_context,
                api_server: kai_settings.api_server,
            };

            if (kai_settings.preset_settings != 'gui') {
                const isHorde = main_api == 'koboldhorde';
                const presetSettings = koboldai_settings[koboldai_setting_names[kai_settings.preset_settings]];
                const maxContext = (adjustedParams && horde_settings.auto_adjust_context_length) ? adjustedParams.maxContextLength : max_context;
                generate_data = getKoboldGenerationData(finalPrompt, presetSettings, maxLength, maxContext, isHorde, type);
            }
            break;
        case 'textgenerationwebui': {
            const cfgValues = useCfgPrompt ? { guidanceScale: cfgGuidanceScale, negativePrompt: await getCombinedPrompt(true) } : null;
            generate_data = await getTextGenGenerationData(finalPrompt, maxLength, isImpersonate, isContinue, cfgValues, type);
            break;
        }
        case 'novel': {
            const cfgValues = useCfgPrompt ? { guidanceScale: cfgGuidanceScale } : null;
            const presetSettings = novelai_settings[novelai_setting_names[nai_settings.preset_settings_novel]];
            generate_data = getNovelGenerationData(finalPrompt, presetSettings, maxLength, isImpersonate, isContinue, cfgValues, type);
            break;
        }
        case 'openai': {
            let [prompt, counts] = await prepareOpenAIMessages({
                name2: name2,
                charDescription: description,
                charPersonality: personality,
                scenario: scenario,
                worldInfoBefore: worldInfoBefore,
                worldInfoAfter: worldInfoAfter,
                extensionPrompts: extension_prompts,
                bias: promptBias,
                type: type,
                quietPrompt: quiet_prompt,
                quietImage: quietImage,
                cyclePrompt: cyclePrompt,
                systemPromptOverride: system,
                jailbreakPromptOverride: jailbreak,
                messages: oaiMessages,
                messageExamples: oaiMessageExamples,
            }, dryRun);
            generate_data = { prompt: prompt };

            // TODO: move these side-effects somewhere else, so this switch-case solely sets generate_data
            // counts will return false if the user has not enabled the token breakdown feature
            if (counts) {
                parseTokenCounts(counts, thisPromptBits);
            }

            if (!dryRun) {
                setInContextMessages(openai_messages_count, type);
            }
            break;
        }
    }

    await eventSource.emit(event_types.GENERATE_AFTER_DATA, generate_data, dryRun);

    if (dryRun) {
        return Promise.resolve();
    }

    /**
     * Saves itemized prompt bits and calls streaming or non-streaming generation API.
     * @returns {Promise<void|*|Awaited<*>|String|{fromStream}|string|undefined|Object>}
     * @throws {Error|object} Error with message text, or Error with response JSON (OAI/Horde), or the actual response JSON (novel|textgenerationwebui|kobold)
     */
    async function finishGenerating() {
        if (power_user.console_log_prompts) {
            console.log(generate_data.prompt);
        }

        console.debug('rungenerate calling API');

        showStopButton();

        //set array object for prompt token itemization of this message
        let currentArrayEntry = Number(thisPromptBits.length - 1);
        let additionalPromptStuff = {
            ...thisPromptBits[currentArrayEntry],
            rawPrompt: generate_data.prompt || generate_data.input,
            mesId: getNextMessageId(type),
            allAnchors: await getAllExtensionPrompts(),
            chatInjects: injectedIndices?.map(index => arrMes[arrMes.length - index - 1])?.join('') || '',
            summarizeString: (extension_prompts['1_memory']?.value || ''),
            authorsNoteString: (extension_prompts['2_floating_prompt']?.value || ''),
            smartContextString: (extension_prompts.chromadb?.value || ''),
            chatVectorsString: (extension_prompts['3_vectors']?.value || ''),
            dataBankVectorsString: (extension_prompts['4_vectors_data_bank']?.value || ''),
            worldInfoString: worldInfoString,
            storyString: storyString,
            beforeScenarioAnchor: beforeScenarioAnchor,
            afterScenarioAnchor: afterScenarioAnchor,
            examplesString: examplesString,
            mesSendString: mesSendString,
            generatedPromptCache: generatedPromptCache,
            promptBias: promptBias,
            finalPrompt: finalPrompt,
            charDescription: description,
            charPersonality: personality,
            scenarioText: scenario,
            this_max_context: this_max_context,
            padding: power_user.token_padding,
            main_api: main_api,
            instruction: main_api !== 'openai' && power_user.sysprompt.enabled ? substituteParams(power_user.prefer_character_prompt && system ? system : power_user.sysprompt.content) : '',
            userPersona: (power_user.persona_description_position == persona_description_positions.IN_PROMPT ? (persona || '') : ''),
            tokenizer: getFriendlyTokenizerName(main_api).tokenizerName || '',
            presetName: getPresetManager()?.getSelectedPresetName() || '',
            messagesCount: main_api !== 'openai' ? mesSend.length : oaiMessages.length,
            examplesCount: main_api !== 'openai' ? (pinExmString ? mesExamplesArray.length : count_exm_add) : oaiMessageExamples.length,
        };

        //console.log(additionalPromptStuff);
        const itemizedIndex = itemizedPrompts.findIndex((item) => item.mesId === additionalPromptStuff.mesId);

        if (itemizedIndex !== -1) {
            itemizedPrompts[itemizedIndex] = additionalPromptStuff;
        }
        else {
            itemizedPrompts.push(additionalPromptStuff);
        }

        console.debug(`pushed prompt bits to itemizedPrompts array. Length is now: ${itemizedPrompts.length}`);

        if (isStreamingEnabled() && type !== 'quiet') {
            continue_mag = promptReasoning.removePrefix(continue_mag);
            _set_streamingProcessor(new StreamingProcessor(type, force_name2, generation_started, continue_mag, promptReasoning));
            if (isContinue) {
                // Save reply does add cycle text to the prompt, so it's not needed here
                streamingProcessor.firstMessageText = '';
            }

            streamingProcessor.generator = await sendStreamingRequest(type, generate_data);

            hideSwipeButtons();
            let getMessage = await streamingProcessor.generate();
            let messageChunk = cleanUpMessage({
                getMessage: getMessage,
                isImpersonate: isImpersonate,
                isContinue: isContinue,
                displayIncompleteSentences: false,
            });

            if (isContinue) {
                getMessage = continue_mag + getMessage;
            }

            const isStreamFinished = streamingProcessor && !streamingProcessor.isStopped && streamingProcessor.isFinished;
            const isStreamWithToolCalls = streamingProcessor && Array.isArray(streamingProcessor.toolCalls) && streamingProcessor.toolCalls.length;
            if (canPerformToolCalls && isStreamFinished && isStreamWithToolCalls) {
                const lastMessage = chat[chat.length - 1];
                const hasToolCalls = ToolManager.hasToolCalls(streamingProcessor.toolCalls);
                const shouldDeleteMessage = type !== 'swipe' && ['', '...'].includes(lastMessage?.mes) && !lastMessage?.extra?.reasoning && ['', '...'].includes(streamingProcessor?.result);
                hasToolCalls && shouldDeleteMessage && await deleteLastMessage();
                const invocationResult = await ToolManager.invokeFunctionTools(streamingProcessor.toolCalls);
                const shouldStopGeneration = (!invocationResult.invocations.length && shouldDeleteMessage) || invocationResult.stealthCalls.length;
                if (hasToolCalls) {
                    if (shouldStopGeneration) {
                        if (Array.isArray(invocationResult.errors) && invocationResult.errors.length) {
                            ToolManager.showToolCallError(invocationResult.errors);
                        }
                        unblockGeneration(type);
                        _set_streamingProcessor(null);
                        return;
                    }

                    _set_streamingProcessor(null);
                    depth = depth + 1;
                    await ToolManager.saveFunctionToolInvocations(invocationResult.invocations);
                    return Generate('normal', { automatic_trigger, force_name2, quiet_prompt, quietToLoud, skipWIAN, force_chid, signal, quietImage, quietName, depth }, dryRun);
                }
            }

            if (isStreamFinished) {
                await streamingProcessor.onFinishStreaming(streamingProcessor.messageId, getMessage);
                _set_streamingProcessor(null);
                triggerAutoContinue(messageChunk, isImpersonate);
                return Object.defineProperties(new String(getMessage), {
                    'messageChunk': { value: messageChunk },
                    'fromStream': { value: true },
                });
            }
        } else {
            return await sendGenerationRequest(type, generate_data, { jsonSchema });
        }
    }

    return finishGenerating().then(onSuccess, onError);

    /**
     * Handles the successful response from the generation API.
     * @param data
     * @returns {Promise<String|{fromStream}|*|string|string|void|Awaited<*>|undefined>}
     * @throws {Error} Throws an error if the response data contains an error message
     */
    async function onSuccess(data) {
        if (!data) return;

        if (data?.fromStream) {
            return data;
        }

        let messageChunk = '';

        // if an error was returned in data (textgenwebui), show it and throw it
        if (data.error) {
            unblockGeneration(type);

            if (data?.response) {
                toastr.error(data.response, t`API Error`, { preventDuplicates: true });
            }
            throw new Error(data?.response);
        }

        if (jsonSchema) {
            unblockGeneration(type);
            return extractJsonFromData(data);
        }

        //const getData = await response.json();
        let getMessage = extractMessageFromData(data);
        let title = extractTitleFromData(data);
        let reasoning = extractReasoningFromData(data);
        let imageUrls = extractImagesFromData(data);
        const reasoningSignature = extractReasoningSignatureFromData(data);
        kobold_horde_model = title;

        const swipes = extractMultiSwipes(data, type);

        messageChunk = cleanUpMessage({
            getMessage: getMessage,
            isImpersonate: isImpersonate,
            isContinue: isContinue,
            displayIncompleteSentences: false,
        });


        reasoning = getRegexedString(reasoning, regex_placement.REASONING);

        if (power_user.trim_spaces) {
            reasoning = reasoning.trim();
        }

        if (isContinue) {
            continue_mag = promptReasoning.removePrefix(continue_mag);
            getMessage = continue_mag + getMessage;
        }

        //Formating
        const displayIncomplete = type === 'quiet' && !quietToLoud;
        getMessage = cleanUpMessage({
            getMessage: getMessage,
            isImpersonate: isImpersonate,
            isContinue: isContinue,
            displayIncompleteSentences: displayIncomplete,
        });

        if (isImpersonate) {
            $('#send_textarea').val(getMessage)[0].dispatchEvent(new Event('input', { bubbles: true }));
            await eventSource.emit(event_types.IMPERSONATE_READY, getMessage);
        }
        else if (type == 'quiet') {
            unblockGeneration(type);
            return getMessage;
        }
        else {
            // Without streaming we'll be having a full message on continuation. Treat it as a last chunk.
            if (originalType !== 'continue') {
                ({ type, getMessage } = await saveReply({ type, getMessage, title, swipes, reasoning, imageUrls, reasoningSignature }));
            }
            else {
                ({ type, getMessage } = await saveReply({ type: 'appendFinal', getMessage, title, swipes, reasoning, imageUrls, reasoningSignature }));
            }

            // This relies on `saveReply` having been called to add the message to the chat, so it must be last.
            parseAndSaveLogprobs(data, continue_mag);
        }

        if (canPerformToolCalls) {
            const hasToolCalls = ToolManager.hasToolCalls(data);
            const shouldDeleteMessage = type !== 'swipe' && ['', '...'].includes(getMessage) && !reasoning;
            hasToolCalls && shouldDeleteMessage && await deleteLastMessage();
            const invocationResult = await ToolManager.invokeFunctionTools(data);
            const shouldStopGeneration = (!invocationResult.invocations.length && shouldDeleteMessage) || invocationResult.stealthCalls.length;
            if (hasToolCalls) {
                if (shouldStopGeneration) {
                    if (Array.isArray(invocationResult.errors) && invocationResult.errors.length) {
                        ToolManager.showToolCallError(invocationResult.errors);
                    }
                    unblockGeneration(type);
                    return;
                }

                depth = depth + 1;
                await ToolManager.saveFunctionToolInvocations(invocationResult.invocations);
                return Generate('normal', { automatic_trigger, force_name2, quiet_prompt, quietToLoud, skipWIAN, force_chid, signal, quietImage, quietName, depth }, dryRun);
            }
        }

        if (type !== 'quiet') {
            playMessageSound();
        }

        const isAborted = abortController && abortController.signal.aborted;
        if (!isAborted && power_user.auto_swipe && generatedTextFiltered(getMessage)) {
            _set_is_send_press(false);
            return await swipe(null, SWIPE_DIRECTION.RIGHT, { source: SWIPE_SOURCE.AUTO_SWIPE, repeated: true, forceMesId: chat.length - 1 });

        }

        console.debug('/api/chats/save called by /Generate');
        await saveChatConditional();
        unblockGeneration(type);
        _set_streamingProcessor(null);

        if (type !== 'quiet') {
            triggerAutoContinue(messageChunk, isImpersonate);
        }

        // Don't break the API chain that expects a single string in return
        return Object.defineProperty(new String(getMessage), 'messageChunk', { value: messageChunk });
    }

    /**
     * Exception handler for finishGenerating
     * @param {Error|object} exception Error or response JSON
     * @throws {Error|object} Re-throws the exception
     */
    function onError(exception) {
        // if the response JSON was thrown (novel|textgenerationwebui|kobold), show the error message
        if (typeof exception?.error?.message === 'string') {
            toastr.error(exception.error.message, t`Text generation error`, { timeOut: 10000, extendedTimeOut: 20000 });
        }

        unblockGeneration(type);
        console.log(exception);
        _set_streamingProcessor(null);
        throw exception;
    }
}
//MARK: Generate() ends

/**
 * Stops the generation and any streaming if it is currently running.
 */
export function stopGeneration() { stTrack('stopGeneration'); // @st-tracked
    let stopped = false;
    if (streamingProcessor) {
        streamingProcessor.onStopStreaming();
        stopped = true;
    }
    if (abortController) {
        abortController.abort('Clicked stop button');
        hideStopButton();
        stopped = true;
    }
    eventSource.emit(event_types.GENERATION_STOPPED);
    return stopped;
}

/**
 * Injects extension prompts into chat messages.
 * @param {object[]} messages Array of chat messages
 * @param {boolean} isContinue Whether the generation is a continuation. If true, the extension prompts of depth 0 are injected at position 1.
 * @returns {Promise<number[]>} Array of indices where the extension prompts were injected
 */
async function doChatInject(messages, isContinue) {
    const injectedMessages = [];
    let totalInsertedMessages = 0;
    messages.reverse();

    const maxDepth = getExtensionPromptMaxDepth();
    for (let i = 0; i <= maxDepth; i++) {
        // Order of priority (most important go lower)
        const roles = [extension_prompt_roles.SYSTEM, extension_prompt_roles.USER, extension_prompt_roles.ASSISTANT];
        const names = {
            [extension_prompt_roles.SYSTEM]: '',
            [extension_prompt_roles.USER]: name1,
            [extension_prompt_roles.ASSISTANT]: name2,
        };
        const roleMessages = [];
        const separator = '\n';
        const wrap = false;

        for (const role of roles) {
            const extensionPrompt = String(await getExtensionPrompt(extension_prompt_types.IN_CHAT, i, separator, role, wrap)).trimStart();
            const isNarrator = role === extension_prompt_roles.SYSTEM;
            const isUser = role === extension_prompt_roles.USER;
            const name = names[role];

            if (extensionPrompt) {
                roleMessages.push({
                    name: name,
                    is_user: isUser,
                    mes: extensionPrompt,
                    extra: {
                        type: isNarrator ? system_message_types.NARRATOR : null,
                    },
                });
            }
        }

        if (roleMessages.length) {
            const depth = isContinue && i === 0 ? 1 : i;
            const injectIdx = Math.min(depth + totalInsertedMessages, messages.length);
            messages.splice(injectIdx, 0, ...roleMessages);
            totalInsertedMessages += roleMessages.length;
            injectedMessages.push(...roleMessages);
        }
    }

    const injectedIndices = injectedMessages.map(msg => messages.indexOf(msg));
    messages.reverse();
    return injectedIndices;
}

function flushWIInjections() {
    const depthPrefix = inject_ids.CUSTOM_WI_DEPTH;
    const outletPrefix = inject_ids.CUSTOM_WI_OUTLET('');

    for (const key of Object.keys(extension_prompts)) {
        if (key.startsWith(depthPrefix) || key.startsWith(outletPrefix)) {
            delete extension_prompts[key];
        }
    }
}


/**
 * Determines if the message should be auto-continued.
 * @param {string} messageChunk Current message chunk
 * @param {boolean} isImpersonate Is the user impersonation
 * @returns {boolean} Whether the message should be auto-continued
 */
export function shouldAutoContinue(messageChunk, isImpersonate) { stTrack('shouldAutoContinue'); // @st-tracked
    if (!power_user.auto_continue.enabled) {
        console.debug('Auto-continue is disabled by user.');
        return false;
    }

    if (typeof messageChunk !== 'string') {
        console.debug('Not triggering auto-continue because message chunk is not a string');
        return false;
    }

    if (isImpersonate) {
        console.log('Continue for impersonation is not implemented yet');
        return false;
    }

    if (is_send_press) {
        console.debug('Auto-continue is disabled because a message is currently being sent.');
        return false;
    }

    if (abortController && abortController.signal.aborted) {
        console.debug('Auto-continue is not triggered because the generation was stopped.');
        return false;
    }

    if (power_user.auto_continue.target_length <= 0) {
        console.log('Auto-continue target length is 0, not triggering auto-continue');
        return false;
    }

    if (main_api === 'openai' && !power_user.auto_continue.allow_chat_completions) {
        console.log('Auto-continue for OpenAI is disabled by user.');
        return false;
    }

    const textareaText = String($('#send_textarea').val());
    const USABLE_LENGTH = 5;

    if (textareaText.length > 0) {
        console.log('Not triggering auto-continue because user input is not empty');
        return false;
    }

    if (messageChunk.trim().length > USABLE_LENGTH && chat.length) {
        const lastMessage = chat[chat.length - 1];
        const messageLength = getTokenCount(lastMessage.mes);
        const shouldAutoContinue = messageLength < power_user.auto_continue.target_length;

        if (shouldAutoContinue) {
            console.log(`Triggering auto-continue. Message tokens: ${messageLength}. Target tokens: ${power_user.auto_continue.target_length}. Message chunk: ${messageChunk}`);
            return true;
        } else {
            console.log(`Not triggering auto-continue. Message tokens: ${messageLength}. Target tokens: ${power_user.auto_continue.target_length}`);
            return false;
        }
    } else {
        console.log('Last generated chunk was empty, not triggering auto-continue');
        return false;
    }
}

/**
 * Triggers auto-continue if the message meets the criteria.
 * @param {string} messageChunk Current message chunk
 * @param {boolean} isImpersonate Is the user impersonation
 */
export function triggerAutoContinue(messageChunk, isImpersonate) { stTrack('triggerAutoContinue'); // @st-tracked
    if (selected_group) {
        console.debug('Auto-continue is disabled for group chat');
        return;
    }

    if (shouldAutoContinue(messageChunk, isImpersonate)) {
        $('#option_continue').trigger('click');
    }
}


/**
 * @param {Object} chatItem Message history item.
 * @param {boolean} isInstruct Whether instruct mode is enabled.
 * @param {boolean|number} forceOutputSequence Whether to force the first/last output sequence for instruct mode.
 */
function formatMessageHistoryItem(chatItem, isInstruct, forceOutputSequence) {
    const isNarratorType = chatItem?.extra?.type === system_message_types.NARRATOR;
    const characterName = chatItem?.name ? chatItem.name : name2;
    const itemName = chatItem.is_user ? chatItem.name : characterName;
    const shouldPrependName = !isNarratorType;

    // If this symbol flag is set, completely ignore the message.
    // This can be used to hide messages without affecting the number of messages in the chat.
    if (chatItem.extra?.[IGNORE_SYMBOL]) {
        return '';
    }

    // Don't include a name if it's empty
    let textResult = chatItem?.name && shouldPrependName ? `${itemName}: ${chatItem.mes}\n` : `${chatItem.mes}\n`;

    if (isInstruct) {
        textResult = formatInstructModeChat(itemName, chatItem.mes, chatItem.is_user, isNarratorType, chatItem.force_avatar, name1, name2, forceOutputSequence);
    }

    return textResult;
}

/**
 * Removes all {{macros}} from a string.
 * @param {string} str String to remove macros from.
 * @returns {string} String with macros removed.
 */
export function removeMacros(str) { stTrack('removeMacros'); // @st-tracked
    return (str ?? '').replace(/\{\{[\s\S]*?\}\}/gm, '').trim();
}


/**
 * Gets the maximum usable context size for the current API.
 * @param {number|null} overrideResponseLength Optional override for the response length.
 * @returns {number} Maximum usable context size.
 */
export function getMaxContextSize(overrideResponseLength = null) { stTrack('getMaxContextSize'); // @st-tracked
    if (typeof overrideResponseLength !== 'number' || overrideResponseLength <= 0 || isNaN(overrideResponseLength)) {
        overrideResponseLength = null;
    }

    let this_max_context = 1487;
    if (main_api == 'kobold' || main_api == 'koboldhorde' || main_api == 'textgenerationwebui') {
        this_max_context = (max_context - (overrideResponseLength || amount_gen));
    }
    if (main_api == 'novel') {
        this_max_context = Number(max_context);
        if (nai_settings.model_novel.includes('clio')) {
            this_max_context = Math.min(max_context, 8192);
        }
        if (nai_settings.model_novel.includes('kayra')) {
            this_max_context = Math.min(max_context, 8192);

            const subscriptionLimit = getKayraMaxContextTokens();
            if (typeof subscriptionLimit === 'number' && this_max_context > subscriptionLimit) {
                this_max_context = subscriptionLimit;
                console.log(`NovelAI subscription limit reached. Max context size is now ${this_max_context}`);
            }
        }
        if (nai_settings.model_novel.includes('erato')) {
            // subscriber limits coming soon
            this_max_context = Math.min(max_context, 8192);

            // Added special tokens and whatnot
            this_max_context -= 10;
        }

        this_max_context = this_max_context - (overrideResponseLength || amount_gen);
    }
    if (main_api == 'openai') {
        this_max_context = oai_settings.openai_max_context - (overrideResponseLength || oai_settings.openai_max_tokens);
    }
    return this_max_context;
}

function parseTokenCounts(counts, thisPromptBits) {
    /**
     * @param {any[]} numbers
     */
    function getSum(...numbers) {
        return numbers.map(x => Number(x)).filter(x => !Number.isNaN(x)).reduce((acc, val) => acc + val, 0);
    }
    const total = getSum(Object.values(counts));

    thisPromptBits.push({
        oaiStartTokens: (counts?.start + counts?.controlPrompts) || 0,
        oaiPromptTokens: getSum(counts?.prompt, counts?.charDescription, counts?.charPersonality, counts?.scenario) || 0,
        oaiBiasTokens: counts?.bias || 0,
        oaiNudgeTokens: counts?.nudge || 0,
        oaiJailbreakTokens: counts?.jailbreak || 0,
        oaiImpersonateTokens: counts?.impersonate || 0,
        oaiExamplesTokens: (counts?.dialogueExamples + counts?.examples) || 0,
        oaiConversationTokens: (counts?.conversation + counts?.chatHistory) || 0,
        oaiNsfwTokens: counts?.nsfw || 0,
        oaiMainTokens: counts?.main || 0,
        oaiTotalTokens: total,
    });
}

function addChatsPreamble(mesSendString) {
    return main_api === 'novel'
        ? substituteParams(nai_settings.preamble) + '\n' + mesSendString
        : mesSendString;
}

function addChatsSeparator(mesSendString) {
    if (power_user.context.chat_start) {
        return substituteParams(power_user.context.chat_start + '\n') + mesSendString;
    }

    else {
        return mesSendString;
    }
}


function setInContextMessages(msgInContextCount, type) {
    chatElement.find('.mes').removeClass('lastInContext');

    if (type === 'swipe' || type === 'regenerate' || type === 'continue') {
        msgInContextCount++;
    }

    const lastMessageBlock = chatElement.find('.mes:not([is_system="true"]), .mes.toolCall').eq(-msgInContextCount);
    lastMessageBlock.addClass('lastInContext');

    if (lastMessageBlock.length === 0) {
        const firstMessageId = getFirstDisplayedMessageId();
        chatElement.find(`.mes[mesid="${firstMessageId}"`).addClass('lastInContext');
    }

    // Update last id to chat. No metadata save on purpose, gets hopefully saved via another call
    const lastMessageId = Math.max(0, chat.length - msgInContextCount);
    chat_metadata.lastInContextMessageId = lastMessageId;
}

/**
 * @typedef {object} AdditionalRequestOptions
 * @property {JsonSchema} [jsonSchema]
 */

/**
 * Sends a non-streaming request to the API.
 * @param {string} type Generation type
 * @param {object} data Generation data
 * @param {AdditionalRequestOptions} [options] Additional options for the generation request
 * @returns {Promise<object>} Response data from the API
 * @throws {Error|object}
 */
export async function sendGenerationRequest(type, data, options = {}) { stTrack('sendGenerationRequest'); // @st-tracked
    if (main_api === 'openai') {
        return await sendOpenAIRequest(type, data.prompt, abortController.signal, options);
    }

    if (main_api === 'koboldhorde') {
        return await generateHorde(data.prompt, data, abortController.signal, true);
    }

    const response = await fetch(getGenerateUrl(main_api), {
        method: 'POST',
        headers: getRequestHeaders(),
        cache: 'no-cache',
        body: JSON.stringify(data),
        signal: abortController.signal,
    });

    if (!response.ok) {
        throw await response.json();
    }

    return await response.json();
}

/**
 * Sends a streaming request to the API.
 * @param {string} type Generation type
 * @param {object} data Generation data
 * @param {AdditionalRequestOptions} [options] Additional options for the generation request
 * @returns {Promise<any>} Streaming generator
 */
export async function sendStreamingRequest(type, data, options = {}) { stTrack('sendStreamingRequest'); // @st-tracked
    if (abortController?.signal?.aborted) {
        throw new Error('Generation was aborted.');
    }

    switch (main_api) {
        case 'openai':
            return await sendOpenAIRequest(type, data.prompt, streamingProcessor.abortController.signal, options);
        case 'textgenerationwebui':
            return await generateTextGenWithStreaming(data, streamingProcessor.abortController.signal);
        case 'novel':
            return await generateNovelWithStreaming(data, streamingProcessor.abortController.signal);
        case 'kobold':
            return await generateKoboldWithStreaming(data, streamingProcessor.abortController.signal);
        default:
            throw new Error('Streaming is enabled, but the current API does not support streaming.');
    }
}

/**
 * Gets the generation endpoint URL for the specified API.
 * @param {string} api API name
 * @returns {string} Generation URL
 * @throws {Error} If the API is unknown
 */
export function getGenerateUrl(api) { stTrack('getGenerateUrl'); // @st-tracked
    switch (api) {
        case 'kobold':
            return '/api/backends/kobold/generate';
        case 'koboldhorde':
            return '/api/backends/koboldhorde/generate';
        case 'textgenerationwebui':
            return '/api/backends/text-completions/generate';
        case 'novel':
            return '/api/novelai/generate';
        default:
            throw new Error(`Unknown API: ${api}`);
    }
}

function extractTitleFromData(data) {
    if (main_api == 'koboldhorde') {
        return data.workerName;
    }

    return undefined;
}

/**
 * Extracts the image from the response data.
 * @param {object} data Response data
 * @param {object} [options] Extraction options
 * @param {string} [options.mainApi] Main API to use
 * @param {string} [options.chatCompletionSource] Chat completion source
 * @returns {string[]} Extracted images or empty array
 */
function extractImagesFromData(data, { mainApi = null, chatCompletionSource = null } = {}) {
    switch (mainApi ?? main_api) {
        case 'openai': {
            switch (chatCompletionSource ?? oai_settings.chat_completion_source) {
                case chat_completion_sources.VERTEXAI:
                case chat_completion_sources.MAKERSUITE: {
                    const inlineData = data?.responseContent?.parts?.filter(x => x.inlineData && !x.thought)?.map(x => x.inlineData);
                    if (Array.isArray(inlineData) && inlineData.length > 0) {
                        return inlineData.map(x => `data:${x.mimeType};base64,${x.data}`).filter(isDataURL);
                    }
                } break;
                case chat_completion_sources.OPENROUTER: {
                    const imageUrl = data?.choices[0]?.message?.images?.filter(x => x.type === 'image_url')?.map(x => x?.image_url?.url);
                    if (Array.isArray(imageUrl) && imageUrl.length > 0) {
                        return imageUrl.filter(isDataURL);
                    }
                    // TODO: Handle remote URLs
                }
            }
        } break;
    }

    return [];
}

/**
 * parseAndSaveLogprobs receives the full data response for a non-streaming
 * generation, parses logprobs for all tokens in the message, and saves them
 * to the currently active message.
 * @param {object} data - response data containing all tokens/logprobs
 * @param {string} continueFrom - for 'continue' generations, the prompt
 *  */
function parseAndSaveLogprobs(data, continueFrom) {
    /** @type {import('./scripts/logprobs.js').TokenLogprobs[] | null} */
    let logprobs = null;

    switch (main_api) {
        case 'novel':
            // parser only handles one token/logprob pair at a time
            logprobs = data.logprobs?.map(parseNovelAILogprobs) || null;
            break;
        case 'openai':
            // OAI and other chat completion APIs must handle this earlier in
            // `sendOpenAIRequest`. `data` for these APIs is just a string with
            // the text of the generated message, logprobs are not included.
            return;
        case 'textgenerationwebui':
            switch (textgen_settings.type) {
                case textgen_types.LLAMACPP: {
                    logprobs = data?.completion_probabilities?.map(x => parseTextgenLogprobs(x.content, [x])) || null;
                } break;
                case textgen_types.KOBOLDCPP:
                case textgen_types.VLLM:
                case textgen_types.INFERMATICAI:
                case textgen_types.APHRODITE:
                case textgen_types.MANCER:
                case textgen_types.TABBY: {
                    logprobs = parseTabbyLogprobs(data) || null;
                } break;
            } break;
        default:
            return;
    }

    saveLogprobsForActiveMessage(logprobs, continueFrom);
}


/**
 * Extracts multiswipe swipes from the response data.
 * @param {Object} data Response data
 * @param {string} type Type of generation
 * @returns {string[]} Array of extra swipes
 */
function extractMultiSwipes(data, type) {
    const swipes = [];

    if (!data) {
        return swipes;
    }

    if (type === 'continue' || type === 'impersonate' || type === 'quiet') {
        return swipes;
    }

    if (main_api === 'textgenerationwebui' && textgen_settings.type === textgen_types.LLAMACPP) {
        if (!Array.isArray(data)) {
            return swipes;
        }

        const multiSwipeCount = data.length - 1;
        if (multiSwipeCount <= 0) {
            return swipes;
        }

        for (let i = 1; i < data.length; i++) {
            const text = data?.[i]?.content ?? '';
            swipes.push(text);
        }
    }

    if (main_api === 'openai' || (main_api === 'textgenerationwebui' && [textgen_types.MANCER, textgen_types.VLLM, textgen_types.APHRODITE, textgen_types.TABBY, textgen_types.INFERMATICAI].includes(textgen_settings.type))) {
        if (!Array.isArray(data.choices)) {
            return swipes;
        }

        const multiSwipeCount = data.choices.length - 1;

        if (multiSwipeCount <= 0) {
            return swipes;
        }

        for (let i = 1; i < data.choices.length; i++) {
            const text = data?.choices[i]?.message?.content ?? data?.choices[i]?.text ?? '';
            swipes.push(text);
        }
    }

    const cleanedSwipes = swipes.map(text => cleanUpMessage({
        getMessage: text,
        isImpersonate: false,
        isContinue: false,
        displayIncompleteSentences: false,
    }));

    return cleanedSwipes;
}


/**
 * Saves the image to the message object.
 * @param {ParsedImage} img Image object
 * @param {ChatMessage} mes Chat message object
 * @typedef {{ image?: string, title?: string, inline?: boolean }} ParsedImage
 */
function saveImageToMessage(img, mes) {
    if (mes && img.image) {
        if (!mes.extra || typeof mes.extra !== 'object') {
            mes.extra = {};
        }
        if (!Array.isArray(mes.extra.media)) {
            mes.extra.media = [];
        }
        mes.extra.media.push({ url: img.image, type: MEDIA_TYPE.IMAGE, title: img.title, source: MEDIA_SOURCE.API });
        mes.extra.inline_image = img.inline;
    }
}

export function getGeneratingApi() { stTrack('getGeneratingApi'); // @st-tracked
    switch (main_api) {
        case 'openai':
            return oai_settings.chat_completion_source || 'openai';
        case 'textgenerationwebui':
            return textgen_settings.type === textgen_types.OOBA ? 'textgenerationwebui' : textgen_settings.type;
        default:
            return main_api;
    }
}

export function getGeneratingModel(mes) { stTrack('getGeneratingModel'); // @st-tracked
    let model = '';
    switch (main_api) {
        case 'kobold':
            model = online_status;
            break;
        case 'novel':
            model = nai_settings.model_novel;
            break;
        case 'openai':
            model = getChatCompletionModel();
            break;
        case 'textgenerationwebui':
            model = online_status;
            break;
        case 'koboldhorde':
            model = kobold_horde_model;
            break;
    }
    return model;
}


// getThumbnailUrl extracted to ./scripts/thumbnail-url.js
import { getThumbnailUrl } from './scripts/thumbnail-url.js';
export { getThumbnailUrl }; // re-exported for backward compat


function getFirstMessage() {
    const firstMes = characters[this_chid]?.first_mes || '';
    const alternateGreetings = characters[this_chid]?.data?.alternate_greetings;

    const message = {
        name: name2,
        is_user: false,
        is_system: false,
        send_date: getMessageTimeStamp(),
        mes: getRegexedString(firstMes, regex_placement.AI_OUTPUT),
        extra: {},
    };

    if (Array.isArray(alternateGreetings) && alternateGreetings.length > 0) {
        const swipes = [message.mes, ...(alternateGreetings.map(greeting => getRegexedString(greeting, regex_placement.AI_OUTPUT)))];

        if (!message.mes) {
            swipes.shift();
            message.mes = swipes[0];
        }

        message.swipe_id = 0;
        message.swipes = swipes;
        message.swipe_info = swipes.map(_ => ({
            send_date: message.send_date,
            gen_started: void 0,
            gen_finished: void 0,
            extra: {},
        }));
    }

    return message;
}

export async function openCharacterChat(file_name) { stTrack('openCharacterChat'); // @st-tracked
    await waitUntilCondition(() => !isChatSaving, debounce_timeout.extended, 10);
    await clearChat({ clearData: true });
    characters[this_chid].chat = file_name;
    _set_chat_metadata({});
    await getChat();
    $('#selected_chat_pole').val(file_name);
    await createOrEditCharacter(new CustomEvent('newChat'));
}

// Common code for message editor done and auto-save
function updateMessage(div) {
    const mesBlock = div.closest('.mes_block');
    let text = mesBlock.find('.edit_textarea').val()
        ?? mesBlock.find('.mes_text').text();
    const mesElement = div.closest('.mes');
    const mes = chat[mesElement.attr('mesid')];

    // editing old messages
    mes.extra ??= {};

    let regexPlacement;
    if (mes?.is_user) {
        regexPlacement = regex_placement.USER_INPUT;
    } else if (mes.extra?.type === 'narrator') {
        regexPlacement = regex_placement.SLASH_COMMAND;
    } else {
        regexPlacement = regex_placement.AI_OUTPUT;
    }

    // Ignore character override if sent as system
    text = getRegexedString(
        text,
        regexPlacement,
        {
            characterOverride: mes.extra?.type === 'narrator' ? undefined : mes.name,
            isEdit: true,
        },
    );


    if (power_user.trim_spaces) {
        text = text.trim();
    }

    const bias = substituteParams(extractMessageBias(text));
    text = substituteParams(text);
    if (bias) {
        text = removeMacros(text);
    }
    mes.mes = text;
    if (mes.swipe_id !== undefined) {
        ensureSwipes(mes);
        mes.swipes[mes.swipe_id] = text;
    }

    if (mes?.is_system || mes?.is_user || mes.extra?.type === system_message_types.NARRATOR) {
        mes.extra.bias = bias ?? null;
    } else {
        mes.extra.bias = null;
    }

    chat_metadata.tainted = true;

    return { mesBlock, text, mes, bias };
}

function openMessageDelete(fromSlashCommand) {
    closeMessageEditor();
    hideSwipeButtons();
    if (fromSlashCommand || (!is_send_press) || (selected_group && !is_group_generating)) {
        $('#dialogue_del_mes').css('display', 'block');
        $('#send_form').css('display', 'none');
        $('.del_checkbox').each(function () {
            $(this).css('display', 'grid');
            $(this).parent().children('.for_checkbox').css('display', 'none');
        });
    } else {
        console.debug(`
            ERR -- could not enter del mode
            this_chid: ${this_chid}
            is_send_press: ${is_send_press}
            selected_group: ${selected_group}
            is_group_generating: ${is_group_generating}`);
    }
    this_del_mes = -1;
    _set_ce_is_delete_mode(true);
}

function messageEditAuto(div) {
    const { mesBlock, text, mes, bias } = updateMessage(div);

    mesBlock.find('.mes_text').val('');
    mesBlock.find('.mes_text').val(messageFormatting(
        text,
        this_edit_mes_chname,
        mes.is_system,
        mes.is_user,
        this_edit_mes_id,
        {},
        false,
    ));
    mesBlock.find('.mes_bias').empty();
    mesBlock.find('.mes_bias').append(messageFormatting(bias, '', false, false, -1, {}, false));
    saveChatDebounced();
}


/**
 * Close the open message editor.
 * This deletes the user's unsaved changes.
 * @param {number} [messageId=this_edit_mes_id]
 */
async function messageEditCancel(messageId = this_edit_mes_id) {
    let text = chat[messageId].mes;
    let thisMesDiv;
    // If this is the button then select it's parent. Otherwise, select by messageId.
    if (this?.classList?.contains('mes_edit_cancel')) {
        thisMesDiv = $(this).closest('.mes');
    } else {
        thisMesDiv = chatElement.children('.mes').filter(`[mesid="${messageId}"]`);
    }

    const thisMesBlock = thisMesDiv.find('.mes_block');
    thisMesBlock.find('.mes_text').empty();
    thisMesDiv.find('.mes_edit_buttons').css('display', 'none');
    thisMesBlock.find('.mes_buttons').css('display', '');
    thisMesBlock.find('.mes_text')
        .append(messageFormatting(
            text,
            this_edit_mes_chname,
            chat[messageId].is_system,
            chat[messageId].is_user,
            messageId,
            {},
            false,
        ));
    appendMediaToMessage(chat[messageId], thisMesDiv);
    addCopyToCodeBlocks(thisMesDiv);

    const reasoningEditDone = thisMesBlock.find('.mes_reasoning_edit_cancel:visible');
    if (reasoningEditDone.length > 0) {
        reasoningEditDone.trigger('click');
    }

    await eventSource.emit(event_types.MESSAGE_UPDATED, messageId);
    if (messageId == this_edit_mes_id) {
        _set_ce_this_edit_mes_id(undefined);
    }
    else {
        console.warn(`The message editor was closed on message #${messageId} while #${this_edit_mes_id} is being edited.`);
    }

    showSwipeButtons();
}

/**
 * Swaps chat[sourceId] with chat[targetId]. They must be adjacent.
 * @param {number} sourceId Index of the message to move
 * @param {number} targetId Index of the target message
 * @returns {Promise<boolean>} True if the messages were moved, false otherwise
 */
async function messageEditMove(sourceId, targetId) {
    if (is_send_press) {
        console.warn(`The message #${sourceId} was not moved to #${targetId} because a generation is in progress.`);
        return false;
    }

    if (Math.abs(sourceId - targetId) !== 1) {
        console.error(`Message #${sourceId} and #${targetId} are not adjacent.`);
        return false;
    }

    const targetMessageDiv = chatElement.find(`.mes[mesid="${targetId}"]`);
    const sourceMessageDiv = chatElement.find(`.mes[mesid="${sourceId}"]`);

    if (sourceMessageDiv.length === 0 || targetMessageDiv.length === 0) {
        console.error(`Message #${sourceId} or #${targetId} were not found.`);
        return false;
    }

    if (sourceId <= targetId) {
        sourceMessageDiv.insertAfter(targetMessageDiv);
    }
    else {
        sourceMessageDiv.insertBefore(targetMessageDiv);
    }

    //Swap Ids.
    targetMessageDiv.attr('mesid', sourceId);
    sourceMessageDiv.attr('mesid', targetId);

    // Swap chat array entries.
    [chat[sourceId], chat[targetId]] = [chat[targetId], chat[sourceId]];

    // Update edited message id
    if (this_edit_mes_id === sourceId) {
        _set_ce_this_edit_mes_id(targetId);
    }

    swapItemizedPrompts(sourceId, targetId);
    updateViewMessageIds();
    refreshSwipeButtons();
    await saveChatConditional();
    return true;
}

async function messageEditDone(div) {
    if (!(this_edit_mes_id >= 0)) {
        console.trace('this_edit_mes_id cannot be blank when calling messageEditDone.');
        return;
    }

    let { mesBlock, text, mes, bias } = updateMessage(div);

    await eventSource.emit(event_types.MESSAGE_EDITED, this_edit_mes_id);
    text = chat[this_edit_mes_id]?.mes ?? text;
    mesBlock.find('.mes_text').empty();
    mesBlock.find('.mes_edit_buttons').css('display', 'none');
    mesBlock.find('.mes_buttons').css('display', '');
    mesBlock.find('.mes_text').append(
        messageFormatting(
            text,
            this_edit_mes_chname,
            mes.is_system,
            mes.is_user,
            this_edit_mes_id,
            {},
            false,
        ),
    );
    mesBlock.find('.mes_bias').empty();
    mesBlock.find('.mes_bias').append(messageFormatting(bias, '', false, false, -1, {}, false));
    appendMediaToMessage(mes, div.closest('.mes'));
    addCopyToCodeBlocks(div.closest('.mes'));

    const reasoningEditDone = mesBlock.find('.mes_reasoning_edit_done:visible');
    if (reasoningEditDone.length > 0) {
        reasoningEditDone.trigger('click');
    }

    await eventSource.emit(event_types.MESSAGE_UPDATED, this_edit_mes_id);
    _set_ce_this_edit_mes_id(undefined);
    await saveChatConditional();
    showSwipeButtons();
}


export async function setCharacterSettingsOverrides() { stTrack('setCharacterSettingsOverrides'); // @st-tracked
    if (!selected_group && (this_chid === undefined || !characters[this_chid])) {
        console.warn('setCharacterSettingsOverrides() -- no selected group or character');
        return;
    }

    const scenarioOverrideValue = chat_metadata.scenario || '';
    const exampleMessagesValue = chat_metadata.mes_example || '';
    const systemPromptValue = chat_metadata.system_prompt || '';
    const isGroup = !!selected_group;

    const $template = $(await renderTemplateAsync('scenarioOverride'));
    $template.find('[data-group="true"]').toggle(isGroup);
    $template.find('[data-character="true"]').toggle(!isGroup);
    const pendingChanges = {
        scenario: scenarioOverrideValue,
        examples: exampleMessagesValue,
        system_prompt: systemPromptValue,
    };

    // Keep edits local until the popup is closed/confirmed
    const $scenario = $template.find('.chat_scenario');
    $scenario.val(scenarioOverrideValue).on('input', function () {
        pendingChanges.scenario = String($(this).val());
    });
    const $examples = $template.find('.chat_examples');
    $examples.val(exampleMessagesValue).on('input', function () {
        pendingChanges.examples = String($(this).val());
    });
    const $systemPrompt = $template.find('.chat_system_prompt');
    $systemPrompt.val(systemPromptValue).on('input', function () {
        pendingChanges.system_prompt = String($(this).val());
    });

    $template.find('.remove_scenario_override').on('click', async function () {
        const confirm = await Popup.show.confirm(t`Are you sure you want to remove all overrides?`, t`This action cannot be undone.`);
        if (!confirm) {
            return;
        }

        $scenario.val('');
        pendingChanges.scenario = '';
        $examples.val('');
        pendingChanges.examples = '';
        $systemPrompt.val('');
        pendingChanges.system_prompt = '';
    });

    // Wait for popup close/confirm.
    await callGenericPopup($template, POPUP_TYPE.TEXT, '', {
        wide: true,
        large: true,
        allowVerticalScrolling: true,
    });

    chat_metadata.scenario = pendingChanges.scenario;
    chat_metadata.mes_example = pendingChanges.examples;
    chat_metadata.system_prompt = pendingChanges.system_prompt;
    await saveMetadata();
}

/**
 * Displays a blocking popup with a given text and type.
 * @param {JQuery<HTMLElement>|string|Element} text - Text to display in the popup.
 * @param {string} type
 * @param {string} inputValue - Value to set the input to.
 * @param {PopupOptions} options - Options for the popup.
 * @typedef {{okButton?: string, rows?: number, wide?: boolean, wider?: boolean, large?: boolean, allowHorizontalScrolling?: boolean, allowVerticalScrolling?: boolean, cropAspect?: number }} PopupOptions - Options for the popup.
 * @returns {Promise<any>} A promise that resolves when the popup is closed.
 * @deprecated Use `callGenericPopup` instead.
 */
export function callPopup(text, type, inputValue = '', { okButton, rows, wide, wider, large, allowHorizontalScrolling, allowVerticalScrolling, cropAspect } = {}) { stTrack('callPopup'); // @st-tracked
    function getOkButtonText() {
        if (['text', 'char_not_selected'].includes(popup_type)) {
            $dialoguePopupCancel.css('display', 'none');
            return okButton ?? t`Ok`;
        } else if (['delete_extension'].includes(popup_type)) {
            return okButton ?? t`Ok`;
        } else if (['new_chat', 'confirm'].includes(popup_type)) {
            return okButton ?? t`Yes`;
        } else if (['input'].includes(popup_type)) {
            return okButton ?? t`Save`;
        }
        return okButton ?? t`Delete`;
    }

    dialogueCloseStop = true;
    if (type) {
        popup_type = type;
    }

    const $dialoguePopup = $('#dialogue_popup');
    const $dialoguePopupCancel = $('#dialogue_popup_cancel');
    const $dialoguePopupOk = $('#dialogue_popup_ok');
    const $dialoguePopupInput = $('#dialogue_popup_input');
    const $dialoguePopupText = $('#dialogue_popup_text');
    const $shadowPopup = $('#shadow_popup');

    $dialoguePopup.toggleClass('wide_dialogue_popup', !!wide)
        .toggleClass('wider_dialogue_popup', !!wider)
        .toggleClass('large_dialogue_popup', !!large)
        .toggleClass('horizontal_scrolling_dialogue_popup', !!allowHorizontalScrolling)
        .toggleClass('vertical_scrolling_dialogue_popup', !!allowVerticalScrolling);

    $dialoguePopupCancel.css('display', 'inline-block');
    $dialoguePopupOk.text(getOkButtonText());
    $dialoguePopupInput.toggle(popup_type === 'input').val(inputValue).attr('rows', rows ?? 1);
    $dialoguePopupText.empty().append(text);
    $shadowPopup.css('display', 'block');

    if (popup_type == 'input') {
        $dialoguePopupInput.trigger('focus');
    }

    $shadowPopup.transition({
        opacity: 1,
        duration: animation_duration,
        easing: animation_easing,
    });

    return new Promise((resolve) => {
        dialogueResolve = resolve;
    });
}

export function cancelTtsPlay() { stTrack('cancelTtsPlay'); // @st-tracked
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
    }
}


/**
 * @deprecated Use `swipe` instead.
 * Handles the swipe to the right event.
 * @param {SwipeEvent} [event] Event.
 * @param {object} params Additional parameters.
 * @param {import('./scripts/constants.js').SWIPE_SOURCE} [params.source] The source of the swipe event. null, 'keyboard', 'auto_swipe', 'back' or 'delete'.
 * @param {boolean} [params.repeated] Is the swipe event repeated.
 * @param {object} [params.message] The chat message to swipe.
 */
//MARK: swipe_right


/**
 * Event handler to open a navbar drawer when a drawer open button is clicked.
 * Handles click events on .drawer-opener elements.
 * Opens the drawer associated with the clicked button according to the data-target attribute.
 * @returns {void}
 */
function doDrawerOpenClick() {
    const targetDrawerID = $(this).attr('data-target');
    const drawer = $(`#${targetDrawerID}`);
    const drawerToggle = drawer.find('.drawer-toggle');
    const drawerWasOpenAlready = drawerToggle.parent().find('.drawer-content').hasClass('openDrawer');
    if (drawerWasOpenAlready || drawer.hasClass('resizing')) { return; }
    doNavbarIconClick.call(drawerToggle);
}

/**
 * Event handler to open or close a navbar drawer when a navbar icon is clicked.
 * Handles click events on .drawer-toggle elements.
 * @returns {Promise<void>}
 */
export async function doNavbarIconClick() { stTrack('doNavbarIconClick'); // @st-tracked
    const icon = $(this).find('.drawer-icon');
    const drawer = $(this).parent().find('.drawer-content');
    const drawerWasOpenAlready = $(this).parent().find('.drawer-content').hasClass('openDrawer');
    const targetDrawerID = $(this).parent().find('.drawer-content').attr('id');

    if (!drawerWasOpenAlready) {
        const $openDrawers = $('.openDrawer:not(.pinnedOpen)');
        const $openIcons = $('.openIcon:not(.drawerPinnedOpen)');
        for (const iconEl of $openIcons) {
            $(iconEl).toggleClass('closedIcon openIcon');
        }
        for (const el of $openDrawers) {
            $(el).toggleClass('closedDrawer openDrawer');
        }
        if ($openDrawers.length && animation_duration) {
            await delay(animation_duration);
        }
        icon.toggleClass('openIcon closedIcon');
        drawer.toggleClass('openDrawer closedDrawer');

        if (targetDrawerID === 'right-nav-panel') {
            favsToHotswap();
            $('#rm_print_characters_block').trigger('scroll');
        }

        // Set the height of "autoSetHeight" textareas within the drawer to their scroll height
        if (!CSS.supports('field-sizing', 'content')) {
            const textareas = $(this).closest('.drawer').find('.drawer-content textarea.autoSetHeight');
            for (const textarea of textareas) {
                await resetScrollHeight($(textarea));
            }
        }
    } else if (drawerWasOpenAlready) {
        icon.toggleClass('closedIcon openIcon');
        drawer.toggleClass('closedDrawer openDrawer');
    }
}

function addDebugFunctions() {
    const doBackfill = async () => {
        for (const message of chat) {
            // System messages are not counted
            if (message.is_system) {
                continue;
            }

            if (!message.extra) {
                message.extra = {};
            }

            const tokenCountText = (message?.extra?.reasoning || '') + message.mes;
            message.extra.token_count = await getTokenCountAsync(tokenCountText, 0);
        }

        await saveChatConditional();
        await reloadCurrentChat();
    };

    registerDebugFunction('forceOnboarding', 'Force onboarding', 'Forces the onboarding process to restart.', async () => {
        _set_sm_firstRun(true);
        await saveSettings();
        location.reload();
    });

    registerDebugFunction('backfillTokenCounts', 'Backfill token counters',
        `Recalculates token counts of all messages in the current chat to refresh the counters.
        Useful when you switch between models that have different tokenizers.
        This is a visual change only. Your chat will be reloaded.`, doBackfill);

    registerDebugFunction('generationTest', 'Send a generation request', 'Generates text using the currently selected API.', async () => {
        const text = prompt('Input text:', 'Hello');
        toastr.info('Working on it...');
        const message = await generateRaw({ prompt: text });
        alert(message);
    });
    registerDebugFunction('toggleEventTracing', 'Toggle event tracing', 'Useful to see what triggered a certain event.', () => {
        localStorage.setItem('eventTracing', localStorage.getItem('eventTracing') === 'true' ? 'false' : 'true');
        toastr.info('Event tracing is now ' + (localStorage.getItem('eventTracing') === 'true' ? 'enabled' : 'disabled'));
    });

    registerDebugFunction('toggleRegenerateWarning', 'Toggle Ctrl+Enter regeneration confirmation', 'Toggle the warning when regenerating a message with a Ctrl+Enter hotkey.', () => {
        accountStorage.setItem('RegenerateWithCtrlEnter', accountStorage.getItem('RegenerateWithCtrlEnter') === 'true' ? 'false' : 'true');
        toastr.info('Regenerate warning is now ' + (accountStorage.getItem('RegenerateWithCtrlEnter') === 'true' ? 'disabled' : 'enabled'));
    });

    registerDebugFunction('copySetup', 'Copy ST setup to clipboard [WIP]', 'Useful data when reporting bugs', async () => {
        const getContextContents = getContext();
        const getSettingsContents = settings;
        //console.log(getSettingsContents);
        const logMessage = `
\`\`\`
API: ${getSettingsContents.main_api}
API Type: ${getSettingsContents[getSettingsContents.main_api + '_settings'].type}
API server: ${getSettingsContents.api_server}
Model: ${getContextContents.onlineStatus}
Context Template: ${power_user.context.preset}
Instruct Template: ${power_user.instruct.preset}
API Settings: ${JSON.stringify(getSettingsContents[getSettingsContents.main_api + '_settings'], null, 2)}
\`\`\`
    `;

        //console.log(getSettingsContents)
        //console.log(logMessage);

        try {
            await copyText(logMessage);
            toastr.info('Your ST API setup data has been copied to the clipboard.');
        } catch (error) {
            toastr.error('Failed to copy ST Setup to clipboard:', error);
        }
    });
}


// MARK: DOM Handlers Start
jQuery(async function () {
    setTimeout(function () {
        $('#groupControlsToggle').trigger('click');
        $('#groupCurrentMemberListToggle .inline-drawer-icon').trigger('click');
    }, 200);

    $(document).on('click', '.api_loading', () => cancelStatusCheck('Canceled because connecting was manually canceled'));

    //////////INPUT BAR FOCUS-KEEPING LOGIC/////////////
    let S_TAPreviouslyFocused = false;
    $('#send_textarea').on('focusin focus click', () => {
        S_TAPreviouslyFocused = true;
    });
    $('#send_but, #option_regenerate, #option_continue, #mes_continue, #mes_impersonate').on('click', () => {
        if (S_TAPreviouslyFocused) {
            $('#send_textarea').trigger('focus');
        }
    });
    $(document).on('click', event => {
        if ($(':focus').attr('id') !== 'send_textarea') {
            var validIDs = ['options_button', 'send_but', 'mes_impersonate', 'mes_continue', 'send_textarea', 'option_regenerate', 'option_continue'];
            if (!validIDs.includes($(event.target).attr('id'))) {
                S_TAPreviouslyFocused = false;
            }
        } else {
            S_TAPreviouslyFocused = true;
        }
    });

    /////////////////

    $('#swipes-checkbox').on('change', function () {
        _set_ce_swipes(!!$('#swipes-checkbox').prop('checked'));
        if (swipes) {
            //console.log('toggle change calling showswipebtns');
            showSwipeButtons();
        } else {
            hideSwipeButtons();
        }
        saveSettingsDebounced();
    });

    ///// SWIPE BUTTON CLICKS ///////

    //limit swiping to only last message clicks
    $(document).on('click', '.last_mes .swipe_right', async (e, data) => await swipe(e, SWIPE_DIRECTION.RIGHT, data));
    $(document).on('click', '.last_mes .swipe_left', async (e, data) => await swipe(e, SWIPE_DIRECTION.LEFT, data));

    initCharacterSearch();

    $('#mes_impersonate').on('click', function () {
        $('#option_impersonate').trigger('click');
    });

    $('#mes_continue').on('click', function () {
        $('#option_continue').trigger('click');
    });

    const userInputGenerateMutex = new SimpleMutex(sendTextareaMessage);
    $('#send_but').on('click', async function () {
        await userInputGenerateMutex.update();
    });

    //menu buttons setup

    $('#rm_button_settings').on('click', function () {
        _set_selected_button('settings');
        selectRightMenuWithAnimation('rm_api_block');
    });
    $('#rm_button_characters').on('click', function () {
        _set_selected_button('characters');
        select_rm_characters();
    });
    $('#rm_button_back').on('click', function () {
        _set_selected_button('characters');
        select_rm_characters();
    });
    $('#rm_button_create').on('click', function () {
        _set_selected_button('create');
        select_rm_create();
    });
    $('#rm_button_selected_ch').on('click', function () {
        if (selected_group) {
            select_group_chats(selected_group, false);
        } else {
            _set_selected_button('character_edit');
            select_selected_character(this_chid);
        }
        $('#character_search_bar').val('').trigger('input');
    });

    $(document).on('click', '.character_select', async function () {
        const id = Number($(this).attr('data-chid'));
        await selectCharacterById(id);
    });

    $(document).on('click', '.bogus_folder_select', function () {
        const tagId = $(this).attr('tagid');
        console.debug('Bogus folder clicked', tagId);
        chooseBogusFolder($(this), tagId);
    });

    const cssAutofit = CSS.supports('field-sizing', 'content');
    if (!cssAutofit) {
        /**
         * Sets the scroll height of the edit textarea to fit the content.
         * @param {HTMLTextAreaElement} e Textarea element to auto-fit
         */
        function autoFitEditTextArea(e) {
            const scrollTop = chatElement.scrollTop();
            e.style.height = '0px';
            const newHeight = e.scrollHeight + 4;
            e.style.height = `${newHeight}px`;
            chatElement.scrollTop(scrollTop);
        }
        const autoFitEditTextAreaDebounced = debounce(autoFitEditTextArea, debounce_timeout.short);
        document.addEventListener('input', e => {
            if (e.target instanceof HTMLTextAreaElement && e.target.classList.contains('edit_textarea')) {
                const scrollbarShown = e.target.clientWidth < e.target.offsetWidth && e.target.offsetHeight >= window.innerHeight * 0.75;
                const immediately = (e.target.scrollHeight > e.target.offsetHeight && !scrollbarShown) || e.target.value === '';
                immediately ? autoFitEditTextArea(e.target) : autoFitEditTextAreaDebounced(e.target);
            }
        });
    }

    const chatElementScroll = document.getElementById('chat');
    const chatScrollHandler = function () {
        if (power_user.waifuMode) {
            scrollLock = true;
            return;
        }

        const scrollIsAtBottom = Math.abs(chatElementScroll.scrollHeight - chatElementScroll.clientHeight - chatElementScroll.scrollTop) < 5;

        // Resume autoscroll if the user scrolls to the bottom
        if (scrollLock && scrollIsAtBottom) {
            scrollLock = false;
        }

        // Cancel autoscroll if the user scrolls up
        if (!scrollLock && !scrollIsAtBottom) {
            scrollLock = true;
        }
    };
    chatElementScroll.addEventListener('scroll', chatScrollHandler, { passive: true });

    $(document).on('click', '.mes', function () {
        //when a 'delete message' parent div is clicked
        // and we are in delete mode and del_checkbox is visible
        if (!is_delete_mode || !$(this).children('.del_checkbox').is(':visible')) {
            return;
        }
        $('.mes').children('.del_checkbox').each(function () {
            $(this).prop('checked', false);
            $(this).parent().removeClass('selected');
        });
        $(this).addClass('selected'); //sets the bg of the mes selected for deletion
        var i = Number($(this).attr('mesid')); //checks the message ID in the chat
        this_del_mes = i;
        //as long as the current message ID is less than the total chat length
        while (i < chat.length) {
            //sets the bg of the all msgs BELOW the selected .mes
            $(`.mes[mesid="${i}"]`).addClass('selected');
            $(`.mes[mesid="${i}"]`).children('.del_checkbox').prop('checked', true);
            i++;
        }
    });

    /**
     * Handles the deletion of a chat file, including group chats.
     *
     * @param {string} chatFile - The name of the chat file to delete.
     * @param {object} group - The group object if the chat is part of a group.
     * @param {boolean} [fromSlashCommand=false] - Whether the deletion was triggered from a slash command.
     * @returns {Promise<void>}
     */
    async function handleDeleteChat(chatFile, group, fromSlashCommand = false) {
        // Close past chat popup.
        $('#select_chat_cross').trigger('click');
        showLoader();
        if (group) {
            await deleteGroupChat(group, chatFile);
        } else {
            await delChat(`${chatFile}.jsonl`);
        }

        if (fromSlashCommand) {  // When called from `/delchat` command, don't re-open the history view.
            $('#options').hide();  // Hide option popup menu.
            hideLoader();
        } else {  // Open the history view again after 2 seconds (delay to avoid edge cases for deleting last chat).
            setTimeout(function () {
                $('#option_select_chat').trigger('click');
                $('#options').hide();  // Hide option popup menu.
                hideLoader();
            }, 2000);
        }
    }

    $(document).on('click', '.PastChat_cross', async function (e, { fromSlashCommand = false } = {}) {
        e.stopPropagation();
        const deleteFileName = $(this).attr('file_name');
        console.debug('detected cross click for' + deleteFileName);

        // Skip confirmation if called from a slash command.
        if (fromSlashCommand) {
            await handleDeleteChat(deleteFileName, selected_group, true);
            return;
        }

        const result = await callGenericPopup('<h3>' + t`Delete the Chat File?` + '</h3>', POPUP_TYPE.CONFIRM);
        if (result === POPUP_RESULT.AFFIRMATIVE) {
            await handleDeleteChat(deleteFileName, selected_group, false);
        }
    });

    $('#advanced_div').on('click', function () {
        if (!cm_is_advanced_char_open) {
            _set_cm_is_advanced_char_open(true);
            $('#character_popup').css({ 'display': 'flex', 'opacity': 0.0 }).addClass('open');
            $('#character_popup').transition({
                opacity: 1.0,
                duration: animation_duration,
                easing: animation_easing,
            });
        } else {
            _set_cm_is_advanced_char_open(false);
            $('#character_popup').css('display', 'none').removeClass('open');
        }
    });

    $('#character_cross').on('click', function () {
        _set_cm_is_advanced_char_open(false);
        $('#character_popup').transition({
            opacity: 0,
            duration: animation_duration,
            easing: animation_easing,
        });
        setTimeout(function () { $('#character_popup').css('display', 'none'); }, animation_duration);
    });

    $('#character_popup_ok').on('click', function () {
        _set_cm_is_advanced_char_open(false);
        $('#character_popup').css('display', 'none');
    });

    $('#dialogue_popup_ok').on('click', async function (_e) {
        dialogueCloseStop = false;
        $('#shadow_popup').transition({
            opacity: 0,
            duration: animation_duration,
            easing: animation_easing,
        });
        setTimeout(function () {
            if (dialogueCloseStop) return;
            $('#shadow_popup').css('display', 'none');
            $('#dialogue_popup').removeClass('large_dialogue_popup');
            $('#dialogue_popup').removeClass('wide_dialogue_popup');
        }, animation_duration);

        if (dialogueResolve) {
            if (popup_type == 'input') {
                dialogueResolve($('#dialogue_popup_input').val());
                $('#dialogue_popup_input').val('');
            }
            else {
                dialogueResolve(true);
            }

            dialogueResolve = null;
        }
    });

    $('#dialogue_popup_cancel').on('click', function (e) {
        dialogueCloseStop = false;
        $('#shadow_popup').transition({
            opacity: 0,
            duration: animation_duration,
            easing: animation_easing,
        });
        setTimeout(function () {
            if (dialogueCloseStop) return;
            $('#shadow_popup').css('display', 'none');
            $('#dialogue_popup').removeClass('large_dialogue_popup');
        }, animation_duration);

        popup_type = '';

        if (dialogueResolve) {
            dialogueResolve(false);
            dialogueResolve = null;
        }
    });

    $('#add_avatar_button').on('change', function () {
        const inputElement = /** @type {HTMLInputElement} */ (this);
        read_avatar_load(inputElement);
    });

    $('#form_create').on('submit', (e) => createOrEditCharacter(e.originalEvent));

    $('#delete_button').on('click', async function () {
        if (this_chid === undefined || !characters[this_chid]) {
            toastr.warning('No character selected.');
            return;
        }

        let deleteChats = false;

        const confirm = await Popup.show.confirm(t`Delete the character?`, await renderTemplateAsync('deleteConfirm'), {
            onClose: () => { deleteChats = !!$('#del_char_checkbox').prop('checked'); },
        });
        if (!confirm) {
            return;
        }

        await deleteCharacter(characters[this_chid].avatar, { deleteChats: deleteChats });
    });

    //////// OPTIMIZED ALL CHAR CREATION/EDITING TEXTAREA LISTENERS ///////////////

    $('#character_name_pole').on('input', function () {
        if (menu_type == 'create') {
            create_save.name = String($('#character_name_pole').val());
        }
    });

    const elementsToUpdate = {
        '#description_textarea': function () { create_save.description = String($('#description_textarea').val()); },
        '#creator_notes_textarea': function () { create_save.creator_notes = String($('#creator_notes_textarea').val()); },
        '#character_version_textarea': function () { create_save.character_version = String($('#character_version_textarea').val()); },
        '#system_prompt_textarea': function () { create_save.system_prompt = String($('#system_prompt_textarea').val()); },
        '#post_history_instructions_textarea': function () { create_save.post_history_instructions = String($('#post_history_instructions_textarea').val()); },
        '#creator_textarea': function () { create_save.creator = String($('#creator_textarea').val()); },
        '#tags_textarea': function () { create_save.tags = String($('#tags_textarea').val()); },
        '#personality_textarea': function () { create_save.personality = String($('#personality_textarea').val()); },
        '#scenario_pole': function () { create_save.scenario = String($('#scenario_pole').val()); },
        '#mes_example_textarea': function () { create_save.mes_example = String($('#mes_example_textarea').val()); },
        '#firstmessage_textarea': function () { create_save.first_message = String($('#firstmessage_textarea').val()); },
        '#talkativeness_slider': function () { create_save.talkativeness = Number($('#talkativeness_slider').val()); },
        '#depth_prompt_prompt': function () { create_save.depth_prompt_prompt = String($('#depth_prompt_prompt').val()); },
        '#depth_prompt_depth': function () { create_save.depth_prompt_depth = Number($('#depth_prompt_depth').val()); },
        '#depth_prompt_role': function () { create_save.depth_prompt_role = String($('#depth_prompt_role').val()); },
    };

    Object.keys(elementsToUpdate).forEach(function (id) {
        $(id).on('input', function () {
            if (menu_type == 'create') {
                elementsToUpdate[id]();
            } else {
                saveCharacterDebounced();
            }
        });
    });

    $('#creator_notes_textarea').on('input', function () {
        const notes = String($('#creator_notes_textarea').val());
        const avatar = menu_type === 'create' ? '' : characters[this_chid]?.avatar;
        $('#creator_notes_spoiler').html(formatCreatorNotes(notes, avatar));
    });

    $('#favorite_button').on('click', function () {
        updateFavButtonState(!cm_fav_ch_checked);
        if (menu_type != 'create') {
            saveCharacterDebounced();
        }
    });

    /* $("#renameCharButton").on('click', renameCharacter); */

    $(document).on('click', '.renameChatButton', async function (e) {
        e.stopPropagation();
        const oldFileName = $(this).closest('.select_chat_block_wrapper').find('.select_chat_block_filename').text();

        const popupText = await renderTemplateAsync('chatRename');
        const newName = await callGenericPopup(popupText, POPUP_TYPE.INPUT, oldFileName);

        if (!newName || typeof newName !== 'string' || newName == oldFileName) {
            console.log('no new name found, aborting');
            return;
        }

        await renameChat(oldFileName, newName);

        await delay(250);
        $('#option_select_chat').trigger('click');
        $('#options').hide();
    });

    $(document).on('click', '.exportChatButton, .exportRawChatButton', async function (e) {
        e.stopPropagation();
        const format = $(this).data('format') || 'txt';
        await saveChatConditional();
        const filename = $(this).closest('.select_chat_block_wrapper').find('.select_chat_block_filename').text();
        console.log(`exporting ${filename} in ${format} format`);

        const body = {
            is_group: !!selected_group,
            avatar_url: characters[this_chid]?.avatar,
            file: `${filename}.jsonl`,
            exportfilename: `${filename}.${format}`,
            format: format,
        };
        console.log(body);
        try {
            const response = await fetch('/api/chats/export', {
                method: 'POST',
                body: JSON.stringify(body),
                headers: getRequestHeaders(),
            });
            const data = await response.json();
            if (!response.ok) {
                // display error message
                console.log(data.message);
                await delay(250);
                toastr.error(`Error: ${data.message}`);
                return;
            } else {
                const mimeType = format == 'txt' ? 'text/plain' : 'application/octet-stream';
                // success, handle response data
                console.log(data);
                await delay(250);
                toastr.success(data.message);
                download(data.result, body.exportfilename, mimeType);
            }
        } catch (error) {
            // display error message
            console.log(`An error has occurred: ${error.message}`);
            await delay(250);
            toastr.error(`Error: ${error.message}`);
        }
    });


    const button = $('#options_button');
    const menu = $('#options');
    let isOptionsMenuVisible = false;

    function showMenu() {
        showBookmarksButtons();
        menu.fadeIn(animation_duration);
        optionsPopper.update();
        isOptionsMenuVisible = true;
    }

    function hideMenu() {
        menu.fadeOut(animation_duration);
        optionsPopper.update();
        isOptionsMenuVisible = false;
    }

    function isMouseOverButtonOrMenu() {
        return menu.is(':hover, :focus-within') || button.is(':hover, :focus');
    }

    button.on('click', function () {
        if (isOptionsMenuVisible) {
            hideMenu();
        } else {
            showMenu();
        }
    });
    $(document).on('click', function () {
        if (!isOptionsMenuVisible) return;
        if (!isMouseOverButtonOrMenu()) { hideMenu(); }
    });

    /* $('#set_chat_character_settings').on('click', setScenarioOverride); */

    ///////////// OPTIMIZED LISTENERS FOR LEFT SIDE OPTIONS POPUP MENU //////////////////////
    $('#options [id]').on('click', async function (event, customData) {
        const fromSlashCommand = customData?.fromSlashCommand || false;
        var id = $(this).attr('id');

        // Check whether a custom prompt was provided via custom data (for example through a slash command)
        const additionalPrompt = customData?.additionalPrompt?.trim() || undefined;
        const buildOrFillAdditionalArgs = (args = {}) => ({
            ...args,
            ...(additionalPrompt !== undefined && { quiet_prompt: additionalPrompt, quietToLoud: true }),
        });

        if (id == 'option_select_chat') {
            if (this_chid === undefined && !is_send_press && !selected_group) {
                await openPermanentAssistantCard();
            }
            if ((selected_group && !is_group_generating) || (this_chid !== undefined && !is_send_press) || fromSlashCommand) {
                await displayPastChats();
                //this is just to avoid the shadow for past chat view when using /delchat
                //however, the dialog popup still gets one..
                if (!fromSlashCommand) {
                    console.log('displaying shadow');
                    $('#shadow_select_chat_popup').css('display', 'block');
                    $('#shadow_select_chat_popup').css('opacity', 0.0);
                    $('#shadow_select_chat_popup').transition({
                        opacity: 1.0,
                        duration: animation_duration,
                        easing: animation_easing,
                    });
                }
            }
        }

        else if (id == 'option_start_new_chat') {
            if ((selected_group || this_chid !== undefined) && !is_send_press) {
                let deleteCurrentChat = false;
                const result = await Popup.show.confirm(t`Start new chat?`, await renderTemplateAsync('newChatConfirm'), {
                    onClose: () => { deleteCurrentChat = !!$('#del_chat_checkbox').prop('checked'); },
                });
                if (!result) {
                    return;
                }

                await doNewChat({ deleteCurrentChat: deleteCurrentChat });
            }
            if (!selected_group && this_chid === undefined && !is_send_press) {
                const alreadyInTempChat = this_chid === undefined && name2 === neutralCharacterName;
                await newAssistantChat({ temporary: alreadyInTempChat });
            }
        }

        else if (id == 'option_regenerate') {
            //Attempting to regenerate a user message will instead generate a new message.
            if (chat.length && chat.length - 1 === this_edit_mes_id && chat[this_edit_mes_id]?.is_user == false) {
                toastr.warning(t`Finish the edit before starting a generation.`, t`You cannot regenerate the message you are editing.`);
                return;
            }
            if (is_send_press == false) {
                if (selected_group) {
                    regenerateGroup();
                }
                else {
                    _set_is_send_press(true);
                    Generate('regenerate', buildOrFillAdditionalArgs());
                }
            }
        }

        else if (id == 'option_impersonate') {
            if (is_send_press == false || fromSlashCommand) {
                _set_is_send_press(true);
                Generate('impersonate', buildOrFillAdditionalArgs());
            }
        }

        else if (id == 'option_continue') {
            if (swipeState == SWIPE_STATE.EDITING) {
                toastr.warning(t`Confirm the edit to start a generation.`, t`You cannot send a message during a swipe-edit.`);
                return;
            }
            if (chat.length && chat.length - 1 === this_edit_mes_id) {
                toastr.warning(t`Finish the edit before starting a generation.`, t`You cannot continue the message you are editing.`);
                return;
            }

            if (is_send_press == false || fromSlashCommand) {
                _set_is_send_press(true);
                Generate('continue', buildOrFillAdditionalArgs());
            }
        }

        else if (id == 'option_delete_mes') {
            setTimeout(() => openMessageDelete(fromSlashCommand), animation_duration);
        }

        else if (id == 'option_close_chat') {
            await closeCurrentChat();
        }

        else if (id === 'option_settings') {
            //var checkBox = document.getElementById("waifuMode");
            var topBar = document.getElementById('top-bar');
            var topSettingsHolder = document.getElementById('top-settings-holder');
            var divchat = document.getElementById('chat');

            //if (checkBox.checked) {
            if (topBar.style.display === 'none') {
                topBar.style.display = ''; // or "inline-block" if that's the original display value
                topSettingsHolder.style.display = ''; // or "inline-block" if that's the original display value

                divchat.style.borderRadius = '';
                divchat.style.backgroundColor = '';

            } else {

                divchat.style.borderRadius = '10px'; // Adjust the value to control the roundness of the corners
                divchat.style.backgroundColor = ''; // Set the background color to your preference

                topBar.style.display = 'none';
                topSettingsHolder.style.display = 'none';
            }
            //}
        }
        hideMenu();
    });

    $('#newChatFromManageScreenButton').on('click', async function () {
        await doNewChat({ deleteCurrentChat: false });
        $('#select_chat_cross').trigger('click');
    });

    //////////////////////////////////////////////////////////////////////////////////////////////

    //functionality for the cancel delete messages button, reverts to normal display of input form
    $('#dialogue_del_mes_cancel').on('click', function () {
        $('#dialogue_del_mes').css('display', 'none');
        $('#send_form').css('display', css_send_form_display);
        $('.del_checkbox').each(function () {
            $(this).css('display', 'none');
            $(this).parent().children('.for_checkbox').css('display', 'block');
            $(this).parent().removeClass('selected');
            $(this).prop('checked', false);
        });
        showSwipeButtons();
        this_del_mes = -1;
        _set_ce_is_delete_mode(false);
    });

    //confirms message deletion with the "ok" button
    $('#dialogue_del_mes_ok').on('click', async function () {
        $('#dialogue_del_mes').css('display', 'none');
        $('#send_form').css('display', css_send_form_display);
        $('.del_checkbox').each(function () {
            $(this).css('display', 'none');
            $(this).parent().children('.for_checkbox').css('display', 'block');
            $(this).parent().removeClass('selected');
            $(this).prop('checked', false);
        });

        if (this_del_mes >= 0) {
            for (let i = (chat.length - 1); i >= this_del_mes; i--) {
                deleteItemizedPromptForMessage(i);
            }
            chatElement.find(`.mes[mesid="${this_del_mes}"]`).nextAll('div').remove();
            chatElement.find(`.mes[mesid="${this_del_mes}"]`).remove();
            chat.length = this_del_mes;
            chat_metadata.tainted = true;
            await saveChatConditional();
            chatElement.scrollTop(chatElement[0].scrollHeight);
            await eventSource.emit(event_types.MESSAGE_DELETED, chat.length);
            chatElement.find('.mes').removeClass('last_mes');
            chatElement.find('.mes').last().addClass('last_mes');
        } else {
            console.log('this_del_mes is not >= 0, not deleting');
        }

        showSwipeButtons();
        this_del_mes = -1;
        _set_ce_is_delete_mode(false);
    });

    $('#main_api').on('change', async function () {
        cancelStatusCheck('Canceled because main api changed');
        changeMainAPI();
        saveSettingsDebounced();
        await eventSource.emit(event_types.MAIN_API_CHANGED, { apiId: main_api });
    });

    ////////////////// OPTIMIZED RANGE SLIDER LISTENERS////////////////

    var sliderLocked = true;
    var sliderTimer;

    $('input[type=\'range\']').on('touchstart', function () {
        // Unlock the slider after 300ms
        setTimeout(function () {
            sliderLocked = false;
            $(this).css('background-color', 'var(--SmartThemeQuoteColor)');
        }.bind(this), 300);
    });

    $('input[type=\'range\']').on('touchend', function () {
        clearTimeout(sliderTimer);
        $(this).css('background-color', '');
        sliderLocked = true;
    });

    $('input[type=\'range\']').on('touchmove', function (event) {
        if (sliderLocked) {
            event.preventDefault();
        }
    });

    const sliders = [
        {
            sliderId: '#amount_gen',
            counterId: '#amount_gen_counter',
            format: (val) => `${val}`,
            setValue: (val) => { _set_amount_gen(Number(val)); },
        },
        {
            sliderId: '#max_context',
            counterId: '#max_context_counter',
            format: (val) => `${val}`,
            setValue: (val) => { _set_max_context(Number(val)); },
        },
    ];

    sliders.forEach(slider => {
        $(document).on('input', slider.sliderId, function () {
            const value = $(this).val();
            const formattedValue = slider.format(value);
            slider.setValue(value);
            $(slider.counterId).val(formattedValue);
            saveSettingsDebounced();
        });
    });

    //////////////////////////////////////////////////////////////

    $('#select_chat_cross').on('click', function () {
        $('#shadow_select_chat_popup').transition({
            opacity: 0,
            duration: animation_duration,
            easing: animation_easing,
        });
        setTimeout(function () { $('#shadow_select_chat_popup').css('display', 'none'); }, animation_duration);
    });

    $(document).on('pointerup', '.mes_copy', async function () {
        if (this_chid !== undefined || selected_group || name2 === neutralCharacterName) {
            try {
                const messageId = $(this).closest('.mes').attr('mesid');
                const text = chat[messageId].mes;
                await copyText(text);
                toastr.info('Copied!', '', { timeOut: 2000 });
            } catch (err) {
                console.error('Failed to copy: ', err);
            }
        }
    });

    //********************
    //***Message Editor***
    $(document).on('click', '.mes_edit', async function () {
        if (is_delete_mode) {
            return;
        }
        if (this_chid !== undefined || selected_group || name2 === neutralCharacterName) {
            // Previously system messages we're allowed to be edited
            /*const message = $(this).closest(".mes");

            if (message.data("isSystem")) {
                return;
            }*/

            if (this_edit_mes_id >= 0) {
                let mes_edited = chatElement.find(`[mesid="${this_edit_mes_id}"]`).find('.mes_edit_done');
                if (Number(edit_mes_id) == chat.length - 1) { //if the generating swipe (...)
                    let run_edit = true;
                    if (chat[edit_mes_id].swipe_id !== undefined) {
                        if (chat[edit_mes_id].swipes.length === chat[edit_mes_id].swipe_id) {
                            run_edit = false;
                        }
                    }
                    if (run_edit) {
                        hideSwipeButtons();
                    }
                }
                await messageEditDone(mes_edited);
            }
            var edit_mes_id = Number($(this).closest('.mes').attr('mesid'));

            await messageEdit(edit_mes_id);
        }
    });

    $(document).on('input', '#curEditTextarea', function () {
        if (power_user.auto_save_msg_edits === true) {
            messageEditAuto($(this));
        }
    });

    $(document).on('click', '.extraMesButtonsHint', function (e) {
        const $hint = $(e.target);
        const $buttons = $hint.siblings('.extraMesButtons');

        $hint.transition({
            opacity: 0,
            duration: animation_duration,
            easing: animation_easing,
            complete: function () {
                $hint.hide();
                $buttons
                    .addClass('visible')
                    .css({
                        opacity: 0,
                        display: 'flex',
                    })
                    .transition({
                        opacity: 1,
                        duration: animation_duration,
                        easing: animation_easing,
                    });
            },
        });
    });

    $(document).on('click', function (e) {
        // Expanded options don't need to be closed
        if (power_user.expand_message_actions) {
            return;
        }

        // Check if the click was outside the relevant elements
        if (!$(e.target).closest('.extraMesButtons, .extraMesButtonsHint').length) {
            const $visibleButtons = $('.extraMesButtons.visible');

            if (!$visibleButtons.length) {
                return;
            }

            const $hiddenHints = $('.extraMesButtonsHint:hidden');

            // Transition out the .extraMesButtons first
            $visibleButtons.transition({
                opacity: 0,
                duration: animation_duration,
                easing: animation_easing,
                complete: function () {
                    // Hide the .extraMesButtons after the transition
                    $(this)
                        .hide()
                        .removeClass('visible');

                    // Transition the .extraMesButtonsHint back in
                    $hiddenHints
                        .show()
                        .transition({
                            opacity: 0.3,
                            duration: animation_duration,
                            easing: animation_easing,
                            complete: function () {
                                $(this).css('opacity', '');
                            },
                        });
                },
            });
        }
    });

    $(document).on('click', '.mes_edit_cancel', async function () {
        await messageEditCancel.call(this, this_edit_mes_id);
    });

    $(document).on('click', '.mes_edit_up', async function () {
        if (this_edit_mes_id <= 0) {
            return;
        }
        const targetId = Number(this_edit_mes_id) - 1;
        await messageEditMove(this_edit_mes_id, targetId);
    });

    $(document).on('click', '.mes_edit_down', async function () {
        if (this_edit_mes_id >= chat.length - 1) {
            return;
        }

        const targetId = Number(this_edit_mes_id) + 1;
        await messageEditMove(this_edit_mes_id, targetId);
    });

    $(document).on('click', '.mes_edit_copy', async function () {
        const confirmation = await callGenericPopup(t`Create a copy of this message?`, POPUP_TYPE.CONFIRM);
        if (!confirmation) {
            return;
        }

        hideSwipeButtons();
        const oldScroll = chatElement[0].scrollTop;
        const clone = structuredClone(chat[this_edit_mes_id]);
        clone.send_date = Date.now();
        const this_edit_mes_element = $(this).closest('.mes');
        clone.mes = this_edit_mes_element.find('.edit_textarea').val().toString();

        if (power_user.trim_spaces) {
            clone.mes = clone.mes.trim();
        }

        chat.splice(Number(this_edit_mes_id) + 1, 0, clone);
        const newMessageElement = updateMessageElement(clone);
        this_edit_mes_element.after(newMessageElement);

        updateViewMessageIds();
        await saveChatConditional();
        chatElement[0].scrollTop = oldScroll;
        showSwipeButtons();
    });

    $(document).on('click', '.mes_edit_delete', async function (event, customData) {
        const fromSlashCommand = customData?.fromSlashCommand || false;
        const message = chat[this_edit_mes_id];
        const selectedSwipe = message.swipe_id ?? undefined;
        const swipesArray = Array.isArray(message.swipes) ? message.swipes : [];
        const canDeleteSwipe = power_user.confirm_message_delete && !fromSlashCommand && !message.is_user && swipesArray.length > 1 && this_edit_mes_id === chat.length - 1 && selectedSwipe !== undefined;
        await deleteMessage(Number(this_edit_mes_id), canDeleteSwipe ? selectedSwipe : undefined, power_user.confirm_message_delete && fromSlashCommand !== true);
    });

    $(document).on('click', '.mes_edit_done', async function () {
        await messageEditDone($(this));
    });

    //Select chat

    //**************************CHARACTER IMPORT EXPORT*************************//
    $('#character_import_button').on('click', function () {
        $('#character_import_file').trigger('click');
    });

    $('#character_import_file').on('change', async function (e) {
        $('#rm_info_avatar').html('');

        if (!(e.target instanceof HTMLInputElement)) {
            return;
        }

        if (!e.target.files.length) {
            return;
        }

        const avatarFileNames = [];
        for (const file of e.target.files) {
            const avatarFileName = await importCharacter(file);
            if (avatarFileName !== undefined) {
                avatarFileNames.push(avatarFileName);
            }
        }

        if (avatarFileNames.length > 0) {
            await importCharactersTags(avatarFileNames);
            selectImportedChar(avatarFileNames[avatarFileNames.length - 1]);
        }

        // Clear the file input value to allow re-uploading the same file
        e.target.value = '';
    });

    $('#export_button').on('click', function () {
        isExportPopupOpen = !isExportPopupOpen;
        $('#export_format_popup').toggle(isExportPopupOpen);
        exportPopper.update();
    });

    $(document).on('click', '.export_format', async function () {
        const format = $(this).data('format');

        if (!format) {
            return;
        }

        $('#export_format_popup').hide();
        isExportPopupOpen = false;
        exportPopper.update();

        // Save before exporting
        await createOrEditCharacter();
        const body = { format, avatar_url: characters[this_chid].avatar };

        const response = await fetch('/api/characters/export', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify(body),
        });

        if (response.ok) {
            const filename = characters[this_chid].avatar.replace('.png', `.${format}`);
            const blob = await response.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.setAttribute('download', filename);
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(a.href);
            document.body.removeChild(a);
        }
    });
    //**************************CHAT IMPORT EXPORT*************************//
    $('#chat_import_button').on('click', function () {
        $('#chat_import_file').trigger('click');
    });

    $('#chat_import_file').on('change', async function (e) {
        const targetElement = e.target;
        const formElement = document.getElementById('form_import_chat');
        if (!(targetElement instanceof HTMLInputElement) || !(formElement instanceof HTMLFormElement)) {
            return;
        }

        const importedFileNames = [];

        for (const file of targetElement.files) {
            const ext = file.name.match(/\.(\w+)$/);
            const format = ext?.[1]?.toLowerCase();

            if (!['json', 'jsonl'].includes(format)) {
                toastr.warning(t`Only JSON and JSONL files are supported for chat imports.`);
                continue;
            }

            if (selected_group && format === 'json') {
                toastr.warning(t`Only SillyTavern's own format is supported for group chat imports. Sorry!`);
                continue;
            }

            const formData = new FormData(formElement);
            formData.set('file_type', format);
            formData.set('avatar', file);
            formData.set('user_name', name1);

            const importFn = selected_group ? importGroupChat : importCharacterChat;
            const result = await importFn(formData, { refresh: false });
            importedFileNames.push(...result);
        }

        if (importedFileNames.length > 0) {
            toastr.success(t`Successfully imported ${importedFileNames.length} chat(s).`);
        }

        await displayPastChats(importedFileNames);

        targetElement.value = '';
    });

    $('#rm_button_group_chats').on('click', function () {
        _set_selected_button('group_chats');
        select_group_chats(null, false);
    });

    $('#rm_button_back_from_group').on('click', function () {
        _set_selected_button('characters');
        select_rm_characters();
    });

    $('#dupe_button').on('click', async function () {
        await duplicateCharacter();
    });

    $(document).on('click', '.mes_stop', function () {
        stopGeneration();
    });

    $(document).on('click', '#form_sheld .stscript_continue', function () {
        pauseScriptExecution();
    });

    $(document).on('click', '#form_sheld .stscript_pause', function () {
        pauseScriptExecution();
    });

    $(document).on('click', '#form_sheld .stscript_stop', function () {
        stopScriptExecution();
    });

    $(document).on('click', '.drawer-opener', doDrawerOpenClick);

    $('.drawer-toggle').on('click', doNavbarIconClick);

    $('html').on('touchstart mousedown', async function (e) {
        const clickTarget = $(e.target);

        if (isExportPopupOpen
            && clickTarget.closest('#export_button').length == 0
            && clickTarget.closest('#export_format_popup').length == 0) {
            $('#export_format_popup').hide();
            isExportPopupOpen = false;
            exportPopper.update();
        }

        const forbiddenTargets = [
            '#character_cross',
            '#avatar-and-name-block',
            '#shadow_popup',
            '.popup',
            '#world_popup',
            '.ui-widget',
            '.text_pole',
            '#toast-container',
            '.select2-results',
        ];

        for (const id of forbiddenTargets) {
            if (clickTarget.closest(id).length > 0) {
                return;
            }
        }

        // This autocloses open drawers that are not pinned if a click happens inside the app which does not target them.
        const targetParentHasOpenDrawer = clickTarget.parents('.openDrawer').length;
        if (!clickTarget.hasClass('drawer-icon') && !clickTarget.hasClass('openDrawer')) {
            const $openDrawers = $('.openDrawer').not('.pinnedOpen');
            if ($openDrawers.length && targetParentHasOpenDrawer === 0) {
                // Toggle icon and drawer classes
                $('.openIcon').not('.drawerPinnedOpen').toggleClass('closedIcon openIcon');
                $openDrawers.toggleClass('closedDrawer openDrawer');
            }
        }
    });

    $(document).on('click', '.inline-drawer-toggle', async function (e) {
        if ($(e.target).hasClass('text_pole')) {
            return;
        }
        const drawer = $(this).closest('.inline-drawer');
        const icon = drawer.find('>.inline-drawer-header .inline-drawer-icon');
        const drawerContent = drawer.find('>.inline-drawer-content');
        icon.toggleClass('down up');
        icon.toggleClass('fa-circle-chevron-down fa-circle-chevron-up');
        drawer.trigger('inline-drawer-toggle');
        drawerContent.stop().slideToggle({
            complete: () => {
                $(this).css('height', '');
            },
        });

        // Set the height of "autoSetHeight" textareas within the inline-drawer to their scroll height
        if (!CSS.supports('field-sizing', 'content')) {
            const textareas = drawerContent.find('textarea.autoSetHeight');
            for (const textarea of textareas) {
                await resetScrollHeight($(textarea));
            }
        }
    });

    $(document).on('click', '.inline-drawer-maximize', function () {
        const icon = $(this).find('.inline-drawer-icon, .floating_panel_maximize');
        icon.toggleClass('fa-window-maximize fa-window-restore');
        const drawerContent = $(this).closest('.drawer-content');
        drawerContent.toggleClass('maximized');
        const drawerId = drawerContent.attr('id');
        resetMovableStyles(drawerId);
    });

    $(document).on('click', '.mes .avatar', function () {
        const messageElement = $(this).closest('.mes');
        const thumbURL = $(this).children('img').attr('src');
        const charsPath = '/characters/';
        const targetAvatarImg = thumbURL.substring(thumbURL.lastIndexOf('=') + 1);
        const charname = targetAvatarImg.replace('.png', '');
        const isValidCharacter = characters.some(x => x.avatar === decodeURIComponent(targetAvatarImg));

        // Remove existing zoomed avatars for characters that are not the clicked character when moving UI is not enabled
        if (!power_user.movingUI) {
            $('.zoomed_avatar').each(function () {
                const currentForChar = $(this).attr('forChar');
                if (currentForChar !== charname && typeof currentForChar !== 'undefined') {
                    console.debug(`Removing zoomed avatar for character: ${currentForChar}`);
                    $(this).remove();
                }
            });
        }

        const avatarSrc = (isDataURL(thumbURL) || /^\/?img\/(?:.+)/.test(thumbURL)) ? thumbURL : charsPath + targetAvatarImg;
        if ($(`.zoomed_avatar[forChar="${charname}"]`).length) {
            console.debug('removing container as it already existed');
            $(`.zoomed_avatar[forChar="${charname}"]`).fadeOut(animation_duration, () => {
                $(`.zoomed_avatar[forChar="${charname}"]`).remove();
            });
        } else {
            console.debug('making new container from template');
            const template = $('#zoomed_avatar_template').html();
            const newElement = $(template);
            newElement.attr('forChar', charname);
            newElement.attr('id', `zoomFor_${charname}`);
            newElement.addClass('draggable');
            newElement.find('.drag-grabber').attr('id', `zoomFor_${charname}header`);

            $('body').append(newElement);
            newElement.fadeIn(animation_duration);
            const zoomedAvatarImgElement = $(`.zoomed_avatar[forChar="${charname}"] img`);
            if (messageElement.attr('is_user') == 'true' || (messageElement.attr('is_system') == 'true' && !isValidCharacter)) {
                //handle user and system avatars
                const isValidPersona = decodeURIComponent(targetAvatarImg) in power_user.personas;
                if (isValidPersona) {
                    const personaSrc = getUserAvatar(targetAvatarImg);
                    zoomedAvatarImgElement.attr('src', personaSrc);
                    zoomedAvatarImgElement.attr('data-izoomify-url', personaSrc);
                } else {
                    zoomedAvatarImgElement.attr('src', thumbURL);
                    zoomedAvatarImgElement.attr('data-izoomify-url', thumbURL);
                }
            } else if (messageElement.attr('is_user') == 'false') { //handle char avatars
                zoomedAvatarImgElement.attr('src', avatarSrc);
                zoomedAvatarImgElement.attr('data-izoomify-url', avatarSrc);
            }
            loadMovingUIState();
            $(`.zoomed_avatar[forChar="${charname}"]`).css('display', 'flex');
            dragElement(newElement);

            if (power_user.zoomed_avatar_magnification) {
                $('.zoomed_avatar_container').izoomify();
            }

            $('.zoomed_avatar, .zoomed_avatar .dragClose').on('click touchend', (e) => {
                if (e.target.closest('.dragClose')) {
                    $(`.zoomed_avatar[forChar="${charname}"]`).fadeOut(animation_duration, () => {
                        $(`.zoomed_avatar[forChar="${charname}"]`).remove();
                    });
                }
            });

            zoomedAvatarImgElement.on('dragstart', (e) => {
                console.log('saw drag on avatar!');
                e.preventDefault();
                return false;
            });
        }
    });

    document.addEventListener('click', function (e) {
        if (!(e.target instanceof HTMLElement)) return;
        if (e.target.matches('#OpenAllWIEntries')) {
            document.querySelectorAll('#world_popup_entries_list .inline-drawer').forEach((/** @type {HTMLElement} */ drawer) => {
                delay(0).then(() => toggleDrawer(drawer, true));
            });
        } else if (e.target.matches('#CloseAllWIEntries')) {
            document.querySelectorAll('#world_popup_entries_list .inline-drawer').forEach((/** @type {HTMLElement} */ drawer) => {
                toggleDrawer(drawer, false);
            });
        }
    });

    $(document).on('click', '.open_alternate_greetings', openAlternateGreetings);
    /* $('#set_character_world').on('click', openCharacterWorldPopup); */

    $(document).on('focus', 'input.auto-select, textarea.auto-select', function () {
        if (!power_user.enable_auto_select_input) return;
        const control = $(this)[0];
        if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) {
            control.select();
            console.debug('Auto-selecting content of input control', control);
        }
    });

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && !e.originalEvent.isComposing) {
            const isEditVisible = $('#curEditTextarea').is(':visible') || $('.reasoning_edit_textarea').length > 0;
            if (isEditVisible && power_user.auto_save_msg_edits === false) {
                closeMessageEditor('all');
                $('#send_textarea').trigger('focus');
                return;
            }
            if (isEditVisible && power_user.auto_save_msg_edits === true) {
                chatElement.find(`.mes[mesid="${this_edit_mes_id}"] .mes_edit_done`).trigger('click');
                closeMessageEditor('reasoning');
                $('#send_textarea').trigger('focus');
                return;
            }
            if (this_edit_mes_id === undefined && $('#mes_stop').is(':visible')) {
                $('#mes_stop').trigger('click');
                if (chat.length === 0) return;
                const lastMessage = chat[chat.length - 1];
                if (Array.isArray(lastMessage.swipes) && lastMessage.swipe_id == lastMessage.swipes.length) {
                    $('.last_mes .swipe_left').trigger('click');
                }
            }
        }
    });

    $('#char-management-dropdown').on('change', async (e) => {
        const targetElement = /** @type {HTMLSelectElement} */ (e.target);
        const target = $(targetElement.selectedOptions).attr('id');
        switch (target) {
            case 'set_character_world':
                await openCharacterWorldPopup();
                break;
            case 'set_chat_character_settings':
                await setCharacterSettingsOverrides();
                break;
            case 'renameCharButton':
                await renameCharacter();
                break;
            case 'import_character_info':
                await importEmbeddedWorldInfo();
                saveCharacterDebounced();
                break;
            case 'character_source': {
                const source = getCharacterSource(this_chid);
                if (source && isValidUrl(source)) {
                    const url = new URL(source);
                    const confirm = await Popup.show.confirm('Open Source', `<span>Do you want to open the link to ${url.hostname} in a new tab?</span><var>${url}</var>`);
                    if (confirm) {
                        window.open(source, '_blank');
                    }
                } else {
                    toastr.info('This character doesn\'t seem to have a source.');
                }
            } break;
            case 'replace_update': {
                let onlineUrl = getCharacterSource(this_chid);

                const POPUP_RESULT_URL = POPUP_RESULT.CUSTOM1, POPUP_RESULT_FILE = POPUP_RESULT.CUSTOM2;
                const result = await Popup.show.confirm(t`Replace Character`,
                    `<p>${t`Choose a new character card to replace this character with.`}</p>` +
                    `<p>${t`You can also replace this character with the one from the online source.`}${onlineUrl ? `<br />This character was downloaded from: <var>${onlineUrl}</var>` : ''}</p>` +
                    `<p>${t`All chats, assets and group memberships will be preserved, but local changes to the character data will be lost.`}<br />${t`Proceed?`}</p>`,
                    {
                        okButton: false,
                        customButtons: [{
                            text: t`Replace with URL`,
                            result: POPUP_RESULT_URL,
                            classes: ['popup-button-ok'],
                        }, {
                            text: t`Replace with File`,
                            result: POPUP_RESULT_FILE,
                            classes: ['popup-button-ok'],
                        }],
                        defaultResult: onlineUrl ? POPUP_RESULT_URL : POPUP_RESULT_FILE,
                    });

                // Remember the chat currently selected, so we can reload it after the replacement
                const currentChatFile = characters[this_chid].chat;
                async function postReplace() {
                    await openCharacterChat(currentChatFile);
                }

                switch (result) {
                    case POPUP_RESULT_FILE: {
                        async function uploadReplacementCard(e) {
                            const file = e.target.files[0];
                            if (!file) {
                                return;
                            }

                            try {
                                const data = new Map();
                                data.set(file, characters[this_chid].avatar);
                                await processDroppedFiles([file], data);
                                await postReplace();
                            } catch {
                                toastr.error('Failed to replace the character card.', 'Something went wrong');
                            }
                        }
                        $('#character_replace_file').off('change').on('change', uploadReplacementCard).trigger('click');
                        break;
                    }
                    case POPUP_RESULT_URL: {
                        const inputUrl = await Popup.show.input(t`Replace Character from URL`,
                            `<p>${t`Enter the URL of the character card to replace this character with.`}</p>` +
                            (onlineUrl ? `<p>${t`This character was downloaded from: <var>${onlineUrl}</var>`}</p>` : ''),
                            onlineUrl);
                        if (!inputUrl) {
                            break;
                        }
                        onlineUrl = inputUrl;
                        await importFromExternalUrl(onlineUrl, { preserveFileName: characters[this_chid].avatar });
                        await postReplace();
                        break;
                    }
                }
            } break;
            case 'import_tags': {
                await importTags(characters[this_chid], { importSetting: tag_import_setting.ASK });
            } break;
            /*case 'delete_button':
                popup_type = "del_ch";
                callPopup(`
                        <h3>Delete the character?</h3>
                        <b>THIS IS PERMANENT!<br><br>
                        THIS WILL ALSO DELETE ALL<br>
                        OF THE CHARACTER'S CHAT FILES.<br><br></b>`
                );
                break;*/
            default:
                await eventSource.emit(event_types.CHARACTER_MANAGEMENT_DROPDOWN, target);
        }
        $('#char-management-dropdown').prop('selectedIndex', 0);
    });

    $(window).on('beforeunload', () => {
        cancelTtsPlay();
        if (streamingProcessor) {
            console.log('Page reloaded. Aborting streaming...');
            streamingProcessor.onStopStreaming();
        }
    });


    var isManualInput = false;
    var valueBeforeManualInput;

    $(document).on('input', '.range-block-counter input, .neo-range-input', function () {
        valueBeforeManualInput = $(this).val();
        console.log(valueBeforeManualInput);
    });

    $(document).on('change', '.range-block-counter input, .neo-range-input', function (e) {
        if (!(e.target instanceof HTMLElement)) {
            return;
        }
        e.target.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    });

    $(document).on('keydown', '.range-block-counter input, .neo-range-input', function (e) {
        const masterSelector = '#' + $(this).data('for');
        const masterElement = $(masterSelector);
        if (e.key === 'Enter') {
            let manualInput = Number($(this).val());
            if (isManualInput) {
                //disallow manual inputs outside acceptable range
                if (manualInput >= Number($(this).attr('min')) && manualInput <= Number($(this).attr('max'))) {
                    //if value is ok, assign to slider and update handle text and position
                    //newSlider.val(manualInput)
                    //handleSlideEvent.call(newSlider, null, { value: parseFloat(manualInput) }, 'manual');
                    valueBeforeManualInput = manualInput;
                    $(masterElement).val($(this).val()).trigger('input', { forced: true });
                } else {
                    //if value not ok, warn and reset to last known valid value
                    toastr.warning(`Invalid value. Must be between ${$(this).attr('min')} and ${$(this).attr('max')}`);
                    //newSlider.val(valueBeforeManualInput)
                    $(this).val(valueBeforeManualInput);
                }
            }
        }
    });

    $(document).on('keyup', '.range-block-counter input, .neo-range-input', function () {
        valueBeforeManualInput = $(this).val();
        isManualInput = true;
    });

    //trigger slider changes when user clicks away
    $(document).on('mouseup blur', '.range-block-counter input, .neo-range-input', function () {
        const masterSelector = '#' + $(this).data('for');
        const masterElement = $(masterSelector);
        let manualInput = Number($(this).val());
        if (isManualInput) {
            //if value is between correct range for the slider
            if (manualInput >= Number($(this).attr('min')) && manualInput <= Number($(this).attr('max'))) {
                valueBeforeManualInput = manualInput;
                //set the slider value to input value
                $(masterElement).val($(this).val()).trigger('input', { forced: true });
            } else {
                //if value not ok, warn and reset to last known valid value
                toastr.warning(`Invalid value. Must be between ${$(this).attr('min')} and ${$(this).attr('max')}`);
                $(this).val(valueBeforeManualInput);
            }
        }
        isManualInput = false;
    });

    $('.user_stats_button').on('click', function () {
        userStatsHandler();
    });

    $(document).on('click', '.external_import_button, #external_import_button', async () => {
        const html = await renderTemplateAsync('importCharacters');
        const input = await callGenericPopup(html, POPUP_TYPE.INPUT, '', { allowVerticalScrolling: true, wider: true, okButton: $('#popup_template').attr('popup-button-import'), rows: 4 });

        if (!input) {
            console.debug('Custom content import cancelled');
            return;
        }

        // break input into one input per line
        const inputs = String(input).split('\n').map(x => x.trim()).filter(x => x.length > 0);

        for (const url of inputs) {
            await importFromExternalUrl(url);
        }
    });

    _set_charDragDropHandler(new DragAndDropHandler('body', async (files, event) => {
        if (!files.length) {
            await importFromURL(event.originalEvent.dataTransfer.items, files);
        }
        await processDroppedFiles(files);
    }, { noAnimation: true }));

    _set_chatDragDropHandler(new DragAndDropHandler('#select_chat_popup', async (_, event) => {
        const importFile = document.getElementById('chat_import_file');
        if (importFile instanceof HTMLInputElement) {
            importFile.files = event.originalEvent.dataTransfer.files;
            $(importFile).trigger('change');
        }
    }));

    $('#charListGridToggle').on('click', async () => {
        doCharListDisplaySwitch();
    });

    $('#hideCharPanelAvatarButton').on('click', () => {
        $('#avatar-and-name-block').slideToggle();
    });

    $(document).on('mouseup touchend', '#show_more_messages', async function () {
        await showMoreMessages();
    });

    $(document).on('click', '.open_characters_library', async function () {
        await getCharacters();
        await eventSource.emit(event_types.OPEN_CHARACTER_LIBRARY);
    });

    // Added here to prevent execution before script.js is loaded and get rid of quirky timeouts
    await firstLoadInit();

    window.addEventListener('beforeunload', (e) => {
        if (isChatSaving || this_edit_mes_id >= 0) {
            e.preventDefault();
            e.returnValue = true;
        }
    });
});
