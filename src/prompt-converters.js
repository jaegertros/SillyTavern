import crypto from 'node:crypto';
import { getConfigValue, tryParse } from './util.js';

export const PROMPT_PLACEHOLDER = getConfigValue('promptPlaceholder', 'Let\'s get started.');

export const REASONING_EFFORT = {
    auto: 'auto',
    low: 'low',
    medium: 'medium',
    high: 'high',
    min: 'min',
    max: 'max',
};

export const PROMPT_PROCESSING_TYPE = {
    NONE: '',
    /** @deprecated Use MERGE instead. */
    CLAUDE: 'claude',
    MERGE: 'merge',
    MERGE_TOOLS: 'merge_tools',
    SEMI: 'semi',
    SEMI_TOOLS: 'semi_tools',
    STRICT: 'strict',
    STRICT_TOOLS: 'strict_tools',
    SINGLE: 'single',
};

// 'auto' is intentionally unmapped
export const GEMINI_MEDIA_RESOLUTION = {
    low: 'media_resolution_low',
    high: 'media_resolution_high',
};

export const enableThoughtSignatures = !!getConfigValue('gemini.thoughtSignatures', true, 'boolean');

/**
 * @typedef {object} PromptNames
 * @property {string} charName Character name
 * @property {string} userName User name
 * @property {string[]} groupNames Group member names
 * @property {function(string): boolean} startsWithGroupName Check if a message starts with a group name
 */

/**
 * Extracts the character name, user name, and group member names from the request.
 * @param {import('express').Request} request Express request object
 * @returns {PromptNames} Prompt names
 */
export function getPromptNames(request) {
    return {
        charName: String(request.body.char_name || ''),
        userName: String(request.body.user_name || ''),
        groupNames: Array.isArray(request.body.group_names) ? request.body.group_names.map(String) : [],
        startsWithGroupName: function (message) {
            return this.groupNames.some(name => message.startsWith(`${name}: `));
        },
    };
}

/**
 * Adds an assistant prefix to the last message.
 * @param {any[]} prompt Prompt messages array
 * @param {any[]} tools Array of tool definitions
 * @param {string} property The property to set the prefix on
 * @returns {any[]} Transformed messages array
 */
export function addAssistantPrefix(prompt, tools, property) {
    if (!prompt.length) {
        return prompt;
    }
    const hasAnyTools = (Array.isArray(tools) && tools.length > 0) || prompt.some(x => x.role === 'tool');
    if (!hasAnyTools && prompt[prompt.length - 1].role === 'assistant') {
        prompt[prompt.length - 1][property] = true;
    }
    return prompt;
}

/**
 * Applies a post-processing step to the generated messages.
 * @param {object[]} messages Messages to post-process
 * @param {string} type Prompt conversion type
 * @param {PromptNames} names Prompt names
 * @returns
 */
export function postProcessPrompt(messages, type, names) {
    switch (type) {
        case PROMPT_PROCESSING_TYPE.MERGE:
        case PROMPT_PROCESSING_TYPE.CLAUDE:
            return mergeMessages(messages, names, { strict: false, placeholders: false, single: false, tools: false });
        case PROMPT_PROCESSING_TYPE.MERGE_TOOLS:
            return mergeMessages(messages, names, { strict: false, placeholders: false, single: false, tools: true });
        case PROMPT_PROCESSING_TYPE.SEMI:
            return mergeMessages(messages, names, { strict: true, placeholders: false, single: false, tools: false });
        case PROMPT_PROCESSING_TYPE.SEMI_TOOLS:
            return mergeMessages(messages, names, { strict: true, placeholders: false, single: false, tools: true });
        case PROMPT_PROCESSING_TYPE.STRICT:
            return mergeMessages(messages, names, { strict: true, placeholders: true, single: false, tools: false });
        case PROMPT_PROCESSING_TYPE.STRICT_TOOLS:
            return mergeMessages(messages, names, { strict: true, placeholders: true, single: false, tools: true });
        case PROMPT_PROCESSING_TYPE.SINGLE:
            return mergeMessages(messages, names, { strict: true, placeholders: false, single: true, tools: false });
        default:
            return messages;
    }
}

/**
 * Merge messages with the same consecutive role, removing names if they exist.
 * @param {any[]} messages Messages to merge
 * @param {PromptNames} names Prompt names
 * @param {object} options Options for merging
 * @param {boolean} [options.strict] Enable strict mode: only allow one system message at the start, force user first message
 * @param {boolean} [options.placeholders] Add user placeholders to the messages in strict mode
 * @param {boolean} [options.single] Force every role to be user, merging all messages into one
 * @param {boolean} [options.tools] Allow tool calls in the prompt. If false, tool call messages are removed.
 * @returns {any[]} Merged messages
 */
