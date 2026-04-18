#!/usr/bin/env node
/**
 * Phase 4: Build core/generation-controller.js from extracted functions.
 */

const fs = require('fs');
const path = require('path');

const ROOT = '/sessions/admiring-relaxed-goldberg/mnt/SillyTavern/public';
const SCRIPT_PATH = path.join(ROOT, 'script.js');
const EXTRACT_PATH = '/sessions/admiring-relaxed-goldberg/generation_controller_extract.json';
const OUTPUT_PATH = path.join(ROOT, 'scripts/core/generation-controller.js');

const source = fs.readFileSync(SCRIPT_PATH, 'utf8');
const lines = source.split('\n');
const data = JSON.parse(fs.readFileSync(EXTRACT_PATH, 'utf8'));

const parts = [];

parts.push(`import { track as stTrack } from '../dev/tracker.js'; // @st-tracker`);
parts.push('');
parts.push('// ============================================================');
parts.push('// generation-controller.js — Phase 4 extraction from script.js');
parts.push('// Core generation pipeline: Generate, StreamingProcessor,');
parts.push('// prompt building, context management, response parsing.');
parts.push('// ============================================================');
parts.push('');

// --- State imports ---
parts.push(`import {
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
} from './state.js';`);
parts.push('');

// --- Debounced ---
parts.push(`import { saveSettingsDebounced } from './debounced.js';`);
parts.push('');

// --- Chat-engine imports ---
parts.push(`import {
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
} from './chat-engine.js';`);
parts.push('');

// --- Settings-manager imports ---
parts.push(`import {
    pingServer,
    deactivateSendButtons,
    activateSendButtons,
    setExtensionPrompt,
    getExtensionPromptRoleByName,
    removeDepthPrompts,
    setGenerationProgress,
    showStopButton,
    hideStopButton,
} from './settings-manager.js';`);
parts.push('');

// --- Character-manager imports ---
parts.push(`import { unshallowCharacter, getCharacterCardFields } from './character-manager.js';`);
parts.push('');

// --- Events ---
parts.push(`import { event_types, eventSource } from '../events.js';`);
parts.push('');

