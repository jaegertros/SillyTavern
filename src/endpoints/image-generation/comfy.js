/**
 * Image generation backend: comfy — extracted from stable-diffusion.js
 */

import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import fetch from 'node-fetch';
import sanitize from 'sanitize-filename';
import { sync as writeFileAtomicSync } from 'write-file-atomic';
import urlJoin from 'url-join';
import _ from 'lodash';

import { delay, getBasicAuthHeader, tryParse } from '../../util.js';
import { getFileNameValidationFunction } from '../../middleware/validateFileName.js';


/**
 * Gets the comfy workflows.
 * @param {import("../users.js").UserDirectoryList} directories
 * @returns {string[]} List of comfy workflows
 */
function getComfyWorkflows(directories) {
    return fs
        .readdirSync(directories.comfyWorkflows)
        .filter(file => file[0] !== '.' && file.toLowerCase().endsWith('.json'))
        .sort(Intl.Collator().compare);
}

export const router = express.Router();

router.post('/ping', async (request, response) => {
    try {
        const url = new URL(urlJoin(request.body.url, '/system_stats'));

        const result = await fetch(url);
        if (!result.ok) {
            throw new Error('ComfyUI returned an error.');
        }

        return response.sendStatus(200);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/samplers', async (request, response) => {
    try {
        const url = new URL(urlJoin(request.body.url, '/object_info'));

        const result = await fetch(url);
        if (!result.ok) {
            throw new Error('ComfyUI returned an error.');
        }

        /** @type {any} */
        const data = await result.json();
        return response.send(data.KSampler.input.required.sampler_name[0]);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/models', async (request, response) => {
    try {
        const url = new URL(urlJoin(request.body.url, '/object_info'));

        const result = await fetch(url);
        if (!result.ok) {
            throw new Error('ComfyUI returned an error.');
        }
        /** @type {any} */
        const data = await result.json();

        const ckpts = data.CheckpointLoaderSimple.input.required.ckpt_name[0].map(it => ({ value: it, text: it })) || [];
        const unets = data.UNETLoader.input.required.unet_name[0].map(it => ({ value: it, text: `UNet: ${it}` })) || [];

        // load list of GGUF unets from diffusion_models if the loader node is available
        const ggufs = data.UnetLoaderGGUF?.input.required.unet_name[0].map(it => ({ value: it, text: `GGUF: ${it}` })) || [];
        const models = [...ckpts, ...unets, ...ggufs];

        // make the display names of the models somewhat presentable
        models.forEach(it => it.text = it.text.replace(/\.[^.]*$/, '').replace(/_/g, ' '));

        return response.send(models);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/schedulers', async (request, response) => {
    try {
        const url = new URL(urlJoin(request.body.url, '/object_info'));

        const result = await fetch(url);
        if (!result.ok) {
            throw new Error('ComfyUI returned an error.');
        }

        /** @type {any} */
        const data = await result.json();
        return response.send(data.KSampler.input.required.scheduler[0]);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/vaes', async (request, response) => {
    try {
        const url = new URL(urlJoin(request.body.url, '/object_info'));

        const result = await fetch(url);
        if (!result.ok) {
            throw new Error('ComfyUI returned an error.');
        }

        /** @type {any} */
        const data = await result.json();
        return response.send(data.VAELoader.input.required.vae_name[0]);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/workflows', async (request, response) => {
    try {
        const data = getComfyWorkflows(request.user.directories);
        return response.send(data);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/workflow', async (request, response) => {
    try {
        let filePath = path.join(request.user.directories.comfyWorkflows, sanitize(String(request.body.file_name)));
        if (!fs.existsSync(filePath)) {
            filePath = path.join(request.user.directories.comfyWorkflows, 'Default_Comfy_Workflow.json');
        }
        const data = fs.readFileSync(filePath, { encoding: 'utf-8' });
        return response.send(JSON.stringify(data));
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/save-workflow', async (request, response) => {
    try {
        const filePath = path.join(request.user.directories.comfyWorkflows, sanitize(String(request.body.file_name)));
        writeFileAtomicSync(filePath, request.body.workflow, 'utf8');
        const data = getComfyWorkflows(request.user.directories);
        return response.send(data);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/delete-workflow', async (request, response) => {
    try {
        const filePath = path.join(request.user.directories.comfyWorkflows, sanitize(String(request.body.file_name)));
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return response.sendStatus(200);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/rename-workflow', getFileNameValidationFunction('old_name'), getFileNameValidationFunction('new_name'), async (request, response) => {
    try {
        const oldName = sanitize(String(request.body.old_name));
        const newName = sanitize(String(request.body.new_name));

        if (path.extname(oldName).toLowerCase() !== '.json' || path.extname(newName).toLowerCase() !== '.json') {
            return response.status(400).send('Only JSON workflow files are allowed');
        }

        const oldPath = path.join(request.user.directories.comfyWorkflows, oldName);
        const newPath = path.join(request.user.directories.comfyWorkflows, newName);

        if (!fs.existsSync(oldPath)) {
            return response.status(404).send('Workflow not found');
        }

        if (fs.existsSync(newPath)) {
            return response.status(409).send('A workflow with that name already exists');
        }

        fs.renameSync(oldPath, newPath);
        return response.sendStatus(204);
    } catch (error) {
        console.error('ComfyUI workflow rename failed', error);
        return response.sendStatus(500);
    }
});

router.post('/generate', async (request, response) => {
    try {
        let item;
        const url = new URL(urlJoin(request.body.url, '/prompt'));

        const controller = new AbortController();
        request.socket.removeAllListeners('close');
        request.socket.on('close', function () {
            if (!response.writableEnded && !item) {
                const interruptUrl = new URL(urlJoin(request.body.url, '/interrupt'));
                fetch(interruptUrl, { method: 'POST', headers: { 'Authorization': getBasicAuthHeader(request.body.auth) } });
            }
            controller.abort();
        });

        const promptResult = await fetch(url, {
            method: 'POST',
            body: request.body.prompt,
        });
        if (!promptResult.ok) {
            const text = await promptResult.text();
            throw new Error('ComfyUI returned an error.', { cause: tryParse(text) });
        }

        /** @type {any} */
        const data = await promptResult.json();
        const id = data.prompt_id;
        const historyUrl = new URL(urlJoin(request.body.url, '/history'));
        while (true) {
            const result = await fetch(historyUrl);
            if (!result.ok) {
                throw new Error('ComfyUI returned an error.');
            }
            /** @type {any} */
            const history = await result.json();
            item = history[id];
            if (item) {
                break;
            }
            await delay(100);
        }
        if (item.status.status_str === 'error') {
            // Report node tracebacks if available
            const errorMessages = item.status?.messages
                ?.filter(it => it[0] === 'execution_error')
                .map(it => it[1])
                .map(it => `${it.node_type} [${it.node_id}] ${it.exception_type}: ${it.exception_message}`)
                .join('\n') || '';
            throw new Error(`ComfyUI generation did not succeed.\n\n${errorMessages}`.trim());
        }
        const outputs = Object.keys(item.outputs).map(it => item.outputs[it]);
        console.debug('ComfyUI outputs:', outputs);
        const imgInfo = outputs.map(it => it.images).flat()[0] ?? outputs.map(it => it.gifs).flat()[0];
        if (!imgInfo) {
            throw new Error('ComfyUI did not return any recognizable outputs.');
        }
        const imgUrl = new URL(urlJoin(request.body.url, '/view'));
        imgUrl.search = `?filename=${imgInfo.filename}&subfolder=${imgInfo.subfolder}&type=${imgInfo.type}`;
        const imgResponse = await fetch(imgUrl);
        if (!imgResponse.ok) {
            throw new Error('ComfyUI returned an error.');
        }
        const format = path.extname(imgInfo.filename).slice(1).toLowerCase() || 'png';
        const imgBuffer = await imgResponse.arrayBuffer();
        return response.send({ format: format, data: Buffer.from(imgBuffer).toString('base64') });
    } catch (error) {
        console.error('ComfyUI error:', error);
        response.status(500).send(error.message);
        return response;
    }
});
