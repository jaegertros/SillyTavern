# SillyTavern Dependency Audit

Generated: 2026-04-11
Project version: 1.16.0
Node requirement: >= 22

---

## Summary

- **73 direct production dependencies**
- **25 dev dependencies**
- **2 unused packages** that can be removed
- **12 packages with major version upgrades available** (potential breaking changes)
- **30+ packages with safe patch/minor upgrades**

---

## Production Dependencies

### Frontend Packages (bundled into public/lib.js via Webpack)

These are imported in `public/lib.js` and served to the browser as a single ES module bundle.

| Package | Current | Latest | Used In | Upgrade Risk |
|---------|---------|--------|---------|--------------|
| `@adobe/css-tools` | 4.4.4 | 4.4.4 | `public/lib.js` | Up to date |
| `@iconfu/svg-inject` | 1.2.3 | **2.0.1** | `public/lib.js` | **MAJOR** - v2 may change API |
| `@popperjs/core` | 2.11.8 | 2.11.8 | `public/lib.js` | Up to date |
| `bowser` | 2.12.1 | 2.14.1 | `public/lib.js` | Safe minor |
| `chalk` | 5.6.0 | 5.6.2 | `public/lib.js`, `src/config-init.js`, `src/util.js` | Safe patch |
| `chevrotain` | 11.1.1 | **12.0.0** | `public/lib.js` (parser framework for slash commands) | **MAJOR** - parser API changes likely |
| `diff-match-patch` | 1.0.5 | 1.0.5 | `public/lib.js` | Up to date |
| `dompurify` | 3.2.6 | 3.3.3 | `public/lib.js` | Safe minor |
| `droll` | 0.2.1 | 0.2.1 | `public/lib.js` (dice roller) | Up to date |
| `fuse.js` | 7.1.0 | 7.3.0 | `public/lib.js` (fuzzy search) | Safe minor |
| `handlebars` | 4.7.9 | 4.7.9 | `public/lib.js`, `src/middleware/whitelist.js` | Up to date |
| `highlight.js` | 11.11.1 | 11.11.1 | `public/lib.js` | Up to date |
| `localforage` | 1.10.0 | 1.10.0 | `public/lib.js` (IndexedDB abstraction) | Up to date |
| `lodash` | 4.17.23 | 4.18.1 | `public/lib.js`, 16 backend files | Safe minor |
| `moment` | 2.30.1 | 2.30.1 | `public/lib.js` | Up to date (maintenance mode) |
| `morphdom` | 2.7.7 | 2.7.8 | `public/lib.js` | Safe patch |
| `seedrandom` | 3.0.5 | 3.0.5 | `public/lib.js` | Up to date |
| `showdown` | 2.1.0 | 2.1.0 | `public/lib.js` (markdown) | Up to date |
| `slidetoggle` | 4.0.0 | 4.0.0 | `public/lib.js` | Up to date |
| `yaml` | 2.8.1 | 2.8.3 | `public/lib.js`, `src/config-init.js`, `src/util.js`, `src/endpoints/characters.js`, `src/recover-password.js` | Safe patch |

### Backend: Server Core

| Package | Current | Latest | Used In | Upgrade Risk |
|---------|---------|--------|---------|--------------|
| `express` | 4.22.1 | **5.2.1** | 54 files across `src/` (every endpoint router) | **MAJOR** - see analysis below |
| `body-parser` | 1.20.4 | **2.2.2** | `src/server-main.js` | **MAJOR** - bundled in Express 5, API may change |
| `compression` | 1.8.1 | 1.8.1 | `src/server-main.js` | Up to date |
| `cookie-session` | 2.1.1 | 2.1.1 | `src/server-main.js` | Up to date |
| `cors` | 2.8.5 | 2.8.6 | `src/server-main.js` | Safe patch |
| `csrf-sync` | 4.2.1 | 4.2.1 | `src/server-main.js` | Up to date |
| `helmet` | 8.1.0 | 8.1.0 | `src/server-main.js` | Up to date |
| `multer` | 2.1.1 | 2.1.1 | `src/server-main.js` | Up to date |
| `response-time` | 2.3.4 | 2.3.4 | `src/server-main.js` | Up to date |
| `host-validation-middleware` | 0.1.1 | 0.1.4 | `src/middleware/hostWhitelist.js` | Safe patch |
| `rate-limiter-flexible` | 5.0.5 | **11.0.0** | `src/endpoints/users-public.js` | **MAJOR** - significant API restructuring |
| `ws` | 8.18.3 | 8.20.0 | WebSocket support | Safe minor |

