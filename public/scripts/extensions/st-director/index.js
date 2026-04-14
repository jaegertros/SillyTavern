import { getContext, extension_settings, renderExtensionTemplateAsync } from '../../../scripts/extensions.js';
import { registerDirectorCallback, group_activation_strategy } from '../../../scripts/group-chats.js';

const MODULE_NAME = 'st-director';

const DEFAULT_SYSTEM_PROMPT = `You are a director controlling a group conversation between fictional characters. Your job is to decide which characters should speak next based on the conversation context.

Consider:
- Who was addressed or mentioned in the last message
- Which characters would naturally react to what was said
- Conversation flow and turn-taking dynamics
- Character personalities and relationships

Respond with a JSON array of character names in the order they should speak. Example: ["Character A", "Character B"]

Only include characters from the provided list. Return between 1 and {{maxSpeakers}} characters.`;

const DEFAULT_SETTINGS = {
    enabled: true,
    directorModel: 'google/gemini-2.0-flash-001',
    apiKey: '',
    maxContextMessages: 15,
    maxSpeakersPerTurn: 3,
    characterSummaries: {},
    directorSystemPrompt: DEFAULT_SYSTEM_PROMPT,
};

function getSettings() {
    if (!extension_settings[MODULE_NAME]) {
        extension_settings[MODULE_NAME] = structuredClone(DEFAULT_SETTINGS);
    }
    return extension_settings[MODULE_NAME];
}

function saveSettings() {
    const context = getContext();
    context.saveSettingsDebounced();
}

async function callDirectorApi(systemPrompt, userContent) {
    const settings = getSettings();
    const response = await fetch('/api/director/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
            model: settings.directorModel,
            api_key: settings.apiKey || undefined,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent },
            ],
            max_tokens: 200,
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

function parseDirectorResponse(text) {
    // Strip markdown fences if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    try {
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
            return parsed.map(String);
        }
        if (Array.isArray(parsed.speakers)) {
            return parsed.speakers.map(String);
        }
    } catch {
        // Try to extract names from brackets
        const match = cleaned.match(/\[([^\]]+)\]/);
        if (match) {
            try {
                return JSON.parse(`[${match[1]}]`).map(String);
            } catch { /* fall through */ }
        }
    }

    console.warn('[ST-Director] Could not parse response:', text);
    return [];
}

async function directorCallback(memberChars, activationText, lastMessage, group) {
    const settings = getSettings();
    const context = getContext();

    // Build character summaries
    const charDescriptions = memberChars.map(char => {
        const summary = settings.characterSummaries?.[char.avatar] || '';
        const desc = summary || (char.description || '').substring(0, 200);
        return `- ${char.name}: ${desc || 'No description'}`;
    }).join('\n');

    // Build recent message history
    const chat = context.chat || [];
    const recentMessages = chat.slice(-settings.maxContextMessages).map(msg => {
        const name = msg.is_user ? (context.name1 || 'User') : (msg.name || 'Unknown');
        const text = (msg.mes || '').substring(0, 300);
        return `${name}: ${text}`;
    }).join('\n');

    // Build system prompt
    const systemPrompt = settings.directorSystemPrompt
        .replace('{{maxSpeakers}}', String(settings.maxSpeakersPerTurn));

    // Build user prompt
    const userContent = `Characters in this group:\n${charDescriptions}\n\nRecent conversation:\n${recentMessages}\n\nWho should speak next? Return a JSON array of character names (max ${settings.maxSpeakersPerTurn}).`;

    try {
        const responseText = await callDirectorApi(systemPrompt, userContent);
        const speakers = parseDirectorResponse(responseText);

        if (speakers.length === 0) {
            console.warn('[ST-Director] No speakers parsed, falling back');
            return memberChars.map(c => c.name).slice(0, settings.maxSpeakersPerTurn);
        }

        // Filter to valid member names and limit
        const memberNames = memberChars.map(c => c.name.toLowerCase());
        const validSpeakers = speakers.filter(name =>
            memberNames.includes(name.toLowerCase()),
        ).slice(0, settings.maxSpeakersPerTurn);

        if (validSpeakers.length === 0) {
            console.warn('[ST-Director] No valid speakers matched, falling back');
            return memberChars.map(c => c.name).slice(0, settings.maxSpeakersPerTurn);
        }

        console.log('[ST-Director] Selected speakers:', validSpeakers);
        return validSpeakers;
    } catch (error) {
        console.error('[ST-Director] Error:', error);
        return memberChars.map(c => c.name).slice(0, settings.maxSpeakersPerTurn);
    }
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
console.log('[ST-Director] Director callback registered.');

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
    const apiKeyInput = document.getElementById('st-director-api-key');
    const modelInput = document.getElementById('st-director-model');
    const maxContextInput = document.getElementById('st-director-max-context');
    const maxSpeakersInput = document.getElementById('st-director-max-speakers');
    const systemPromptTextarea = document.getElementById('st-director-system-prompt');

    if (enabledCheckbox) {
        enabledCheckbox.checked = settings.enabled;
        enabledCheckbox.addEventListener('change', () => {
            settings.enabled = enabledCheckbox.checked;
            saveSettings();
        });
    }

    if (apiKeyInput) {
        apiKeyInput.value = settings.apiKey || '';
        apiKeyInput.addEventListener('input', () => {
            settings.apiKey = apiKeyInput.value.trim();
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
        maxContextInput.addEventListener('change', () => {
            settings.maxContextMessages = parseInt(maxContextInput.value) || 15;
            saveSettings();
        });
    }

    if (maxSpeakersInput) {
        maxSpeakersInput.value = settings.maxSpeakersPerTurn;
        maxSpeakersInput.addEventListener('change', () => {
            settings.maxSpeakersPerTurn = parseInt(maxSpeakersInput.value) || 3;
            saveSettings();
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
