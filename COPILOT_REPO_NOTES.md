# Copilot Repo Notes: SillyTavern

Purpose: quick orientation for future coding tasks in this repo.

## Snapshot
- Repo: SillyTavern/SillyTavern
- Branch context: release
- License: AGPL-3.0
- Runtime: Node.js >= 22 (from package.json)
- Module format: ESM ("type": "module")

## Important Correction vs CLAUDE.md
- CLAUDE.md says Node >= 18, but package.json enforces Node >= 22.
- Trust package.json for runtime requirements.

## Primary Entry Points
- server startup: server.js
- express app wiring and middleware chain: src/server-main.js
- endpoint registration: src/server-startup.js (setupPrivateEndpoints)
- frontend shell: public/index.html
- frontend main script: public/script.js

## Backend Architecture Notes
- Server uses Express 5.x with security/compression/session/CSRF middleware.
- Public routes are mounted before login enforcement; most API routes require auth middleware.
- Main provider routing path for chat completions:
  - /api/backends/chat-completions
  - implementation in src/endpoints/backends/chat-completions.js
- Private API routers are mounted centrally in src/server-startup.js.

## Frontend Architecture Notes
- Legacy frontend is vanilla JS plus jQuery.
- Core orchestration is still in public/script.js with many imports from public/scripts/.
- Vue migration exists but is incremental; compiled artifacts are in public/vue-dist and source in public/vue-src.

## Dev and QA Commands
- run app: npm start
- debug: npm run debug
- lint: npm run lint
- auto-fix lint: npm run lint:fix
- plugin maintenance: npm run plugins:update / npm run plugins:install

## Testing
- Jest config: tests/jest.config.json
- test environment: node
- e2e infra exists under tests/ with Playwright config present.

## Contribution Workflow Notes
- CONTRIBUTING.md targets PRs to staging for most work.
- release PRs are intended for readme/gha/hotfix categories.
- Keep changes small and testable, and run lint before PR.

## Files Worth Knowing Early
- config.yaml: runtime/server behavior
- src/users.js: auth/session/user storage behavior
- src/util.js: broad utility surface used across backend
- src/endpoints/: feature routers
- public/scripts/: major frontend feature modules

## Practical Guidance For Future Changes
- Prefer minimal scoped edits; avoid broad refactors unless requested.
- Verify middleware ordering implications before changing auth/csrf/cors behavior.
- For API work, update route wiring and endpoint handler together.
- For UI work, check whether a feature is legacy jQuery or Vue-migrated before editing.

## Where To Edit For Common Tasks
- Add or change a private backend API route: implement in src/endpoints/<feature>.js and mount/update it in src/server-startup.js (setupPrivateEndpoints).
- Add or change a public unauthenticated route: add endpoint wiring in src/server-main.js before requireLoginMiddleware.
- Change auth/session/login behavior: src/users.js and middleware setup in src/server-main.js.
- Change CSRF behavior: src/server-main.js (csrf-sync setup and /csrf-token route).
- Change CORS or host filtering: src/server-main.js plus src/middleware/hostWhitelist.js when relevant.
- Change LLM provider request handling: src/endpoints/backends/chat-completions.js and src/prompt-converters.js.
- Add or adjust model token counting behavior: src/endpoints/tokenizers.js and src/tokenizers/.
- Modify chat/character persistence flows: src/endpoints/chats.js, src/endpoints/characters.js, and data schema expectations in data/<user>/.
- Change main UI behavior/state orchestration: public/script.js and feature modules in public/scripts/.
- Change extension loader behavior: public/scripts/extensions.js (client) and src/plugin-loader.js (server plugins).
- Work on Vue-migrated UI pieces: source in public/vue-src/, build output in public/vue-dist/ (generated).
- Update build/lint rules: package.json scripts and eslint.config.js.
- Add/update unit tests: tests/*.test.js and test settings in tests/jest.config.json.
- Add/update E2E coverage: tests/*.e2e.js and tests/playwright.config.js.

## Safe Edit Order Checklists

### API Change Checklist
- Confirm target router file under src/endpoints/ and existing route patterns.
- Implement handler changes in endpoint file first.
- Mount or adjust route wiring in src/server-startup.js if path/feature is new.
- If request/response schema changed, update frontend caller in public/scripts/ (or public/script.js).
- Add or update tests under tests/ for the changed behavior.
- Run npm run lint and relevant tests before PR.

### UI Change Checklist
- Identify whether feature is legacy jQuery (public/script.js or public/scripts/) or Vue (public/vue-src/).
- Change only one UI stack unless migration work is intentional.
- Verify event wiring/state flow after edits (custom events, settings persistence, template bindings).
- If Vue source changed, rebuild generated output as required by repo workflow.
- Smoke test the user flow in browser and check console for runtime errors.

### Auth and Security Checklist
- Map where the behavior is enforced: src/users.js vs middleware chain in src/server-main.js.
- Preserve middleware order unless explicitly required; auth/csrf/cors ordering can change behavior.
- Validate login-required boundaries for routes (before/after requireLoginMiddleware).
- Verify csrf-token handling for both enabled and disabled CSRF modes.
- Re-check CORS/host whitelist implications when touching network-facing settings.

### Storage and Data Flow Checklist
- Identify affected user data path under data/<user>/ before changing persistence logic.
- Keep backward compatibility for existing JSON/JSONL/card formats where possible.
- For migrations, add idempotent handling and preserve old-data fallback paths.
- Confirm import/export and backup flows still work for modified entities.

## Exploration Coverage
Reviewed directly:
- CLAUDE.md
- README.md
- package.json
- src/server-main.js
- src/server-startup.js
- CONTRIBUTING.md
- tests/jest.config.json
- eslint.config.js
