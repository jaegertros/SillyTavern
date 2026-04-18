import { createApp } from 'vue';
import { getRequestHeaders } from '../../../../script.js';
import { ScraperManager } from '../../../../scripts/scrapers.js';
import { POPUP_RESULT, POPUP_TYPE, callGenericPopup } from '../../../../scripts/popup.js';
import { SlashCommand } from '../../../../scripts/slash-commands/SlashCommand.js';
import { ARGUMENT_TYPE, SlashCommandNamedArgument } from '../../../../scripts/slash-commands/SlashCommandArgument.js';
import { SlashCommandParser } from '../../../../scripts/slash-commands/SlashCommandParser.js';
import MiHoYoPopup from './MiHoYoPopup.vue';

const MODULE_NAME = 'Bronie Parser Extension';

/**
 * Scrapes data from the miHoYo/HoYoverse HoYoLAB wiki.
 */
class MiHoYoScraper {
    constructor() {
        this.id = 'mihoyo';
        this.name = 'miHoYo';
        this.description = 'Download a page from the miHoYo/HoYoverse HoYoLAB wiki.';
        this.iconClass = 'scripts/extensions/third-party/Bronie-Parser-Extension/parsers/mihoyo/mihoyo.svg';
        this.iconAvailable = false;

        SlashCommandParser.addCommandObject(SlashCommand.fromProps({
            name: 'mihoyo',
            callback: async ({ wiki, wiki_id }) => {
                try {
                    if (!wiki) {
                        throw new Error('A specific HoYoLab wiki is required');
                    }
                    if (!wiki_id) {
                        throw new Error('A specific HoYoLab wiki ID is required');
                    }

                    const miHoYoWiki = String(wiki.trim() || '');
                    if (!['hsr', 'genshin'].includes(miHoYoWiki)) {
                        throw new Error('Unknown wiki name identifier');
                    }

                    if (!await this.isAvailable()) {
                        throw new Error('The miHoYo plugin is not installed or failed to initialize. Check the installation or server logs and try again.');
                    }

                    const result = await this.beginParse(miHoYoWiki, wiki_id, true);
                    return result;
                } catch (error) {
                    toastr.error(error.message);
                    return '';
                }
            },
            returns: ARGUMENT_TYPE.STRING,
            namedArgumentList: [
                new SlashCommandNamedArgument('wiki', 'The specific HoYoLab wiki to scrape from', ['hsr', 'genshin'], true, false),
                new SlashCommandNamedArgument('wiki_id', 'The HoYoLab wiki ID to scrape', ARGUMENT_TYPE.NUMBER, true, false),
            ],
            unnamedArgumentList: [],
            helpString: `
            <div>
                <p>Returns a string of scraped data from the miHoYo/HoYoverse HoYoLAB wiki by Wiki Page and ID.</p>
            </div>
            <div>
                <strong>Example:</strong>
                <ul>
                    <li>
                        <pre><code>/mihoyo wiki=hsr wiki_id=14</code></pre>
                        will parse the Honkai: Star Rail wiki for Wiki Entry ID '14' (Bronya).
                    </li>
                    <li>
                        <pre><code>/mihoyo wiki=genshin wiki_id=14</code></pre>
                        will parse the Genshin Impact wiki for Wiki Entry ID '14' (Amber).
                    </li>
                </ul>
            </div>
            `,
        }));
    }

    async isAvailable() {
        try {
            const result = await fetch('/api/plugins/hoyoverse/probe', {
                method: 'POST',
                headers: getRequestHeaders(),
            });

            return result.ok;
        } catch (error) {
            console.debug('Could not probe miHoYo plugin', error);
            return false;
        }
    }

    parseOutput(moduleData) {
        let output = '';
        for (const entry of moduleData) {
            if (entry.key === '') {
                output += `- ${entry.value}\n`;
                continue;
            }
            output += `- ${entry.key}: ${entry.value}\n`;
        }
        return output;
    }

    async scrape() {
        const popupState = {
            wiki: '',
            wikiId: '',
        };

        const container = document.createElement('div');
        const popupApp = createApp(MiHoYoPopup, {
            wiki: popupState.wiki,
            wikiId: popupState.wikiId,
            'onUpdate:wiki': (value) => {
                popupState.wiki = String(value ?? '');
            },
            'onUpdate:wikiId': (value) => {
                popupState.wikiId = String(value ?? '');
            },
        });
        popupApp.mount(container);

        const confirm = await callGenericPopup($(container), POPUP_TYPE.CONFIRM, '', {
            wide: false,
            large: false,
        }).finally(() => {
            popupApp.unmount();
        });

        if (confirm !== POPUP_RESULT.AFFIRMATIVE) {
            return;
        }

        const miHoYoWiki = popupState.wiki;
        const miHoYoWikiID = popupState.wikiId;

        if (!miHoYoWiki) {
            toastr.error('A specific HoYoLab wiki is required');
            return;
        }

        if (!miHoYoWikiID) {
            toastr.error('A specific HoYoLab wiki ID is required');
            return;
        }

        if (!['hsr', 'genshin'].includes(miHoYoWiki)) {
            throw new Error('Unknown wiki name identifier');
        }

        if (!await this.isAvailable()) {
            throw new Error('The miHoYo plugin is not installed or failed to initialize. Check the installation or server logs and try again.');
        }

        if (miHoYoWiki === 'hsr') {
            toastr.info(`Scraping the Honkai: Star Rail HoYoLAB wiki for Wiki Entry ID: ${miHoYoWikiID}`);
        } else {
            toastr.info(`Scraping the Genshin Impact wiki for Wiki Entry ID: ${miHoYoWikiID}`);
        }

        return await this.beginParse(miHoYoWiki, miHoYoWikiID);
    }

    async beginParse(wiki, wikiId, printData = false) {
        const result = await fetch('/api/plugins/hoyoverse/silver-wolf', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({ miHoYoWiki: wiki, miHoYoWikiID: wikiId }),
        });

        if (!result.ok) {
            const error = await result.text();
            throw new Error(error);
        }

        const data = await result.json();
        const dataContent = data[0].content;

        let combinedContent = '';
        combinedContent += `Name: ${data[0].name}\n`;

        if (dataContent.description !== '') {
            combinedContent += `Description: ${dataContent.description}\n\n`;
        }

        if (dataContent.modules != []) {
            for (const moduleData of dataContent.modules) {
                if (moduleData.data.length === 0) {
                    continue;
                }
                combinedContent += `${moduleData.name}\n`;
                combinedContent += this.parseOutput(moduleData.data);
                combinedContent += '\n';
            }
        }

        if (printData) {
            return combinedContent;
        }

        const fileName = data[0].name;
        const file = new File([combinedContent], `${fileName}.txt`, { type: 'text/plain' });
        return [file];
    }
}

const PARSER_LIST = [new MiHoYoScraper()];
let initialized = false;

export function init() {
    if (initialized) return;
    initialized = true;

    jQuery(async () => {
        for (const parser of PARSER_LIST) {
            console.log(`[${MODULE_NAME}] Registering ${parser.name} scraper`);
            try {
                ScraperManager.registerDataBankScraper(parser);
                console.log(`[${MODULE_NAME}] Registered ${parser.name} scraper`);
            } catch (error) {
                console.error(`[${MODULE_NAME}] Failed to register ${parser.name} scraper`, error);
            }
        }
    });
}
