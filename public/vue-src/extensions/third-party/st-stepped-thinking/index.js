import { createApp } from 'vue';
import { SlashCommandParser } from '../../../../scripts/slash-commands/SlashCommandParser.js';
import { SlashCommand } from '../../../../scripts/slash-commands/SlashCommand.js';
import {
    deleteHiddenThoughts,
    findChatCharacterIdByName,
    registerGenerationEventListeners,
    runNewBoundThoughtsGeneration,
} from '../../../../scripts/extensions/third-party/st-stepped-thinking/thinking/engine.js';
import {
    ARGUMENT_TYPE,
    SlashCommandArgument,
    SlashCommandNamedArgument,
} from '../../../../scripts/slash-commands/SlashCommandArgument.js';
import { commonEnumProviders } from '../../../../scripts/slash-commands/SlashCommandCommonEnumsProvider.js';
import { registerGenerationMutexListeners } from '../../../../scripts/extensions/third-party/st-stepped-thinking/interconnection.js';
import {
    loadSettings,
    registerSettingsListeners,
    addSettingsUI,
} from '../../../../scripts/extensions/third-party/st-stepped-thinking/settings/settings.js';
import { setCharacterId, setCharacterName } from '../../../../scripts/core/character-manager.js';
import { getContext } from '../../../../scripts/extensions.js';
import SteppedThinkingSettings from './SteppedThinkingSettings.vue';

/**
 * @param {object} input
 * @param {?string} name
 * @return {Promise<string>}
 */
async function runThinkingCommand(input, name = '') {
    const context = getContext();

    // TODO: implement a popup to select a character
    if (!name && Number.isNaN(parseInt(context.characterId))) {
        throw new Error('Unknown character to generate thoughts. Please, specify one with passing the name argument');
    }
    if (name) {
        let characterId = findChatCharacterIdByName(name);

        setCharacterId(characterId);
        setCharacterName(name);
    }

    let targetPromptIds = input.prompt_ids ? input.prompt_ids.split(',').map(id => Number(id)) : null;

    await runNewBoundThoughtsGeneration($('#send_textarea'), targetPromptIds).catch(error => {
        // For some reason, the characterId and characterName are reset after the first thinking prompt generation in the context
        // which leads to throwing an error. I have no desire to untie the generation spaghetti to figure out how to
        // prevent this behavior or add ugly crutches, taking into consideration that it actually WORKS even despite the errors
        console.error('[Stepped Thinking] An error occurred during running thinking process', error);
    });

    return '';
}

SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: 'stepthink-trigger',
    callback: runThinkingCommand,
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'character name',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: false,
            enumProvider: commonEnumProviders.groupMembers,
        }),
    ],
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'prompt_ids',
            description: 'comma-separated prompt ids, e.g., prompt_ids=1,2',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: false,
        }),
    ],
    helpString: 'Trigger Stepped Thinking.',
}));

/**
 * @param {object} _
 * @param {?string} name
 * @return {Promise<string>}
 */
async function deleteHiddenThoughtsCommand(_, name = '') {
    const numRemovedMessages = await deleteHiddenThoughts(name);

    const deletionResultInfo = `Deleted ${numRemovedMessages} thoughts`;
    toastr.info(name ? deletionResultInfo + ` from ${name}` : deletionResultInfo, 'Stepped Thinking');

    return '';
}

SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: 'stepthink-delete-hidden',
    callback: deleteHiddenThoughtsCommand,
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'character name',
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: false,
            enumProvider: commonEnumProviders.groupMembers,
        }),
    ],
    helpString: 'Delete hidden thoughts.',
}));

let initialized = false;

function mountSettings() {
    const target = document.getElementById('extensions_settings');
    if (!target) return null;

    const root = document.createElement('div');
    target.append(root);

    return createApp(SteppedThinkingSettings).mount(root);
}

export function init() {
    if (initialized) return;
    initialized = true;

    jQuery(async () => {
        const settingsView = mountSettings();

        await loadSettings();
        settingsView?.syncFromExtensionSettings?.();
        addSettingsUI();
        registerSettingsListeners();

        registerGenerationMutexListeners();
        registerGenerationEventListeners();
    });
}
