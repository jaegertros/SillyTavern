/**
 * Prompt converter: claude — extracted from prompt-converters.js
 */

import { getConfigValue } from '../util.js';
import { PROMPT_PLACEHOLDER, REASONING_EFFORT } from '../prompt-converters.js';

/**
 * Convert a prompt from the ChatML objects to the format used by Claude.
 * Mainly deprecated. Only used for counting tokens.
 * @param {object[]} messages Array of messages
 * @param {boolean}  addAssistantPostfix Add Assistant postfix.
 * @param {string}   addAssistantPrefill Add Assistant prefill after the assistant postfix.
 * @param {boolean}  withSysPromptSupport Indicates if the Claude model supports the system prompt format.
 * @param {boolean}  useSystemPrompt Indicates if the system prompt format should be used.
 * @param {boolean}  excludePrefixes Exlude Human/Assistant prefixes.
 * @param {string}   addSysHumanMsg Add Human message between system prompt and assistant.
 * @returns {string} Prompt for Claude
 * @copyright Prompt Conversion script taken from RisuAI by kwaroran (GPLv3).
 */
export function convertClaudePrompt(messages, addAssistantPostfix, addAssistantPrefill, withSysPromptSupport, useSystemPrompt, addSysHumanMsg, excludePrefixes) {

    //Prepare messages for claude.
    //When 'Exclude Human/Assistant prefixes' checked, setting messages role to the 'system'(last message is exception).
    if (messages.length > 0) {
        messages.forEach((m) => {
            if (!m.content) {
                m.content = '';
            }
            if (m.tool_calls) {
                m.content += JSON.stringify(m.tool_calls);
            }
        });
        if (excludePrefixes) {
            messages.slice(0, -1).forEach(message => message.role = 'system');
        } else {
            messages[0].role = 'system';
        }
        //Add the assistant's message to the end of messages.
        if (addAssistantPostfix) {
            messages.push({
                role: 'assistant',
                content: addAssistantPrefill || '',
            });
        }
        // Find the index of the first message with an assistant role and check for a "'user' role/Human:" before it.
        let hasUser = false;
        const firstAssistantIndex = messages.findIndex((message, i) => {
            if (i >= 0 && (message.role === 'user' || message.content.includes('\n\nHuman: '))) {
                hasUser = true;
            }
            return message.role === 'assistant' && i > 0;
        });
        // When 2.1+ and 'Use system prompt' checked, switches to the system prompt format by setting the first message's role to the 'system'.
        // Inserts the human's message before the first the assistant one, if there are no such message or prefix found.
        if (withSysPromptSupport && useSystemPrompt) {
            messages[0].role = 'system';
            if (firstAssistantIndex > 0 && addSysHumanMsg && !hasUser) {
                messages.splice(firstAssistantIndex, 0, {
                    role: 'user',
                    content: addSysHumanMsg,
                });
            }
        } else {
            // Otherwise, use the default message format by setting the first message's role to 'user'(compatible with all claude models including 2.1.)
            messages[0].role = 'user';
            // Fix messages order for default message format when(messages > Context Size) by merging two messages with "\n\nHuman: " prefixes into one, before the first Assistant's message.
            if (firstAssistantIndex > 0 && !excludePrefixes) {
                messages[firstAssistantIndex - 1].role = firstAssistantIndex - 1 !== 0 && messages[firstAssistantIndex - 1].role === 'user' ? 'FixHumMsg' : messages[firstAssistantIndex - 1].role;
            }
        }
    }

    // Convert messages to the prompt.
    let requestPrompt = messages.map((v, i) => {
        // Set prefix according to the role. Also, when "Exclude Human/Assistant prefixes" is checked, names are added via the system prefix.
        let prefix = {
            'assistant': '\n\nAssistant: ',
            'user': '\n\nHuman: ',
            'system': i === 0 ? '' : v.name === 'example_assistant' ? '\n\nA: ' : v.name === 'example_user' ? '\n\nH: ' : excludePrefixes && v.name ? `\n\n${v.name}: ` : '\n\n',
            'FixHumMsg': '\n\nFirst message: ',
        }[v.role] ?? '';
        // Claude doesn't support message names, so we'll just add them to the message content.
        return `${prefix}${v.name && v.role !== 'system' ? `${v.name}: ` : ''}${v.content}`;
    }).join('');

    return requestPrompt;
}

/**
 * Convert ChatML objects into working with Anthropic's new Messaging API.
 * @param {object[]} messages Array of messages
 * @param {string}   prefillString User determined prefill string
 * @param {boolean}  useSysPrompt See if we want to use a system prompt
 * @param {boolean}  useTools See if we want to use tools
 * @param {PromptNames} names Prompt names
 * @returns {{messages: object[], systemPrompt: object[]}} Prompt for Anthropic
 */
