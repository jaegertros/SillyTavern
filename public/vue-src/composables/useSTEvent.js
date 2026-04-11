import { onMounted, onUnmounted } from 'vue';
import { eventSource } from '../../../scripts/events.js';

export function useSTEvent(eventName, handler) {
    onMounted(() => {
        eventSource.on(eventName, handler);
    });

    onUnmounted(() => {
        eventSource.removeListener(eventName, handler);
    });
}
