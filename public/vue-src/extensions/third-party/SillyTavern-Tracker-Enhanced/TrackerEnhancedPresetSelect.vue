<script setup>
defineProps({
    state: {
        type: Object,
        required: true,
    },
});
</script>

<template>
    <select id="tracker_enhanced_preset_select" class="text_pole" v-model="state.selectedPreset">
        <option v-for="option in state.options" :key="option.value" :value="option.value">
            {{ option.label }}
        </option>
    </select>
</template>
