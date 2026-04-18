import { getContext, extension_settings, renderExtensionTemplateAsync } from '../../../scripts/extensions.js';
import { registerDirectorCallback, group_activation_strategy } from '../../../scripts/group-chats.js';
import { extension_prompt_types, extension_prompt_roles, characters as globalCharacters } from '../../core/state.js';
import { eventSource, event_types } from '../../events.js';
import { getRequestHeaders } from '../../request-utils.js';
import { setExtensionPrompt } from '../../core/settings-manager.js';

const MODULE_NAME = 'st-director';
const INJECT_KEY = 'st-director-direction';

const DEFAULT_SYSTEM_PROMPT = `You are a scene director for a group roleplay chat. Your ONLY job is to decide which characters should speak next and in what order, based on the conversation context.

You will receive:
- A compact summary of each character in the scene
- Recent conversation history
- The user's latest message

RULES:
1. The user (Caleb) almost always expects a response. You MUST return at least one speaker UNLESS the user's latest message is purely transitional or atmospheric with no addressee, no question, and no invitation to react (e.g. "I walk to the door", "I sit quietly"). When in doubt, return one speaker — silence is the rare exception, not the default.
2. If the user addresses a character by name OR asks a question OR invites discussion ("thoughts?", "what do you think?", "anyone?"), at least one named character MUST be included — usually the addressed/most-relevant one, first.
3. Narrator/DM characters are ONLY included when the scene needs environmental description, NPC dialogue, scene transitions, or physical-world consequences. Never include a narrator just to "fill in" between character turns. A narrator alone, with no party characters, is appropriate when the user explores or interacts with the environment.
4. Avoid picking the character who just spoke unless they are directly addressed or have a clear continuation. Favor other voices.
5. Consider personality: laconic or reserved characters speak less; chatty characters speak more. Character summaries tell you who is who.
6. Relevance matters more than completeness — don't include a character just because they exist.
7. Order matters: put the most natural first-responder first.
8. Maximum {{maxSpeakers}} speakers per turn. Fewer is usually better — one strong response is almost always better than two diluted ones.

Include a brief "direction" note for each speaker — what they should focus on or react to. Not dialogue, just intent. Examples: "react to the tactical suggestion", "ask a follow-up about the crystal", "quiet observation only, brief", "narrate the shift in light and the NPC's reaction".

Respond with ONLY a JSON array. No prose, no markdown, no code fences. If you genuinely believe no one should respond (rare), return an empty array [].

Format:
[
  {"speaker": "Character Name", "direction": "brief intent note"},
  {"speaker": "Character Name", "direction": "brief intent note"}
]`;

const DEFAULT_SETTINGS = {
    enabled: true,
    provider: 'openrouter',           // 'openrouter' | 'koboldcpp' | 'custom'
    apiUrl: '',                        // Endpoint URL (Kobold/Custom)
    directorModel: 'google/gemini-2.0-flash-001',
    apiKey: '',
    sessionId: '',                     // OpenRouter session_id — groups calls in the OR dashboard
    maxContextMessages: 15,
    maxSpeakersPerTurn: 2,
    characterSummaries: {},
    directorSystemPrompt: DEFAULT_SYSTEM_PROMPT,
    batchMode: false,                  // Phase 2 — not yet wired.
};

// Module-level cache: avatar -> direction string from the most recent director call.
const lastDirections = new Map();

function getSettings() {
    if (!extension_settings[MODULE_NAME]) {
        extension_settings[MODULE_NAME] = structuredClone(DEFAULT_SETTINGS);
    } else {
        // Merge any keys that were added in newer versions but are missing from
        // the user's saved settings — without overwriting their existing values.
        for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
            if (extension_settings[MODULE_NAME][key] === undefined) {
                extension_settings[MODULE_NAME][key] = structuredClone(defaultValue);
            }
        }
    }
    return extension_settings[MODULE_NAME];
}

function saveSettings() {
    const context = getContext();
    context.saveSettingsDebounced();
}