// --- Other module imports ---
parts.push(`import { getRequestHeaders } from '../request-utils.js';`);
parts.push(`import { t } from '../i18n.js';`);
parts.push(`import { delay, isOdd, countOccurrences, Stopwatch, shiftUpByOne, shiftDownByOne } from '../utils.js';`);
parts.push(`import { inject_ids, MEDIA_TYPE, MEDIA_SOURCE, GENERATION_TYPE_TRIGGERS, IGNORE_SYMBOL } from '../constants.js';`);
parts.push(`import { selected_group, is_group_generating, generateGroupWrapper, getGroupDepthPrompts, groups } from '../group-chats.js';`);
parts.push(`import { power_user, generatedTextFiltered, renderStoryString, collapseNewlines, playMessageSound, persona_description_positions, getCustomStoppingStrings, flushEphemeralStoppingStrings, MAX_CONTEXT_DEFAULT, MAX_RESPONSE_DEFAULT } from '../power-user.js';`);
parts.push(`import {
    oai_settings,
    sendOpenAIRequest,
    setOpenAIMessages,
    setOpenAIMessageExamples,
    prepareOpenAIMessages,
    openai_messages_count,
    chat_completion_sources,
    getChatCompletionModel,
} from '../openai.js';`);
parts.push(`import {
    nai_settings,
    novelai_settings,
    novelai_setting_names,
    adjustNovelInstructionPrompt,
    generateNovelWithStreaming,
    getNovelGenerationData,
    getKayraMaxContextTokens,
    parseNovelAILogprobs,
} from '../nai-settings.js';`);
parts.push(`import {
    kai_settings,
    kai_flags,
    koboldai_settings,
    koboldai_setting_names,
    generateKoboldWithStreaming,
    getKoboldGenerationData,
} from '../kai-settings.js';`);
parts.push(`import {
    textgenerationwebui_settings as textgen_settings,
    textgen_types,
    generateTextGenWithStreaming,
    getTextGenGenerationData,
    parseTextgenLogprobs,
    parseTabbyLogprobs,
} from '../textgen-settings.js';`);
parts.push(`import { horde_settings, generateHorde, adjustHordeGenerationParams, isHordeGenerationNotAllowed, MIN_LENGTH } from '../horde.js';`);
parts.push(`import { getWorldInfoPrompt, wi_anchor_position, world_info_include_names } from '../world-info.js';`);
parts.push(`import { formatInstructModeChat, formatInstructModePrompt, formatInstructModeStoryString, force_output_sequence, getInstructStoppingSequences } from '../instruct-mode.js';`);
parts.push(`import { extension_settings, runGenerationInterceptors } from '../extensions.js';`);
parts.push(`import { getTokenCountAsync, getTokenCount, getFriendlyTokenizerName } from '../tokenizers.js';`);
parts.push(`import { saveLogprobsForActiveMessage } from '../logprobs.js';`);
parts.push(`import { messageFormatting } from '../message-renderer.js';`);
parts.push(`import { PromptReasoning, ReasoningHandler, extractReasoningFromData, extractReasoningSignatureFromData, parseReasoningInSwipes, removeReasoningFromString, updateReasoningUI } from '../reasoning.js';`);
parts.push(`import { ToolManager } from '../tool-calling.js';`);
parts.push(`import { getCfgPrompt, getGuidanceScale } from '../cfg-scale.js';`);
parts.push(`import { setFloatingPrompt, shouldWIAddPrompt, NOTE_MODULE_NAME, metadata_keys } from '../authors-note.js';`);
parts.push(`import { getRegexedString, regex_placement } from '../extensions/regex/engine.js';`);
parts.push(`import { getLastMessageId, evaluateMacros } from '../macros.js';`);
parts.push(`import { itemizedPrompts, deleteItemizedPromptForMessage, promptItemize } from '../itemized-prompts.js';`);
parts.push(`import { getPresetManager } from '../preset-manager.js';`);
parts.push(`import { appendFileContent, hasPendingFileAttachment, encodeStyleTags, decodeStyleTags } from '../chats.js';`);
parts.push(`import { system_message_types, sendSystemMessage } from '../system-messages.js';`);
parts.push(`import { applyStreamFadeIn } from '../util/stream-fadein.js';`);
parts.push(`import { user_avatar } from '../personas.js';`);
parts.push(`import { AbortReason } from '../util/AbortReason.js';`);
parts.push(`import { formatInstructModeExamples } from '../instruct-mode.js';`);
parts.push(`import { SimpleMutex } from '../util/SimpleMutex.js';`);
parts.push('');

// --- Co-extracted private state ---
parts.push('// ---- Co-extracted private state from script.js ----');
parts.push('/** @type {AbortController} */');
parts.push('let abortController;');
parts.push('');
parts.push("let kobold_horde_model = '';");
parts.push('');

// isGenerating (was a const arrow in script.js)
parts.push('export const isGenerating = () => (is_send_press || is_group_generating);');
parts.push('');

// --- Extracted functions ---
parts.push('// ============================================================');
parts.push('// Extracted functions');
parts.push('// ============================================================');
parts.push('');

const exportedSet = new Set(data.exported);

for (const fn of data.functions) {
    const startIdx = fn.startLine - 1;
    const endIdx = fn.endLine;
    let code = lines.slice(startIdx, endIdx).join('\n');

    // Strip existing 'export' keyword
    if (fn.nodeType === 'class') {
        code = code.replace(/^export class /m, 'class ');
    } else {
        code = code.replace(/^export (async )?function /m, '$1function ');
    }

    // Re-add export for exported items
    if (exportedSet.has(fn.name)) {
        if (fn.nodeType === 'class') {
            code = code.replace(/^class /m, 'export class ');
        } else {
            code = code.replace(/^(async )?function /m, 'export $1function ');
        }
    }

    parts.push(code);
    parts.push('');
}

// Fix scrollLock references: replace direct reads/writes with state imports
let output = parts.join('\n');

// Replace `scrollLock = false` and `scrollLock = true` with setter
output = output.replace(/\bscrollLock = (true|false)/g, '_set_scrollLock($1)');

// Remove duplicate import of instruct-mode (formatInstructModeExamples combined)
// Actually let me check if we have a duplicate... we import formatInstructModeExamples separately.
// Let me combine them in the import block.

const output2 = output;
fs.writeFileSync(OUTPUT_PATH, output2);
console.log(`Wrote ${OUTPUT_PATH} (${output2.split('\n').length} lines)`);
