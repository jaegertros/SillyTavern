/**
 * Image generation backend: bfl — extracted from stable-diffusion.js
 */

import express from 'express';
import fetch from 'node-fetch';

import { delay } from '../../util.js';
import { readSecret, SECRET_KEYS } from '../secrets.js';

export const router = express.Router();

router.post('/generate', async (request, response) => {
    try {
        const key = readSecret(request.user.directories, SECRET_KEYS.BFL);

        if (!key) {
            console.warn('BFL key not found.');
            return response.sendStatus(400);
        }

        const requestBody = {
            prompt: request.body.prompt,
            steps: request.body.steps,
            guidance: request.body.guidance,
            width: request.body.width,
            height: request.body.height,
            prompt_upsampling: request.body.prompt_upsampling,
            seed: request.body.seed ?? null,
            safety_tolerance: 6, // being least strict
            output_format: 'jpeg',
        };

        function getClosestAspectRatio(width, height) {
            const minAspect = 9 / 21;
            const maxAspect = 21 / 9;
            const currentAspect = width / height;

            const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
            const simplifyRatio = (w, h) => {
                const divisor = gcd(w, h);
                return `${w / divisor}:${h / divisor}`;
            };

            if (currentAspect < minAspect) {
                const adjustedHeight = Math.round(width / minAspect);
                return simplifyRatio(width, adjustedHeight);
            } else if (currentAspect > maxAspect) {
                const adjustedWidth = Math.round(height * maxAspect);
                return simplifyRatio(adjustedWidth, height);
            } else {
                return simplifyRatio(width, height);
            }
        }

        if (String(request.body.model).endsWith('-ultra')) {
            requestBody.aspect_ratio = getClosestAspectRatio(request.body.width, request.body.height);
            delete requestBody.steps;
            delete requestBody.guidance;
            delete requestBody.width;
            delete requestBody.height;
            delete requestBody.prompt_upsampling;
        }

        if (String(request.body.model).endsWith('-pro-1.1')) {
            delete requestBody.steps;
            delete requestBody.guidance;
        }

        console.debug('BFL request:', requestBody);

        const result = await fetch(`https://api.bfl.ml/v1/${request.body.model}`, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-Type': 'application/json',
                'x-key': key,
            },
        });

        if (!result.ok) {
            console.warn('BFL returned an error.');
            return response.sendStatus(500);
        }

        /** @type {any} */
        const taskData = await result.json();
        const { id } = taskData;

        const MAX_ATTEMPTS = 100;
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
            await delay(2500);

            const statusResult = await fetch(`https://api.bfl.ml/v1/get_result?id=${id}`);

            if (!statusResult.ok) {
                const text = await statusResult.text();
                console.warn('BFL returned an error.', text);
                return response.sendStatus(500);
            }

            /** @type {any} */
            const statusData = await statusResult.json();

            if (statusData?.status === 'Pending') {
                continue;
            }

            if (statusData?.status === 'Ready') {
                const { sample } = statusData.result;
                const fetchResult = await fetch(sample);
                const fetchData = await fetchResult.arrayBuffer();
                const image = Buffer.from(fetchData).toString('base64');
                return response.send({ image: image });
            }

            throw new Error('BFL failed to generate image.', { cause: statusData });
        }
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});
