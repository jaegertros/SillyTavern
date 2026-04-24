/**
 * Image generation backend: zai — extracted from stable-diffusion.js
 */

import path from 'node:path';
import express from 'express';
import fetch from 'node-fetch';

import { delay, isValidUrl } from '../../util.js';
import { readSecret, SECRET_KEYS } from '../secrets.js';

export const router = express.Router();

router.post('/generate', async (request, response) => {
    try {
        const key = readSecret(request.user.directories, SECRET_KEYS.ZAI);

        if (!key) {
            console.warn('Z.AI key not found.');
            return response.sendStatus(400);
        }

        console.debug('Z.AI image request:', request.body);

        // Always use Common API for image generation (Coding API has stricter rate limits)
        const generateResponse = await fetch('https://api.z.ai/api/paas/v4/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
            },
            body: JSON.stringify({
                prompt: request.body.prompt,
                model: request.body.model,
                quality: request.body.quality,
                size: request.body.size,
            }),
        });

        if (!generateResponse.ok) {
            const text = await generateResponse.text();
            console.warn('Z.AI returned an error.', text);
            return response.sendStatus(500);
        }

        /** @type {any} */
        const data = await generateResponse.json();
        console.debug('Z.AI image response:', data);

        const url = data?.data?.[0]?.url;
        if (!url || !isValidUrl(url) || !new URL(url).hostname.endsWith('.z.ai')) {
            console.warn('Z.AI returned an invalid image URL.');
            return response.sendStatus(500);
        }

        const imageResponse = await fetch(url);
        if (!imageResponse.ok) {
            console.warn('Z.AI image fetch returned an error. Status:', imageResponse.status, imageResponse.statusText);
            return response.sendStatus(500);
        }

        const buffer = await imageResponse.arrayBuffer();
        const image = Buffer.from(buffer).toString('base64');
        const format = path.extname(url).substring(1).toLowerCase() || 'png';

        return response.send({ image, format });
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/generate-video', async (request, response) => {
    try {
        const controller = new AbortController();
        request.socket.removeAllListeners('close');
        request.socket.on('close', function () {
            controller.abort();
        });

        const key = readSecret(request.user.directories, SECRET_KEYS.ZAI);

        if (!key) {
            console.warn('Z.AI key not found.');
            return response.sendStatus(400);
        }

        console.debug('Z.AI video request:', request.body);

        const generateResponse = await fetch('https://api.z.ai/api/paas/v4/videos/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
            },
            body: JSON.stringify({
                prompt: request.body.prompt,
                model: request.body.model,
                quality: request.body.quality,
                size: request.body.size,
                aspect_ratio: request.body.aspect_ratio,
            }),
            signal: controller.signal,
        });

        if (!generateResponse.ok) {
            const text = await generateResponse.text();
            console.warn('Z.AI returned an error.', text);
            return response.sendStatus(500);
        }

        /** @type {any} */
        const data = await generateResponse.json();
        console.debug('Z.AI video response:', data);

        // Poll for video generation completion
        for (let attempt = 0; attempt < 30; attempt++) {
            if (controller.signal.aborted) {
                console.info('Z.AI video generation aborted by client');
                return response.status(500).send('Video generation aborted by client');
            }

            await delay(5000 + attempt * 1000);
            console.debug(`Polling Z.AI video job ${data.id}, attempt ${attempt + 1}`);

            const pollResponse = await fetch(`https://api.z.ai/api/paas/v4/async-result/${data.id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${key}`,
                },
            });

            if (!pollResponse.ok) {
                const text = await pollResponse.text();
                console.warn('Z.AI video job polling failed', pollResponse.statusText, text);
                return response.status(500).send(text);
            }

            /** @type {any} */
            const pollResult = await pollResponse.json();
            console.debug(`Z.AI video job status: ${pollResult.task_status}`);

            if (pollResult.task_status === 'FAIL') {
                console.warn('Z.AI video generation failed', pollResult);
                return response.status(500).send('Video generation failed');
            }

            if (pollResult.task_status === 'SUCCESS') {
                console.debug('Z.AI video generation succeeded', pollResult);
                const url = pollResult?.video_result?.[0]?.url;

                if (!url || !isValidUrl(url)) {
                    console.warn('Z.AI returned an invalid video URL.');
                    return response.sendStatus(500);
                }

                const contentResponse = await fetch(url);
                if (!contentResponse.ok) {
                    const text = await contentResponse.text();
                    console.warn('Z.AI video content fetch failed', contentResponse.statusText, text);
                    return response.status(500).send(text);
                }

                const contentBuffer = await contentResponse.arrayBuffer();
                return response.send({ format: 'mp4', video: Buffer.from(contentBuffer).toString('base64') });
            }
        }
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});
