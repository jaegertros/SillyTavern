<script setup>
import { computed, reactive, ref } from 'vue';
import { saveSettingsDebounced } from '../../../../script.js';
import {
    settings as extensionSettings,
    applyThinkingMode,
    getAvailableThinkingModes,
    getDefaultCommonSettings,
    toggleShutdownFromUI,
} from '../../../../scripts/extensions/third-party/st-stepped-thinking/settings/settings.js';

const defaults = getDefaultCommonSettings();

const state = reactive({
    is_shutdown: defaults.is_shutdown,
    is_enabled: defaults.is_enabled,
    is_wian_skipped: defaults.is_wian_skipped,
    is_thinking_popups_enabled: defaults.is_thinking_popups_enabled,
    is_thoughts_spoiler_open: defaults.is_thoughts_spoiler_open,
    is_thoughts_as_system: defaults.is_thoughts_as_system,
    is_always_include_ongoing_thoughts: defaults.is_always_include_ongoing_thoughts,
    mode: defaults.mode,
    max_thoughts_in_prompt: defaults.max_thoughts_in_prompt,
    generation_delay: defaults.generation_delay,
    min_thought_length: defaults.min_thought_length,
    max_response_length: defaults.max_response_length,
    regexp_to_sanitize: defaults.regexp_to_sanitize,
    max_hiding_thoughts_lookup: defaults.max_hiding_thoughts_lookup,
    system_character_name_template: defaults.system_character_name_template,
    thoughts_message_template: defaults.thoughts_message_template,
    sending_thoughts_role: defaults.sending_thoughts_role,
    thoughts_prompts_order_prefix: defaults.thoughts_prompts_order_prefix,
    thoughts_block_title: defaults.thoughts_block_title,
    thoughts_prefix_injection_mode: defaults.thoughts_prefix_injection_mode,
    thoughts_injection_prefix: defaults.thoughts_injection_prefix,
    general_injection_template: defaults.general_injection_template,
    thought_injection_template: defaults.thought_injection_template,
    thought_injection_separator: defaults.thought_injection_separator,
    thoughts_placeholder_start: defaults.thoughts_placeholder.start,
    thoughts_placeholder_content: defaults.thoughts_placeholder.content,
    thoughts_placeholder_default_content: defaults.thoughts_placeholder.default_content,
    thoughts_placeholder_end: defaults.thoughts_placeholder.end,
});

const modeOptions = ref([]);
const isAdditionalSettingsOpen = ref(false);

const shutdownClasses = computed(() => ({
    stepthink_shutdown_turn_on: state.is_shutdown,
    stepthink_shutdown_turn_off: !state.is_shutdown,
}));

function persist() {
    saveSettingsDebounced();
}

function persistText(key, value) {
    if (!extensionSettings) return;
    extensionSettings[key] = value;
    persist();
}

function persistBoolean(key, value) {
    if (!extensionSettings) return;
    extensionSettings[key] = Boolean(value);
    persist();
}

function persistInteger(key, value) {
    if (!extensionSettings) return;

    const numericValue = Number(value);
    if (!Number.isInteger(numericValue) || numericValue < 0) {
        return;
    }

    extensionSettings[key] = numericValue;
    state[key] = numericValue;
    persist();
}

function persistFloat(key, value) {
    if (!extensionSettings) return;

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue < 0.0) {
        return;
    }

    extensionSettings[key] = numericValue;
    state[key] = numericValue;
    persist();
}

function persistPlaceholderField(field, value) {
    if (!extensionSettings) return;

    extensionSettings.thoughts_placeholder[field] = value;
    persist();
}

function onModeChange() {
    if (!extensionSettings) return;

    extensionSettings.mode = state.mode;
    applyThinkingMode(state.mode);
    persist();
}

async function onShutdownClick() {
    if (!extensionSettings) return;

    await toggleShutdownFromUI();
}

function restoreRegexpToSanitize() {
    state.regexp_to_sanitize = defaults.regexp_to_sanitize;
    persistText('regexp_to_sanitize', state.regexp_to_sanitize);
}

function restoreThoughtInjectionTemplate() {
    state.thought_injection_template = defaults.thought_injection_template;
    persistText('thought_injection_template', state.thought_injection_template);
}