export function mergeMessages(messages, names, { strict = false, placeholders = false, single = false, tools = false } = {}) {
    let mergedMessages = [];

    /** @type {Map<string,object>} */
    const contentTokens = new Map();

    // Remove names from the messages
    messages.forEach((message) => {
        if (!message.content) {
            message.content = '';
        }
        // Flatten contents and replace image URLs with random tokens
        if (Array.isArray(message.content)) {
            const text = message.content.map((content) => {
                if (content.type === 'text') {
                    return content.text;
                }
                // Could be extended with other non-text types
                if (['image_url', 'video_url', 'audio_url'].includes(content.type)) {
                    const token = crypto.randomBytes(32).toString('base64');
                    contentTokens.set(token, content);
                    return token;
                }
                return '';
            }).join('\n\n');
            message.content = text;
        }
        if (message.role === 'system' && message.name === 'example_assistant') {
            if (names.charName && !message.content.startsWith(`${names.charName}: `) && !names.startsWithGroupName(message.content)) {
                message.content = `${names.charName}: ${message.content}`;
            }
        }
        if (message.role === 'system' && message.name === 'example_user') {
            if (names.userName && !message.content.startsWith(`${names.userName}: `)) {
                message.content = `${names.userName}: ${message.content}`;
            }
        }
        if (message.name && message.role !== 'system') {
            if (!message.content.startsWith(`${message.name}: `)) {
                message.content = `${message.name}: ${message.content}`;
            }
        }
        if (message.role === 'tool' && !tools) {
            message.role = 'user';
        }
        if (single) {
            if (message.role === 'assistant') {
                if (names.charName && !message.content.startsWith(`${names.charName}: `) && !names.startsWithGroupName(message.content)) {
                    message.content = `${names.charName}: ${message.content}`;
                }
            }
            if (message.role === 'user') {
                if (names.userName && !message.content.startsWith(`${names.userName}: `)) {
                    message.content = `${names.userName}: ${message.content}`;
                }
            }

            message.role = 'user';
        }
        delete message.name;
        if (!tools) {
            delete message.tool_calls;
            delete message.tool_call_id;
        }
    });

    // Squash consecutive messages with the same role
    messages.forEach((message) => {
        if (mergedMessages.length > 0 && mergedMessages[mergedMessages.length - 1].role === message.role && message.content && message.role !== 'tool') {
            mergedMessages[mergedMessages.length - 1].content += '\n\n' + message.content;
        } else {
            mergedMessages.push(message);
        }
    });

    // Prevent erroring out if the mergedMessages array is empty.
    if (mergedMessages.length === 0) {
        mergedMessages.unshift({
            role: 'user',
            content: PROMPT_PLACEHOLDER,
        });
    }

    // Check for content tokens and replace them with the actual content objects
    if (contentTokens.size > 0) {
        mergedMessages.forEach((message) => {
            const hasValidToken = Array.from(contentTokens.keys()).some(token => message.content.includes(token));

            if (hasValidToken) {
                const splitContent = message.content.split('\n\n');
                const mergedContent = [];

                splitContent.forEach((content) => {
                    if (contentTokens.has(content)) {
                        mergedContent.push(contentTokens.get(content));
                    } else {
                        if (mergedContent.length > 0 && mergedContent[mergedContent.length - 1].type === 'text') {
                            mergedContent[mergedContent.length - 1].text += `\n\n${content}`;
                        } else {
                            mergedContent.push({ type: 'text', text: content });
                        }
                    }
                });

                message.content = mergedContent;
            }
        });
    }

    if (strict) {
        for (let i = 0; i < mergedMessages.length; i++) {
            // Force mid-prompt system messages to be user messages
            if (i > 0 && mergedMessages[i].role === 'system') {
                mergedMessages[i].role = 'user';
            }
        }
        if (mergedMessages.length && placeholders) {
            if (mergedMessages[0].role === 'system' && (mergedMessages.length === 1 || mergedMessages[1].role !== 'user')) {
                mergedMessages.splice(1, 0, { role: 'user', content: PROMPT_PLACEHOLDER });
            }
            else if (mergedMessages[0].role !== 'system' && mergedMessages[0].role !== 'user') {
                mergedMessages.unshift({ role: 'user', content: PROMPT_PLACEHOLDER });
            }
        }
        return mergeMessages(mergedMessages, names, { strict: false, placeholders, single: false, tools });
    }

    return mergedMessages;
}

