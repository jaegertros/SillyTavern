import express from 'express';
import fetch from 'node-fetch';
import { readSecret, SECRET_KEYS } from '../endpoints/secrets.js';

export const router = express.Router();

/**
 * Director proxy. Dispatches the director prompt to one of three providers
 * based on the `provider` field and returns a uniform { text } response.
 *
 * Request body:
 *   provider:     'openrouter' | 'koboldcpp' | 'custom'   (default: openrouter)
 *   url:          endpoint URL (required for koboldcpp and custom)
 *   model:        model ID (openrouter / custom; ignored for koboldcpp)
 *   messages:     OpenAI-style [{role, content}] — flattened for koboldcpp
 *   api_key:      optional; for openrouter, falls back to the stored secret
 *   max_tokens:   default 400
 *   temperature:  default 0.3
 */
router.post('/generate', async (request, response) => {
    try {
        const {
            provider = 'openrouter',
            url = '',
            model,
            messages,
            max_tokens = 400,
            temperature = 0.3,
            api_key,
            session_id,
        } = request.body;

        if (!messages || !Array.isArray(messages)) {
            return response.status(400).json({ error: 'Missing required field: messages' });
        }

        let endpoint;
        const headers = { 'Content-Type': 'application/json' };
        let body;

        if (provider === 'openrouter') {
            const apiKey = api_key || readSecret(request.user.directories, SECRET_KEYS.OPENROUTER);
            if (!apiKey) {
                return response.status(400).json({ error: 'No OpenRouter API key configured. Set one in ST Director settings or in the main OpenRouter connection.' });
            }
            if (!model) {
                return response.status(400).json({ error: 'Missing required field: model' });
            }
            endpoint = 'https://openrouter.ai/api/v1/chat/completions';
            headers['Authorization'] = `Bearer ${apiKey}`;
            headers['HTTP-Referer'] = 'http://localhost';
            headers['X-Title'] = 'SillyTavern Director';
            const openrouterBody = { model, messages, max_tokens, temperature };
            if (session_id) openrouterBody.session_id = session_id;
            body = JSON.stringify(openrouterBody);

        } else if (provider === 'koboldcpp') {
            if (!url) {
                return response.status(400).json({ error: 'KoboldCpp requires an endpoint URL.' });
            }
            // Kobold's /api/v1/generate is a flat-prompt endpoint — fold the
            // chat messages into a single prompt string.
            const sys = messages.find(m => m.role === 'system')?.content || '';
            const usr = messages.find(m => m.role === 'user')?.content || '';
            const prompt = sys ? `${sys}\n\n${usr}` : usr;
            endpoint = `${url.replace(/\/+$/, '')}/api/v1/generate`;
            body = JSON.stringify({
                prompt,
                max_length: max_tokens,
                temperature,
                stop_sequence: ['\n\n\n', '```'],
            });

        } else if (provider === 'custom') {
            if (!url) {
                return response.status(400).json({ error: 'Custom provider requires an endpoint URL.' });
            }
            if (!model) {
                return response.status(400).json({ error: 'Custom provider requires a model ID.' });
            }
            endpoint = url;
            if (api_key) headers['Authorization'] = `Bearer ${api_key}`;
            body = JSON.stringify({ model, messages, max_tokens, temperature });

        } else {
            return response.status(400).json({ error: `Unknown provider: ${provider}` });
        }

        const result = await fetch(endpoint, { method: 'POST', headers, body });

        if (!result.ok) {
            const errorText = await result.text();
            console.error(`Director API error (${provider}):`, result.status, errorText);
            return response.status(result.status).json({ error: `${provider} API error: ${result.status}` });
        }

        const data = await result.json();

        // Extract text based on provider response shape.
        const text = provider === 'koboldcpp'
            ? (data?.results?.[0]?.text || '')
            : (data?.choices?.[0]?.message?.content || '');

        return response.json({ text });
    } catch (error) {
        console.error('Director generation failed:', error);
        return response.status(500).json({ error: 'Director generation failed' });
    }
});