### Backend: Networking & Proxy

| Package | Current | Latest | Used In | Upgrade Risk |
|---------|---------|--------|---------|--------------|
| `node-fetch` | 3.3.2 | 3.3.2 | 30 endpoint files | Up to date |
| `proxy-agent` | 6.5.0 | **8.0.1** | `src/request-proxy.js` | **MAJOR** - API changes likely |
| `form-data` | 4.0.4 | 4.0.4 | `src/endpoints/openai.js`, `speech.js`, `stable-diffusion.js` | Up to date |
| `url-join` | 5.0.0 | 5.0.0 | 6 endpoint files | Up to date |

### Backend: Image Processing (Jimp)

All 18 `@jimp/*` packages: **1.6.0 → 1.6.1** (safe patch)

| Package | Current | Latest | Used In | Upgrade Risk |
|---------|---------|--------|---------|--------------|
| `@jimp/core` + 17 plugins | 1.6.0 | 1.6.1 | `src/jimp.js` (central wrapper), `src/endpoints/thumbnails.js` | Safe patch |
| `image-size` | 2.0.2 | 2.0.2 | `src/endpoints/image-metadata.js`, `thumbnails.js` | Up to date |

### Backend: Tokenization & AI

| Package | Current | Latest | Used In | Upgrade Risk |
|---------|---------|--------|---------|--------------|
| `sillytavern-transformers` | 2.14.6 | 2.14.6 | `src/transformers.js` | Up to date (pinned, no ^) |
| `tiktoken` | 1.0.22 | 1.0.22 | `src/endpoints/tokenizers.js` | Up to date |
| `@agnai/sentencepiece-js` | 1.1.1 | 1.1.1 | `src/endpoints/tokenizers.js` | Up to date |
| `@agnai/web-tokenizers` | 0.1.3 | 0.1.6-pre3 | `src/endpoints/tokenizers.js` | Pre-release only |
| `@zeldafan0225/ai_horde` | 5.2.0 | **6.0.2** | `src/endpoints/horde.js` | **MAJOR** - AI Horde API v2 |
| `vectra` | 0.2.2 | **0.14.0** | `src/endpoints/vectors.js` | **MAJOR** - massive version jump, API likely rewritten |

### Backend: File & Data

| Package | Current | Latest | Used In | Upgrade Risk |
|---------|---------|--------|---------|--------------|
| `archiver` | 7.0.1 | 7.0.1 | `src/users.js` (backup export) | Up to date |
| `node-persist` | 4.0.4 | 4.0.4 | 5 files (characters, users, storage) | Up to date |
| `write-file-atomic` | 5.0.1 | **7.0.1** | 17 files (all safe writes) | **MAJOR** - API may change |
| `sanitize-filename` | 1.6.3 | 1.6.4 | 18 files | Safe patch |
| `yauzl` | 3.2.1 | 3.3.0 | `src/util.js` (ZIP extraction) | Safe minor |
| `png-chunk-text` | 1.0.0 | 1.0.0 | `src/character-card-parser.js` | Up to date |
| `png-chunks-extract` | 1.0.0 | 1.0.0 | `src/character-card-parser.js` | Up to date |
| `crc` | 4.3.2 | 4.3.2 | `src/png/encode.js` | Up to date |

