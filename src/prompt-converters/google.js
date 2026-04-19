/**
 * Prompt converter: google — extracted from prompt-converters.js
 */

import { getConfigValue } from '../util.js';
import { REASONING_EFFORT, GEMINI_MEDIA_RESOLUTION, enableThoughtSignatures } from '../prompt-converters.js';

/**
 * Convert a prompt from the ChatML objects to the format used by Google MakerSuite models.
 * @param {object[]} messages Array of messages
 * @param {string} model Model name
 * @param {boolean} useSysPrompt Use system prompt
 * @param {PromptNames} names Prompt names
 * @returns {{contents: *[], system_instruction: {parts: {text: string}[]}}} Prompt for Google MakerSuite models
 */
export function convertGooglePrompt(messages, model, useSysPrompt, names) {
    const sysPrompt = [];

    if (useSysPrompt) {
        while (messages.length > 1 && messages[0].role === 'system') {
            // Append example names if not already done by the frontend (e.g. for group chats).
            if (names.userName && messages[0].name === 'example_user') {
                if (!messages[0].content.startsWith(`${names.userName}: `)) {
                    messages[0].content = `${names.userName}: ${messages[0].content}`;
                }
            }
            if (names.charName && messages[0].name === 'example_assistant') {
                if (!messages[0].content.startsWith(`${names.charName}: `) && !names.startsWithGroupName(messages[0].content)) {
                    messages[0].content = `${names.charName}: ${messages[0].content}`;
                }
            }
            sysPrompt.push(messages[0].content);
            messages.shift();
        }
    }

    const system_instruction = { parts: sysPrompt.map(text => ({ text })) };
    const toolNameMap = {};

    const contents = [];
    messages.forEach((message, index) => {
        // fix the roles
        if (message.role === 'system' || message.role === 'tool') {
            message.role = 'user';
        } else if (message.role === 'assistant') {
            message.role = 'model';
        }

        // Convert the content to an array of parts
        if (!Array.isArray(message.content)) {
            const content = (() => {
                const hasToolCalls = Array.isArray(message.tool_calls) && message.tool_calls.length > 0;
                const hasToolCallId = typeof message.tool_call_id === 'string' && message.tool_call_id.length > 0;

                if (hasToolCalls) {
                    return { type: 'tool_calls', tool_calls: message.tool_calls };
                }

                if (hasToolCallId) {
                    return { type: 'tool_call_id', tool_call_id: message.tool_call_id, content: String(message.content ?? '') };
                }

                return { type: 'text', text: String(message.content ?? '') };
            })();
            message.content = [content];
        }

        // similar story as claude
        if (message.name) {
            message.content.forEach((part) => {
                if (part.type !== 'text') {
                    return;
                }
                if (message.name === 'example_user') {
                    if (names.userName && !part.text.startsWith(`${names.userName}: `)) {
                        part.text = `${names.userName}: ${part.text}`;
                    }
                } else if (message.name === 'example_assistant') {
                    if (names.charName && !part.text.startsWith(`${names.charName}: `) && !names.startsWithGroupName(part.text)) {
                        part.text = `${names.charName}: ${part.text}`;
                    }
                } else {
                    if (!part.text.startsWith(`${message.name}: `)) {
                        part.text = `${message.name}: ${part.text}`;
                    }
                }
            });

            delete message.name;
        }

        //create the prompt parts
        const parts = [];
        message.content.forEach((part) => {
            const addDataUrlPart = (/** @type {string} */ url, /** @type {string} */ defaultMimeType, /** @type {string?} */ detail = null) => {
                if (url && url.startsWith('data:')) {
                    const [header, base64Data] = url.split(',');
                    const mimeType = header.match(/data:([^;]+)/)?.[1] || defaultMimeType;
                    const mediaResolution = GEMINI_MEDIA_RESOLUTION[detail] || null;

                    const part = {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data,
                        },
                    };

                    // https://ai.google.dev/gemini-api/docs/gemini-3#media_resolution
                    if (/gemini-3/.test(model) && mediaResolution) {
                        part.mediaResolution = {
                            level: mediaResolution,
                        };
                    }

                    parts.push(part);
                }
            };

            if (part.type === 'text') {
                parts.push({ text: part.text });
            } else if (part.type === 'tool_call_id') {
                const name = toolNameMap[part.tool_call_id] ?? 'unknown';
                parts.push({
                    functionResponse: {
                        name: name,
                        response: { name: name, content: part.content },
                    },
                });
            } else if (part.type === 'tool_calls') {
                part.tool_calls.forEach((toolCall) => {
                    parts.push({
                        functionCall: {
                            name: toolCall.function.name,
                            args: tryParse(toolCall.function.arguments) ?? toolCall.function.arguments,
                        },
                        ...(toolCall.signature ? { thoughtSignature: toolCall.signature } : {}),
                    });

                    toolNameMap[toolCall.id] = toolCall.function.name;
                });
            } else if (part.type === 'image_url') {
                const imageUrl = part.image_url?.url;
                const detail = part.image_url?.detail;
                addDataUrlPart(imageUrl, 'image/png', detail);
            } else if (part.type === 'video_url') {
                const videoUrl = part.video_url?.url;
                const detail = part.video_url?.detail;
                addDataUrlPart(videoUrl, 'video/mp4', detail);
            } else if (part.type === 'audio_url') {
                const audioUrl = part.audio_url?.url;
                addDataUrlPart(audioUrl, 'audio/mpeg');
            }
        });

        // https://ai.google.dev/gemini-api/docs/gemini-3#migrating_from_other_models
        // Inject stored thought signatures, or fall back to bypass magic for Gemini 3
        if (/gemini-3/.test(model) || /gemini-2\.5/.test(model)) {
            const skipSignatureMagic = 'skip_thought_signature_validator';
            const textSignature = message.signature;

            parts.forEach((part) => {
                if (enableThoughtSignatures && textSignature && typeof part.text === 'string') {
                    part.thoughtSignature = textSignature;
                } else if (/gemini-3/.test(model)) {
                    // Gemini 3: Fall back to bypass magic for function calls (mandatory) and images
                    if (part.functionCall && !part.thoughtSignature) {
                        part.thoughtSignature = skipSignatureMagic;
                    }
                    if (/-image/.test(model) && message.role === 'model') {
                        if (typeof part.text === 'string' || part.inlineData) {
                            part.thoughtSignature = skipSignatureMagic;
                        }
                    }
                }
                // Gemini 2.5 without stored signatures: signatures are optional, no bypass needed
            });
        }

        // merge consecutive messages with the same role
        if (index > 0 && message.role === contents[contents.length - 1].role) {
            parts.forEach((part) => {
                if (part.text) {
                    const textPart = contents[contents.length - 1].parts.find(p => typeof p.text === 'string');
                    if (textPart) {
                        textPart.text += '\n\n' + part.text;
                    } else {
                        contents[contents.length - 1].parts.push(part);
                    }
                }
                if (part.inlineData || part.functionCall || part.functionResponse || part.thoughtSignature || part.mediaResolution) {
                    contents[contents.length - 1].parts.push(part);
                }
            });
        } else {
            contents.push({
                role: message.role,
                parts: parts,
            });
        }
    });

    return { contents: contents, system_instruction: system_instruction };
}

