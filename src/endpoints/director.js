import express from 'express';
import fetch from 'node-fetch';
import { readSecret, SECRET_KEYS } from '../endpoints/secrets.js';

export const router = express.Router();

router.post('/generate', async (request, response) => {
    try {
        const { model, messages, max_tokens = 200, temperature = 0.3, api_key } = request.body;

        // Use extension-provided key first, fall back to main OpenRouter key
        const apiKey = api_key || readSecret(request.user.directories, SECRET_KEYS.OPENROUTER);

        if (!apiKey) {
            return response.status(400).json({ error: 'No OpenRouter API key configured. Set one in ST Director settings or in the main OpenRouter connection.' });
        }

        if (!model || !messages) {
            return response.status(400).json({ error: 'Missing required fields: model, messages' });
        }

        const result = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost',
                'X-Title': 'SillyTavern Director',
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens,
                temperature,
            }),
        });

        if (!result.ok) {
            const errorText = await result.text();
            console.error('Director API error:', result.status, errorText);
            return response.status(result.status).json({ error: `OpenRouter API error: ${result.status}` });
        }

        const data = await result.json();
        const text = data?.choices?.[0]?.message?.content || '';
        return response.json({ text });
    } catch (error) {
        console.error('Director generation failed:', error);
        return response.status(500).json({ error: 'Director generation failed' });
    }
});
