/**
 * Image generation backend: xai — extracted from stable-diffusion.js
 */

import express from 'express';
import fetch from 'node-fetch';

import { readSecret, SECRET_KEYS } from '../secrets.js';

export const router = express.Router();

router.post('/generate', async (request, response) => {
    try {
        const key = readSecret(request.user.directories, SECRET_KEYS.XAI);

        if (!key) {
            console.warn('xAI key not found.');
            return response.sendStatus(400);
        }

        const requestBody = {
            prompt: request.body.prompt,
            model: request.body.model,
            response_format: 'b64_json',
        };

        console.debug('xAI request:', requestBody);

        const result = await fetch('https://api.x.ai/v1/images/generations', {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
            },
        });

        if (!result.ok) {
            const text = await result.text();
            console.warn('xAI returned an error.', text);
            return response.sendStatus(500);
        }

        /** @type {any} */
        const data = await result.json();

        const image = data?.data?.[0]?.b64_json;
        if (!image) {
            console.warn('xAI returned invalid data.');
            return response.sendStatus(500);
        }

        return response.send({ image });
    } catch (error) {
        console.error('Error communicating with xAI', error);
        return response.sendStatus(500);
    }
});