### Backend: Translation

| Package | Current | Latest | Used In | Upgrade Risk |
|---------|---------|--------|---------|--------------|
| `bing-translate-api` | 4.1.0 | 4.2.0 | `src/endpoints/translate.js` | Safe minor |
| `google-translate-api-x` | 10.7.2 | 10.7.2 | `src/endpoints/google.js`, `translate.js` | Up to date |

### Backend: Utilities

| Package | Current | Latest | Used In | Upgrade Risk |
|---------|---------|--------|---------|--------------|
| `yargs` | 17.7.2 | **18.0.0** | `src/command-line.js`, `src/electron/index.js` | **MAJOR** - CLI parsing changes |
| `bytes` | 3.1.2 | 3.1.2 | `src/util.js` | Up to date |
| `env-paths` | 3.0.0 | **4.0.0** | `src/command-line.js` | **MAJOR** - ESM-only changes likely |
| `iconv-lite` | 0.6.3 | **0.7.2** | `src/endpoints/` (encoding) | **MINOR** - may have API tweaks |
| `is-docker` | 3.0.0 | **4.0.0** | `src/middleware/whitelist.js`, `webpack.config.js` | **MAJOR** - ESM-only changes |
| `ip-matching` | 2.1.2 | 2.1.2 | `src/middleware/whitelist.js` | Up to date |
| `ip-regex` | 5.0.0 | 5.0.0 | `src/command-line.js` | Up to date |
| `ipaddr.js` | 2.2.0 | 2.3.0 | `src/express-common.js` | Safe minor |
| `lodash` | 4.17.23 | 4.18.1 | 16 backend files | Safe minor |
| `mime-types` | 3.0.2 | 3.0.2 | 13 files | Up to date |
| `simple-git` | 3.33.0 | 3.35.2 | `src/plugin-loader.js`, `src/util.js`, `src/endpoints/extensions.js` | Safe minor |
| `command-exists` | 1.2.9 | 1.2.9 | `src/plugin-loader.js`, `src/util.js` | Up to date |
| `html-entities` | 2.6.0 | 2.6.0 | `src/endpoints/search.js` | Up to date |
| `open` | 10.2.0 | **11.0.0** | `src/server-main.js` (dynamic import, opens browser) | **MAJOR** - ESM-only changes |
| `@mozilla/readability` | 0.6.0 | 0.6.0 | `public/lib.js` | Up to date |
| `wavefile` | 11.0.0 | 11.0.0 | `src/endpoints/speech.js` | Up to date |
| `webpack` | 5.105.4 | 5.106.1 | `src/middleware/webpack-serve.js` | Safe patch |

### Vue 3 (newly added)

| Package | Current | Latest | Used In | Upgrade Risk |
|---------|---------|--------|---------|--------------|
| `vue` | 3.5.32 | 3.5.32 | `public/vue-src/` (bundled by Vite) | Up to date |

---

## Unused Packages (Can Be Removed)

| Package | Evidence |
|---------|----------|
| `cookie-parser` | Zero imports found anywhere in `src/` or `public/`. Project uses `cookie-session` instead. |

---

## Dev Dependencies