function restoreThoughtsMessageTemplate() {
    state.thoughts_message_template = defaults.thoughts_message_template;
    persistText('thoughts_message_template', state.thoughts_message_template);
}

function restoreThoughtsPlaceholder() {
    state.thoughts_placeholder_start = defaults.thoughts_placeholder.start;
    state.thoughts_placeholder_content = defaults.thoughts_placeholder.content;
    state.thoughts_placeholder_default_content = defaults.thoughts_placeholder.default_content;
    state.thoughts_placeholder_end = defaults.thoughts_placeholder.end;

    persistPlaceholderField('start', state.thoughts_placeholder_start);
    persistPlaceholderField('content', state.thoughts_placeholder_content);
    persistPlaceholderField('default_content', state.thoughts_placeholder_default_content);
    persistPlaceholderField('end', state.thoughts_placeholder_end);
}

function syncFromExtensionSettings() {
    if (!extensionSettings) {
        modeOptions.value = [];
        return;
    }

    modeOptions.value = getAvailableThinkingModes();

    state.is_shutdown = Boolean(extensionSettings.is_shutdown);
    state.is_enabled = Boolean(extensionSettings.is_enabled);
    state.is_wian_skipped = Boolean(extensionSettings.is_wian_skipped);
    state.is_thinking_popups_enabled = Boolean(extensionSettings.is_thinking_popups_enabled);
    state.is_thoughts_spoiler_open = Boolean(extensionSettings.is_thoughts_spoiler_open);
    state.is_thoughts_as_system = Boolean(extensionSettings.is_thoughts_as_system);
    state.is_always_include_ongoing_thoughts = Boolean(extensionSettings.is_always_include_ongoing_thoughts);
    state.mode = extensionSettings.mode;
    state.max_thoughts_in_prompt = extensionSettings.max_thoughts_in_prompt;
    state.generation_delay = extensionSettings.generation_delay;
    state.min_thought_length = extensionSettings.min_thought_length;
    state.max_response_length = extensionSettings.max_response_length;
    state.regexp_to_sanitize = extensionSettings.regexp_to_sanitize;
    state.max_hiding_thoughts_lookup = extensionSettings.max_hiding_thoughts_lookup;
    state.system_character_name_template = extensionSettings.system_character_name_template;
    state.thoughts_message_template = extensionSettings.thoughts_message_template;
    state.sending_thoughts_role = extensionSettings.sending_thoughts_role;
    state.thoughts_prompts_order_prefix = extensionSettings.thoughts_prompts_order_prefix;
    state.thoughts_block_title = extensionSettings.thoughts_block_title;
    state.thoughts_prefix_injection_mode = extensionSettings.thoughts_prefix_injection_mode;
    state.thoughts_injection_prefix = extensionSettings.thoughts_injection_prefix;
    state.general_injection_template = extensionSettings.general_injection_template;
    state.thought_injection_template = extensionSettings.thought_injection_template;
    state.thought_injection_separator = extensionSettings.thought_injection_separator;
    state.thoughts_placeholder_start = extensionSettings.thoughts_placeholder.start;
    state.thoughts_placeholder_content = extensionSettings.thoughts_placeholder.content;
    state.thoughts_placeholder_default_content = extensionSettings.thoughts_placeholder.default_content;
    state.thoughts_placeholder_end = extensionSettings.thoughts_placeholder.end;

    applyThinkingMode(state.mode);
}

defineExpose({ syncFromExtensionSettings });
</script>

