# SillyTavern - Project Guide

## What This Is

SillyTavern (v1.16.0) is a self-hosted LLM frontend for power users. It provides a rich chat UI that connects to 25+ AI backends (OpenAI, Claude, Gemini, Mistral, NovelAI, local models, etc.) with features like character cards, world info, group chats, extensions, and prompt management.

- **License:** AGPL-3.0
- **Runtime:** Node.js >= 22 (also supports Deno, Bun, Electron)
- **Module system:** ES Modules (`"type": "module"`)
- **Framework:** Express.js backend, vanilla JS + jQuery frontend
- **Data storage:** File-based (no SQL database) - JSON, JSONL, PNG-embedded cards

## Commands

```bash
npm start              # Start server (node server.js)
npm run debug          # Start with --inspect
npm run start:electron # Desktop Electron app
npm run lint           # ESLint check
npm run lint:fix       # ESLint auto-fix
npm run plugins:update # Update plugins
npm run plugins:install # Install plugins
npm run vue:build      # Compile Vue SFCs to public/vue-dist/
npm run vue:watch      # Watch mode for Vue development (fast rebuilds)
```

## Companion Documents

- **[DISPLAY_SYSTEM.md](DISPLAY_SYSTEM.md)** — Drawer/panel/overlay architecture, z-index hierarchy, popup system, extension UI safety rules. Read this before touching any UI layering.
- **[ST-DIRECTOR.md](ST-DIRECTOR.md)** — Change log for the Director (AI) group reply strategy extension.
- **[VUE3_MIGRATION_PLAN.md](VUE3_MIGRATION_PLAN.md)** — Phase 1 Vue 3 migration plan and composable bridge design.
- **[DEPENDENCY_AUDIT.md](DEPENDENCY_AUDIT.md)** — Full dependency audit with upgrade risk analysis.

## Project Structure

```
server.js                  # Entry point - parses CLI args, imports server-main
src/
  server-main.js           # Express app setup, middleware chain, static serving
  server-startup.js        # HTTP/HTTPS listener, registers all 44 endpoint routers
  users.js          (1083) # User accounts, auth, session, directory management
  util.js           (1569) # Utility functions, config, caching, file ops
  prompt-converters.js (1421) # Converts unified message format to provider-specific formats
  constants.js             # Global constants and enums
  command-line.js          # CLI argument parsing (yargs)
  plugin-loader.js         # Dynamic server-side plugin loading
  charx.js / byaf.js       # Character card format parsers
  endpoints/               # Express routers (44 files) - one per feature area
    backends/
      chat-completions.js (2675) # THE core LLM router - handles 25+ providers
      text-completions.js  (649) # Text generation completions
      kobold.js            (281) # KoboldAI backend
    characters.js    (1547) # Character CRUD, card parsing, sprite management
    chats.js         (1057) # Chat history, backups, integrity checking
    stable-diffusion.js (2028) # Image generation (SD, ComfyUI, etc.)
    tokenizers.js    (1128) # Token counting for multiple model families
    content-manager.js (1045) # Asset import/export
    openai.js         (843) # OpenAI-specific endpoints
    google.js         (641) # Google/Gemini endpoints
    data-maid.js      (816) # Data maintenance/cleanup
    vectors.js        (578) # Vector embeddings
    ... (30+ more endpoint files)
  middleware/              # Express middleware (9 files)
    basicAuth.js, whitelist.js, corsProxy.js, cacheBuster.js, etc.
  vectors/                 # Vector embedding backends (9 providers)
  tokenizers/              # Tokenizer model files

public/
  index.html        (8054) # Monolithic HTML template (all UI in one file)
  script.js        (12330) # Main frontend entry - THE God Object (see below)
  style.css                # Main stylesheet (imports 36+ component CSS files)
  scripts/                 # Frontend modules (~70 files)
    openai.js        (6895) # OpenAI chat UI, message management, streaming
    world-info.js    (6193) # World info system - parsing, activation, UI
    slash-commands.js (5890) # Slash command dispatcher + 50+ command handlers
    power-user.js    (4601) # Settings UI, tokenizer config, formatting rules
    utils.js         (2941) # Browser-side utility functions
    tags.js          (2772) # Tag system
    group-chats.js   (2496) # Group chat management
    chats.js         (2422) # Chat history UI
    variables.js     (2380) # Variable system (local/global scope)
    PromptManager.js (2146) # Prompt composition and token-aware ordering
    personas.js      (2070) # Persona/character selection
    textgen-settings.js (1846) # Text generation settings UI
    reasoning.js     (1518) # Chain-of-thought / reasoning features
    extensions.js    (1798) # Extension loading and lifecycle
    RossAscends-mods.js (1285) # UI modifications
    extensions/            # Client-side extensions (15 extension dirs)
      stable-diffusion/, vectors/, quick-reply/, tts/, regex/,
      expressions/, memory/, translate/, caption/, gallery/, etc.
    slash-commands/         # Slash command subsystem
    autocomplete/           # Autocomplete subsystem
    macros/                 # Macro system
  css/                     # 36 modular CSS files (well-organized)
  lib/                     # Third-party libraries (jQuery, Select2, etc.)
  locales/                 # i18n translation files

data/                      # Runtime data (per-user directories)
  {user}/characters/, chats/, settings.json, etc.
default/                   # Default config templates and scaffolding
tests/                     # Jest + Playwright tests
plugins/                   # Server-side plugin directory
```

