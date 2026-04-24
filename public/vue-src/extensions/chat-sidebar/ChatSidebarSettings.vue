<template>
    <div class="chat-sidebar-settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>Chat Sidebar</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <label class="checkbox_label" title="Show a Discord-style chat sidebar on the left edge.">
                    <input v-model="localSettings.enabled" type="checkbox" @change="emitChange" />
                    <span>Enable Chat Sidebar</span>
                </label>

                <label class="checkbox_label" title="Show green online-style dot on every avatar.">
                    <input v-model="localSettings.showDots" type="checkbox" @change="emitChange" />
                    <span>Show Online Dots</span>
                </label>

                <label class="checkbox_label" title="Show favorited characters/groups at the top of the list.">
                    <input v-model="localSettings.favsFirst" type="checkbox" @change="emitChange" />
                    <span>Favorites First</span>
                </label>

                <div class="flex-container flexGap5">
                    <div class="flex1">
                        <label for="csb_max_items_vue">Max visible items (0 = all)</label>
                        <input
                            id="csb_max_items_vue"
                            v-model.number="localSettings.maxItems"
                            type="number"
                            class="text_pole"
                            min="0"
                            max="200"
                            @input="emitChange"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, watch } from 'vue';

const props = defineProps({
    settings: {
        type: Object,
        required: true,
    },
});

const emit = defineEmits(['settings-change']);

const localSettings = reactive({
    enabled: Boolean(props.settings.enabled),
    showDots: Boolean(props.settings.showDots),
    favsFirst: Boolean(props.settings.favsFirst),
    maxItems: Number(props.settings.maxItems) || 0,
});

watch(() => props.settings, (nextSettings) => {
    if (!nextSettings) return;
    localSettings.enabled = Boolean(nextSettings.enabled);
    localSettings.showDots = Boolean(nextSettings.showDots);
    localSettings.favsFirst = Boolean(nextSettings.favsFirst);
    localSettings.maxItems = Number(nextSettings.maxItems) || 0;
}, { deep: true });

function emitChange() {
    emit('settings-change', {
        enabled: localSettings.enabled,
        showDots: localSettings.showDots,
        favsFirst: localSettings.favsFirst,
        maxItems: Number(localSettings.maxItems) || 0,
    });
}
</script>
