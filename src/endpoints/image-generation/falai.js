/**
 * Image generation backend: falai — extracted from stable-diffusion.js
 */

import express from 'express';
import fetch from 'node-fetch';

import { delay } from '../../util.js';
import { readSecret, SECRET_KEYS } from '../secrets.js';

export const router = express.Router();

router.post('/models', async (_request, response) => {
    try {
        const modelsUrl = new URL('https://fal.ai/api/models?categories=text-to-image');
        let page = 1;
        /** @type {any} */
        let modelsResponse;
        let models = [];

        do {
            modelsUrl.searchParams.set('page', page.toString());
            const result = await fetch(modelsUrl);

            if (!result.ok) {
                console.warn('FAL.AI returned an error.', result.status, result.statusText);
                throw new Error('FAL.AI request failed.');
            }

            modelsResponse = await result.json();
            if (!('items' in modelsResponse) || !Array.isArray(modelsResponse.items)) {
                console.warn('FAL.AI returned invalid data.');
                throw new Error('FAL.AI request failed.');
            }

            models = models.concat(
                modelsResponse.items.filter(
                    x => (
                        !x.title.toLowerCase().includes('inpainting') &&
                        !x.title.toLowerCase().includes('control') &&
                        !x.title.toLowerCase().includes('upscale') &&
                        !x.title.toLowerCase().includes('lora')
                    ),
                ),
            );

            page = modelsResponse.page + 1;
        } while (modelsResponse != null && page < modelsResponse.pages);

        const modelOptions = models
            .sort((a, b) => a.title.localeCompare(b.title))
            .map(x => ({ value: x.modelUrl.split('fal-ai/')[1], text: x.title }))
            .map(x => ({ ...x, text: `${x.text} (${x.value})` }));
        return response.send(modelOptions);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/generate', async (request, response) => {
    try {
        const key = readSecret(request.user.directories, SECRET_KEYS.FALAI);

        if (!key) {
            console.warn('FAL.AI key not found.');
            return response.sendStatus(400);
        }

        const requestBody = {
            prompt: request.body.prompt,
            image_size: { 'width': request.body.width, 'height': request.body.height },
            num_inference_steps: request.body.steps,
            seed: request.body.seed ?? null,
            guidance_scale: request.body.guidance,
            enable_safety_checker: false, // Disable general safety checks
            safety_tolerance: 6, // Make Flux the least strict
        };

        console.debug('FAL.AI request:', requestBody);

        const result = await fetch(`https://queue.fal.run/fal-ai/${request.body.model}`, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Key ${key}`,
            },
        });

        if (!result.ok) {
            console.warn('FAL.AI returned an error.');
            return response.sendStatus(500);
        }

        /** @type {any} */
        const taskData = await result.json();
        const { status_url } = taskData;

        const MAX_ATTEMPTS = 100;
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
            await delay(2500);

            const statusResult = await fetch(status_url, {
                headers: {
                    'Authorization': `Key ${key}`,
                },
            });

            if (!statusResult.ok) {
                const text = await statusResult.text();
                console.warn('FAL.AI returned an error.', text);
                return response.sendStatus(500);
            }

            /** @type {any} */
            const statusData = await statusResult.json();

            if (statusData?.status === 'IN_QUEUE' || statusData?.status === 'IN_PROGRESS') {
                continue;
            }

            if (statusData?.status === 'COMPLETED') {
                const resultFetch = await fetch(statusData?.response_url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Key ${key}`,
                    },
                });
                /** @type {any} */
                const resultData = await resultFetch.json();

                if (resultData.detail !== null && resultData.detail !== undefined) {
                    throw new Error('FAL.AI failed to generate image.', { cause: `${resultData.detail[0].loc[1]}: ${resultData.detail[0].msg}` });
                }

                const imageFetch = await fetch(resultData?.images[0].url, {
                    headers: {
                        'Authorization': `Key ${key}`,
                    },
                });

                const fetchData = await imageFetch.arrayBuffer();
                const image = Buffer.from(fetchData).toString('base64');
                return response.send({ image: image });
            }

            throw new Error('FAL.AI failed to generate image.', { cause: statusData });
        }
    } catch (error) {
        console.error(error);
        return response.status(500).send(error.cause || error.message);
    }
});
