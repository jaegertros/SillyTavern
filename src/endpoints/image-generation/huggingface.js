/**
 * Image generation backend: huggingface — extracted from stable-diffusion.js
 */

import express from 'express';
import fetch from 'node-fetch';

import { readSecret, SECRET_KEYS } from '../secrets.js';

export const router = express.Router();

router.post('/generate', async (request, response) => {
    try {
        const key = readSecret(request.user.directories, SECRET_KEYS.HUGGINGFACE);

        if (!key) {
            console.warn('Hugging Face key not found.');
            return response.sendStatus(400);
        }

        console.debug('Hugging Face request:', request.body);

        const result = await fetch(`https://api-inference.huggingface.co/models/${request.body.model}`, {
            method: 'POST',
            body: JSON.stringify({
                inputs: request.body.prompt,
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
            },
        });

        if (!result.ok) {
            console.warn('Hugging Face returned an error.');
            return response.sendStatus(500);
        }

        const buffer = await result.arrayBuffer();
        return response.send({
            image: Buffer.from(buffer).toString('base64'),
        });
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});