/**
 * Convert a prompt from the ChatML objects to the format used by Text Completion API.
 * @param {object[]} messages Array of messages
 * @returns {string} Prompt for Text Completion API
 */
export function convertTextCompletionPrompt(messages) {
    if (typeof messages === 'string') {
        return messages;
    }

    const messageStrings = [];
    messages.forEach(m => {
        if (m.role === 'system' && m.name === undefined) {
            messageStrings.push('System: ' + m.content);
        }
        else if (m.role === 'system' && m.name !== undefined) {
            messageStrings.push(m.name + ': ' + m.content);
        }
        else {
            messageStrings.push(m.role + ': ' + m.content);
        }
    });
    return messageStrings.join('\n') + '\nassistant:';
}

/**
 * Embed media content in OpenRouter messages (OpenAI-compatible).
 * @param {object[]} messages Array of messages
 * @param {object} options Options for embedding
 * @param {boolean} [options.audio] Enable audio embedding (default: true)
 * @param {boolean} [options.video] Enable video embedding (default: true)
 * @returns {void}
 */
export function embedOpenRouterMedia(messages, { audio = true, video = true } = { audio: true, video: true }) {
    if (!Array.isArray(messages)) {
        return;
    }

    for (const message of messages) {
        if (!Array.isArray(message.content)) {
            continue;
        }

        for (const contentPart of message.content) {
            if (video && contentPart?.type === 'video_url' && contentPart.video_url?.url?.startsWith('data:')) {
                contentPart.type = 'input_video';
            }

            if (audio && contentPart?.type === 'audio_url' && contentPart.audio_url?.url?.startsWith('data:')) {
                const formatMap = {
                    'audio/mpeg': 'mp3',
                    'audio/wav': 'wav',
                };

                const [header, base64Data] = contentPart.audio_url.url.split(',');
                const mimeType = header.match(/data:([^;]+)/)?.[1] || 'audio/mpeg';

                contentPart.type = 'input_audio';
                contentPart.input_audio = {
                    format: formatMap[mimeType] || 'mp3',
                    data: base64Data,
                };

                delete contentPart.audio_url;
            }
        }
    }
}

/**
 * Adds a dummy reasoning_content field to messages with tool calls for DeepSeek reasoner.
 * @param {object[]} messages Array of messages
 * @returns {void}
 */
export function addReasoningContentToToolCalls(messages) {
    if (!Array.isArray(messages)) {
        return;
    }

    for (const message of messages) {
        if (!Array.isArray(message.tool_calls) || 'reasoning_content' in message) {
            continue;
        }

        message.reasoning_content = '';
    }
}

/**
 * Converts reasoning signatures to OpenRouter format.
 * @param {object[]} messages Array of messages
 * @param {string} model Model name
 * @return {void}
 */
export function addOpenRouterSignatures(messages, model) {
    const getFormatForModel = () => {
        if (/google\/gemini/.test(model)) {
            return 'google-gemini-v1';
        }
        if (/anthropic\/claude/.test(model)) {
            return 'anthropic-claude-v1';
        }
        if (/openai\/gpt/.test(model)) {
            return 'openai-responses-v1';
        }
        if (/x-ai\/grok/.test(model)) {
            return 'xai-responses-v1';
        }
        return 'unknown';
    };

    if (!Array.isArray(messages)) {
        return;
    }

    for (const message of messages) {
        const details = [];
        const addDetail = (data, id) => {
            if (typeof data !== 'string' || data.length === 0) {
                return;
            }
            const detail = {
                index: details.length,
                id: id || `signature-${details.length}`,
                type: 'reasoning.encrypted',
                data: data,
                format: getFormatForModel(),
            };
            details.push(detail);
        };
        if (typeof message.signature === 'string') {
            addDetail(message.signature);
            delete message.signature;
        }
        if (Array.isArray(message.tool_calls)) {
            message.tool_calls.forEach((toolCall) => {
                if (typeof toolCall.signature === 'string') {
                    addDetail(toolCall.signature, toolCall.id);
                    delete toolCall.signature;
                }
            });
        }
        if (details.length > 0) {
            message.reasoning_details = details;
        }
    }
}


// Re-exports from provider-specific converter modules
export { convertClaudePrompt, convertClaudeMessages, cachingAtDepthForClaude, cachingAtDepthForOpenRouterClaude, cachingSystemPromptForOpenRouter, calculateClaudeBudgetTokens } from './prompt-converters/claude.js';
export { convertGooglePrompt, calculateGoogleBudgetTokens } from './prompt-converters/google.js';
export { convertCohereMessages, convertAI21Messages, convertMistralMessages, convertXAIMessages } from './prompt-converters/others.js';
