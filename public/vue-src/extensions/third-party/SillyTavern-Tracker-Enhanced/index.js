import { createApp, reactive } from 'vue';

import { eventSource, event_types } from '../../../../script.js';
import { SlashCommand } from '../../../../scripts/slash-commands/SlashCommand.js';
import { SlashCommandParser } from '../../../../scripts/slash-commands/SlashCommandParser.js';
import { ARGUMENT_TYPE, SlashCommandNamedArgument } from '../../../../scripts/slash-commands/SlashCommandArgument.js';
import { commonEnumProviders } from '../../../../scripts/slash-commands/SlashCommandCommonEnumsProvider.js';
import { SlashCommandEnumValue } from '../../../../scripts/slash-commands/SlashCommandEnumValue.js';

import { initSettings } from '../../../../scripts/extensions/third-party/SillyTavern-Tracker-Enhanced/src/settings/settings.js';
import { eventHandlers } from '../../../../scripts/extensions/third-party/SillyTavern-Tracker-Enhanced/src/events.js';
import { registerGenerationMutexListeners } from '../../../../scripts/extensions/third-party/SillyTavern-Tracker-Enhanced/lib/interconnection.js';
import { TrackerInterface } from '../../../../scripts/extensions/third-party/SillyTavern-Tracker-Enhanced/src/ui/trackerInterface.js';
import { TrackerPreviewManager } from '../../../../scripts/extensions/third-party/SillyTavern-Tracker-Enhanced/src/ui/trackerPreviewManager.js';
import {
    generateTrackerCommand,
    getTrackerCommand,
    saveTrackerToMessageCommand,
    stateTrackerCommand,
    trackerOverrideCommand,
    toggleTrackerInjectionCommand,
} from '../../../../scripts/extensions/third-party/SillyTavern-Tracker-Enhanced/src/commands.js';
import { FIELD_INCLUDE_OPTIONS } from '../../../../scripts/extensions/third-party/SillyTavern-Tracker-Enhanced/src/trackerDataHandler.js';
import TrackerEnhancedShell from './TrackerEnhancedShell.vue';
import TrackerEnhancedPresetSelect from './TrackerEnhancedPresetSelect.vue';

const PRESET_SELECT_MOUNT_ID = 'tracker_enhanced_preset_select_vue_mount';

let isMounted = false;
let presetSelectApp = null;
const presetSelectState = reactive({
    options: [],
    selectedPreset: '',
});

function normalizePresetOptions(options) {
    if (!Array.isArray(options)) {
        return [];
    }

    const seen = new Set();
    const normalizedOptions = [];

    for (const option of options) {
        if (!option || typeof option.value !== 'string') {
            continue;
        }

        const value = option.value;
        if (seen.has(value)) {
            continue;
        }

        seen.add(value);
        normalizedOptions.push({
            value,
            label: typeof option.label === 'string' && option.label.length > 0 ? option.label : value,
        });
    }

    return normalizedOptions;
}

function mountPresetSelect() {
    if (presetSelectApp) {
        return;
    }

    const mountPoint = document.getElementById(PRESET_SELECT_MOUNT_ID);
    if (!mountPoint) {
        return;
    }

    presetSelectApp = createApp(TrackerEnhancedPresetSelect, {
        state: presetSelectState,
    });
    presetSelectApp.mount(mountPoint);
}

function updatePresetSelect(options, selectedPreset) {
    const normalizedOptions = normalizePresetOptions(options);
    presetSelectState.options = normalizedOptions;

    const selectedValue = typeof selectedPreset === 'string' ? selectedPreset : '';
    const selectedExists = normalizedOptions.some((option) => option.value === selectedValue);
    presetSelectState.selectedPreset = selectedExists ? selectedValue : (normalizedOptions[0]?.value || '');
}

function registerVueBridge() {
    window.SillyTavernTrackerEnhancedVue = {
        mountPresetSelect,
        updatePresetSelect,
    };
}

function mountSettingsShell() {
    if (isMounted || document.getElementById('tracker_enhanced_vue_mount')) {
        isMounted = true;
        return;
    }

    const settingsContainer = document.getElementById('extensions_settings2');
    if (!settingsContainer) {
        return;
    }

    const mountPoint = document.createElement('div');
    mountPoint.id = 'tracker_enhanced_vue_mount';
    settingsContainer.appendChild(mountPoint);
    createApp(TrackerEnhancedShell).mount(mountPoint);
    isMounted = true;
}