export function convertClaudeMessages(messages, prefillString, useSysPrompt, useTools, names) {
    let systemPrompt = [];
    if (useSysPrompt) {
        // Collect all the system messages up until the first instance of a non-system message, and then remove them from the messages array.
        let i;
        for (i = 0; i < messages.length; i++) {
            if (messages[i].role !== 'system') {
                break;
            }
            // Append example names if not already done by the frontend (e.g. for group chats).
            if (names.userName && messages[i].name === 'example_user') {
                if (!messages[i].content.startsWith(`${names.userName}: `)) {
                    messages[i].content = `${names.userName}: ${messages[i].content}`;
                }
            }
            if (names.charName && messages[i].name === 'example_assistant') {
                if (!messages[i].content.startsWith(`${names.charName}: `) && !names.startsWithGroupName(messages[i].content)) {
                    messages[i].content = `${names.charName}: ${messages[i].content}`;
                }
            }
            systemPrompt.push({ type: 'text', text: messages[i].content });
        }

        messages.splice(0, i);

        // Check if the first message in the array is of type user, if not, interject with humanMsgFix or a blank message.
        // Also prevents erroring out if the messages array is empty.
        if (messages.length === 0) {
            messages.unshift({
                role: 'user',
                content: PROMPT_PLACEHOLDER,
            });
        }
    }

    // Now replace all further messages that have the role 'system' with the role 'user'. (or all if we're not using one)
    const parse = (str) => typeof str === 'string' ? JSON.parse(str) : str;
    messages.forEach((message) => {
        if (message.role === 'assistant' && message.tool_calls) {
            message.content = message.tool_calls.map((tc) => ({
                type: 'tool_use',
                id: tc.id,
                name: tc.function.name,
                input: parse(tc.function.arguments),
            }));
        }

        if (message.role === 'tool') {
            message.role = 'user';
            message.content = [{
                type: 'tool_result',
                tool_use_id: message.tool_call_id,
                content: message.content,
            }];
        }

        if (message.role === 'system') {
            if (names.userName && message.name === 'example_user') {
                if (!message.content.startsWith(`${names.userName}: `)) {
                    message.content = `${names.userName}: ${message.content}`;
                }
            }
            if (names.charName && message.name === 'example_assistant') {
                if (!message.content.startsWith(`${names.charName}: `) && !names.startsWithGroupName(message.content)) {
                    message.content = `${names.charName}: ${message.content}`;
                }
            }
            message.role = 'user';

            // Delete name here so it doesn't get added later
            delete message.name;
        }

        // Convert everything to an array of it would be easier to work with
        if (typeof message.content === 'string') {
            // Take care of name properties since claude messages don't support them
            if (message.name) {
                message.content = `${message.name}: ${message.content}`;
            }

            message.content = [{ type: 'text', text: message.content }];
        } else if (Array.isArray(message.content)) {
            message.content = message.content.map((content) => {
                if (content.type === 'image_url') {
                    const imageEntry = content?.image_url;
                    const imageData = imageEntry?.url;
                    const mimeType = imageData?.split(';')?.[0].split(':')?.[1];
                    const base64Data = imageData?.split(',')?.[1];

                    return {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: mimeType,
                            data: base64Data,
                        },
                    };
                }

                if (content.type === 'text') {
                    if (message.name) {
                        content.text = `${message.name}: ${content.text}`;
                    }

                    // If the text is empty, replace it with a zero-width space
                    return { type: 'text', text: content.text || '\u200b' };
                }

                return content;
            });
        }

        // Remove offending properties
        delete message.name;
        delete message.tool_calls;
        delete message.tool_call_id;
    });

    // Images in assistant messages should be moved to the next user message
    for (let i = 0; i < messages.length; i++) {
        if (messages[i].role === 'assistant' && messages[i].content.some(c => c.type === 'image')) {
            // Find the next user message
            let j = i + 1;
            while (j < messages.length && messages[j].role !== 'user') {
                j++;
            }

            // Move the images
            if (j >= messages.length) {
                // If there is no user message after the assistant message, add a new one
                messages.splice(i + 1, 0, { role: 'user', content: [] });
            }

            messages[j].content.push(...messages[i].content.filter(c => c.type === 'image'));
            messages[i].content = messages[i].content.filter(c => c.type !== 'image');
        }
    }

    // Shouldn't be conditional anymore, messages api expects the last role to be user unless we're explicitly prefilling
    if (prefillString) {
        messages.push({
            role: 'assistant',
            // Dangling whitespace are not allowed for prefilling
            content: [{ type: 'text', text: prefillString.trimEnd() }],
        });
    }

    // Since the messaging endpoint only supports user assistant roles in turns, we have to merge messages with the same role if they follow eachother
    // Also handle multi-modality, holy slop.
    let mergedMessages = [];
    messages.forEach((message) => {
        if (mergedMessages.length > 0 && mergedMessages[mergedMessages.length - 1].role === message.role) {
            mergedMessages[mergedMessages.length - 1].content.push(...message.content);
        } else {
            mergedMessages.push(message);
        }
    });

    if (!useTools) {
        mergedMessages.forEach((message) => {
            message.content.forEach((content) => {
                if (content.type === 'tool_use') {
                    content.type = 'text';
                    content.text = JSON.stringify(content.input);
                    delete content.id;
                    delete content.name;
                    delete content.input;
                }
                if (content.type === 'tool_result') {
                    content.type = 'text';
                    content.text = content.content;
                    delete content.tool_use_id;
                    delete content.content;
                }
            });
        });
    }

    return { messages: mergedMessages, systemPrompt: systemPrompt };
}

