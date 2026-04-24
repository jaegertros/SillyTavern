/**
 * Image generation backend: nanogpt — extracted from stable-diffusion.js
 */

import express from 'express';
import fetch from 'node-fetch';

import { readSecret, SECRET_KEYS } from '../secrets.js';

export const router = express.Router();

router.post('/models', async (request, response) => {
    try {
        const key = readSecret(request.user.directories, SECRET_KEYS.NANOGPT);

        if (!key) {
            console.warn('NanoGPT key not found.');
            return response.sendStatus(400);
        }

        const modelsResponse = await fetch('https://nano-gpt.com/api/models', {
            method: 'GET',
            headers: {
                'x-api-key': key,
                'Content-Type': 'application/json',
            },
        });

        if (!modelsResponse.ok) {
            console.warn('NanoGPT returned an error.');
            return response.sendStatus(500);
        }

        /** @type {any} */
        const data = await modelsResponse.json();
        const imageModels = data?.models?.image;

        if (!imageModels || typeof imageModels !== 'object') {
            console.warn('NanoGPT returned invalid data.');
            return response.sendStatus(500);
        }

        const models = Object.values(imageModels).map(x => ({ value: x.model, text: x.name }));
        return response.send(models);
    }
    catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/generate', async (request, response) => {
    try {
        const key = readSecret(request.user.directories, SECRET_KEYS.NANOGPT);

        if (!key) {
            console.warn('NanoGPT key not found.');
            return response.sendStatus(400);
        }

        console.debug('NanoGPT request:', request.body);

        const result = await fetch('https://nano-gpt.com/api/generate-image', {
            method: 'POST',
            body: JSON.stringify(request.body),
            headers: {
                'x-api-key': key,
                'Content-Type': 'application/json',
            },
        });

        if (!result.ok) {
            console.warn('NanoGPT returned an error.');
            return response.sendStatus(500);
        }

        /** @type {any} */
        const data = await result.json();

        const image = data?.data?.[0]?.b64_json;
        if (!image) {
            console.warn('NanoGPT returned invalid data.');
            return response.sendStatus(500);
        }

        return response.send({ image });
    }
    catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});
