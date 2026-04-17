# Vue 3 Migration - Phase 1: Infrastructure + Token Counter PoC

## Context

SillyTavern's frontend is a 12,330-line monolithic vanilla JS + jQuery application. The goal is to incrementally migrate to Vue 3 without breaking existing functionality. Phase 1 establishes the build infrastructure and proves the approach by converting the Token Counter extension (119 lines, simplest extension) to Vue 3.

**Key constraint:** Vue must coexist with existing jQuery code. No breaking changes. The existing extension manifest system stays unchanged.

---

## Step 1: Install Dependencies

Add Vue 3 and Vite to `package.json`:

```bash
npm install vue@^3
npm install --save-dev vite @vitejs/plugin-vue
```

**Files modified:** `package.json`, `package-lock.json`

---

## Step 2: Create Vite Config

Create `vite.config.js` at project root. Vite compiles `.vue` SFC files into ES modules output to `public/vue-dist/`.

**Key design decisions:**
- **Library mode** - outputs ES modules, not a full app bundle
- **Vue is bundled into the output** (not externalized) since it's not in the existing lib.js
- **All imports to existing ST modules are externalized** - they resolve at browser runtime via the existing ES module graph served by express.static
- **Directory mirroring** - `public/vue-src/extensions/token-counter/` compiles to `public/vue-dist/extensions/token-counter/` so relative import paths to `../../scripts/*.js` stay valid

**New file:** `vite.config.js`

---

## Step 3: Create Vue Source Directory Structure

```
public/vue-src/
  composables/
    useSTContext.js       # Bridge: wraps getContext() and main_api for Vue
    useSTEvent.js         # Bridge: wraps eventSource with auto-cleanup on unmount
  extensions/
    token-counter/
      TokenCounterButton.vue   # Wand menu button
      TokenCounterPopup.vue    # Popup content (textarea, results, chunks)
      index.js                 # Entry point - mounts both components
```

**Output (gitignored):**
```
public/vue-dist/
  extensions/
    token-counter/
      index.js            # Compiled ES module (Vue bundled in, ST imports external)
```

---

## Step 4: Build the Composables (State Bridge)

### `public/vue-src/composables/useSTContext.js`

Thin wrapper that re-exports `getContext` and `main_api` so Vue components don't need to know ST import paths. Also provides a reactive ref that updates on relevant events.

```js
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
```

### `public/vue-src/composables/useSTEvent.js`

Wraps `eventSource.on()` with Vue's `onMounted`/`onUnmounted` lifecycle for automatic listener cleanup. Prevents memory leaks when Vue components are destroyed.

```js
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
```

