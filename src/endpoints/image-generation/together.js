/**
 * Image generation backend: together — extracted from stable-diffusion.js
 */

import express from 'express';
import fetch from 'node-fetch';

import { readSecret, SECRET_KEYS } from '../secrets.js';

export const router = express.Router();

router.post('/models', async (request, response) => {
    try {
        const key = readSecret(request.user.directories, SECRET_KEYS.TOGETHERAI);

        if (!key) {
            console.warn('TogetherAI key not found.');
            return response.sendStatus(400);
        }

        const modelsResponse = await fetch('https://api.together.xyz/api/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${key}`,
            },
        });

        if (!modelsResponse.ok) {
            console.warn('TogetherAI returned an error.');
            return response.sendStatus(500);
        }

        const data = await modelsResponse.json();

        if (!Array.isArray(data)) {
            console.warn('TogetherAI returned invalid data.');
            return response.sendStatus(500);
        }

        const models = data
            .filter(x => x.type === 'image')
            .map(x => ({ value: x.id, text: x.display_name }));

        return response.send(models);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/generate', async (request, response) => {
    try {
        const key = readSecret(request.user.directories, SECRET_KEYS.TOGETHERAI);

        if (!key) {
            console.warn('TogetherAI key not found.');
            return response.sendStatus(400);
        }

        console.debug('TogetherAI request:', request.body);

        const result = await fetch('https://api.together.xyz/v1/images/generations', {
            method: 'POST',
            body: JSON.stringify({
                prompt: request.body.prompt,
                negative_prompt: request.body.negative_prompt,
                height: request.body.height,
                width: request.body.width,
                model: request.body.model,
                steps: request.body.steps,
                n: 1,
                // Limited to 10000 on playground, works fine with more.
                seed: request.body.seed >= 0 ? request.body.seed : Math.floor(Math.random() * 10_000_000),
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
            },
        });

        if (!result.ok) {
            console.warn('TogetherAI returned an error.', { body: await result.text() });
            return response.sendStatus(500);
        }

        /** @type {any} */
        const data = await result.json();
        console.debug('TogetherAI response:', data);

        const choice = data?.data?.[0];
        let b64_json = choice.b64_json;

        if (!b64_json) {
            const buffer = await (await fetch(choice.url)).arrayBuffer();
            b64_json = Buffer.from(buffer).toString('base64');
        }

        return response.send({ format: 'jpg', data: b64_json });
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});