(Line counts shown in parentheses for large files)

## Architecture Overview

### Backend (Express.js)

**Middleware chain** (in order):
1. Helmet (security headers), compression, response-time
2. Body parsers (JSON/URL-encoded, 500MB limit)
3. CORS (configurable via config.yaml)
4. Basic auth + IP whitelist (optional)
5. Access logging (optional)
6. Cookie-session + CSRF protection
7. User context injection
8. Static file serving
9. Login enforcement
10. Multer file uploads (500MB limit)

**Routing:** All 44 endpoint routers are registered in `server-startup.js:setupPrivateEndpoints()`. Each router is a separate file in `src/endpoints/`.

**LLM provider flow:**
1. Frontend sends unified request to `/api/backends/chat-completions`
2. `chat-completions.js` routes to provider-specific handler function
3. `prompt-converters.js` converts messages to provider format
4. Response streamed back via SSE or returned as JSON

**Data model:** All data is file-based. Per-user directories under `data/`. Characters stored as PNG cards (metadata embedded in PNG chunks) or JSON. Chats stored as JSONL. Settings as JSON.

### Frontend (Vanilla JS + jQuery)

The frontend is a single-page application loaded from `index.html`. Core logic lives in `public/script.js` which imports from `public/scripts/`. Uses jQuery for DOM manipulation, custom event system for state changes.

**Key patterns:**
- Global state in `script.js` with exported variables
- Event-driven communication via custom `eventSource` events
- Extension system with manifest-based loading
- Template-based UI (hidden DOM elements used as templates)

## Configuration

Primary config: `config.yaml` at project root. Controls:
- Server listen address/port, SSL/TLS
- IP whitelist, CORS, security settings
- User accounts (multi-user mode)
- Extension auto-update behavior
- Performance tuning (cache sizes, lazy loading)

## Key Technical Details

- **Auth:** Optional multi-user with scrypt-hashed passwords, cookie sessions, CSRF tokens. SSO support (Authelia/Authentik).
- **Character cards:** PNG-embedded metadata (Tavern Card format). Also supports CharX, BYAF, Risu formats.
- **Chat storage:** JSONL format with automatic throttled backups.
- **Tokenizers:** Tiktoken, SentencePiece, web-tokenizers for accurate token counting across model families.
- **Extensions:** Client-side JS modules with manifests. Server-side plugins (disabled by default). Git-based installation and updates.

## Code Style

- ES Modules throughout (import/export, not require)
- JSDoc for type annotations (strict checking via jsconfig.json)
- ESLint with separate configs for Node.js (src/) and browser (public/) code
- 4-space indentation, LF line endings, UTF-8
- jQuery used extensively in frontend (`$` is global)

## Testing

- **Unit tests:** Jest (`tests/jest.config.json`)
- **E2E tests:** Playwright (`tests/playwright.config.js`)
- Run: `npx jest` from `tests/` directory

---

## Vue 3 Architecture (Phase 1)

The frontend is being incrementally migrated to Vue 3 using Vite as the build tool. Vue coexists with the existing jQuery code — no breaking changes.

### Build Pipeline

```
public/vue-src/**/*.vue  ──→  Vite build (library mode)  ──→  public/vue-dist/**/*.js
(source SFCs)                                                   (ES modules, served by express.static)
```

`public/vue-dist/` is **gitignored** — it is regenerated from source by running `npm run vue:build`. The `postinstall` hook runs this automatically after `npm install`.

### Directory Layout

```
public/
  vue-src/                   # Vue source files (committed)
    composables/
      useSTContext.js        # Bridge: wraps getContext() and main_api for Vue
      useSTEvent.js          # Bridge: wraps eventSource with auto-cleanup on unmount
    extensions/
      token-counter/
        TokenCounterButton.vue
        TokenCounterPopup.vue
        index.js             # Vite entry point
  vue-dist/                  # Compiled output (gitignored, regenerated)
    extensions/
      token-counter/
        index.js             # Bundled ES module (Vue bundled in, ST imports external)
```

### Key Design Decisions