/**
 * Append cache_control object to a Claude messages at depth. Directly modifies the messages array.
 * @param {any[]} messages Messages to modify
 * @param {number} cachingAtDepth Depth at which caching is supposed to occur
 * @param {string} ttl TTL value
 */
export function cachingAtDepthForClaude(messages, cachingAtDepth, ttl) {
    let passedThePrefill = false;
    let depth = 0;
    let previousRoleName = '';

    for (let i = messages.length - 1; i >= 0; i--) {
        if (!passedThePrefill && messages[i].role === 'assistant') {
            continue;
        }

        passedThePrefill = true;

        if (messages[i].role !== previousRoleName) {
            if (depth === cachingAtDepth || depth === cachingAtDepth + 2) {
                const content = messages[i].content;
                content[content.length - 1].cache_control = { type: 'ephemeral', ttl: ttl };
            }

            if (depth === cachingAtDepth + 2) {
                break;
            }

            depth += 1;
            previousRoleName = messages[i].role;
        }
    }
}

/**
 * Append cache_control headers to an OpenRouter request at depth. Directly modifies the
 * messages array.
 * @param {object[]} messages Array of messages
 * @param {number} cachingAtDepth Depth at which caching is supposed to occur
 * @param {string} ttl TTL value
 */
export function cachingAtDepthForOpenRouterClaude(messages, cachingAtDepth, ttl) {
    //caching the prefill is a terrible idea in general
    let passedThePrefill = false;
    //depth here is the number of message role switches
    let depth = 0;
    let previousRoleName = '';
    for (let i = messages.length - 1; i >= 0; i--) {
        if (!passedThePrefill && messages[i].role === 'assistant') {
            continue;
        }

        passedThePrefill = true;

        if (messages[i].role !== previousRoleName) {
            if (depth === cachingAtDepth || depth === cachingAtDepth + 2) {
                const content = messages[i].content;
                if (typeof content === 'string') {
                    messages[i].content = [{
                        type: 'text',
                        text: content,
                        cache_control: { type: 'ephemeral', ttl: ttl },
                    }];
                } else {
                    const contentPartCount = content.length;
                    content[contentPartCount - 1].cache_control = {
                        type: 'ephemeral',
                        ttl: ttl,
                    };
                }
            }

            if (depth === cachingAtDepth + 2) {
                break;
            }

            depth += 1;
            previousRoleName = messages[i].role;
        }
    }
}

/**
 * Adds cache_control to the system prompt for OpenRouter requests.
 *
 * @param {object[]} messages Array of messages
 * @param {string} [ttl] TTL value (optional)
 */
export function cachingSystemPromptForOpenRouter(messages, ttl = undefined) {
    if (!Array.isArray(messages) || messages.length === 0) {
        return;
    }

    // Find the first system message
    const systemMessage = messages.find(msg => msg.role === 'system');
    if (!systemMessage) {
        return;
    }

    // Check if it already has cache_control (at message level)
    if (systemMessage.cache_control) {
        return;
    }

    const cacheControl = ttl
        ? { type: 'ephemeral', ttl }
        : { type: 'ephemeral' };

    if (Array.isArray(systemMessage.content)) {
        const hasExistingCacheControl = systemMessage.content.some(part => part?.cache_control);
        if (hasExistingCacheControl) {
            return;
        }

        for (let i = systemMessage.content.length - 1; i >= 0; i--) {
            if (systemMessage.content[i]?.type === 'text') {
                systemMessage.content[i].cache_control = cacheControl;
                return;
            }
        }
    } else if (typeof systemMessage.content === 'string') {
        systemMessage.content = [
            {
                type: 'text',
                text: systemMessage.content,
                cache_control: cacheControl,
            },
        ];
    }
}

/**
 * Calculate the Claude budget tokens for a given reasoning effort.
 * @param {number} maxTokens Maximum tokens
 * @param {string} reasoningEffort Reasoning effort
 * @param {boolean} stream If streaming is enabled
 * @returns {number?} Budget tokens
 */
export function calculateClaudeBudgetTokens(maxTokens, reasoningEffort, stream) {
    let budgetTokens = 0;

    switch (reasoningEffort) {
        case REASONING_EFFORT.auto:
            return null;
        case REASONING_EFFORT.min:
            budgetTokens = 1024;
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
            budgetTokens = Math.floor(maxTokens * 0.95);
            break;
    }

    budgetTokens = Math.max(budgetTokens, 1024);

    if (!stream) {
        budgetTokens = Math.min(budgetTokens, 21333);
    }

    return budgetTokens;
}
