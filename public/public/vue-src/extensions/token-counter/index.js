import { createApp } from 'vue';
import TokenCounterButton from './TokenCounterButton.vue';
import TokenCounterPopup from './TokenCounterPopup.vue';
import { getContext } from '../../../scripts/extensions.js';
import { getTokenCountAsync } from '../../../scripts/tokenizers.js';
import { POPUP_TYPE, callGenericPopup } from '../../../scripts/popup.js';
import { SlashCommand } from '../../../scripts/slash-commands/SlashCommand.js';
import { SlashCommandParser } from '../../../scripts/slash-commands/SlashCommandParser.js';

function openPopup() {
    const container = document.createElement('div');
    const popupApp = createApp(TokenCounterPopup);
    popupApp.mount(container);

    callGenericPopup($(container), POPUP_TYPE.TEXT, '', {
        wide: true, large: true, allowVerticalScrolling: true,
    }).finally(() => {
        popupApp.unmount();
    });
}

async function doCount() {
    const context = getContext();
    const messages = context.chat.filter(x => x.mes && !x.is_system).map(x => x.mes);
    const allMessages = messages.join(' ');
    const count = await getTokenCountAsync(allMessages);
    toastr.success(`Token count: ${count}`);
    return count;
}

export function init() {
    const buttonApp = createApp(TokenCounterButton, {
        onOpen: () => openPopup(),
    });
    buttonApp.mount('#token_counter_wand_container');

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'count',
        callback: async () => String(await doCount()),
        returns: 'number of tokens',
        helpString: 'Counts the number of tokens in the current chat.',
    }));
}
