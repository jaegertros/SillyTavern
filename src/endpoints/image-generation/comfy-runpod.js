/**
 * Image generation backend: comfyRunPod — extracted from stable-diffusion.js
 */

import path from 'node:path';
import express from 'express';
import fetch from 'node-fetch';
import urlJoin from 'url-join';

import { delay, tryParse } from '../../util.js';
import { readSecret, SECRET_KEYS } from '../secrets.js';

export const router = express.Router();

router.post('/ping', async (request, response) => {
    try {
        const key = readSecret(request.user.directories, SECRET_KEYS.COMFY_RUNPOD);

        if (!key) {
            console.warn('RunPod key not found.');
            return response.sendStatus(400);
        }

        const url = new URL(urlJoin(request.body.url, '/health'));

        const result = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${key}` },
        });
        if (!result.ok) {
            throw new Error('ComfyUI returned an error.');
        }
        /** @type {any} */
        const data = await result.json();
        if (data.workers.ready <= 0) {
            console.warn(`No workers reported as ready. ${result}`);
        }

        return response.sendStatus(200);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/generate', async (request, response) => {
    try {
        const key = readSecret(request.user.directories, SECRET_KEYS.COMFY_RUNPOD);

        if (!key) {
            console.warn('RunPod key not found.');
            return response.sendStatus(400);
        }

        let jobId;
        let item;
        const url = new URL(urlJoin(request.body.url, '/run'));

        const controller = new AbortController();
        request.socket.removeAllListeners('close');
        request.socket.on('close', function () {
            if (!response.writableEnded && !item) {
                const interruptUrl = new URL(urlJoin(request.body.url, `/cancel/${jobId}`));
                fetch(interruptUrl, { method: 'POST', headers: { 'Authorization': `Bearer ${key}` } });
            }
            controller.abort();
        });
        const workflow = JSON.parse(request.body.prompt).prompt;
        const wrappedWorkflow = workflow?.input?.workflow ? workflow : ({ input: { workflow: workflow } });
        const runpodPrompt = JSON.stringify(wrappedWorkflow);

        console.debug('ComfyUI RunPod request:', wrappedWorkflow);

        const promptResult = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${key}` },
            body: runpodPrompt,
        });
        if (!promptResult.ok) {
            const text = await promptResult.text();
            throw new Error('ComfyUI returned an error.', { cause: tryParse(text) });
        }

        /** @type {any} */
        const data = await promptResult.json();
        jobId = data.id;
        const statusUrl = new URL(urlJoin(request.body.url, `/status/${jobId}`));
        while (true) {
            const result = await fetch(statusUrl, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${key}` },
            });
            if (!result.ok) {
                throw new Error('ComfyUI returned an error.');
            }
            /** @type {any} */
            const status = await result.json();
            if (status.output) {
                item = status.output.images[0];
            }
            if (item) {
                break;
            }
            await delay(500);
        }
        const format = path.extname(item.filename).slice(1).toLowerCase() || 'png';
        return response.send({ format: format, data: item.data });
    } catch (error) {
        console.error('ComfyUI error:', error);
        response.status(500).send(error.message);
        return response;
    }
});
