import { createApp } from 'vue';
import { chat, chat_metadata, event_types, eventSource, saveSettingsDebounced } from '../../../../script.js';
import { metadata_keys } from '../../../../scripts/authors-note.js';
import { extension_settings } from '../../../../scripts/extensions.js';
import { SlashCommand } from '../../../../scripts/slash-commands/SlashCommand.js';
import { SlashCommandParser } from '../../../../scripts/slash-commands/SlashCommandParser.js';
import { delay } from '../../../../scripts/utils.js';
import { world_info_position } from '../../../../scripts/world-info.js';
import WorldInfoInfoShell from './WorldInfoInfoShell.vue';

const strategy = {
    constant: '🔵',
    normal: '🟢',
    vectorized: '🔗',
};
const getStrategy = (entry) => {
    if (entry.constant === true) {
        return 'constant';
    } else if (entry.vectorized === true) {
        return 'vectorized';
    } else {
        return 'normal';
    }
};

/**
 * @typedef {object} RenderedEntry
 * @property {string} id
 * @property {'wi'|'mes'|'note'} type
 * @property {boolean} isBroken
 * @property {string} tooltip
 * @property {string} strategyText
 * @property {string[]} strategyClasses
 * @property {string} count
 * @property {string} titleText
 * @property {string} first
 * @property {?string} last
 * @property {string} stickyText
 * @property {string} stickyTitle
 */

/**
 * @typedef {object} RenderedGroup
 * @property {string} world
 * @property {RenderedEntry[]} entries
 */

/**
 * @param {string} world
 * @param {any} entry
 * @param {number} entryIndex
 * @returns {RenderedEntry}
 */
function toRenderedEntry(world, entry, entryIndex) {
    const strategyClasses = [];
    let strategyText = '';
    if (entry.type === 'wi') {
        strategyText = strategy[getStrategy(entry)];
    } else if (entry.type === 'mes') {
        strategyClasses.push('fa-solid', 'fa-fw', 'fa-comments');
    } else if (entry.type === 'note') {
        strategyClasses.push('fa-solid', 'fa-fw', 'fa-note-sticky');
    }

    let titleText = '';
    let first = '';
    let last = null;
    let tooltip = '';

    if (entry.type === 'wi') {
        titleText = entry.comment?.length ? entry.comment : entry.key.join(', ');
        tooltip = `[${entry.world}] ${titleText}\n---\n${entry.content}`;
    } else if (entry.type === 'mes') {
        first = entry.first ?? '';
        if (entry.last) {
            last = entry.last;
            tooltip = `Messages #${entry.from}-${entry.to}\n---\n${first}\n...\n${last}`;
        } else {
            tooltip = `Message #${entry.from}\n---\n${first}`;
        }
    } else {
        titleText = 'Author\'s Note';
        tooltip = `Author's Note\n---\n${entry.text}`;
    }

    const idBase = entry.uid ?? `${entry.from ?? 'x'}-${entry.to ?? 'x'}`;
    return {
        id: `${world}-${entry.type}-${idBase}-${entryIndex}`,
        type: entry.type,
        isBroken: false,
        tooltip,
        strategyText,
        strategyClasses,
        count: entry.count != null ? String(entry.count) : '',
        titleText,
        first,
        last,
        stickyText: entry.sticky ? `📌 ${entry.sticky}` : '',
        stickyTitle: entry.sticky ? `Sticky for ${entry.sticky} more rounds` : '',
    };
}

let generationType;
eventSource.on(event_types.GENERATION_STARTED, (genType) => generationType = genType);

let initialized = false;

