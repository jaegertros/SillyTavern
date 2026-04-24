/**
 * Image generation backend: sdcpp — extracted from stable-diffusion.js
 */

import express from 'express';
import fetch from 'node-fetch';

export const router = express.Router();

router.post('/ping', async (request, response) => {
    try {
        const url = new URL(request.body.url);
        url.pathname = '/v1/images/generations';

        const result = await fetch(url, { method: 'OPTIONS' });
        if (!result.ok) {
            throw new Error('stable-diffusion.cpp server returned an error.');
        }

        return response.sendStatus(200);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/generate', async (request, response) => {
    try {
        const url = new URL(request.body.url);
        url.pathname = '/sdapi/v1/txt2img';

        const payload = {
            prompt: request.body.prompt,
            negative_prompt: request.body.negative_prompt,
            width: request.body.width,
            height: request.body.height,
            steps: request.body.steps,
            cfg_scale: request.body.cfg_scale,
            seed: request.body.seed,
            batch_size: request.body.batch_size,
            sampler_name: request.body.sampler_name,
            scheduler: request.body.scheduler,
            clip_skip: request.body.clip_skip,
        };

        for (const [key, value] of Object.entries(payload)) {
            if (value === undefined || value === null || value === '') {
                delete payload[key];
            }
        }

        console.debug('stable-diffusion.cpp request:', payload);

        const result = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!result.ok) {
            const text = await result.text();
            throw new Error('stable-diffusion.cpp server returned an error.', { cause: text });
        }

        const data = await result.json();
        return response.send(data);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});