- **Library mode** — Vite outputs ES modules, not a full app bundle.
- **Vue is bundled into the output** — it is not in the existing `lib.js`.
- **All ST module imports are externalized** — they resolve at browser runtime via `express.static`.
- **Directory mirroring** — `vue-src/extensions/token-counter/` compiles to `vue-dist/extensions/token-counter/` so relative import paths like `../../scripts/*.js` stay valid at runtime.
- **Extension manifests unchanged** — `manifest.json` still points to `scripts/extensions/token-counter/index.js`. That file is now a thin loader that calls `init()` from the compiled Vue bundle.

### How to Create a New Vue Extension

1. Add source files under `public/vue-src/extensions/<name>/`.
2. Create an `index.js` entry point that exports `init()`.
3. Add the entry to `vite.config.js` under `build.lib.entry`.
4. Replace (or create) `public/scripts/extensions/<name>/index.js` with a two-line loader:
   ```js
   import { init } from '../../../vue-dist/extensions/<name>/index.js';
   init();
   ```
5. Run `npm run vue:build` (or `npm run vue:watch` during development).

### Composables

- **`useSTContext`** — provides `getContext` and a reactive `currentApi` ref that updates when `SETTINGS_UPDATED` fires. Use instead of importing `main_api` and `getContext` directly.
- **`useSTEvent`** — wraps `eventSource.on()` with Vue's `onMounted`/`onUnmounted` lifecycle for automatic listener cleanup.

---

## Large Files That Should Be Modularized

These files are excessively large and mix multiple concerns. They are the primary candidates for refactoring into smaller, focused modules.

### Critical (Frontend)

| File | Lines | Problem | Suggested Split |
|------|-------|---------|-----------------|
| `public/script.js` | 12,330 | **God Object.** Chat rendering, character management, group chat coordination, API dispatch, generation control, settings persistence, message formatting, extension lifecycle, avatar management - all in one file. | `chat-engine.js`, `character-manager.js`, `generation-controller.js`, `settings-manager.js`, `message-renderer.js` |
| `public/scripts/openai.js` | 6,895 | Mixes OpenAI API integration, Message/MessageCollection classes, token counting, preset management, tool calling, streaming. | Extract `message-classes.js`, `preset-manager.js`, `tool-calling.js` |
| `public/scripts/world-info.js` | 6,193 | Combines entry parsing, activation/matching engine, recursive depth handling, and full UI editor. | `world-info-engine.js` (logic) + `world-info-ui.js` (DOM/editor) |
| `public/scripts/slash-commands.js` | 5,890 | Dispatcher + 50+ individual command implementations all in one file. | Move command handlers to individual files in `slash-commands/` directory |
| `public/scripts/power-user.js` | 4,601 | Mixes UI preferences, tokenizer selection, chat formatting rules, debug utilities, style pinning. | `ui-settings.js`, `tokenizer-config.js`, `chat-formatting.js` |
| `public/index.html` | 8,054 | All UI templates, panels, and controls in a single HTML file. 1000+ element IDs. | Extract component templates to separate HTML template files |

### Critical (Backend)

| File | Lines | Problem | Suggested Split |
|------|-------|---------|-----------------|
| `src/endpoints/backends/chat-completions.js` | 2,675 | Handles ALL 25+ LLM providers in one file. Massive switch/if chains for provider-specific request building, message conversion, streaming, and tool calling. | Extract per-provider modules: `providers/openai.js`, `providers/claude.js`, `providers/google.js`, etc. |
| `src/endpoints/stable-diffusion.js` | 2,028 | Image generation for multiple backends (SD, ComfyUI, etc.) with workflow management, API calls, and image processing mixed together. | Split by backend + extract image processing utilities |
| `src/util.js` | 1,569 | Kitchen-sink utility file: config management, file ops, formatting, caching (MemoryLimitedMap), image processing, logging. | `config.js`, `file-utils.js`, `cache.js`, `image-utils.js` |
| `src/prompt-converters.js` | 1,421 | Prompt conversion for all LLM formats with Claude caching logic and message merging interleaved. | Split by provider: `converters/claude.js`, `converters/google.js`, etc. |
| `src/endpoints/characters.js` | 1,547 | Mixes DiskCache class, multiple card format parsers, sprite management, avatar processing. | Extract `disk-cache.js`, move format parsers to their own modules |
| `src/users.js` | 1,083 | User auth, directory management, session handling, and avatar management all combined. | Separate auth logic from directory/file structure management |
| `src/endpoints/tokenizers.js` | 1,128 | Tokenizer initialization, model loading, and endpoint logic in one file. | Extract tokenizer initialization/loading into service module |
| `src/endpoints/chats.js` | 1,057 | Chat CRUD + backup system + integrity checking + export/import. | Extract `chat-backups.js`, `chat-integrity.js` |
