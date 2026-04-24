<script setup>
import { reactive } from 'vue';

const props = defineProps({
    group: { type: Boolean, default: true },
    order: { type: Boolean, default: true },
    mes: { type: Boolean, default: true },
});

const ui = reactive({
    panelActive: false,
    configActive: false,
    mode: 'message',
    message: '?',
    groups: [],
});

function togglePanel() {
    ui.panelActive = !ui.panelActive;
}

function toggleConfig() {
    ui.configActive = !ui.configActive;
}

function setPanelMessage(message) {
    ui.mode = 'message';
    ui.message = message;
}

function setPanelRows(groups) {
    ui.mode = 'rows';
    ui.groups = groups;
}

defineExpose({
    setPanelMessage,
    setPanelRows,
});
</script>

<template>
    <div id="stwii-root">
        <div
            id="stwii-trigger"
            class="stwii--trigger fa-solid fa-fw fa-book-atlas"
            title="Active WI\n---\nright click for options"
            @click="togglePanel"
            @contextmenu.prevent="toggleConfig"
        ></div>

        <div id="stwii-panel" class="stwii--panel" :class="{ 'stwii--isActive': ui.panelActive }">
            <template v-if="ui.mode === 'message'">
                {{ ui.message }}
            </template>
            <template v-else>
                <template v-for="group in ui.groups" :key="group.world">
                    <div class="stwii--world">{{ group.world }}</div>
                    <div
                        v-for="entry in group.entries"
                        :key="entry.id"
                        class="stwii--entry"
                        :class="{ 'stwii--messages': entry.type === 'mes', 'stwii--note': entry.type === 'note', 'stwii--isBroken': entry.isBroken }"
                        :title="entry.tooltip"
                    >
                        <div
                            class="stwii--strategy"
                            :class="entry.strategyClasses"
                            :data-stwii--count="entry.count"
                        >
                            {{ entry.strategyText }}
                        </div>

                        <div class="stwii--title">
                            <template v-if="entry.type === 'mes'">
                                <div class="stwii--first">{{ entry.first }}</div>
                                <template v-if="entry.last">
                                    <div class="stwii--sep">...</div>
                                    <div class="stwii--last">{{ entry.last }}</div>
                                </template>
                            </template>
                            <template v-else>
                                {{ entry.titleText }}
                            </template>
                        </div>

                        <div class="stwii--sticky" :title="entry.stickyTitle">{{ entry.stickyText }}</div>
                    </div>
                </template>
            </template>
        </div>

        <div id="stwii-config-panel" class="stwii--panel" :class="{ 'stwii--isActive': ui.configActive }">
            <label class="stwii--configRow" title="Group entries by World Info book">
                <input id="stwii-config-group" type="checkbox" :checked="props.group">
                <div>Group by book</div>
            </label>

            <label class="stwii--configRow" title="Show in insertion depth / order instead of alphabetically">
                <input id="stwii-config-order" type="checkbox" :checked="props.order">
                <div>Show in order</div>
            </label>

            <label class="stwii--configRow" title="Indicate message history (only when ungrouped and shown in order)">
                <input id="stwii-config-mes" type="checkbox" :checked="props.mes">
                <div>Show messages</div>
            </label>
        </div>
    </div>
</template>
