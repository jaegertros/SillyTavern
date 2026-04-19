import express from 'express';
import fetch from 'node-fetch';
import _ from 'lodash';

import { delay, getBasicAuthHeader } from '../util.js';

// Image generation backend imports
import { router as comfy } from './image-generation/comfy.js';
import { router as comfyRunPod } from './image-generation/comfy-runpod.js';
import { router as together } from './image-generation/together.js';
import { router as sdcpp } from './image-generation/sdcpp.js';
import { router as drawthings } from './image-generation/drawthings.js';
import { router as pollinations } from './image-generation/pollinations.js';
import { router as stability } from './image-generation/stability.js';
import { router as huggingface } from './image-generation/huggingface.js';
import { router as electronhub } from './image-generation/electronhub.js';
import { router as chutes } from './image-generation/chutes.js';
import { router as nanogpt } from './image-generation/nanogpt.js';
import { router as bfl } from './image-generation/bfl.js';
import { router as falai } from './image-generation/falai.js';
import { router as xai } from './image-generation/xai.js';
import { router as aimlapi } from './image-generation/aimlapi.js';
import { router as zai } from './image-generation/zai.js';

export const router = express.Router();

router.post('/ping', async (request, response) => {
    try {
        const url = new URL(request.body.url);
        url.pathname = '/sdapi/v1/options';

        const result = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': getBasicAuthHeader(request.body.auth),
            },
        });

        if (!result.ok) {
            throw new Error('SD WebUI returned an error.');
        }

        return response.sendStatus(200);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/upscalers', async (request, response) => {
    try {
        async function getUpscalerModels() {
            const url = new URL(request.body.url);
            url.pathname = '/sdapi/v1/upscalers';

            const result = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': getBasicAuthHeader(request.body.auth),
                },
            });

            if (!result.ok) {
                throw new Error('SD WebUI returned an error.');
            }

            /** @type {any} */
            const data = await result.json();
            return data.map(x => x.name);
        }

        async function getLatentUpscalers() {
            const url = new URL(request.body.url);
            url.pathname = '/sdapi/v1/latent-upscale-modes';

            const result = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': getBasicAuthHeader(request.body.auth),
                },
            });

            if (!result.ok) {
                throw new Error('SD WebUI returned an error.');
            }

            /** @type {any} */
            const data = await result.json();
            return data.map(x => x.name);
        }

        const [upscalers, latentUpscalers] = await Promise.all([getUpscalerModels(), getLatentUpscalers()]);

        // 0 = None, then Latent Upscalers, then Upscalers
        upscalers.splice(1, 0, ...latentUpscalers);

        return response.send(upscalers);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/vaes', async (request, response) => {
    try {
        const autoUrl = new URL(request.body.url);
        autoUrl.pathname = '/sdapi/v1/sd-vae';
        const forgeUrl = new URL(request.body.url);
        forgeUrl.pathname = '/sdapi/v1/sd-modules';

        const requestInit = {
            method: 'GET',
            headers: {
                'Authorization': getBasicAuthHeader(request.body.auth),
            },
        };
        const results = await Promise.allSettled([
            fetch(autoUrl, requestInit).then(r => r.ok ? r.json() : Promise.reject(r.statusText)),
            fetch(forgeUrl, requestInit).then(r => r.ok ? r.json() : Promise.reject(r.statusText)),
        ]);

        const data = results.find(r => r.status === 'fulfilled')?.value;

        if (!Array.isArray(data)) {
            throw new Error('SD WebUI returned an error.');
        }

        const names = data.map(x => x.model_name);
        return response.send(names);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/samplers', async (request, response) => {
    try {
        const url = new URL(request.body.url);
        url.pathname = '/sdapi/v1/samplers';

        const result = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': getBasicAuthHeader(request.body.auth),
            },
        });

        if (!result.ok) {
            throw new Error('SD WebUI returned an error.');
        }

        /** @type {any} */
        const data = await result.json();
        const names = data.map(x => x.name);
        return response.send(names);

    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/schedulers', async (request, response) => {
    try {
        const url = new URL(request.body.url);
        url.pathname = '/sdapi/v1/schedulers';

        const result = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': getBasicAuthHeader(request.body.auth),
            },
        });

        if (!result.ok) {
            throw new Error('SD WebUI returned an error.');
        }

        /** @type {any} */
        const data = await result.json();
        const names = data.map(x => x.name);
        return response.send(names);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/models', async (request, response) => {
    try {
        const url = new URL(request.body.url);
        url.pathname = '/sdapi/v1/sd-models';

        const result = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': getBasicAuthHeader(request.body.auth),
            },
        });

        if (!result.ok) {
            throw new Error('SD WebUI returned an error.');
        }

        /** @type {any} */
        const data = await result.json();
        const models = data.map(x => ({ value: x.title, text: x.title }));
        return response.send(models);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/get-model', async (request, response) => {
    try {
        const url = new URL(request.body.url);
        url.pathname = '/sdapi/v1/options';

        const result = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': getBasicAuthHeader(request.body.auth),
            },
        });
        /** @type {any} */
        const data = await result.json();
        return response.send(data.sd_model_checkpoint);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/set-model', async (request, response) => {
    try {
        async function getProgress() {
            const url = new URL(request.body.url);
            url.pathname = '/sdapi/v1/progress';

            const result = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': getBasicAuthHeader(request.body.auth),
                },
            });
            return await result.json();
        }

        const url = new URL(request.body.url);
        url.pathname = '/sdapi/v1/options';

        const options = {
            sd_model_checkpoint: request.body.model,
        };

        const result = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(options),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getBasicAuthHeader(request.body.auth),
            },
        });

        if (!result.ok) {
            throw new Error('SD WebUI returned an error.');
        }

        const MAX_ATTEMPTS = 10;
        const CHECK_INTERVAL = 2000;

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            /** @type {any} */
            const progressState = await getProgress();

            const progress = progressState.progress;
            const jobCount = progressState.state.job_count;
            if (progress === 0.0 && jobCount === 0) {
                break;
            }

            console.info(`Waiting for SD WebUI to finish model loading... Progress: ${progress}; Job count: ${jobCount}`);
            await delay(CHECK_INTERVAL);
        }

        return response.sendStatus(200);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/generate', async (request, response) => {
    try {
        try {
            const optionsUrl = new URL(request.body.url);
            optionsUrl.pathname = '/sdapi/v1/options';
            const optionsResult = await fetch(optionsUrl, { headers: { 'Authorization': getBasicAuthHeader(request.body.auth) } });
            if (optionsResult.ok) {
                const optionsData = /** @type {any} */ (await optionsResult.json());
                const isForge = 'forge_preset' in optionsData;

                if (!isForge) {
                    _.unset(request.body, 'override_settings.forge_additional_modules');
                }
            }
        } catch (error) {
            console.error('SD WebUI failed to get options:', error);
        }

        const controller = new AbortController();
        request.socket.removeAllListeners('close');
        request.socket.on('close', function () {
            if (!response.writableEnded) {
                const interruptUrl = new URL(request.body.url);
                interruptUrl.pathname = '/sdapi/v1/interrupt';
                fetch(interruptUrl, { method: 'POST', headers: { 'Authorization': getBasicAuthHeader(request.body.auth) } });
            }
            controller.abort();
        });

        console.debug('SD WebUI request:', request.body);
        const txt2imgUrl = new URL(request.body.url);
        txt2imgUrl.pathname = '/sdapi/v1/txt2img';
        const result = await fetch(txt2imgUrl, {
            method: 'POST',
            body: JSON.stringify(request.body),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getBasicAuthHeader(request.body.auth),
            },
            signal: controller.signal,
        });

        if (!result.ok) {
            const text = await result.text();
            throw new Error('SD WebUI returned an error.', { cause: text });
        }

        const data = await result.json();
        return response.send(data);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

