/**
 * message-renderer.js
 *
 * Message text formatting / rendering pipeline.
 * Extracted from script.js to allow importing without pulling in the full monolith.
 *
 * Circular imports from script.js are intentional and safe — all bindings are
 * read inside function bodies, never at module initialisation time.
 */

import { DOMPurify } from '../lib.js';

// Circular imports from script.js — safe (read at call time)
import { chat, systemUserName, converter } from './core/state.js';
import { substituteParams } from '../script.js';

import { COMMENT_NAME_DEFAULT } from './slash-commands.js';
import { getRegexedString, regex_placement } from './extensions/regex/engine.js';
import { fixMarkdown, power_user } from './power-user.js';
import { canUseNegativeLookbehind, escapeHtml, escapeRegex } from './utils.js';
import { encodeStyleTags, decodeStyleTags } from './chats.js';

/**
 * Working copy of the raw message being processed by {@link messageFormatting}.
 * Exposed so that showdown extensions can compare the pre-processed string.
 * @type {string}
 */
export let mesForShowdownParse;

/**
 * Formats the message text into an HTML string using Markdown and other formatting.
 * @param {string} mes Message text
 * @param {string} ch_name Character name
 * @param {boolean} isSystem If the message was sent by the system
 * @param {boolean} isUser If the message was sent by the user
 * @param {number} messageId Message index in chat array
 * @param {Partial<DOMPurify.Config>} [sanitizerOverrides] DOMPurify sanitizer option overrides
 * @param {boolean} [isReasoning] If the message is reasoning output
 * @returns {string} HTML string
 */
