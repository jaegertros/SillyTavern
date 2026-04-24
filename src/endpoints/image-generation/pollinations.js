/**
 * Image generation backend: pollinations — extracted from stable-diffusion.js
 */

import express from 'express';
import fetch from 'node-fetch';
import mime from 'mime-types';

import { readSecret, SECRET_KEYS } from '../secrets.js';

export const router = express.Router();

router.post('/models', async (_request, response) => {
    try {
        const modelsUrl = new URL('https://gen.pollinations.ai/image/models');
        const result = await fetch(modelsUrl);

        if (!result.ok) {
            console.warn('Pollinations returned an error.', result.status, result.statusText);
            throw new Error('Pollinations request failed.');
        }

        const data = await result.json();

        if (!Array.isArray(data)) {
            console.warn('Pollinations returned invalid data.');
            throw new Error('Pollinations request failed.');
        }

        const models = data.map(x => ({ value: x.name, text: x.name }));
        return response.send(models);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/generate', async (request, response) => {
    try {
        const key = readSecret(request.user.directories, SECRET_KEYS.POLLINATIONS);
        if (!key) {
            console.warn('Pollinations API key not found.');
            return response.sendStatus(400);
        }

        const promptUrl = new URL(`https://gen.pollinations.ai/image/${encodeURIComponent(request.body.prompt)}`);
        const params = new URLSearchParams({
            model: String(request.body.model),
            negative_prompt: String(request.body.negative_prompt),
            seed: String(request.body.seed >= 0 ? request.body.seed : Math.floor(Math.random() * 10_000_000)),
            width: String(request.body.width ?? 1024),
            height: String(request.body.height ?? 1024),
        });
        if (request.body.enhance) {
            params.set('enhance', String(true));
        }
        promptUrl.search = params.toString();

        console.info('Pollinations request URL:', promptUrl.toString());

        const result = await fetch(promptUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${key}`,
            },
        });

        if (!result.ok) {
            const text = await result.text();
            console.warn('Pollinations returned an error.', text);
            throw new Error('Pollinations request failed.');
        }

        const format = result.headers.get('Content-Type')?.toString() || 'image/jpeg';
        const buffer = await result.arrayBuffer();
        return response.send({ image: Buffer.from(buffer).toString('base64'), format: mime.extension(format) || 'jpg' });
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});