export function init() {
    if (initialized) return;
    initialized = true;

    const groupDefault = extension_settings.worldInfoInfo?.group ?? true;
    const orderDefault = extension_settings.worldInfoInfo?.order ?? true;
    const mesDefault = extension_settings.worldInfoInfo?.mes ?? true;

    const shellRoot = document.createElement('div');
    document.body.append(shellRoot);

    const shellView = createApp(WorldInfoInfoShell, {
        group: groupDefault,
        order: orderDefault,
        mes: mesDefault,
    }).mount(shellRoot);

    const trigger = document.getElementById('stwii-trigger');
    const cbGroup = document.getElementById('stwii-config-group');
    const cbOrder = document.getElementById('stwii-config-order');
    const cbMes = document.getElementById('stwii-config-mes');

    if (!trigger || !cbGroup || !cbOrder || !cbMes) {
        console.error('[WorldInfoInfo] Failed to mount shell UI');
        return;
    }

    let entries = [];

    let count = -1;
    const updateBadge = async (newEntries) => {
        if (count != newEntries.length) {
            if (newEntries.length == 0) {
                trigger.classList.add('stwii--badge-out');
                await delay(510);
                trigger.setAttribute('data-stwii--badge-count', newEntries.length.toString());
                trigger.classList.remove('stwii--badge-out');
            } else if (count == 0) {
                trigger.classList.add('stwii--badge-in');
                trigger.setAttribute('data-stwii--badge-count', newEntries.length.toString());
                await delay(510);
                trigger.classList.remove('stwii--badge-in');
            } else {
                trigger.setAttribute('data-stwii--badge-count', newEntries.length.toString());
                trigger.classList.add('stwii--badge-bounce');
                await delay(1010);
                trigger.classList.remove('stwii--badge-bounce');
            }
            count = newEntries.length;
        } else if (new Set(newEntries).difference(new Set(entries)).size > 0) {
            trigger.classList.add('stwii--badge-bounce');
            await delay(1010);
            trigger.classList.remove('stwii--badge-bounce');
        }
        entries = newEntries;
    };

    let currentEntryList = [];
    let currentChat = [];

    cbGroup.addEventListener('click', () => {
        if (!extension_settings.worldInfoInfo) {
            extension_settings.worldInfoInfo = {};
        }
        extension_settings.worldInfoInfo.group = cbGroup.checked;
        updatePanel(currentEntryList);
        saveSettingsDebounced();
    });

    cbOrder.addEventListener('click', () => {
        if (!extension_settings.worldInfoInfo) {
            extension_settings.worldInfoInfo = {};
        }
        extension_settings.worldInfoInfo.order = cbOrder.checked;
        updatePanel(currentEntryList);
        saveSettingsDebounced();
    });

    cbMes.addEventListener('click', () => {
        if (!extension_settings.worldInfoInfo) {
            extension_settings.worldInfoInfo = {};
        }
        extension_settings.worldInfoInfo.mes = cbMes.checked;
        updatePanel(currentEntryList);
        saveSettingsDebounced();
    });

    eventSource.on(event_types.WORLD_INFO_ACTIVATED, async (entryList) => {
        shellView.setPanelMessage('Updating...');
        updateBadge(entryList.map(it => `${it.world}§§§${it.uid}`));
        for (const entry of entryList) {
            entry.type = 'wi';
            entry.sticky = parseInt(/** @type {string} */(await SlashCommandParser.commands['wi-get-timed-effect'].callback(
                {
                    effect: 'sticky',
                    format: 'number',
                    file: `${entry.world}`,
                    _scope: null,
                    _abortController: null,
                },
                entry.uid,
            )));
        }
        currentEntryList = [...entryList];
        updatePanel(entryList, true);
    });

    const updatePanel = (entryList, newChat = false) => {
        const isGrouped = extension_settings.worldInfoInfo?.group ?? true;
        const isOrdered = extension_settings.worldInfoInfo?.order ?? true;
        const isMes = extension_settings.worldInfoInfo?.mes ?? true;
        const renderGroups = [];
        let grouped;
        if (isGrouped) {
            grouped = Object.groupBy(entryList, (it) => it.world);
        } else {
            grouped = {
                'WI Entries': [...entryList],
            };
        }
        const depthPos = [world_info_position.ANBottom, world_info_position.ANTop, world_info_position.atDepth];
        for (const [world, entries] of Object.entries(grouped)) {
            /** @type {any[]} */
            const worldEntries = entries ?? [];
            for (const e of worldEntries) {
                e.depth = e.position == world_info_position.atDepth ? e.depth : (chat_metadata[metadata_keys.depth] + (e.position == world_info_position.ANTop ? 0.1 : 0));
            }
            worldEntries.sort((a, b) => {
                if (isOrdered) {
                    if (!depthPos.includes(a.position) && !depthPos.includes(b.position)) return a.position - b.position;
                    if (depthPos.includes(a.position) && !depthPos.includes(b.position)) return 1;
                    if (!depthPos.includes(a.position) && depthPos.includes(b.position)) return -1;
                    if ((a.depth ?? Number.MAX_SAFE_INTEGER) < (b.depth ?? Number.MAX_SAFE_INTEGER)) return 1;
                    if ((a.depth ?? Number.MAX_SAFE_INTEGER) > (b.depth ?? Number.MAX_SAFE_INTEGER)) return -1;
                    if ((a.order ?? Number.MAX_SAFE_INTEGER) > (b.order ?? Number.MAX_SAFE_INTEGER)) return 1;
                    if ((a.order ?? Number.MAX_SAFE_INTEGER) < (b.order ?? Number.MAX_SAFE_INTEGER)) return -1;
                    return (a.comment ?? a.key.join(', ')).toLowerCase().localeCompare((b.comment ?? b.key.join(', ')).toLowerCase());
                } else {
                    return (a.comment?.length ? a.comment : a.key.join(', '))
                        .toLowerCase()
                        .localeCompare(b.comment?.length ? b.comment : b.key.join(', '));
                }
            });
            if (!isGrouped && isOrdered && isMes) {
                const an = chat_metadata[metadata_keys.prompt];
                const ad = chat_metadata[metadata_keys.depth];
                if (an?.length) {
                    const idx = worldEntries.findIndex(e => depthPos.includes(e.position) && e.depth <= ad);
                    worldEntries.splice(idx, 0, {
                        type: 'note',
                        position: world_info_position.ANBottom,
                        depth: ad,
                        text: an,
                    });
                }
                if (newChat) {
                    currentChat = [...chat];
                    if (generationType == 'swipe') currentChat.pop();
                }
                const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
                let currentDepth = currentChat.length - 1;
                let isDumped = false;
                for (let i = worldEntries.length - 1; i >= -1; i--) {
                    if (i < 0 && currentDepth < 0) continue;
                    if (isDumped) continue;
                    if ((i < 0 && currentDepth >= 0) || !depthPos.includes(worldEntries[i].position)) {
                        isDumped = true;
                        const depth = -1;
                        const mesList = currentChat.slice(depth + 1, currentDepth + 1);
                        const text = mesList
                            .map(it => it.mes)
                            .map(it => it
                                .replace(/```.+```/gs, '')
                                .replace(/<[^>]+?>/g, '')
                                .trim(),
                            )
                            .filter(it => it.length)
                            .join('\n');
                        const sentences = [...segmenter.segment(text)].map(it => it.segment.trim());
                        worldEntries.splice(i + 1, 0, {
                            type: 'mes',
                            count: mesList.length,
                            from: depth + 1,
                            to: currentDepth,
                            first: sentences.at(0),
                            last: sentences.length > 1 ? sentences.at(-1) : null,
                        });
                        currentDepth = -1;
                        continue;
                    }
                    let depth = Math.max(-1, currentChat.length - worldEntries[i].depth - 1);
                    if (depth >= currentDepth) continue;
                    depth = Math.ceil(depth);
                    if (depth == currentDepth) continue;
                    const mesList = currentChat.slice(depth + 1, currentDepth + 1);
                    const text = mesList
                        .map(it => it.mes)
                        .map(it => it
                            .replace(/```.+```/gs, '')
                            .replace(/<[^>]+?>/g, '')
                            .trim(),
                        )
                        .filter(it => it.length)
                        .join('\n');
                    const sentences = [...segmenter.segment(text)].map(it => it.segment.trim());
                    worldEntries.splice(i + 1, 0, {
                        type: 'mes',
                        count: mesList.length,
                        from: depth + 1,
                        to: currentDepth,
                        first: sentences.at(0),
                        last: sentences.length > 1 ? sentences.at(-1) : null,
                    });
                    currentDepth = depth;
                }
            }
            const renderedEntries = worldEntries.map((entry, entryIndex) => toRenderedEntry(world, entry, entryIndex));
            renderGroups.push({
                world,
                entries: renderedEntries,
            });
        }
        shellView.setPanelRows(renderGroups);
    };

    const original_debug = console.debug;
    console.debug = function (...args) {
        const triggers = [
            '[WI] Found 0 world lore entries. Sorted by strategy',
            '[WI] Adding 0 entries to prompt',
        ];
        if (triggers.includes(args[0])) {
            shellView.setPanelMessage('No active entries');
            updateBadge([]);
            currentEntryList = [];
        }
        return original_debug.bind(console)(...args);
    };
    const original_log = console.log;
    console.log = function (...args) {
        const triggers = [
            '[WI] Found 0 world lore entries. Sorted by strategy',
            '[WI] Adding 0 entries to prompt',
        ];
        if (triggers.includes(args[0])) {
            shellView.setPanelMessage('No active entries');
            updateBadge([]);
            currentEntryList = [];
        }
        return original_log.bind(console)(...args);
    };

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'wi-triggered',
        callback: (args, value) => {
            return JSON.stringify(currentEntryList);
        },
        returns: 'list of triggered WI entries',
        helpString: 'Get the list of World Info entries triggered on the last generation.',
    }));
}