export function init() {
    registerVueBridge();

    jQuery(async () => {
        mountSettingsShell();
        await initSettings();
        await TrackerInterface.initializeTrackerButtons();
        TrackerPreviewManager.init();
        TrackerInterface.initializeInjectionIndicator();
    });

    registerGenerationMutexListeners();

    eventSource.on(event_types.CHAT_CHANGED, eventHandlers.onChatChanged);
    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, eventHandlers.onCharacterMessageRendered);
    eventSource.on(event_types.USER_MESSAGE_RENDERED, eventHandlers.onUserMessageRendered);
    eventSource.on(event_types.GENERATION_AFTER_COMMANDS, eventHandlers.onGenerateAfterCommands);
    eventSource.on(event_types.GENERATE_AFTER_COMBINE_PROMPTS, eventHandlers.generateAfterCombinePrompts);

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'generate-tracker-enhanced',
        callback: generateTrackerCommand,
        returns: 'The tracker JSON object.',
        namedArgumentList: [
            SlashCommandNamedArgument.fromProps({
                name: 'message',
                description: 'generate tracker for specific message',
                typeList: [ARGUMENT_TYPE.NUMBER],
                isRequired: false,
                enumProvider: commonEnumProviders.messages(),
            }),
            SlashCommandNamedArgument.fromProps({
                name: 'include',
                description: 'which fields to include in the tracker generation',
                typeList: [ARGUMENT_TYPE.string],
                isRequired: false,
                defaultValue: 'DYNAMIC',
                enumProvider: () => Object.keys(FIELD_INCLUDE_OPTIONS).map((key) => new SlashCommandEnumValue(key.toLowerCase())),
            }),
        ],
        helpString: 'Generates a tracker for the given message. If no message is provided, the tracker will be generated for the last non-system message.',
        aliases: ['gen-tracker-enhanced'],
    }));

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'tracker-enhanced-override',
        callback: trackerOverrideCommand,
        returns: 'The tracker JSON object.',
        namedArgumentList: [
            SlashCommandNamedArgument.fromProps({
                name: 'tracker',
                description: 'the tracker used to override',
                typeList: [ARGUMENT_TYPE.STRING],
                isRequired: true,
            }),
        ],
        helpString: 'Overrides the tracker used for the next generation with the provided tracker.',
    }));

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'save-tracker-enhanced',
        callback: saveTrackerToMessageCommand,
        returns: 'The tracker JSON object.',
        namedArgumentList: [
            SlashCommandNamedArgument.fromProps({
                name: 'message',
                description: 'message to add tracker to',
                typeList: [ARGUMENT_TYPE.NUMBER],
                isRequired: false,
                enumProvider: commonEnumProviders.messages(),
            }),
            SlashCommandNamedArgument.fromProps({
                name: 'tracker',
                description: 'the tracker to save',
                typeList: [ARGUMENT_TYPE.STRING],
                isRequired: true,
            }),
        ],
        helpString: 'Saves tracker to message. If no message is provided, the tracker will be saved to the last non-system message.',
    }));

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'get-tracker-enhanced',
        callback: getTrackerCommand,
        returns: 'The tracker JSON object.',
        namedArgumentList: [
            SlashCommandNamedArgument.fromProps({
                name: 'message',
                description: 'message to retrieve tracker from',
                typeList: [ARGUMENT_TYPE.NUMBER],
                isRequired: false,
                enumProvider: commonEnumProviders.messages(),
            }),
        ],
        helpString: 'Retrieves the tracker from the specified message. If no message is provided, the tracker will be retrieved from the last non-system message.',
    }));

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'tracker-enhanced-state',
        callback: stateTrackerCommand,
        returns: 'The current tracker extension state.',
        namedArgumentList: [
            SlashCommandNamedArgument.fromProps({
                name: 'enabled',
                description: 'whether to enable or disable the tracker extension',
                typeList: [ARGUMENT_TYPE.BOOLEAN],
                isRequired: false,
            }),
        ],
        helpString: 'Get or set the tracker extension enabled/dissabled state.',
        aliases: ['toggle-tracker-enhanced'],
    }));

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'toggle_tracker_injection',
        aliases: ['ttj'],
        callback: toggleTrackerInjectionCommand,
        returns: 'true when tracker injection is enabled, false otherwise.',
        namedArgumentList: [
            SlashCommandNamedArgument.fromProps({
                name: 'enabled',
                description: 'Set to true/false to force a state; omit to toggle.',
                typeList: [ARGUMENT_TYPE.BOOLEAN],
                isRequired: false,
            }),
        ],
        helpString: 'Toggles tracker prompt injection or forces it on/off.',
    }));
}