router.post('/sd-next/upscalers', async (request, response) => {
    try {
        const url = new URL(request.body.url);
        url.pathname = '/sdapi/v1/upscalers';

        const result = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': getBasicAuthHeader(request.body.auth),
            },
        });

        if (!result.ok) {
            throw new Error('SD WebUI returned an error.');
        }

        // Vlad doesn't provide Latent Upscalers in the API, so we have to hardcode them here
        const latentUpscalers = ['Latent', 'Latent (antialiased)', 'Latent (bicubic)', 'Latent (bicubic antialiased)', 'Latent (nearest)', 'Latent (nearest-exact)'];

        /** @type {any} */
        const data = await result.json();
        const names = data.map(x => x.name);

        // 0 = None, then Latent Upscalers, then Upscalers
        names.splice(1, 0, ...latentUpscalers);

        return response.send(names);
    } catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }
});

// Mount image generation backend sub-routers
router.use('/comfy', comfy);
router.use('/comfyrunpod', comfyRunPod);
router.use('/together', together);
router.use('/sdcpp', sdcpp);
router.use('/drawthings', drawthings);
router.use('/pollinations', pollinations);
router.use('/stability', stability);
router.use('/huggingface', huggingface);
router.use('/electronhub', electronhub);
router.use('/chutes', chutes);
router.use('/nanogpt', nanogpt);
router.use('/bfl', bfl);
router.use('/falai', falai);
router.use('/xai', xai);
router.use('/aimlapi', aimlapi);
router.use('/zai', zai);