export function messageFormatting(mes, ch_name, isSystem, isUser, messageId, sanitizerOverrides = {}, isReasoning = false) {
    if (!mes) {
        return '';
    }

    if (Number(messageId) === 0 && !isSystem && !isUser && !isReasoning) {
        const mesBeforeReplace = mes;
        const chatMessage = chat[messageId];
        mes = substituteParams(mes, undefined, ch_name);
        if (chatMessage && chatMessage.mes === mesBeforeReplace && chatMessage.extra?.display_text !== mesBeforeReplace) {
            chatMessage.mes = mes;
        }
    }

    mesForShowdownParse = mes;

    // Force isSystem = false on comment messages so they get formatted properly
    if (ch_name === COMMENT_NAME_DEFAULT && isSystem && !isUser) {
        isSystem = false;
    }

    // Let hidden messages have markdown
    if (isSystem && ch_name !== systemUserName) {
        isSystem = false;
    }

    // Prompt bias replacement should be applied on the raw message
    const replacedPromptBias = power_user.user_prompt_bias && substituteParams(power_user.user_prompt_bias);
    if (!power_user.show_user_prompt_bias && ch_name && !isUser && !isSystem && replacedPromptBias && mes.startsWith(replacedPromptBias)) {
        mes = mes.slice(replacedPromptBias.length);
    }

    if (!isSystem) {
        function getRegexPlacement() {
            try {
                if (isReasoning) {
                    return regex_placement.REASONING;
                }
                if (isUser) {
                    return regex_placement.USER_INPUT;
                } else if (chat[messageId]?.extra?.type === 'narrator') {
                    return regex_placement.SLASH_COMMAND;
                } else {
                    return regex_placement.AI_OUTPUT;
                }
            } catch {
                return regex_placement.AI_OUTPUT;
            }
        }

        const regexPlacement = getRegexPlacement();
        const usableMessages = chat.map((x, index) => ({ message: x, index: index })).filter(x => !x.message.is_system);
        const indexOf = usableMessages.findIndex(x => x.index === Number(messageId));
        const depth = messageId >= 0 && indexOf !== -1 ? (usableMessages.length - indexOf - 1) : undefined;

        // Always override the character name
        mes = getRegexedString(mes, regexPlacement, {
            characterOverride: ch_name,
            isMarkdown: true,
            depth: depth,
        });
    }

    if (power_user.auto_fix_generated_markdown) {
        mes = fixMarkdown(mes, true);
    }

    if (!isSystem && power_user.encode_tags) {
        mes = canUseNegativeLookbehind()
            ? mes.replaceAll('<', '&lt;').replace(new RegExp('(?<!^|\\n\\s*)>', 'g'), '&gt;')
            : mes.replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    }

    // Make sure reasoning strings are always shown, even if they include "<" or ">"
    [power_user.reasoning.prefix, power_user.reasoning.suffix].forEach((reasoningString) => {
        if (!reasoningString || !reasoningString.trim().length) {
            return;
        }
        // Only replace the first occurrence of the reasoning string
        if (mes.includes(reasoningString)) {
            mes = mes.replace(reasoningString, escapeHtml(reasoningString));
        }
    });

    if (!isSystem) {
        // Save double quotes in tags as a special character to prevent them from being encoded
        if (!power_user.encode_tags) {
            mes = mes.replace(/<([^>]+)>/g, function (_, contents) {
                return '<' + contents.replace(/"/g, '\ufffe') + '>';
            });
        }

        mes = mes.replace(
            /<style>[\s\S]*?<\/style>|```[\s\S]*?```|~~~[\s\S]*?~~~|``[\s\S]*?``|`[\s\S]*?`|(".*?")|(\u201C.*?\u201D)|(\u00AB.*?\u00BB)|(\u300C.*?\u300D)|(\u300E.*?\u300F)|(\uFF02.*?\uFF02)/gim,
            function (match, p1, p2, p3, p4, p5, p6) {
                if (p1) {
                    // English double quotes
                    return `<q>"${p1.slice(1, -1)}"</q>`;
                } else if (p2) {
                    // Curly double quotes " "
                    return `<q>"${p2.slice(1, -1)}"</q>`;
                } else if (p3) {
                    // Guillemets « »
                    return `<q>«${p3.slice(1, -1)}»</q>`;
                } else if (p4) {
                    // Corner brackets 「 」
                    return `<q>「${p4.slice(1, -1)}」</q>`;
                } else if (p5) {
                    // White corner brackets 『 』
                    return `<q>『${p5.slice(1, -1)}』</q>`;
                } else if (p6) {
                    // Fullwidth quotes ＂ ＂
                    return `<q>＂${p6.slice(1, -1)}＂</q>`;
                } else {
                    // Return the original match if no quotes are found
                    return match;
                }
            },
        );

        // Restore double quotes in tags
        if (!power_user.encode_tags) {
            mes = mes.replace(/\ufffe/g, '"');
        }

        mes = mes.replaceAll('\\begin{align*}', '$$');
        mes = mes.replaceAll('\\end{align*}', '$$');
        mes = converter.makeHtml(mes);

        mes = mes.replace(/<code(.*)>[\s\S]*?<\/code>/g, function (match) {
            // Firefox creates extra newlines from <br>s in code blocks, so we replace them before converting newlines to <br>s.
            return match.replace(/\n/gm, '\u0000');
        });
        mes = mes.replace(/\u0000/g, '\n'); // Restore converted newlines
        mes = mes.trim();

        mes = mes.replace(/<code(.*)>[\s\S]*?<\/code>/g, function (match) {
            return match.replace(/&amp;/g, '&');
        });
    }

    if (!power_user.allow_name2_display && ch_name && !isUser && !isSystem) {
        mes = mes.replace(new RegExp(`(^|\n)${escapeRegex(ch_name)}:`, 'g'), '$1');
    }

    /** @type {DOMPurify.Config} */
    const config = {
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        RETURN_TRUSTED_TYPE: false,
        MESSAGE_SANITIZE: true,
        ADD_TAGS: ['custom-style'],
        ...sanitizerOverrides,
    };
    mes = encodeStyleTags(mes);
    mes = DOMPurify.sanitize(mes, config);
    mes = decodeStyleTags(mes, { prefix: '.mes_text ' });

    return mes;
}