/**
 * Calculate the Google budget tokens for a given reasoning effort.
 * @param {number} maxTokens Maximum tokens
 * @param {string} reasoningEffort Reasoning effort
 * @param {string} model Model name
 * @returns {number|string|null} Budget tokens
 */
export function calculateGoogleBudgetTokens(maxTokens, reasoningEffort, model) {
    function getFlashBudget() {
        let budgetTokens = 0;

        switch (reasoningEffort) {
            case REASONING_EFFORT.auto:
                return -1;
            case REASONING_EFFORT.min:
                return 0;
            case REASONING_EFFORT.low:
                budgetTokens = Math.floor(maxTokens * 0.1);
                break;
            case REASONING_EFFORT.medium:
                budgetTokens = Math.floor(maxTokens * 0.25);
                break;
            case REASONING_EFFORT.high:
                budgetTokens = Math.floor(maxTokens * 0.5);
                break;
            case REASONING_EFFORT.max:
                budgetTokens = maxTokens;
                break;
        }

        budgetTokens = Math.min(budgetTokens, 24576);

        return budgetTokens;
    }

    function getFlashLiteBudget() {
        let budgetTokens = 0;

        switch (reasoningEffort) {
            case REASONING_EFFORT.auto:
                return -1;
            case REASONING_EFFORT.min:
                return 0;
            case REASONING_EFFORT.low:
                budgetTokens = Math.floor(maxTokens * 0.1);
                break;
            case REASONING_EFFORT.medium:
                budgetTokens = Math.floor(maxTokens * 0.25);
                break;
            case REASONING_EFFORT.high:
                budgetTokens = Math.floor(maxTokens * 0.5);
                break;
            case REASONING_EFFORT.max:
                budgetTokens = maxTokens;
                break;
        }

        budgetTokens = Math.max(Math.min(budgetTokens, 24576), 512);

        return budgetTokens;
    }

    function getProBudget() {
        let budgetTokens = 0;

        switch (reasoningEffort) {
            case REASONING_EFFORT.auto:
                return -1;
            case REASONING_EFFORT.min:
                budgetTokens = 128;
                break;
            case REASONING_EFFORT.low:
                budgetTokens = Math.floor(maxTokens * 0.1);
                break;
            case REASONING_EFFORT.medium:
                budgetTokens = Math.floor(maxTokens * 0.25);
                break;
            case REASONING_EFFORT.high:
                budgetTokens = Math.floor(maxTokens * 0.5);
                break;
            case REASONING_EFFORT.max:
                budgetTokens = maxTokens;
                break;
        }

        budgetTokens = Math.max(Math.min(budgetTokens, 32768), 128);

        return budgetTokens;
    }

    function getGemini3FlashBudget() {
        switch (reasoningEffort) {
            case REASONING_EFFORT.auto:
                return null;
            case REASONING_EFFORT.min:
                return 'minimal';
            case REASONING_EFFORT.low:
                return 'low';
            case REASONING_EFFORT.medium:
                return 'medium';
            case REASONING_EFFORT.high:
                return 'high';
            case REASONING_EFFORT.max:
                return 'high';
        }

        return null;
    }

    function getGemini3ProBudget() {
        switch (reasoningEffort) {
            case REASONING_EFFORT.auto:
                return null;
            case REASONING_EFFORT.min:
                return 'low';
            case REASONING_EFFORT.low:
                return 'low';
            case REASONING_EFFORT.medium:
                return 'low';
            case REASONING_EFFORT.high:
                return 'high';
            case REASONING_EFFORT.max:
                return 'high';
        }

        return null;
    }

    if (/gemini-3-pro/.test(model)) {
        return getGemini3ProBudget();
    }

    if (/gemini-3-flash/.test(model) ) {
        return getGemini3FlashBudget();
    }

    if (/flash-lite/.test(model)) {
        return getFlashLiteBudget();
    }

    if (/flash/.test(model)) {
        return getFlashBudget();
    }

    if (/pro/.test(model)) {
        return getProBudget();
    }

    return null;
}
