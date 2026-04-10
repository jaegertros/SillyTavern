# SillyTavern Repository Analysis

This document summarizes the structure and runtime model of the `SillyTavern` repository to help contributors ramp up quickly.

## 1) High-level architecture

SillyTavern is a Node.js (ESM) web application with:

- A **server entrypoint** in `server.js` that parses CLI args and bootstraps the app.
- A central **Express server** in `src/server-main.js`.
- A broad set of **feature routers** in `src/endpoints/**` wired through `src/server-startup.js`.
- A large **browser-side frontend** rooted in `public/script.js` and many modules under `public/scripts/**`.
- Optional **server plugins** loaded from `./plugins`.

## 2) Startup flow

The startup sequence is:

1. `server.js` logs runtime details, parses CLI arguments (`CommandLineParser`), sets globals (`DATA_ROOT`, `COMMAND_LINE_ARGS`), and imports `src/server-main.js`.
2. `src/server-main.js` creates and configures the Express app (security middleware, CORS, sessions, CSRF, static hosting, auth gating, uploads).
3. `src/server-startup.js` mounts private API routers, redirects deprecated routes, and starts HTTP/HTTPS listeners.

This split keeps argument parsing, middleware bootstrapping, and transport startup concerns separate.

## 3) Server-side module map

### Core runtime files

- `server.js`: process entrypoint and bootstrap handoff.
- `src/command-line.js`: CLI schema/defaults and config merging behavior.
- `src/server-main.js`: middleware order, auth/session handling, static assets, and API wiring.
- `src/server-startup.js`: endpoint registration and listener startup logic.
- `src/users.js`: user account model, per-user directory management, security checks, migration utilities.
- `src/plugin-loader.js`: dynamic plugin loading lifecycle (`info`, `init`, optional `exit`) and optional auto-update.

### Endpoint organization

`src/server-startup.js` mounts many independent routers (`/api/openai`, `/api/characters`, `/api/worldinfo`, `/api/backups`, etc.), which suggests a feature-sliced backend: each domain owns its own router implementation under `src/endpoints/`.

### Middleware and supporting subsystems

- `src/middleware/**`: access log writing, auth/whitelist checks, cache buster, CORS proxy, etc.
- `src/tokenizers`, `src/vectors`, `src/validator`, `src/png`, `src/git`: specialized subsystems.

## 4) Frontend structure

The frontend appears intentionally modular but centralized under a single top-level orchestrator:

- `public/script.js` imports many focused modules (`world-info`, `group-chats`, `openai`, `extensions`, etc.) and coordinates UI/runtime behavior.
- `public/scripts/**` contains feature-specific browser logic.
- `public/index.html`, `public/style.css`, and static assets (`img`, `sounds`, `locales`, etc.) support the UI.

In practice, frontend changes are usually implemented by editing one or more feature modules under `public/scripts/**` plus corresponding UI/template/style pieces.

## 5) Configuration model

Two primary configuration sources:

- `default/config.yaml` (template/default behavior).
- Runtime CLI flags from `src/command-line.js`.

Important operational knobs include:

- Networking/listen mode and IPv4/IPv6 behavior.
- SSL cert/key configuration.
- Whitelist/basic auth/user-account controls.
- CSRF and CORS settings.
- Request proxy, backups, thumbnails, performance toggles.

Because security and exposure settings are interdependent, review `src/users.js` and `src/server-main.js` before deploying in non-localhost/listen mode.

## 6) Data and multi-user behavior

SillyTavern supports both single-user defaults and multi-user account mode.

- Public/user content directories are created and verified at startup.
- User-specific folders are derived from a directory template model (avatars, chats, groups, worlds, backups, etc.).
- Migration helpers are provided for moving from older layout patterns.

This means most persistent state lives under `DATA_ROOT` rather than being hardcoded to repository paths.

## 7) Plugin model

There are two plugin paths:

- Runtime plugin loading in `src/plugin-loader.js` (guarded by config flags).
- CLI plugin management utility in `plugins.js` for install/update operations.

Plugin IDs are validated, duplicate IDs are rejected, and plugins can mount routes under `/api/plugins/<id>`.

## 8) Tooling and test workflow

### Root package (`package.json`)

- Runtime target: Node >= 20.
- Main scripts: `npm start`, `npm run debug`, linting, plugin helper scripts.

### Test package (`tests/package.json`)

- Separate test workspace with Jest (unit) and Playwright (E2E).
- Unified test command runs unit then E2E.

## 9) Contributor quick-start (repo-local)

1. Install dependencies: `npm install`
2. Start app: `npm start`
3. Lint before changes: `npm run lint`
4. Run tests from `tests/`: `npm test`

For contribution safety:

- Verify config assumptions when changing auth/network settings.
- Keep endpoint behavior with existing route structure and deprecation redirects.
- Prefer feature-local edits (endpoint module or frontend feature module) over monolithic changes.

## 10) Suggested “where to edit” guide

- **Server bootstrap / middleware order**: `src/server-main.js`
- **CLI/config behavior**: `src/command-line.js`
- **API domain behavior**: corresponding file in `src/endpoints/`
- **User/account/data-root behavior**: `src/users.js`
- **Frontend behavior**: `public/scripts/<feature>.js` (+ `public/script.js` integration points)
- **Plugin lifecycle**: `src/plugin-loader.js` and `plugins.js`

---

If you want, I can follow this with a second document that maps **specific endpoint files to user-facing features** (e.g., which APIs are used by chat generation, world info, assets, and backups).
