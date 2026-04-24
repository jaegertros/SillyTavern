/**
 * Image generation backend: stability — extracted from stable-diffusion.js
 */

import express from 'express';
import fetch from 'node-fetch';
import FormData from 'form-data';

import { readSecret, SECRET_KEYS } from '../secrets.js';

export const router = express.Router();

router.post('/generate', async (request, response) => {
    try {
        const key = readSecret(request.user.directories, SECRET_KEYS.STABILITY);

        if (!key) {
            console.warn('Stability AI key not found.');
            return response.sendStatus(400);
        }

        const { payload, model } = request.body;

        console.debug('Stability AI request:', model, payload);

        const formData = new FormData();
        for (const [key, value] of Object.entries(payload)) {
            if (value !== undefined) {
                formData.append(key, String(value));
            }
        }

        let apiUrl;
        switch (model) {
            case 'stable-image-ultra':
                apiUrl = 'https://api.stability.ai/v2beta/stable-image/generate/ultra';
                break;
            case 'stable-image-core':
                apiUrl = 'https://api.stability.ai/v2beta/stable-image/generate/core';
                break;
            case 'stable-diffusion-3':
                apiUrl = 'https://api.stability.ai/v2beta/stable-image/generate/sd3';
                break;
            default:
                throw new Error('Invalid Stability AI model selected');
        }

        const result = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Accept': 'image/*',
            },
            body: formData,
        });

        if (!result.ok) {
            const text = await result.text();
            console.warn('Stability AI returned an error.', result.status, result.statusText, text);
            return response.sendStatus(500);
        }

        const buffer = await result.arrayBuffer();
        return response.send(Buffer.from(buffer).toString('base64'));
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});
