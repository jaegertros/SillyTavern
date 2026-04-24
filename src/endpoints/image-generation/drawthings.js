/**
 * Image generation backend: drawthings — extracted from stable-diffusion.js
 */

import express from 'express';
import fetch from 'node-fetch';

import { getBasicAuthHeader } from '../../util.js';

export const router = express.Router();

router.post('/ping', async (request, response) => {
    try {
        const url = new URL(request.body.url);
        url.pathname = '/';

        const result = await fetch(url, {
            method: 'HEAD',
        });

        if (!result.ok) {
            throw new Error('SD DrawThings API returned an error.');
        }

        return response.sendStatus(200);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/get-model', async (request, response) => {
    try {
        const url = new URL(request.body.url);
        url.pathname = '/';

        const result = await fetch(url, {
            method: 'GET',
        });

        /** @type {any} */
        const data = await result.json();

        return response.send(data.model);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/get-upscaler', async (request, response) => {
    try {
        const url = new URL(request.body.url);
        url.pathname = '/';

        const result = await fetch(url, {
            method: 'GET',
        });

        /** @type {any} */
        const data = await result.json();

        return response.send(data.upscaler);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/generate', async (request, response) => {
    try {
        console.debug('SD DrawThings API request:', request.body);

        const url = new URL(request.body.url);
        url.pathname = '/sdapi/v1/txt2img';

        const body = { ...request.body };
        const auth = getBasicAuthHeader(request.body.auth);
        delete body.url;
        delete body.auth;

        const result = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': auth,
            },
        });

        if (!result.ok) {
            const text = await result.text();
            throw new Error('SD DrawThings API returned an error.', { cause: text });
        }

        const data = await result.json();
        return response.send(data);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});
