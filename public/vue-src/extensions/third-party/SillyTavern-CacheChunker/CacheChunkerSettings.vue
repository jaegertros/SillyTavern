<template>
    <div class="cache_chunker_settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>Cache Chunker</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <div class="flex-container flexFlowColumn">
                    <label class="checkbox_label" for="cache_chunker_enabled" title="Enable Cache Chunker">
                        <input
                            id="cache_chunker_enabled"
                            :checked="localSettings.enabled"
                            type="checkbox"
                            @input="onEnabledInput"
                        />
                        <span>Enabled</span>
                    </label>
                </div>
                <div class="flex-container flexFlowColumn">
                    <label for="cache_chunker_chunk_size">
                        Chunk Size
                    </label>
                    <input
                        id="cache_chunker_chunk_size"
                        :value="localSettings.chunkSize"
                        type="number"
                        class="text_pole widthUnset"
                        min="1"
                        max="99999"
                        @change="onChunkSizeChange"
                    />
                </div>

                <div class="flex-container flexFlowColumn">
                    <label for="cache_chunker_max_message_history_context">
                        Max Message History Context
                    </label>
                    <input
                        id="cache_chunker_max_message_history_context"
                        :value="localSettings.maxMessageHistoryContext"
                        type="number"
                        class="text_pole widthUnset"
                        min="1"
                        max="99999"
                        @change="onMaxMessageHistoryContextChange"
                    />
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
    chunkSize: Number(props.settings.chunkSize),
    maxMessageHistoryContext: Number(props.settings.maxMessageHistoryContext),
});

watch(() => props.settings, (nextSettings) => {
    if (!nextSettings) return;

    localSettings.enabled = Boolean(nextSettings.enabled);
    localSettings.chunkSize = Number(nextSettings.chunkSize);
    localSettings.maxMessageHistoryContext = Number(nextSettings.maxMessageHistoryContext);
}, { deep: true });

function emitChange() {
    emit('settings-change', {
        enabled: localSettings.enabled,
        chunkSize: localSettings.chunkSize,
        maxMessageHistoryContext: localSettings.maxMessageHistoryContext,
    });
}

function onEnabledInput(event) {
    localSettings.enabled = Boolean(event.target?.checked);
    emitChange();
}

function onChunkSizeChange(event) {
    const value = Number(event.target?.value);
    localSettings.chunkSize = Number.isFinite(value) && value > 0 ? value : 1;
    emitChange();
}

function onMaxMessageHistoryContextChange(event) {
    const value = Number(event.target?.value);
    localSettings.maxMessageHistoryContext = Number.isFinite(value) && value > 0 ? value : 1;
    emitChange();
}
</script>
