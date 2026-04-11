<template>
    <div id="token_counter" class="list-group-item flex-container flexGap5" @click="$emit('open')">
        <div class="fa-solid fa-1 extensionsMenuExtensionButton"></div>
        {{ t`Token Counter` }}
    </div>
</template>

<script setup>
import { t } from '../../../scripts/i18n.js';

defineEmits(['open']);
</script>
