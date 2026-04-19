/**
 * Prompt converter: others — extracted from prompt-converters.js
 */

import { PROMPT_PLACEHOLDER } from '../prompt-converters.js';

/**
 * Convert a prompt from the ChatML objects to the format used by Cohere.
 * @param {object[]} messages Array of messages
 * @param {PromptNames} names Prompt names
 * @returns {{chatHistory: object[]}} Prompt for Cohere
 */
export function convertCohereMessages(messages, names) {
    if (messages.length === 0) {
        messages.unshift({
            role: 'user',
            content: PROMPT_PLACEHOLDER,
        });
    }

    messages.forEach((msg, index) => {
        // Tool calls require an assistent primer
        if (Array.isArray(msg.tool_calls)) {
            if (index > 0 && messages[index - 1].role === 'assistant') {
                msg.content = messages[index - 1].content;
                messages.splice(index - 1, 1);
            } else {
                msg.content = `I'm going to call a tool for that: ${msg.tool_calls.map(tc => tc?.function?.name).join(', ')}`;
            }
        }
        // No names support (who would've thought)
        if (msg.name) {
            if (msg.role == 'system' && msg.name == 'example_assistant') {
                if (names.charName && !msg.content.startsWith(`${names.charName}: `) && !names.startsWithGroupName(msg.content)) {
                    msg.content = `${names.charName}: ${msg.content}`;
                }
            }
            if (msg.role == 'system' && msg.name == 'example_user') {
                if (names.userName && !msg.content.startsWith(`${names.userName}: `)) {
                    msg.content = `${names.userName}: ${msg.content}`;
                }
            }
            if (msg.role !== 'system' && !msg.content.startsWith(`${msg.name}: `)) {
                msg.content = `${msg.name}: ${msg.content}`;
            }
            delete msg.name;
        }
    });

    return { chatHistory: messages };
}

/**
 * Convert AI21 prompt. Classic: system message squash, user/assistant message merge.
 * @param {object[]} messages Array of messages
 * @param {PromptNames} names Prompt names
 * @returns {object[]} Prompt for AI21
 */
export function convertAI21Messages(messages, names) {
    if (!Array.isArray(messages)) {
        return [];
    }

    // Collect all the system messages up until the first instance of a non-system message, and then remove them from the messages array.
    let i = 0, systemPrompt = '';

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
        systemPrompt += `${messages[i].content}\n\n`;
    }

    messages.splice(0, i);

    // Prevent erroring out if the messages array is empty.
    if (messages.length === 0) {
        messages.unshift({
            role: 'user',
            content: PROMPT_PLACEHOLDER,
        });
    }

    if (systemPrompt) {
        messages.unshift({
            role: 'system',
            content: systemPrompt.trim(),
        });
    }

    // Doesn't support completion names, so prepend if not already done by the frontend (e.g. for group chats).
    messages.forEach(msg => {
        if ('name' in msg) {
            if (msg.role !== 'system' && !msg.content.startsWith(`${msg.name}: `)) {
                msg.content = `${msg.name}: ${msg.content}`;
            }
            delete msg.name;
        }
    });

    // Since the messaging endpoint only supports alternating turns, we have to merge messages with the same role if they follow each other
    let mergedMessages = [];
    messages.forEach((message) => {
        if (mergedMessages.length > 0 && mergedMessages[mergedMessages.length - 1].role === message.role) {
            mergedMessages[mergedMessages.length - 1].content += '\n\n' + message.content;
        } else {
            mergedMessages.push(message);
        }
    });

    return mergedMessages;
}

/**
 * Convert a prompt from the ChatML objects to the format used by MistralAI.
 * @param {object[]} messages Array of messages
 * @param {PromptNames} names Prompt names
 * @returns {object[]} Prompt for MistralAI
 */