async function callDirectorApi(systemPrompt, userContent) {
    const settings = getSettings();
    // Use ST's getRequestHeaders() — it reads the live `token` variable that
    // the CSRF middleware actually validates against. The meta tag we used
    // before was either stale or not what the middleware checks, causing 403s.
    const response = await fetch('/api/director/generate', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({
            provider: settings.provider || 'openrouter',
            url: settings.apiUrl || '',
            model: settings.directorModel,
            api_key: settings.apiKey || undefined,
            session_id: settings.sessionId || undefined,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent },
            ],
            max_tokens: 400,
            temperature: 0.3,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Director API returned ${response.status}`);
    }

    const data = await response.json();
    return data.text;
}

/**
 * Parse the director's response into an array of {speaker, direction} objects.
 * Accepts:
 *   - Array of {speaker, direction} (the current spec format)
 *   - Array of bare strings (legacy — direction is treated as empty)
 *   - {speakers: [...]}  wrapper object
 * Returns [] on any parse failure.
 */
function parseDirectorResponse(text) {
    let cleaned = String(text || '').trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    const normalize = (arr) => arr.map(item => {
        if (typeof item === 'string') {
            return { speaker: item, direction: '' };
        }
        if (item && typeof item === 'object' && item.speaker) {
            return { speaker: String(item.speaker), direction: String(item.direction || '') };
        }
        return null;
    }).filter(Boolean);

    try {
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
            return normalize(parsed);
        }
        if (parsed && Array.isArray(parsed.speakers)) {
            return normalize(parsed.speakers);
        }
    } catch {
        const match = cleaned.match(/\[[\s\S]*\]/);
        if (match) {
            try {
                const parsed = JSON.parse(match[0]);
                if (Array.isArray(parsed)) return normalize(parsed);
            } catch { /* fall through */ }
        }
    }

    console.warn('[ST-Director] Could not parse response:', text);
    return [];
}

async function directorCallback(memberChars, activationText, lastMessage, group) {
    const settings = getSettings();
    const context = getContext();

    // Respect the enabled toggle. Returning an empty array triggers the
    // natural-order fallback in activateDirectorOrder without an error path.
    if (!settings.enabled) {
        console.log('[ST-Director] Disabled via settings; yielding to natural order.');
        lastDirections.clear();
        return [];
    }

    console.log(`[ST-Director] Call: maxSpeakers=${settings.maxSpeakersPerTurn} provider=${settings.provider} model=${settings.directorModel}`);

    // Build character summaries — per-character overrides take precedence over card description.
    const charDescriptions = memberChars.map(char => {
        const summary = settings.characterSummaries?.[char.avatar] || '';
        const desc = summary || (char.description || '').substring(0, 200);
        return `${char.name}: ${desc || 'No description provided.'}`;
    }).join('\n\n');

    // Recent conversation (up to maxContextMessages).
    const chat = context.chat || [];
    const recent = chat.slice(-settings.maxContextMessages).map(msg => {
        const name = msg.is_user ? (context.name1 || 'User') : (msg.name || 'Unknown');
        const text = (msg.mes || '').substring(0, 300);
        return `${name}: ${text}`;
    }).join('\n');

    // Highlight the user's latest message as the primary stimulus.
    let userLatest = '';
    let userLatestName = context.name1 || 'User';
    for (let i = chat.length - 1; i >= 0; i--) {
        if (chat[i].is_user) {
            userLatest = (chat[i].mes || '').substring(0, 800);
            userLatestName = chat[i].name || userLatestName;
            break;
        }
    }

    // Accept both {{maxSpeakers}} (current) and [maxSpeakers] (legacy) placeholders
    // so saved prompts from older versions of this extension still respect the cap.
    const maxStr = String(settings.maxSpeakersPerTurn);
    const systemPrompt = settings.directorSystemPrompt
        .replace(/\{\{maxSpeakers\}\}/g, maxStr)
        .replace(/\[maxSpeakers\]/g, maxStr);

    const userContent =
        `CHARACTERS IN SCENE:\n${charDescriptions}\n\n---\n\n` +
        `RECENT CONVERSATION:\n${recent || '(no prior messages)'}\n\n---\n\n` +
        `USER'S LATEST MESSAGE (from ${userLatestName}):\n${userLatest || '(none)'}\n\n` +
        `Respond with ONLY a JSON array of {speaker, direction} objects. No prose, no markdown.`;

    try {
        const responseText = await callDirectorApi(systemPrompt, userContent);
        const picks = parseDirectorResponse(responseText);

        // Build lookup. Try case-insensitive AND fuzzy-match (strip non-alpha,
        // collapse whitespace) so the director can return "World_DM", "The World",
        // "TheWorld", "**Lyra**" etc. and still match.
        const normalize = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const memberByLower = new Map(memberChars.map(c => [c.name.toLowerCase(), c]));
        const memberByNorm = new Map(memberChars.map(c => [normalize(c.name), c]));

        const matchPick = (pickName) => {
            const lower = pickName.toLowerCase();
            if (memberByLower.has(lower)) return memberByLower.get(lower);
            const norm = normalize(pickName);
            if (memberByNorm.has(norm)) return memberByNorm.get(norm);
            // Last resort: substring match on normalized form (e.g. "World" matches "TheWorld")
            for (const [memberNorm, char] of memberByNorm.entries()) {
                if (memberNorm.includes(norm) || norm.includes(memberNorm)) return char;
            }
            return null;
        };

        // Diagnostic log so we can see what the director returned vs. who's in the group.
        console.log('[ST-Director] Raw response:', responseText);
        console.log('[ST-Director] Parsed picks:', picks.map(p => p.speaker));
        console.log('[ST-Director] Group members:', memberChars.map(c => c.name));

        const matched = picks
            .map(p => ({ char: matchPick(p.speaker), direction: p.direction, originalName: p.speaker }))
            .filter(x => x.char);

        // Dedupe by avatar (same character can't be picked twice in one turn).
        const seenAvatars = new Set();
        const validPicks = [];
        for (const m of matched) {
            if (seenAvatars.has(m.char.avatar)) continue;
            seenAvatars.add(m.char.avatar);
            validPicks.push(m);
            if (validPicks.length >= settings.maxSpeakersPerTurn) break;
        }

        // Refresh the direction cache for this turn, regardless of outcome.
        lastDirections.clear();
        for (const pick of validPicks) {
            if (pick.direction) {
                lastDirections.set(pick.char.avatar, pick.direction);
            }
        }

        if (validPicks.length === 0) {
            console.warn('[ST-Director] No valid speakers matched; falling back to natural order.');
            console.warn('[ST-Director]   picks were:', picks.map(p => p.speaker));
            console.warn('[ST-Director]   members were:', memberChars.map(c => c.name));
            return [];
        }

        const summary = validPicks.map(p => `${p.char.name}${p.direction ? ` → ${p.direction}` : ''}`).join('; ');
        console.log(`[ST-Director] Selected: ${summary}`);

        // Return canonical character names (preserving case) to the caller.
        return validPicks.map(p => p.char.name);
    } catch (error) {
        console.error('[ST-Director] Error:', error);
        lastDirections.clear();
        return [];
    }
}

/**
 * Injects the director's per-character "direction" hint as a depth-0 system
 * author's note right before that character generates. Cleared between turns.
 */
function injectDirectionFor(chId) {
    const char = globalCharacters?.[chId];
    if (!char) return;

    const direction = lastDirections.get(char.avatar);
    if (!direction) {
        setExtensionPrompt(INJECT_KEY, '', extension_prompt_types.IN_CHAT, 0, false, extension_prompt_roles.SYSTEM);
        return;
    }

    const text = `[Director's note to ${char.name}: ${direction}]`;
    setExtensionPrompt(INJECT_KEY, text, extension_prompt_types.IN_CHAT, 0, false, extension_prompt_roles.SYSTEM);
}

function clearDirectionInjection() {
    setExtensionPrompt(INJECT_KEY, '', extension_prompt_types.IN_CHAT, 0, false, extension_prompt_roles.SYSTEM);
}

function buildCharSummaryUI() {
    const context = getContext();
    const settings = getSettings();
    const container = document.getElementById('st-director-char-list');
    if (!container) return;

    container.innerHTML = '';

    // Only show for group chats
    if (!context.groupId) {
        container.innerHTML = '<i>Open a group chat to configure character summaries.</i>';
        return;
    }

    const group = context.groups?.find(g => g.id === context.groupId);
    if (!group) return;

    const characters = context.characters || [];

    for (const memberId of group.members) {
        const char = characters.find(c => c.avatar === memberId);
        if (!char) continue;

        const div = document.createElement('div');
        div.className = 'director-char-summary';

        const label = document.createElement('label');
        label.textContent = char.name;
        div.appendChild(label);

        const textarea = document.createElement('textarea');
        textarea.value = settings.characterSummaries?.[char.avatar] || '';
        textarea.placeholder = `Brief description of ${char.name}'s personality and role...`;
        textarea.addEventListener('input', () => {
            if (!settings.characterSummaries) settings.characterSummaries = {};
            settings.characterSummaries[char.avatar] = textarea.value;
            saveSettings();
        });
        div.appendChild(textarea);

        container.appendChild(div);
    }
}

async function onTestDirector() {
    const output = document.getElementById('st-director-test-output');
    if (!output) return;

    output.style.display = 'block';
    output.textContent = 'Testing director...';

    const context = getContext();
    if (!context.groupId) {
        output.textContent = 'Error: Open a group chat first.';
        return;
    }

    const group = context.groups?.find(g => g.id === context.groupId);
    if (!group) {
        output.textContent = 'Error: Group not found.';
        return;
    }

    const characters = context.characters || [];
    const memberChars = group.members
        .map(id => characters.find(c => c.avatar === id))
        .filter(Boolean)
        .filter(c => !group.disabled_members?.includes(c.avatar));

    try {
        const speakers = await directorCallback(memberChars, '', null, group);
        output.textContent = `Director selected: ${JSON.stringify(speakers, null, 2)}`;
    } catch (error) {
        output.textContent = `Error: ${error.message}`;
    }
}

// Register the director callback IMMEDIATELY at module load time.
// This must happen before any group chat tries to use the Director strategy.
// The DOM setup below can fail without breaking the core callback functionality.
registerDirectorCallback(directorCallback);

// Wire up direction-injection via group-chat events.
//  - Before each character in the activation queue generates, inject their
//    direction hint as a depth-0 system author's note.
//  - Clear after the message is received or the whole turn wraps.
eventSource.on(event_types.GROUP_MEMBER_DRAFTED, injectDirectionFor);
eventSource.on(event_types.MESSAGE_RECEIVED, clearDirectionInjection);
eventSource.on(event_types.GROUP_WRAPPER_FINISHED, () => {
    clearDirectionInjection();
    lastDirections.clear();
});

console.log('[ST-Director] Director callback and event hooks registered.');

jQuery(async () => {
    try {
        const settingsHtml = await renderExtensionTemplateAsync(MODULE_NAME, 'index');
        $('#extensions_settings2').append(settingsHtml);
    } catch (err) {
        console.error('[ST-Director] Failed to load settings template:', err);
        return;
    }

    const settings = getSettings();

    // Bind UI
    const enabledCheckbox = document.getElementById('st-director-enabled');
    const providerSelect = document.getElementById('st-director-provider');
    const apiUrlInput = document.getElementById('st-director-api-url');
    const apiUrlRows = document.querySelectorAll('.st-director-url-row');
    const apiKeyInput = document.getElementById('st-director-api-key');
    const sessionIdInput = document.getElementById('st-director-session-id');
    const modelInput = document.getElementById('st-director-model');
    const maxContextInput = document.getElementById('st-director-max-context');
    const maxSpeakersInput = document.getElementById('st-director-max-speakers');
    const batchModeCheckbox = document.getElementById('st-director-batch-mode');
    const systemPromptTextarea = document.getElementById('st-director-system-prompt');

    const updateUrlVisibility = () => {
        const needsUrl = (settings.provider === 'koboldcpp' || settings.provider === 'custom');
        apiUrlRows.forEach(el => { el.style.display = needsUrl ? '' : 'none'; });
    };

    if (enabledCheckbox) {
        enabledCheckbox.checked = settings.enabled;
        enabledCheckbox.addEventListener('change', () => {
            settings.enabled = enabledCheckbox.checked;
            saveSettings();
        });
    }

    if (providerSelect) {
        providerSelect.value = settings.provider || 'openrouter';
        providerSelect.addEventListener('change', () => {
            settings.provider = providerSelect.value;
            saveSettings();
            updateUrlVisibility();
        });
    }

    if (apiUrlInput) {
        apiUrlInput.value = settings.apiUrl || '';
        apiUrlInput.addEventListener('input', () => {
            settings.apiUrl = apiUrlInput.value.trim();
            saveSettings();
        });
    }

    updateUrlVisibility();

    if (apiKeyInput) {
        apiKeyInput.value = settings.apiKey || '';
        apiKeyInput.addEventListener('input', () => {
            settings.apiKey = apiKeyInput.value.trim();
            saveSettings();
        });
    }

    if (sessionIdInput) {
        sessionIdInput.value = settings.sessionId || '';
        sessionIdInput.addEventListener('input', () => {
            settings.sessionId = sessionIdInput.value.trim();
            saveSettings();
        });
    }

    if (batchModeCheckbox) {
        batchModeCheckbox.checked = !!settings.batchMode;
        batchModeCheckbox.addEventListener('change', () => {
            settings.batchMode = batchModeCheckbox.checked;
            saveSettings();
        });
    }

    if (modelInput) {
        modelInput.value = settings.directorModel;
        modelInput.addEventListener('input', () => {
            settings.directorModel = modelInput.value.trim();
            saveSettings();
        });
    }

    if (maxContextInput) {
        maxContextInput.value = settings.maxContextMessages;
        // 'input' fires per-keystroke; 'change' only fires on blur, which
        // misses the user typing a value and immediately sending a message.
        maxContextInput.addEventListener('input', () => {
            const v = parseInt(maxContextInput.value);
            if (Number.isFinite(v) && v > 0) {
                settings.maxContextMessages = v;
                saveSettings();
            }
        });
    }

    if (maxSpeakersInput) {
        maxSpeakersInput.value = settings.maxSpeakersPerTurn;
        maxSpeakersInput.addEventListener('input', () => {
            const v = parseInt(maxSpeakersInput.value);
            if (Number.isFinite(v) && v >= 0) {
                settings.maxSpeakersPerTurn = v;
                saveSettings();
            }
        });
    }

    if (systemPromptTextarea) {
        systemPromptTextarea.value = settings.directorSystemPrompt;
        systemPromptTextarea.addEventListener('input', () => {
            settings.directorSystemPrompt = systemPromptTextarea.value;
            saveSettings();
        });
    }

    document.getElementById('st-director-reset-btn')?.addEventListener('click', () => {
        settings.directorSystemPrompt = DEFAULT_SYSTEM_PROMPT;
        if (systemPromptTextarea) systemPromptTextarea.value = DEFAULT_SYSTEM_PROMPT;
        saveSettings();
    });

    document.getElementById('st-director-test-btn')?.addEventListener('click', onTestDirector);

    // Build character summaries when chat changes
    const ctx = getContext();
    const es = ctx?.eventSource || window['eventSource'];
    if (typeof es?.on === 'function') {
        es.on('chatLoaded', buildCharSummaryUI);
        es.on('groupSelected', buildCharSummaryUI);
    }
    buildCharSummaryUI();

    console.log('[ST-Director] Settings UI loaded.');
});
