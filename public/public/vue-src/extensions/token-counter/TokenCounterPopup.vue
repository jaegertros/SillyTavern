<template>
    <div class="wide100p">
        <h3>{{ t`Token Counter` }}</h3>
        <div class="justifyLeft flex-container flexFlowColumn">
            <h4>{{ t`Type / paste in the box below to see the number of tokens in the text.` }}</h4>
            <p><span>{{ t`Selected tokenizer:` }}</span> {{ tokenizerName }}</p>
            <div>{{ t`Input:` }}</div>
            <textarea
                v-model="inputText"
                class="wide100p textarea_compact"
                rows="1"
            ></textarea>
            <div><span>{{ t`Tokens:` }}</span> <span>{{ tokenCount }}</span></div>
            <hr>
            <div>{{ t`Tokenized text:` }}</div>
            <div class="wide100p">
                <template v-if="chunks.length > 0">
                    <template v-for="(chunk, i) in chunks" :key="i">
                        <br v-if="chunk.text === '\n'">
                        <code
                            v-else
                            :style="{ backgroundColor: chunk.color }"
                            :title="String(chunk.id)"
                        >{{ chunk.text }}</code>
                    </template>
                </template>
                <template v-else>&mdash;</template>
            </div>
            <hr>
            <div>{{ t`Token IDs:` }}</div>
            <textarea class="wide100p textarea_compact" readonly rows="1">{{ tokenIds }}</textarea>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { main_api } from '../../../script.js';
import { getFriendlyTokenizerName, getTextTokens, getTokenCountAsync, tokenizers } from '../../../scripts/tokenizers.js';
import { debounce } from '../../../scripts/utils.js';
import { debounce_timeout } from '../../../scripts/constants.js';
import { t } from '../../../scripts/i18n.js';

const { tokenizerName, tokenizerId } = getFriendlyTokenizerName(main_api);

const inputText = ref('');
const tokenCount = ref(0);
const tokenIds = ref('\u2014');
const chunks = ref([]);

const pastelRainbow = ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BFFFBF', '#BAE1FF', '#FFBAF3'];

const countTokens = debounce(async () => {
    const text = inputText.value;
    if (!text) {
        tokenCount.value = 0;
        tokenIds.value = '\u2014';
        chunks.value = [];
        return;
    }

    const ids = main_api === 'openai'
        ? getTextTokens(tokenizers.OPENAI, text)
        : getTextTokens(tokenizerId, text);

    if (Array.isArray(ids) && ids.length > 0) {
        tokenIds.value = `[${ids.join(', ')}]`;
        tokenCount.value = ids.length;

        if (Object.hasOwnProperty.call(ids, 'chunks')) {
            const rawChunks = Object.getOwnPropertyDescriptor(ids, 'chunks').value;
            chunks.value = rawChunks.map((chunk, i) => {
                let text = chunk.replace(/[\u2581\u0120]/g, ' ');
                if (/^<0x[0-9A-F]+>$/i.test(text)) {
                    text = String.fromCodePoint(parseInt(text.substring(3, text.length - 1), 16));
                }
                return { text, color: pastelRainbow[i % pastelRainbow.length], id: ids[i] };
            });
        }
    } else {
        const count = await getTokenCountAsync(text);
        tokenIds.value = '\u2014';
        tokenCount.value = count;
        chunks.value = [];
    }
}, debounce_timeout.relaxed);

watch(inputText, () => countTokens());
</script>

<style scoped>
code {
    color: black;
    text-shadow: none;
    padding: 2px;
    display: inline-block;
}
</style>
