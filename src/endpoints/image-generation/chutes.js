/**
 * Image generation backend: chutes — extracted from stable-diffusion.js
 */

import express from 'express';
import fetch from 'node-fetch';

import { readSecret, SECRET_KEYS } from '../secrets.js';

export const router = express.Router();

router.post('/models', async (request, response) => {
    try {
        const key = readSecret(request.user.directories, SECRET_KEYS.CHUTES);

        if (!key) {
            console.warn('Chutes key not found.');
            return response.sendStatus(400);
        }

        const modelsResponse = await fetch('https://api.chutes.ai/chutes/?template=diffusion&include_public=true&limit=999', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
        });

        if (!modelsResponse.ok) {
            console.warn('Chutes returned an error.');
            return response.sendStatus(500);
        }

        const data = await modelsResponse.json();

        const chutesData = /** @type {{items: Array<{name: string}>}} */ (data);
        const models = chutesData.items.map(x => ({ value: x.name, text: x.name })).sort((a, b) => a?.text?.localeCompare(b?.text));
        return response.send(models);
    }
    catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/generate', async (request, response) => {
    try {
        const key = readSecret(request.user.directories, SECRET_KEYS.CHUTES);

        if (!key) {
            console.warn('Chutes key not found.');
            return response.sendStatus(400);
        }

        const bodyParams = {
            model: request.body.model,
            prompt: request.body.prompt,
            negative_prompt: request.body.negative_prompt,
            guidance_scale: request.body.guidance_scale || 7.0,
            width: request.body.width || 1024,
            height: request.body.height || 1024,
            num_inference_steps: request.body.steps || 10,
        };

        console.debug('Chutes request:', bodyParams);

        const result = await fetch('https://image.chutes.ai/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyParams),
        });

        if (!result.ok) {
            const text = await result.text();
            console.warn('Chutes returned an error:', text);
            return response.sendStatus(500);
        }

        const buffer = await result.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');

        return response.send({ image: base64 });
    }
    catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});
