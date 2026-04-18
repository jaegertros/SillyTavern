<template>
    <div class="flexFlowColumn flex-container">
        <div class="range-block-title">
            <h3>miHoYo/HoYoverse HoYoLAB Scraper</h3>
        </div>
        <h4>Select a Wiki to parse through.</h4>
        <div class="range-block-range wide100p">
            <select v-model="localWiki" class="wide100p">
                <option value="">--- None ---</option>
                <option value="hsr">Honkai: Star Rail (H:SR)</option>
                <option value="genshin">Genshin Impact (GI)</option>
            </select>
        </div>
        <div class="range-block-title">
            <h4>
                <span>Enter the Wiki Page ID.</span>
            </h4>
        </div>
        <div class="range-block-counter justifyCenter flex-container flexFlowColumn margin-bot-10px">
            <span>This is the last digit in the HoYoLAB URL i.e.</span>
            <code>https://wiki.hoyolab.com/pc/hsr/entry/X</code>
            <small>
                <span>Example:</span>
                <code>14</code>
            </small>
        </div>
        <input v-model="localWikiId" type="text" class="text_pole" placeholder="14">
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
    wiki: {
        type: String,
        default: '',
    },
    wikiId: {
        type: String,
        default: '',
    },
});

const emit = defineEmits(['update:wiki', 'update:wikiId']);

const localWiki = ref(props.wiki);
const localWikiId = ref(props.wikiId);

watch(() => props.wiki, (value) => {
    localWiki.value = value ?? '';
});

watch(() => props.wikiId, (value) => {
    localWikiId.value = value ?? '';
});

watch(localWiki, (value) => {
    emit('update:wiki', String(value ?? ''));
});

watch(localWikiId, (value) => {
    emit('update:wikiId', String(value ?? ''));
});
</script>