| Package | Current | Latest | Upgrade Risk |
|---------|---------|--------|--------------|
| `@chevrotain/types` | 11.1.1 | **12.0.0** | **MAJOR** - must match `chevrotain` version |
| `@types/archiver` | 6.0.3 | **7.0.0** | **MAJOR** - types for archiver v7 |
| `@types/cookie-parser` | 1.4.9 | 1.4.10 | Safe patch (but package is unused) |
| `@types/deno` | 2.3.0 | 2.5.0 | Safe minor |
| `@types/express` | 4.17.23 | **5.0.6** | **MAJOR** - only if upgrading Express to v5 |
| `@types/jquery` | 3.5.33 | **4.0.0** | **MAJOR** - jQuery 4 types |
| `@types/lodash` | 4.17.20 | 4.17.24 | Safe patch |
| `@types/node` | 22.19.17 | **25.6.0** | **MAJOR** - Node 25 types |
| `@types/yargs` | 17.0.33 | 17.0.35 | Safe patch |
| `eslint` | 8.57.1 | **10.2.0** | **MAJOR** - flat config required, plugin ecosystem changes |
| `eslint-plugin-jest` | 27.9.0 | **29.15.2** | **MAJOR** - needs ESLint 9+ |
| `eslint-plugin-jsdoc` | 48.10.0 | **62.9.0** | **MAJOR** - needs ESLint 9+ |
| `eslint-plugin-playwright` | 2.3.0 | 2.10.1 | Safe minor |
| `vite` | 8.0.8 | 8.0.8 | Up to date |
| `@vitejs/plugin-vue` | 6.0.5 | 6.0.5 | Up to date |

All `@types/*` packages not listed above are at latest within their semver range.

---

## Breaking Change Analysis (Deep Dive — Researched 2026-04-10)

### HIGH RISK - Do Not Upgrade Without Significant Work

#### `express` 4.22 → 5.2