These composables are bundled INTO the Vite output (they're small and Vue-specific). The ST imports they reference (`../../../script.js`, `../../../scripts/extensions.js`) are externalized.

---

## Step 5: Build the Vue Components

### `TokenCounterButton.vue`

Replaces the jQuery button creation (`$('#token_counter_wand_container').append(buttonHtml)`). Simple template with click handler that calls the popup.

```vue
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
```

### `TokenCounterPopup.vue`

Replaces `window.html` template + jQuery event handlers. Contains:
- Textarea with `v-model` and debounced watcher for token counting
- Reactive token count display
- Tokenized chunks display with color-coded `<code>` elements
- Token IDs display
- All the logic currently in `doTokenCounter()` and `drawChunks()`

```vue
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
```

---

## Step 6: Create the Vue Extension Entry Point

### `public/vue-src/extensions/token-counter/index.js`

This is the Vite entry point. It:
1. Imports `createApp` from Vue
2. Imports the two Vue components
3. Exports an `init()` function that:
   - Creates a Vue app for the button and mounts it to `#token_counter_wand_container`
   - Registers the `/count` slash command (same as current)

For the popup: when button is clicked, creates a detached `<div>`, mounts `TokenCounterPopup` as a sub-app into it, wraps in `$()`, passes to `callGenericPopup()`. On popup close, unmounts the sub-app.

```js
import { createApp } from 'vue';
import TokenCounterButton from './TokenCounterButton.vue';
import TokenCounterPopup from './TokenCounterPopup.vue';
import { getContext } from '../../../scripts/extensions.js';
import { getTokenCountAsync } from '../../../scripts/tokenizers.js';
import { POPUP_TYPE, callGenericPopup } from '../../../scripts/popup.js';
import { SlashCommand } from '../../../scripts/slash-commands/SlashCommand.js';
import { SlashCommandParser } from '../../../scripts/slash-commands/SlashCommandParser.js';

function openPopup() {
    const container = document.createElement('div');
    const popupApp = createApp(TokenCounterPopup);
    popupApp.mount(container);

    callGenericPopup($(container), POPUP_TYPE.TEXT, '', {
        wide: true, large: true, allowVerticalScrolling: true,
    }).finally(() => {
        popupApp.unmount();
    });
}

async function doCount() {
    const context = getContext();
    const messages = context.chat.filter(x => x.mes && !x.is_system).map(x => x.mes);
    const allMessages = messages.join(' ');
    const count = await getTokenCountAsync(allMessages);
    toastr.success(`Token count: ${count}`);
    return count;
}

export function init() {
    const buttonApp = createApp(TokenCounterButton, {
        onOpen: () => openPopup(),
    });
    buttonApp.mount('#token_counter_wand_container');

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'count',
        callback: async () => String(await doCount()),
        returns: 'number of tokens',
        helpString: 'Counts the number of tokens in the current chat.',
    }));
}
```

---

## Step 7: Rewire the Extension's index.js

Replace `public/scripts/extensions/token-counter/index.js` to become a thin loader:

```js
import { init } from '../../../vue-dist/extensions/token-counter/index.js';
init();
```

The manifest.json stays **completely unchanged** - it still points to `index.js`, and the extension loader still injects it as a `<script type="module">`. The only difference is what that module does internally.

---

## Step 8: Add Build Scripts to package.json

```json
{
  "scripts": {
        "vue:build": "vite build --config vite.config.js",
        "vue:watch": "vite build --config vite.config.js --watch"
  }
}
```

These scripts are used for Vue extension development builds. `vue:build` performs a one-shot compile and `vue:watch` keeps rebuilding while source files change.

---

## Step 9: Add vue-dist to .gitignore

Add `public/vue-dist/` to `.gitignore` (compiled output, regenerated from source).

---

## Step 10: Update CLAUDE.md

Document the new Vue architecture, build commands, and how to create new Vue extensions.

---

## File Summary

| Action | File |
|--------|------|
| **Modify** | `package.json` - add vue, vite, @vitejs/plugin-vue; update postinstall |
| **Create** | `vite.config.js` - Vite build config (library mode, externals) |
| **Create** | `public/vue-src/composables/useSTContext.js` - context bridge |
| **Create** | `public/vue-src/composables/useSTEvent.js` - event bridge |
| **Create** | `public/vue-src/extensions/token-counter/index.js` - entry point |
| **Create** | `public/vue-src/extensions/token-counter/TokenCounterButton.vue` - button SFC |
| **Create** | `public/vue-src/extensions/token-counter/TokenCounterPopup.vue` - popup SFC |
| **Modify** | `public/scripts/extensions/token-counter/index.js` - rewire to load from vue-dist |
| **Modify** | `.gitignore` (or create) - add public/vue-dist/ |
| **Modify** | `CLAUDE.md` - document Vue setup |

**Files NOT modified:**
- `public/scripts/extensions/token-counter/manifest.json` - stays the same
- `public/scripts/extensions/token-counter/style.css` - can be removed (moved into SFC `<style scoped>`)
- `public/scripts/extensions/token-counter/window.html` - can be removed (replaced by Vue template)
- `webpack.config.js` - untouched
- `src/server-main.js` - untouched
- `public/scripts/extensions.js` - untouched
- `public/index.html` - untouched

---

## Vite Configuration (vite.config.js)

```js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

export default defineConfig({
    plugins: [vue()],
    build: {
        outDir: 'public/vue-dist',
        emptyDirFirst: true,
        lib: {
            entry: {
                'extensions/token-counter/index': 'public/vue-src/extensions/token-counter/index.js',
            },
            formats: ['es'],
        },
        rollupOptions: {
            // Externalize all imports to existing SillyTavern modules.
            // These resolve at browser runtime via express.static.
            external: (id) => {
                // Bundle Vue and .vue files
                if (id === 'vue' || id.endsWith('.vue')) return false;
                // Bundle composables (they're small and Vue-specific)
                if (id.includes('/composables/')) return false;
                // Externalize everything else (ST core modules)
                if (id.startsWith('.') || id.startsWith('/')) return true;
                return false;
            },
            output: {
                // Preserve directory structure in output
                entryFileNames: '[name].js',
                chunkFileNames: 'chunks/[name]-[hash].js',
            },
        },
    },
    resolve: {
        alias: {
            '@st': path.resolve(__dirname, 'public'),
        },
    },
});
```

---

## Architecture Diagram

```
CURRENT FLOW (jQuery):
  Extension Loader → injects <script type="module" src="extensions/token-counter/index.js">
  index.js → jQuery DOM manipulation → button + popup

NEW FLOW (Vue 3):
  Extension Loader → injects <script type="module" src="extensions/token-counter/index.js">
  index.js → import from vue-dist/extensions/token-counter/index.js
  vue-dist → compiled from vue-src by Vite (Vue bundled in, ST imports external)
  compiled index.js → createApp(Button).mount('#container') + createApp(Popup).mount(detached div)

BUILD PIPELINE:
  public/vue-src/**/*.vue  ──→  Vite build  ──→  public/vue-dist/**/*.js
  (source SFCs)                (library mode)     (ES modules, served by express.static)
```

---

## Verification

1. **Build:** `npm run vue:build` succeeds, creates `public/vue-dist/extensions/token-counter/index.js` and `public/vue-dist/extensions/chat-portraits/index.js`
2. **Start:** `npm start` works normally, no errors in console
3. **Token Counter button:** Appears in the wand menu (extensions magic wand icon), looks identical to before
4. **Token Counter popup:** Click button, popup opens, type text, see token count update with debounce, see colored chunks, see token IDs
5. **Slash command:** `/count` still works, returns token count of current chat
6. **No regressions:** All other extensions still load and function normally
7. **Import check:** Browser dev tools Network tab shows `vue-dist/extensions/token-counter/index.js` loaded as ES module, and its imports to `scripts/tokenizers.js`, `scripts/popup.js` etc resolve correctly

---

## Future Phases (Out of Scope for Phase 1)

- **Phase 2:** Migrate 2-3 more extensions (Translate, Caption). Add Vite HMR middleware to Express for dev workflow.
- **Phase 3:** Add Pinia for state management. Begin migrating core UI panels (settings, character editor).
- **Phase 4:** Migrate `script.js` God Object - break into Vue-managed domain modules.
- **Phase 5:** TypeScript migration of backend (`src/`) files.
