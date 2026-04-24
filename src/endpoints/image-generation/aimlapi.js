/**
 * Image generation backend: aimlapi — extracted from stable-diffusion.js
 */

import express from 'express';
import fetch from 'node-fetch';

import { readSecret, SECRET_KEYS } from '../secrets.js';
import { AIMLAPI_HEADERS } from '../../constants.js';

export const router = express.Router();

router.post('/models', async (request, response) => {
    try {
        const key = readSecret(request.user.directories, SECRET_KEYS.AIMLAPI);

        if (!key) {
            console.warn('AI/ML API key not found.');
            return response.sendStatus(400);
        }

        const modelsResponse = await fetch('https://api.aimlapi.com/v1/models', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${key}`,
            },
        });

        if (!modelsResponse.ok) {
            console.warn('AI/ML API returned an error.');
            return response.sendStatus(500);
        }

        /** @type {any} */
        const data = await modelsResponse.json();
        const models = (data.data || [])
            .filter(model =>
                model.type === 'image' &&
                model.id !== 'triposr' &&
                model.id !== 'flux/dev/image-to-image',
            )
            .map(model => ({
                value: model.id,
                text: model.info?.name || model.id,
            }));

        return response.send({ data: models });
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/generate-image', async (req, res) => {
    try {
        const key = readSecret(req.user.directories, SECRET_KEYS.AIMLAPI);
        if (!key) return res.sendStatus(400);

        console.debug('AI/ML API image request:', req.body);

        const apiRes = await fetch('https://api.aimlapi.com/v1/images/generations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, ...AIMLAPI_HEADERS },
            body: JSON.stringify(req.body),
        });
        if (!apiRes.ok) {
            const err = await apiRes.text();
            return res.status(500).send(err);
        }
        /** @type {any} */
        const data = await apiRes.json();

        const imgObj = Array.isArray(data.images) ? data.images[0] : data.data?.[0];
        if (!imgObj) return res.status(500).send('No image returned');

        let base64;
        if (imgObj.b64_json || imgObj.base64) {
            base64 = imgObj.b64_json || imgObj.base64;
        } else if (imgObj.url) {
            const blobRes = await fetch(imgObj.url);
            if (!blobRes.ok) throw new Error('Failed to fetch image URL');
            const buffer = await blobRes.arrayBuffer();
            base64 = Buffer.from(buffer).toString('base64');
        } else {
            throw new Error('Unsupported image format');
        }

        return res.json({ format: 'png', data: base64 });
    } catch (e) {
        console.error(e);
        res.status(500).send('Internal error');
    }
});
