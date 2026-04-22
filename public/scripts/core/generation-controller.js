import { track as stTrack } from '../dev/tracker.js'; // @st-tracker

// ============================================================
// generation-controller.js — Phase 4 extraction from script.js
// Core generation pipeline: Generate, StreamingProcessor,
// prompt building, context management, response parsing.
// ============================================================

import {
    name1,
    name2,
    chat,
    chat_metadata,
    characters,
    this_chid,
    main_api,
    amount_gen,
    max_context,
    online_status,
    is_send_press,
    streamingProcessor,
    chatElement,
    extension_prompts,
    extension_prompt_roles,
    menu_type,
    scrollLock,
    _set_is_send_press,
    _set_streamingProcessor,
    _set_scrollLock,
    depth_prompt_depth_default,
    depth_prompt_role_default,
    extension_prompt_types,
    animation_duration,
} from './state.js';

import { saveSettingsDebounced } from './debounced.js';

import {
    cleanUpMessage,
    saveReply,
    saveChatConditional,
    scrollChatToBottom,
    hideSwipeButtons,
    showSwipeButtons,
    syncMesToSwipe,
    deleteLastMessage,
    getBiasStrings,
    getStoppingStrings,
    getExtensionPrompt,
    getExtensionPromptMaxDepth,
    getNextMessageId,
    getAllExtensionPrompts,
    getFirstDisplayedMessageId,
    processCommands,
    substituteParams,
    sendMessageAsUser,
    swipe,
    parseMesExamples,
    baseChatReplace,
    appendMediaToMessage,
    extractMessageFromData,
    extractJsonFromData,
    updateSwipeCounter,
    addCopyToCodeBlocks,
    unblockGeneration,
    TempResponseLength,
    processImageAttachment,
    formatGenerationTimer,
    generation_started,
    _set_ce_generation_started,
} from './chat-engine.js';

import {
    pingServer,
    deactivateSendButtons,
    activateSendButtons,
    setExtensionPrompt,
    getExtensionPromptRoleByName,
    removeDepthPrompts,
    setGenerationProgress,
    showStopButton,
    hideStopButton,
} from './settings-manager.js';

import { unshallowCharacter } from './character-manager.js';
import { getCharacterCardFields } from '../../script.js';

import { event_types, eventSource } from '../events.js';

import { getRequestHeaders } from '../request-utils.js';
import { t } from '../i18n.js';
import { delay, isOdd, countOccurrences, Stopwatch, shiftUpByOne, shiftDownByOne } from '../utils.js';
import { inject_ids, MEDIA_TYPE, MEDIA_SOURCE, GENERATION_TYPE_TRIGGERS, IGNORE_SYMBOL } from '../constants.js';
import { selected_group, is_group_generating, generateGroupWrapper, getGroupDepthPrompts, groups } from '../group-chats.js';
import { power_user, generatedTextFiltered, renderStoryString, collapseNewlines, playMessageSound, persona_description_positions, getCustomStoppingStrings, flushEphemeralStoppingStrings, MAX_CONTEXT_DEFAULT, MAX_RESPONSE_DEFAULT } from '../power-user.js';
import {
    oai_settings,
    sendOpenAIRequest,
    setOpenAIMessages,
    setOpenAIMessageExamples,
    prepareOpenAIMessages,
    openai_messages_count,
    chat_completion_sources,
    getChatCompletionModel,
} from '../openai.js';
import {
    nai_settings,
    novelai_settings,
    novelai_setting_names,
    adjustNovelInstructionPrompt,
    generateNovelWithStreaming,
    getNovelGenerationData,
    getKayraMaxContextTokens,
    parseNovelAILogprobs,
} from '../nai-settings.js';
import {
    kai_settings,
    kai_flags,
    koboldai_settings,
    koboldai_setting_names,
    generateKoboldWithStreaming,
    getKoboldGenerationData,
} from '../kai-settings.js';
import {
    textgenerationwebui_settings as textgen_settings,
    textgen_types,
    generateTextGenWithStreaming,
    getTextGenGenerationData,
    parseTextgenLogprobs,
    parseTabbyLogprobs,
} from '../textgen-settings.js';
import { horde_settings, generateHorde, adjustHordeGenerationParams, isHordeGenerationNotAllowed, MIN_LENGTH } from '../horde.js';
import { getWorldInfoPrompt, wi_anchor_position, world_info_include_names } from '../world-info.js';
import { formatInstructModeChat, formatInstructModePrompt, formatInstructModeExamples, formatInstructModeStoryString, force_output_sequence, getInstructStoppingSequences } from '../instruct-mode.js';
import { extension_settings, runGenerationInterceptors } from '../extensions.js';
import { getTokenCountAsync, getTokenCount, getFriendlyTokenizerName } from '../tokenizers.js';
import { saveLogprobsForActiveMessage } from '../logprobs.js';
import { messageFormatting } from '../message-renderer.js';
import { PromptReasoning, ReasoningHandler, extractReasoningFromData, extractReasoningSignatureFromData, parseReasoningInSwipes, removeReasoningFromString, updateReasoningUI } from '../reasoning.js';
import { ToolManager } from '../tool-calling.js';
import { getCfgPrompt, getGuidanceScale } from '../cfg-scale.js';
import { setFloatingPrompt, shouldWIAddPrompt, NOTE_MODULE_NAME, metadata_keys } from '../authors-note.js';
import { getRegexedString, regex_placement } from '../extensions/regex/engine.js';
import { getLastMessageId, evaluateMacros } from '../macros.js';
import { itemizedPrompts, deleteItemizedPromptForMessage, promptItemize } from '../itemized-prompts.js';
import { getPresetManager } from '../preset-manager.js';
import { appendFileContent, hasPendingFileAttachment, encodeStyleTags, decodeStyleTags } from '../chats.js';
import { system_message_types, sendSystemMessage } from '../system-messages.js';
import { applyStreamFadeIn } from '../util/stream-fadein.js';
import { user_avatar } from '../personas.js';
import { AbortReason } from '../util/AbortReason.js';
import { SimpleMutex } from '../util/SimpleMutex.js';

// ---- Co-extracted private state from script.js ----
/** @type {AbortController} */
let abortController;

let kobold_horde_model = '';

export const isGenerating = () => (is_send_press || is_group_generating);

// ============================================================
// Extracted functions
// ============================================================

export function setExternalAbortController(controller) { stTrack('setExternalAbortController'); // @st-tracked
    abortController = controller;
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

export class StreamingProcessor {
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
            _set_scrollLock(false);
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

export function flushWIInjections() {
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
export function saveImageToMessage(img, mes) {
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
