import { ref, onMounted, onUnmounted } from 'vue';
import { main_api } from '../../../script.js';
import { getContext } from '../../../scripts/extensions.js';
import { eventSource, event_types } from '../../../scripts/events.js';

export function useSTContext() {
    const currentApi = ref(main_api);

    const updateApi = () => {
        currentApi.value = main_api;
    };

    onMounted(() => {
        eventSource.on(event_types.SETTINGS_UPDATED, updateApi);
    });

    onUnmounted(() => {
        eventSource.removeListener(event_types.SETTINGS_UPDATED, updateApi);
    });

    return {
        getContext,
        currentApi,
    };
}