<template>
    <div id="stepthink_settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>Stepped Thinking</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <div class="flex-container justifySpaceBetween flexFlowRow">
                    <div class="flex-container marginTopBot5">
                        <label class="checkbox_label expander" for="stepthink_is_enabled"
                            title="Trigger thoughts generation every time a new message is generated">
                            <input id="stepthink_is_enabled" type="checkbox" v-model="state.is_enabled" @input="persistBoolean('is_enabled', state.is_enabled)"/>
                            Enable thinking on each message
                        </label>
                    </div>

                    <div class="flex-container marginTopBot5 indent20p">
                        <div id="stepthink_is_shutdown" class="menu_button margin0 fa-solid fa-power-off stepthink_mode_embedded"
                             :class="shutdownClasses"
                             @click="onShutdownClick"
                             title="Completely shut down/turn on the extension, including hiding/revealing already existing thoughts. The page will be reloaded">
                        </div>
                    </div>
                </div>

                <div class="flex-container alignItemsCenter">
                    Thinking mode:
                    <select id="stepthink_mode" class="text_pole widthNatural" v-model="state.mode" @input="onModeChange">
                        <option v-for="mode in modeOptions" :key="mode.name" :value="mode.name">{{ mode.title }}</option>
                    </select>
                </div>

                <hr/>

                <div class="flex-container justifySpaceBetween alignItemsCenter">
                    Prompts for thinking:
                    <div id="stepthink_prompt_list_add"
                         class="menu_button menu_button_icon fa-solid fa-plus"
                         title="Add prompt"></div>
                </div>

                <div id="stepthink_prompt_list"></div>

                <div class="flex-container marginTopBot5">
                    <label class="checkbox_label expander" for="stepthink_is_wian_skipped"
                           title="Omit World Info and Author's Note from thought generation prompts">
                        <input id="stepthink_is_wian_skipped" type="checkbox" v-model="state.is_wian_skipped" @input="persistBoolean('is_wian_skipped', state.is_wian_skipped)"/>
                        Skip WI/AN
                    </label>
                </div>

                <div class="flex-container marginTopBot5 stepthink_mode_separated">
                    <label class="checkbox_label expander" for="stepthink_is_thoughts_as_system"
                           title="Include character thoughts messages as the System role">
                        <input id="stepthink_is_thoughts_as_system" type="checkbox" v-model="state.is_thoughts_as_system" @input="persistBoolean('is_thoughts_as_system', state.is_thoughts_as_system)"/>
                        Thoughts as System
                    </label>
                </div>

                <div class="flex-container alignItemsCenter marginTopBot5 stepthink_mode_embedded">
                    Role for sending thoughts:
                    <select id="stepthink_sending_thoughts_role" class="text_pole widthNatural" v-model.number="state.sending_thoughts_role" @input="persistInteger('sending_thoughts_role', state.sending_thoughts_role)">
                        <option value="0">System</option>
                        <option value="1">User</option>
                        <option value="2">Assistant</option>
                    </select>
                </div>

                <hr/>

                <div class="flex-container marginTopBot5">
                    <div class="flex-container flex1"
                         title="The number of a character's last messages with thoughts that will be included in the generation prompt">
                        <label for="stepthink_max_thoughts_in_prompt">
                            Number of last thoughts included in prompt:
                        </label>
                        <input type="number" id="stepthink_max_thoughts_in_prompt" class="text_pole" min="0" v-model.number="state.max_thoughts_in_prompt" @input="persistInteger('max_thoughts_in_prompt', state.max_thoughts_in_prompt)"/>
                    </div>
                </div>

                <div class="flex-container marginTopBot5 stepthink_mode_embedded">
                    <label class="checkbox_label expander" for="stepthink_is_always_include_ongoing_thoughts"
                           title='Whether the thought that is currently being generated will always be included in the prompt without increasing the counter set by the "Number of last thoughts included in prompt" setting'>
                        <input id="stepthink_is_always_include_ongoing_thoughts" type="checkbox" v-model="state.is_always_include_ongoing_thoughts" @input="persistBoolean('is_always_include_ongoing_thoughts', state.is_always_include_ongoing_thoughts)"/>
                        Always include ongoing thoughts
                    </label>
                </div>

                <hr class="stepthink_mode_embedded"/>

                <div class="flex-container justifySpaceBetween alignItemsCenter">
                    <label for="stepthink_character_settings"
                           title="You can set up individual settings for selected characters. Click on a character’s name after the character is added to the list to adjust its settings">
                        Character settings (click on a name to adjust):
                    </label>
                    <div id="stepthink_load_characters"
                         class="menu_button menu_button_icon fa-solid fa-undo"
                         title="Reload characters list"></div>
                    <select id="stepthink_character_settings" class="select2_multi_sameline"
                            multiple="multiple"></select>
                </div>

                <div class="flex-container marginTopBot5">
                    <div id="stepthink_additional_settings_toggle" class="menu_button menu_button_icon" @click="isAdditionalSettingsOpen = !isAdditionalSettingsOpen">
                        <i class="fa-solid fa-cog"></i>
                        Additional Settings
                    </div>
                </div>
                <div id="stepthink_additional_settings" v-show="isAdditionalSettingsOpen">
                    <div class="flex-container marginTopBot5">
                        <label class="checkbox_label expander" for="stepthink_is_thoughts_spoiler_open"
                               title="Whether spoilers will be open or closed in new messages. It doesn't affect existing ones">
                            <input id="stepthink_is_thoughts_spoiler_open" type="checkbox" v-model="state.is_thoughts_spoiler_open" @input="persistBoolean('is_thoughts_spoiler_open', state.is_thoughts_spoiler_open)"/>
                            Thought spoilers are open by default
                        </label>
                    </div>

                    <div class="flex-container marginTopBot5">
                        <label class="checkbox_label expander" for="stepthink_is_thinking_popups_enabled"
                               title="Whether popups notifying about the progress of thinking will be shown">
                            <input id="stepthink_is_thinking_popups_enabled" type="checkbox" v-model="state.is_thinking_popups_enabled" @input="persistBoolean('is_thinking_popups_enabled', state.is_thinking_popups_enabled)"/>
                            Enable popups when a character is thinking
                        </label>
                    </div>

                    <div class="flex-container marginTopBot5">
                        <div class="flex-container flex1"
                             title="The minimum length of a generated thought in characters. If a generated thought is less than or equal to the specified length, another generation attempt will be triggered, and so on, until the length exceeds the specified value">
                            <label for="stepthink_min_thought_length">
                                Minimum thought length (characters):
                            </label>
                            <input type="number" id="stepthink_min_thought_length" class="text_pole" min="0" v-model.number="state.min_thought_length" @input="persistInteger('min_thought_length', state.min_thought_length)"/>
                        </div>
                    </div>

                    <div class="flex-container marginTopBot5">
                        <div class="flex-container flex1"
                             title="This setting restricts the response length for generated thoughts. The generation will stop when the thought reaches the specified length. Set to 0 to disable.">
                            <label for="stepthink_max_response_length">
                                Maximum thought length (tokens):
                            </label>
                            <input type="number" id="stepthink_max_response_length" class="text_pole" min="0" v-model.number="state.max_response_length" @input="persistInteger('max_response_length', state.max_response_length)"/>
                        </div>
                    </div>

                    <div class="flex-container marginTopBot5">
                        <div class="flex-container flex1"
                             title="Certain APIs may experience issues when attempting too many generations in a short time; this option lets you set up a delay before each generation request. Fractional numbers are allowed">
                            <label for="stepthink_generation_delay">
                                Delay generation requests (seconds):
                            </label>
                            <input type="number" id="stepthink_generation_delay" class="text_pole" min="0" v-model.number="state.generation_delay" @input="persistFloat('generation_delay', state.generation_delay)"/>
                        </div>
                    </div>

                    <div class="flex-container marginTopBot5">
                        <div class="flex-container flex1"
                             title="This number defines the maximum messages inspected, starting from the last one, to determine for which of them thoughts should be hidden">
                            <label for="stepthink_max_hiding_thoughts_lookup">
                                Maximum messages to inspect for hiding:
                            </label>
                            <input type="number" id="stepthink_max_hiding_thoughts_lookup" class="text_pole" min="0" v-model.number="state.max_hiding_thoughts_lookup" @input="persistInteger('max_hiding_thoughts_lookup', state.max_hiding_thoughts_lookup)"/>
                        </div>
                    </div>

                    <div class="flex-container marginTopBot5">
                        <div class="flex-container justifySpaceBetween alignItemsCenter flex1"
                             title="Often, there are special symbols and other shiza in the generation output; it will be removed by the regexp">
                            <label for="stepthink_regexp_to_sanitize">
                                Regexp to sanitize thoughts:
                            </label>
                            <div id="stepthink_restore_regexp_to_sanitize" class="menu_button margin0" title="Restore default regexp" @click="restoreRegexpToSanitize">Default</div>
                            <input type="text" id="stepthink_regexp_to_sanitize" class="text_pole textarea_compact" v-model="state.regexp_to_sanitize" @input="persistText('regexp_to_sanitize', state.regexp_to_sanitize)"/>
                        </div>
                    </div>

                    <hr/>

                    <div class="flex-container marginTopBot5 stepthink_mode_embedded">
                        <label for="stepthink_thoughts_block_title"
                               title="This string will be used as a header for the thoughts block. It won't be sent in the prompt">
                            Thoughts UI block title:
                        </label>
                        <input type="text" id="stepthink_thoughts_block_title" class="text_pole textarea_compact" v-model="state.thoughts_block_title" @input="persistText('thoughts_block_title', state.thoughts_block_title)"/>
                    </div>

                    <div class="flex-container alignItemsCenter stepthink_mode_embedded">
                        <label for="stepthink_thoughts_prefix_injection_mode"
                               title='This setting controls when the "Thoughts injection prefix" will be injected. You might want to disable prefix injection for Instruct or Chat Completions modes, or you can use "Import from settings" to automatically determine when prefix injection is required'>
                            Prefix injection mode:
                        </label>
                        <select id="stepthink_thoughts_prefix_injection_mode" class="text_pole widthNatural" v-model="state.thoughts_prefix_injection_mode" @input="persistText('thoughts_prefix_injection_mode', state.thoughts_prefix_injection_mode)">
                            <option value="always">Always</option>
                            <option value="groups">Only Group chats</option>
                            <option value="from_instruct">Import from settings</option>
                            <option value="never">Never</option>
                        </select>
                    </div>

                    <div class="flex-container marginTopBot5 stepthink_mode_embedded">
                        <label for="stepthink_thoughts_injection_prefix"
                               title="This string will replace the macro {{prefix}} if it is allowed by the prefix injection mode">
                            Thoughts injection prefix:
                        </label>
                        <input type="text" id="stepthink_thoughts_injection_prefix" class="text_pole textarea_compact" v-model="state.thoughts_injection_prefix" @input="persistText('thoughts_injection_prefix', state.thoughts_injection_prefix)"/>
                    </div>

                    <div class="flex-container marginTopBot5 stepthink_mode_embedded">
                        <div class="flex-container justifySpaceBetween alignItemsCenter flex1">
                            <label for="stepthink_general_injection_template"
                                   title="This template will be rendered and passed in the resulting prompt. Additional macros: {{prefix}}, {{thoughts)}}">
                                General thoughts injection template:
                            </label>
                            <textarea id="stepthink_general_injection_template" class="text_pole textarea_compact" rows="3" v-model="state.general_injection_template" @input="persistText('general_injection_template', state.general_injection_template)"></textarea>
                        </div>
                    </div>

                    <div class="flex-container marginTopBot5 stepthink_mode_embedded">
                        <div class="flex-container justifySpaceBetween alignItemsCenter flex1">
                            <label for="stepthink_thought_injection_template"
                                   title="This template will replace the {{thoughts}} macro in the general template, rendering each thought separated by the specified separator. Additional macros: {{thought}}, {{prompt_name}}, {{prompt_name.toLowerCase()}}">
                                Thought injection template:
                            </label>
                            <div id="stepthink_restore_thought_injection_template" class="menu_button margin0" title="Restore default thought injection template" @click="restoreThoughtInjectionTemplate">Default</div>
                            <textarea id="stepthink_thought_injection_template" class="text_pole textarea_compact" rows="3" v-model="state.thought_injection_template" @input="persistText('thought_injection_template', state.thought_injection_template)"></textarea>
                        </div>
                    </div>

                    <div class="flex-container marginTopBot5 stepthink_mode_embedded">
                        <div class="flex-container justifySpaceBetween alignItemsCenter flex1">
                            <label for="stepthink_thought_injection_separator"
                                   title="This string will be used to separate thoughts in the prompt">
                                Thoughts injection separator:
                            </label>
                            <textarea id="stepthink_thought_injection_separator" class="text_pole textarea_compact" rows="2" v-model="state.thought_injection_separator" @input="persistText('thought_injection_separator', state.thought_injection_separator)"></textarea>
                        </div>
                    </div>

                    <div class="flex-container marginTopBot5 stepthink_mode_embedded">
                        <label for="stepthink_thoughts_prompts_order_prefix"
                               title='This string defines the position of injected thought prompts among other extension prompts. The prompts are sorted alphabetically: setting it to "0" places the prompt first, while "Z" places it last. Leave it empty if you are fine with the default order of extension prompts'>
                            Extension injection order prefix:
                        </label>
                        <input type="text" id="stepthink_thoughts_prompts_order_prefix" class="text_pole textarea_compact" v-model="state.thoughts_prompts_order_prefix" @input="persistText('thoughts_prompts_order_prefix', state.thoughts_prompts_order_prefix)"/>
                    </div>

                    <div class="flex-container marginTopBot5 stepthink_mode_separated">
                        <div class="flex-container justifySpaceBetween alignItemsCenter flex1"
                             title="This name will be used when thoughts are sent from the System role">
                            <label for="stepthink_system_character_name_template">
                                System name template:
                            </label>
                            <input type="text" id="stepthink_system_character_name_template" class="text_pole textarea_compact" v-model="state.system_character_name_template" @input="persistText('system_character_name_template', state.system_character_name_template)"/>
                        </div>
                    </div>

                    <div class="flex-container marginTopBot5 stepthink_mode_separated">
                        <div class="flex-container flexFlowColumn flex1">
                            <div class="flex-container flexFlowRow alignItemsStart justifySpaceBetween">
                                <label title="A set of fields used to fill the {{thoughts_placeholder}} macro">
                                    Thoughts placeholder:
                                </label>
                                <div id="stepthink_restore_thoughts_placeholder" class="menu_button margin0" title="Restore default thoughts placeholder" @click="restoreThoughtsPlaceholder">Default</div>
                            </div>

                            <div class="flex-container flexFlowColumn">
                                <div class="flex-container flexFlowRow">
                                    <div class="flex-container flexFlowRow alignItemsCenter">
                                        <small title="The beginning of a thought block">
                                            Start:
                                        </small>
                                        <input type="text" id="stepthink_thoughts_placeholder_start" class="text_pole textarea_compact" v-model="state.thoughts_placeholder_start" @input="persistPlaceholderField('start', state.thoughts_placeholder_start)"/>
                                    </div>
                                    <div class="flex-container flexFlowRow alignItemsCenter marginLeft5">
                                        <small title="The placeholder that is used when thinking generation is in progress">
                                            Default:
                                        </small>
                                        <input type="text" id="stepthink_thoughts_placeholder_default_content" class="text_pole textarea_compact" v-model="state.thoughts_placeholder_default_content" @input="persistPlaceholderField('default_content', state.thoughts_placeholder_default_content)"/>
                                    </div>
                                    <div class="flex-container flexFlowRow alignItemsCenter marginLeft5">
                                        <small title="The end of a thought block. Be careful: this string must be unique and should not appear within thoughts! Otherwise, the extension may behave unpredictably">
                                            End:
                                        </small>
                                        <input type="text" id="stepthink_thoughts_placeholder_end" class="text_pole textarea_compact" v-model="state.thoughts_placeholder_end" @input="persistPlaceholderField('end', state.thoughts_placeholder_end)"/>
                                    </div>
                                </div>
                                <div class="flex-container">
                                    <div class="flex-container flexFlowRow alignItemsCenter width100p">
                                        <small title="The content of a thought block after the thought is generated. Additional macros: {{thoughts}}">
                                            Content:
                                        </small>
                                        <textarea id="stepthink_thoughts_placeholder_content" class="text_pole textarea_compact" rows="3" v-model="state.thoughts_placeholder_content" @input="persistPlaceholderField('content', state.thoughts_placeholder_content)"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex-container marginTopBot5 stepthink_mode_separated">
                        <div class="flex-container justifySpaceBetween alignItemsCenter flex1"
                             title="This name will be used when thoughts are sent from the System role. Additional macros: {{thoughts_spoiler_open_state}}, {{thoughts_placeholder}}">
                            <label for="stepthink_thoughts_message_template">
                                Template for a thoughts message:
                            </label>
                            <div id="stepthink_restore_thoughts_message_template" class="menu_button margin0" title="Restore default thoughts message template" @click="restoreThoughtsMessageTemplate">Default</div>
                            <textarea id="stepthink_thoughts_message_template" class="text_pole textarea_compact" rows="6" v-model="state.thoughts_message_template" @input="persistText('thoughts_message_template', state.thoughts_message_template)"></textarea>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
