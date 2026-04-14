/**
 * OpenRouter Direct Extension
 *
 * Bypasses SillyTavern's Connection Manager profile/preset chain entirely.
 * Intercepts ConnectionManagerRequestService.sendRequest() and makes a
 * direct fetch to OpenRouter's /v1/chat/completions endpoint.
 *
 * Designed for zTracker but works for any extension using Connection Manager.
 */

import { extension_settings, getContext } from '../../extensions.js';
import { saveSettingsDebounced } from '../../../script.js';

const MODULE_NAME = 'openrouter-direct';

const defaultSettings = {
    enabled: false,
    apiKey: '',
    model: 'google/gemini-2.5-flash',
    sessionId: '',
    targetProfileId: '',
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

function getSettings() {
    return extension_settings[MODULE_NAME];
}

function initSettings() {
    if (!extension_settings[MODULE_NAME]) {
        extension_settings[MODULE_NAME] = structuredClone(defaultSettings);
    }
    for (const [key, val] of Object.entries(defaultSettings)) {
        if (!(key in extension_settings[MODULE_NAME])) {
            extension_settings[MODULE_NAME][key] = val;
        }
    }

    // Auto-detect zTracker's profile ID if not set
    if (!extension_settings[MODULE_NAME].targetProfileId) {
        const ztSettings =
            extension_settings['SillyTavern-zTracker'] ||
            extension_settings['zTracker'];
        if (ztSettings?.profileId) {
            extension_settings[MODULE_NAME].targetProfileId = ztSettings.profileId;
            console.log('[OR-Direct] Auto-detected zTracker profile ID:', ztSettings.profileId);
        }
    }
}

// ---------------------------------------------------------------------------
// Monkey-patch ConnectionManagerRequestService.sendRequest
// ---------------------------------------------------------------------------

let patched = false;
let originalSendRequest = null;

function patchSendRequest() {
    if (patched) return;

    const ctx = getContext();
    const CMRS = ctx?.ConnectionManagerRequestService;
    if (!CMRS || typeof CMRS.sendRequest !== 'function') {
        console.warn('[OR-Direct] ConnectionManagerRequestService not found in context, retrying in 2s...');
        setTimeout(patchSendRequest, 2000);
        return;
    }

    originalSendRequest = CMRS.sendRequest.bind(CMRS);

    CMRS.sendRequest = async function (profileId, prompt, maxTokens, custom = {}, overridePayload = {}) {
        const settings = getSettings();

        // Pass through to original if not enabled or no API key
        if (!settings?.enabled || !settings?.apiKey) {
            return originalSendRequest(profileId, prompt, maxTokens, custom, overridePayload);
        }

        // Pass through if targeting a specific profile and this isn't it
        if (settings.targetProfileId && profileId !== settings.targetProfileId) {
            return originalSendRequest(profileId, prompt, maxTokens, custom, overridePayload);
        }

        // Streaming not supported — fall back to original
        if (custom?.stream) {
            console.log('[OR-Direct] Streaming requested — falling back to Connection Manager');
            return originalSendRequest(profileId, prompt, maxTokens, custom, overridePayload);
        }

        // ---- Direct OpenRouter path ----
        const { signal } = { ...{ signal: null }, ...custom };

        console.log('[OR-Direct] Intercepting sendRequest');
        console.log('[OR-Direct]   Model :', settings.model);
        console.log('[OR-Direct]   Session:', settings.sessionId || '(none)');
        console.log('[OR-Direct]   Tokens :', maxTokens);

        // Build messages array (OpenRouter chat completions format)
        let messages;
        if (Array.isArray(prompt)) {
            messages = prompt.map(m => ({
                role: m.role || 'user',
                content: m.content || '',
            }));
        } else {
            messages = [{ role: 'user', content: String(prompt) }];
        }

        const body = {
            model: settings.model,
            messages,
            max_tokens: maxTokens,
            stream: false,
            ...(settings.sessionId ? { session_id: settings.sessionId } : {}),
        };

        console.log(`[OR-Direct] Sending ${messages.length} messages to OpenRouter...`);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-OpenRouter-Title': 'SillyTavern-zTracker',
            },
            body: JSON.stringify(body),
            signal: signal,
        });

        const json = await response.json();

        if (!response.ok || json.error) {
            const errorMsg = json.error?.message || json.error?.code || JSON.stringify(json.error) || `HTTP ${response.status}`;
            console.error('[OR-Direct] API Error:', errorMsg);
            throw new Error(`OpenRouter: ${errorMsg}`);
        }

        const content = json.choices?.[0]?.message?.content || '';
        const reasoning = json.choices?.[0]?.message?.reasoning_content || '';

        console.log(`[OR-Direct] Response: ${content.length} chars content, ${reasoning.length} chars reasoning`);

        // Return in ExtractedData format (what zTracker expects)
        return { content, reasoning };
    };

    patched = true;
    console.log('[OR-Direct] Patched sendRequest — direct OpenRouter calls active');
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

