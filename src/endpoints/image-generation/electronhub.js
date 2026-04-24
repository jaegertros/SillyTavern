/**
 * Image generation backend: electronhub — extracted from stable-diffusion.js
 */

import express from 'express';
import fetch from 'node-fetch';

import { readSecret, SECRET_KEYS } from '../secrets.js';

export const router = express.Router();

router.post('/models', async (request, response) => {
    try {
        const key = readSecret(request.user.directories, SECRET_KEYS.ELECTRONHUB);

        if (!key) {
            console.warn('Electron Hub key not found.');
            return response.sendStatus(400);
        }

        const modelsResponse = await fetch('https://api.electronhub.ai/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
        });

        if (!modelsResponse.ok) {
            console.warn('Electron Hub returned an error.');
            return response.sendStatus(500);
        }

        /** @type {any} */
        const data = await modelsResponse.json();

        if (!Array.isArray(data?.data)) {
            console.warn('Electron Hub returned invalid data.');
            return response.sendStatus(500);
        }

        const models = data.data
            .filter(x => x && Array.isArray(x.endpoints) && x.endpoints.includes('/v1/images/generations'))
            .map(x => ({ ...x, value: x.id, text: x.name }));
        return response.send(models);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/generate', async (request, response) => {
    try {
        const key = readSecret(request.user.directories, SECRET_KEYS.ELECTRONHUB);

        if (!key) {
            console.warn('Electron Hub key not found.');
            return response.sendStatus(400);
        }

        let bodyParams = {
            model: request.body.model,
            prompt: request.body.prompt,
            response_format: 'b64_json',
        };

        if (request.body.size) {
            bodyParams.size = request.body.size;
        }

        if (request.body.quality) {
            bodyParams.quality = request.body.quality;
        }

        console.debug('Electron Hub request:', bodyParams);

        const result = await fetch('https://api.electronhub.ai/v1/images/generations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...bodyParams,
            }),
        });

        if (!result.ok) {
            const errorText = await result.text();
            console.warn('Electron Hub returned an error.', result.status, result.statusText, errorText);
            return response.sendStatus(500);
        }

        /** @type {any} */
        const data = await result.json();
        const image = data?.data?.[0]?.b64_json;

        if (!image) {
            console.warn('Electron Hub returned invalid data.');
            return response.sendStatus(500);
        }

        return response.send({ image });
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/sizes', async (request, response) => {
    const result = await fetch(`https://api.electronhub.ai/v1/models/${request.body.model}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!result.ok) {
        console.warn('Electron Hub returned an error.');
        return response.sendStatus(500);
    }

    /** @type {any} */
    const data = await result.json();

    const sizes = data.sizes;

    if (!sizes) {
        console.warn('Electron Hub returned invalid data.');
        return response.sendStatus(500);
    }

    return response.send({ sizes });
});
