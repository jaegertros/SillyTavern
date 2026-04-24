<template>
    <div class="chat-portraits-settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>Chat Portraits</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <label class="checkbox_label" title="Show character and persona portraits to the left of the chat.">
                    <input v-model="localSettings.enabled" type="checkbox" @change="emitChange" />
                    <span>Enable Chat Portraits</span>
                </label>
                <label class="checkbox_label" title="Show your persona portrait at the top.">
                    <input v-model="localSettings.showPersona" type="checkbox" @change="emitChange" />
                    <span>Show Persona</span>
                </label>
                <label class="checkbox_label" title="In group chats, show all active members (not just the last speaker).">
                    <input v-model="localSettings.showAllGroup" type="checkbox" @change="emitChange" />
                    <span>Show All Group Members</span>
                </label>
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
    showPersona: Boolean(props.settings.showPersona),
    showAllGroup: Boolean(props.settings.showAllGroup),
});

watch(() => props.settings, (nextSettings) => {
    if (!nextSettings) return;
    localSettings.enabled = Boolean(nextSettings.enabled);
    localSettings.showPersona = Boolean(nextSettings.showPersona);
    localSettings.showAllGroup = Boolean(nextSettings.showAllGroup);
}, { deep: true });

function emitChange() {
    emit('settings-change', {
        enabled: localSettings.enabled,
        showPersona: localSettings.showPersona,
        showAllGroup: localSettings.showAllGroup,
    });
}
</script>