jQuery(async () => {
    initSettings();

    // Patch immediately, then retry if context wasn't ready
    patchSendRequest();

    const settings = getSettings();

    const html = `
    <div class="openrouter-direct-settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>OpenRouter Direct</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <div class="flex-container flexFlowColumn" style="gap: 6px;">
                    <small style="color: #888; margin-bottom: 4px;">
                        Bypasses Connection Manager presets and calls OpenRouter directly.<br>
                        Works with zTracker and any extension that uses Connection Manager profiles.
                    </small>

                    <label class="checkbox_label" style="margin-bottom: 4px;">
                        <input type="checkbox" id="ord_enabled" ${settings.enabled ? 'checked' : ''} />
                        <span>Enable Direct OpenRouter</span>
                    </label>

                    <label for="ord_apiKey">
                        <small>API Key</small>
                    </label>
                    <div style="display:flex; gap:4px;">
                        <input type="text" id="ord_apiKey" class="text_pole" style="flex:1"
                            value="${settings.apiKey}" placeholder="sk-or-v1-..." />
                        <div id="ord_toggleKey" class="menu_button" title="Show/hide key" style="width:30px; text-align:center;">
                            <i class="fa-solid fa-eye"></i>
                        </div>
                    </div>

                    <label for="ord_model">
                        <small>Model</small>
                    </label>
                    <input type="text" id="ord_model" class="text_pole"
                        value="${settings.model}" placeholder="google/gemini-2.5-flash" />

                    <label for="ord_sessionId">
                        <small>Session Name <span style="color:#888">(optional &mdash; groups requests in OpenRouter dashboard)</span></small>
                    </label>
                    <input type="text" id="ord_sessionId" class="text_pole"
                        value="${settings.sessionId}" placeholder="drake-group-rp" />

                    <label for="ord_targetProfileId">
                        <small>Target Profile ID <span style="color:#888">(leave empty to intercept all)</span></small>
                    </label>
                    <input type="text" id="ord_targetProfileId" class="text_pole" style="font-family: monospace; font-size: 12px;"
                        value="${settings.targetProfileId}" placeholder="auto-detected from zTracker" />

                    <div id="ord_status" style="margin-top: 6px; padding: 6px; border-radius: 4px; font-size: 12px;"></div>

                    <div style="display: flex; gap: 6px; margin-top: 4px;">
                        <div id="ord_testBtn" class="menu_button" style="flex:1; text-align:center;">
                            <i class="fa-solid fa-flask"></i> Test Connection
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    $('#extensions_settings2').append(html);
    updateStatus();

    // ---- Event handlers ----

    $('#ord_enabled').on('change', function () {
        settings.enabled = $(this).prop('checked');
        saveSettingsDebounced();
        updateStatus();
    });

    $('#ord_apiKey').on('input', function () {
        settings.apiKey = String($(this).val());
        saveSettingsDebounced();
        updateStatus();
    });

    $('#ord_toggleKey').on('click', function () {
        const input = $('#ord_apiKey');
        const icon = $(this).find('i');
        if (input.attr('type') === 'password') {
            input.attr('type', 'text');
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            input.attr('type', 'password');
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });

    $('#ord_model').on('input', function () {
        settings.model = String($(this).val()).trim();
        saveSettingsDebounced();
        updateStatus();
    });

    $('#ord_sessionId').on('input', function () {
        settings.sessionId = String($(this).val()).trim();
        saveSettingsDebounced();
    });

    $('#ord_targetProfileId').on('input', function () {
        settings.targetProfileId = String($(this).val()).trim();
        saveSettingsDebounced();
    });

    $('#ord_testBtn').on('click', testConnection);
});

function updateStatus() {
    const s = getSettings();
    const el = $('#ord_status');
    if (!el.length) return;

    if (!s.enabled) {
        el.css({ background: '#333', color: '#999' }).text('Disabled — using Connection Manager profiles.');
    } else if (!s.apiKey) {
        el.css({ background: '#553300', color: '#ffaa44' }).text('Enter an API key to enable.');
    } else if (!s.model) {
        el.css({ background: '#553300', color: '#ffaa44' }).text('Enter a model name.');
    } else {
        el.css({ background: '#1a3a1a', color: '#66cc66' }).text(`Active — routing to ${s.model}`);
    }
}

async function testConnection() {
    const s = getSettings();
    const el = $('#ord_status');

    if (!s.apiKey) {
        el.css({ background: '#553300', color: '#ffaa44' }).text('Need an API key first.');
        return;
    }

    el.css({ background: '#1a2a4a', color: '#88aaff' }).text('Testing...');

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${s.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-OpenRouter-Title': 'SillyTavern-zTracker',
            },
            body: JSON.stringify({
                model: s.model,
                messages: [{ role: 'user', content: 'Reply with only the word OK.' }],
                max_tokens: 10,
                ...(s.sessionId ? { session_id: s.sessionId } : {}),
            }),
        });

        const json = await response.json();

        if (!response.ok || json.error) {
            const msg = json.error?.message || json.error?.code || JSON.stringify(json.error);
            el.css({ background: '#4a1a1a', color: '#ff6666' }).text(`Error: ${msg}`);
            return;
        }

        const reply = json.choices?.[0]?.message?.content || '(empty)';
        const model = json.model || s.model;
        el.css({ background: '#1a3a1a', color: '#66cc66' }).text(`Connected! Model: ${model} — Reply: "${reply.slice(0, 50)}"`);
    } catch (err) {
        el.css({ background: '#4a1a1a', color: '#ff6666' }).text(`Network error: ${err.message}`);
    }
}