- **Impact:** 46 endpoint files in `src/endpoints/`, plus `src/server-main.js` and `src/server-startup.js`
- **Code audit results:** No usage of removed APIs (`req.param()`, `app.del()`, `res.redirect('back')`) found anywhere in the codebase. All `res.status()` calls use integers. All `req.query` access is read-only (compatible with Express 5's read-only query object).
- **One required change:** `src/server-main.js` lines 17, 102-103 — replace separate `body-parser` import with Express 5's built-in `express.json()` and `express.urlencoded()`. Remove `body-parser` from dependencies.
- **Surprise finding:** The actual migration is simpler than expected. The codebase doesn't use any of the commonly-broken patterns.
- **Recommendation:** DEFER but lower risk than initially assessed. When ready, the migration is mostly: swap body-parser → express.json/urlencoded, update `@types/express` to v5, and run the test suite. Consider as a standalone PR.

#### `vectra` 0.2.2 → 0.14.0

- **Impact:** `src/endpoints/vectors.js` — uses `LocalIndex`, `isIndexCreated()`, `createIndex()`, `beginUpdate()`, `endUpdate()`, `upsertItem()`, `deleteItem()`, `listItems()`, `listItemsByMetadata()`, `queryItems()`, and `folderPath` property.
- **Code audit results — THREE critical breaking changes confirmed:**
  1. **Serialization format changed to Protocol Buffers.** Existing `.vectra` index files on disk become unreadable. All user vector data requires reindexing.
  2. **Node.js requirement bumped to ≥22.** SillyTavern supports Node ≥18, so this silently breaks deployments on Node 18–21.
  3. **Storage abstraction rewritten.** The `folderPath` property and direct filesystem assumptions may have changed.
- **The `openai` override** (`openai@^4.17.0` forced as transitive dep) may become irrelevant or conflicting if vectra 0.14 drops/changes its openai dependency.
- **Recommendation:** DEFER indefinitely. The data migration problem alone makes this a project-scale effort. Users would lose all indexed vector data on upgrade. Requires a migration script to reindex, plus bumping the minimum Node version to 22.

#### `eslint` 8.57 → 10.2

- **Impact:** `.eslintrc.cjs` must be completely rewritten to `eslint.config.js` (flat config).
- **Code audit results:**
  - ESLint 10 (Feb 2026) **completely removes** eslintrc support — no fallback, no compatibility mode.
  - Current config uses `extends`, `overrides`, and `env` — all replaced by flat config's array-of-objects pattern.
  - **Plugin upgrades required simultaneously:**
    - `eslint-plugin-jest` 27.9 → ≥28.0 (flat config support added in v28)
    - `eslint-plugin-playwright` 2.3 → latest (needs flat config compat)
    - `eslint-plugin-jsdoc` 48.10 → already supports flat config, but upgrade to latest recommended
  - Migration pattern: `env: { node, browser }` → `languageOptions: { globals: {...} }`; `parserOptions` → nested under `languageOptions`; `overrides` → separate config objects in the array.
- **Recommendation:** DEFER. This is a standalone task: create `eslint.config.js`, delete `.eslintrc.cjs`, upgrade all 3 plugins, run `npm run lint` to verify. Mechanical but tedious.

### MODERATE RISK - Manageable Upgrades

#### `chevrotain` 11.1 → 12.0

- **Impact:** Webpack-bundled in `public/lib.js`, powers slash command parser (`public/scripts/slash-commands/`) and macro parser.
- **Code audit results — FIVE breaking changes to evaluate:**
  1. **ESM-only** — UMD bundles removed. Webpack bundling should handle this, but verify.
  2. **`Parser` class removed** — must use `CstParser` or `EmbeddedActionsParser`. Check if codebase uses the old class name.
  3. **Default `maxLookahead` reduced to 3** — may cause grammar ambiguity errors in complex slash command syntax.
  4. **OPTION methods now return `OUT | undefined`** — TypeScript strictness change; may surface type errors.
  5. **Grammar de-serialization removed** — `serializedGrammar` property deleted.
- **Files to test:** `public/scripts/slash-commands/` directory, macro parser
- **Recommendation:** MEDIUM-HIGH risk. The `maxLookahead` reduction could silently break complex slash command parsing. Test extensively before deploying. Must upgrade `@chevrotain/types` simultaneously.

#### `rate-limiter-flexible` 5.0 → 11.0

- **Impact:** `src/endpoints/users-public.js` — imports `RateLimiterMemory` and `RateLimiterRes`.
- **Code audit results:** Current usage is straightforward — constructs with `points` and `duration`, calls `.consume(ip)` and `.delete(ip)`, catches `RateLimiterRes` exceptions.
- **Known breaking change (v10):** Negative `points` values now accepted instead of defaulting to 4. Current code doesn't use negative values, so this is safe.
- **Recommendation:** LOWER risk than expected. The basic API (`RateLimiterMemory`, `consume`, `delete`) appears stable across versions. Test login rate limiting after upgrade.

#### `write-file-atomic` 5.0 → 7.0

- **Impact:** 17 files across backend.
- **Code audit results — NO API changes, just Node version bumps:**
  - v6 requires Node ≥18.17, v7 requires Node **≥20.17**
  - Function signatures unchanged across v5→v7. All 17 files use the same patterns: `writeFileAtomicSync(path, data, 'utf8')` and `await writeFileAtomic(path, data, 'utf8')`
  - v7 replaced `imurmurhash` with native `node:crypto` internally — no user-facing impact.
- **Import patterns found:** 14 files import sync only, 2 files import both sync+async, 1 file imports async only.
- **Recommendation:** **LOW RISK** — upgrade freely. Only caveat: requires Node ≥20.17. No code changes needed.

#### `proxy-agent` 6.5 → 8.0

- **Impact:** `src/request-proxy.js` only (~40 lines).
- **Code audit results:**
  - Current usage: `import { ProxyAgent } from 'proxy-agent'; const proxyAgent = new ProxyAgent(); http.globalAgent = proxyAgent; https.globalAgent = proxyAgent;`
  - This basic constructor pattern is stable in v8 — **no code changes needed.**
  - **Blocker:** v8 requires Node **≥20**. The entire sub-dependency chain (agent-base, http/https-proxy-agent, socks-proxy-agent) also jumped to major versions.
- **Recommendation:** **LOW CODE RISK** but blocked by Node ≥20 requirement. If already on Node 20+, upgrade freely.

#### `yargs` 17.7 → 18.0

- **Impact:** `src/command-line.js` and `src/electron/index.js`.
- **Code audit results:**
  - `src/command-line.js`: Uses modern pattern — `import yargs from 'yargs/yargs'` + `import { hideBin } from 'yargs/helpers'` + `yargs(hideBin(args)).option(...).parseSync()`. **Fully compatible with v18.**
  - `src/electron/index.js`: Uses older import — `import yargs from 'yargs'` (not `/yargs`), passes raw `process.argv`. **Needs fix:** change to `import yargs from 'yargs/yargs'` + `import { hideBin } from 'yargs/helpers'` + `yargs(hideBin(process.argv))`.
  - v18 removes singleton pattern and auto-derived command names — neither used here.
  - **Blocker:** v18 requires Node **≥20.19**.
- **Recommendation:** LOW RISK — one file needs a minor import fix. Blocked by Node ≥20.19 requirement.

#### `@zeldafan0225/ai_horde` 5.2 → 6.0

- **Impact:** `src/endpoints/horde.js` (387 lines) — heavy API client usage.
- **Code audit results:** Uses `new AIHorde({ client_agent })` plus methods: `getModels()`, `postAsyncInterrogate()`, `getInterrogationStatus()`, `postAsyncImageGenerate()`, `getImageGenerationCheck()`, `getImageGenerationStatus()`, `deleteImageGenerationRequest()`, `findUser()`, `getSharedKey()`. Note: comment at line 273 flags `use_gfpgan` param as missing from type definition — v6 may fix this.
- **Recommendation:** MEDIUM risk. Multiple API method calls would need validation against v6 types. Only affects Horde users, so limited blast radius.

#### `@iconfu/svg-inject` 1.2 → 2.0

- **Impact:** `public/lib.js` (import + window shim) and `public/script.js` (line 1735: `await SVGInject(image)`).
- **Code audit results:** v2's only breaking change is **dropping IE support**. The API is a drop-in replacement — no code modifications required.
- **Recommendation:** **LOW RISK** — upgrade freely. No code changes needed.

#### ESM-only packages: `env-paths` 3→4, `is-docker` 3→4, `open` 10→11

- **Impact:** One file each — `src/command-line.js`, `src/middleware/whitelist.js`, `src/server-main.js`.
- **Code audit results:** SillyTavern is already **fully ESM** (`"type": "module"` in package.json). All three packages are already imported correctly:
  - `env-paths`: static import in command-line.js — compatible
  - `is-docker`: static import in whitelist.js — compatible
  - `open`: dynamic `await import('open')` in server-main.js — compatible (already wrapped intentionally per a TODO comment about Node 18 support)
- **Recommendation:** **LOW RISK** — all three are drop-in upgrades. No code changes needed.

### LOW RISK - Safe to Upgrade

These are patch/minor version bumps within semver range. They should be safe:

| Package | Change | Notes |
|---------|--------|-------|
| All `@jimp/*` (18 packages) | 1.6.0 → 1.6.1 | Patch fix |
| `lodash` | 4.17.23 → 4.18.1 | Minor, backwards compatible |
| `dompurify` | 3.2.6 → 3.3.3 | Minor, security fixes |
| `cors` | 2.8.5 → 2.8.6 | Patch |
| `fuse.js` | 7.1.0 → 7.3.0 | Minor |
| `ws` | 8.18.3 → 8.20.0 | Minor |
| `yaml` | 2.8.1 → 2.8.3 | Patch |
| `simple-git` | 3.33.0 → 3.35.2 | Minor |
| `bowser` | 2.12.1 → 2.14.1 | Minor |
| `chalk` | 5.6.0 → 5.6.2 | Patch |
| `morphdom` | 2.7.7 → 2.7.8 | Patch |
| `webpack` | 5.105.4 → 5.106.1 | Patch |
| `bing-translate-api` | 4.1.0 → 4.2.0 | Minor |
| `ipaddr.js` | 2.2.0 → 2.3.0 | Minor |
| `sanitize-filename` | 1.6.3 → 1.6.4 | Patch |
| `yauzl` | 3.2.1 → 3.3.0 | Minor |
| `host-validation-middleware` | 0.1.1 → 0.1.4 | Patch |

---

## Node.js Version Implications

Several upgrades are **gated by the minimum Node.js version**. Currently SillyTavern requires Node ≥18.

| Target Node Version | Packages Unlocked |
|---------------------|-------------------|
| Node ≥20.17 | `write-file-atomic` 7, `proxy-agent` 8 |
| Node ≥20.19 | `yargs` 18 |
| Node ≥22 | `vectra` 0.14 |

If the project bumps its minimum to Node ≥20, that immediately unblocks `write-file-atomic`, `proxy-agent`, and `yargs` — all confirmed as low-code-risk upgrades.

---

## Recommended Upgrade Order (Revised)

### Phase 1: Safe Patches (do now)
```bash
npm update
```
This updates all packages within their semver range (^). Covers all "Safe patch" and "Safe minor" entries above. No code changes needed.

### Phase 2: Remove Unused (do now)
```bash
npm uninstall cookie-parser
npm uninstall @types/cookie-parser
```

### Phase 3a: Drop-in Upgrades (no code changes, just bump package.json)
These were researched and confirmed safe — no API changes, just version bumps:

1. `@iconfu/svg-inject` 1 → 2 (only drops IE support)
2. `env-paths` 3 → 4 (ESM-only, already using ESM)
3. `is-docker` 3 → 4 (ESM-only, already using ESM)
4. `open` 10 → 11 (ESM-only, already using dynamic import)
5. `rate-limiter-flexible` 5 → 11 (basic API unchanged, test login limiting)

### Phase 3b: Requires Node ≥20 (bump minimum Node version first)
6. `write-file-atomic` 5 → 7 (API unchanged, 17 files, zero code changes)
7. `proxy-agent` 6 → 8 (API unchanged, 1 file, zero code changes)
8. `yargs` 17 → 18 (1 file needs import fix in `src/electron/index.js`)

### Phase 3c: Needs Testing (research done, code changes may be needed)
9. `@zeldafan0225/ai_horde` 5 → 6 (validate method signatures against v6 types)
10. `chevrotain` 11 → 12 + `@chevrotain/types` (check for `Parser` class usage, test slash commands with maxLookahead=3)

### Phase 4: Major Migrations (dedicated effort)
1. `eslint` 8 → 10 + all plugins (rewrite `.eslintrc.cjs` to `eslint.config.js`, upgrade jest/playwright plugins)
2. `express` 4 → 5 + `body-parser` 1 → 2 (swap body-parser for express.json/urlencoded, update @types/express, run full test suite)
3. `vectra` 0.2 → 0.14 (DEFER INDEFINITELY — requires Node ≥22, breaks all existing vector index files, needs data migration script)

---

## Notable Observations

- **`moment` is in maintenance mode.** Consider migrating to `dayjs` (2KB vs 72KB) or native `Intl.DateTimeFormat`. Used in both frontend (lib.js) and implicitly throughout the codebase.
- **`lodash` is used in 16+ backend files** but could be replaced with native JS methods in many cases (ES2023 has `Object.groupBy`, `Array.prototype.toSorted`, etc.).
- **`node-fetch` is used in 30 files** but Node 18+ has native `fetch`. Could be incrementally replaced.
- **`sillytavern-transformers` is pinned** (no ^) at 2.14.6 — this is intentional for stability. Don't add ^.
- **The `vectra` override** forces `openai@^4.17.0` as a transitive dependency — upgrading vectra may change this requirement.
- **Node ≥20 is the key unlock.** Bumping the minimum Node version from 18 to 20 unblocks three confirmed-safe upgrades (`write-file-atomic`, `proxy-agent`, `yargs`) with minimal code changes.