export function convertMistralMessages(messages, names) {
    if (!Array.isArray(messages)) {
        return [];
    }

    // Make the last assistant message a prefill
    const prefixEnabled = getConfigValue('mistral.enablePrefix', false, 'boolean');
    const lastMsg = messages[messages.length - 1];
    if (prefixEnabled && messages.length > 0 && lastMsg?.role === 'assistant') {
        lastMsg.prefix = true;
    }

    const sanitizeToolId = (id) => crypto.createHash('sha512').update(id).digest('hex').slice(0, 9);

    // Doesn't support completion names, so prepend if not already done by the frontend (e.g. for group chats).
    messages.forEach(msg => {
        if ('tool_calls' in msg && Array.isArray(msg.tool_calls)) {
            msg.tool_calls.forEach(tool => {
                tool.id = sanitizeToolId(tool.id);
            });
        }
        if ('tool_call_id' in msg && msg.role === 'tool') {
            msg.tool_call_id = sanitizeToolId(msg.tool_call_id);
        }
        if (msg.role === 'system' && msg.name === 'example_assistant') {
            if (names.charName && !msg.content.startsWith(`${names.charName}: `) && !names.startsWithGroupName(msg.content)) {
                msg.content = `${names.charName}: ${msg.content}`;
            }
            delete msg.name;
        }

        if (msg.role === 'system' && msg.name === 'example_user') {
            if (names.userName && !msg.content.startsWith(`${names.userName}: `)) {
                msg.content = `${names.userName}: ${msg.content}`;
            }
            delete msg.name;
        }

        if (msg.name && msg.role !== 'system' && !msg.content.startsWith(`${msg.name}: `)) {
            msg.content = `${msg.name}: ${msg.content}`;
            delete msg.name;
        }
    });

    // If user role message immediately follows a tool message, append it to the last user message
    const fixToolMessages = () => {
        let rerun = true;
        while (rerun) {
            rerun = false;
            messages.forEach((message, i) => {
                if (i === messages.length - 1) {
                    return;
                }
                if (message.role === 'tool' && messages[i + 1].role === 'user') {
                    const lastUserMessage = messages.slice(0, i).findLastIndex(m => m.role === 'user' && m.content);
                    if (lastUserMessage !== -1) {
                        messages[lastUserMessage].content += '\n\n' + messages[i + 1].content;
                        messages.splice(i + 1, 1);
                        rerun = true;
                    }
                }
            });
        }
    };
    fixToolMessages();

    // If system role message immediately follows an assistant message, change its role to user
    for (let i = 0; i < messages.length - 1; i++) {
        if (messages[i].role === 'assistant' && messages[i + 1].role === 'system') {
            messages[i + 1].role = 'user';
        }
    }

    return messages;
}

/**
 * Convert a prompt from the messages objects to the format used by xAI.
 * @param {object[]} messages Array of messages
 * @param {PromptNames} names Prompt names
 * @returns {object[]} Prompt for xAI
 */
export function convertXAIMessages(messages, names) {
    if (!Array.isArray(messages)) {
        return [];
    }

    messages.forEach(msg => {
        if (!msg.name || msg.role === 'user') {
            return;
        }

        const needsCharNamePrefix = [
            { role: 'assistant', condition: names.charName && !msg.content.startsWith(`${names.charName}: `) && !names.startsWithGroupName(msg.content) },
            { role: 'system', name: 'example_assistant', condition: names.charName && !msg.content.startsWith(`${names.charName}: `) && !names.startsWithGroupName(msg.content) },
            { role: 'system', name: 'example_user', condition: names.userName && !msg.content.startsWith(`${names.userName}: `) },
        ];

        const matchingRule = needsCharNamePrefix.find(rule =>
            msg.role === rule.role && (!rule.name || msg.name === rule.name) && rule.condition,
        );

        if (matchingRule) {
            const prefix = msg.role === 'system' && msg.name === 'example_user' ? names.userName : names.charName;
            msg.content = `${prefix}: ${msg.content}`;
        }

        delete msg.name;
    });

    return messages;
}
