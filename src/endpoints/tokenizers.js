/**
 * Tokenizer API routes — Express router for tokenization endpoints.
 * Tokenizer engine (classes, instances, model resolution) extracted to tokenizer-engine.js
 */
import express from 'express';
import fetch from 'node-fetch';

import { TEXTGEN_TYPES } from '../constants.js';
import { setAdditionalHeaders } from '../additional-headers.js';

import {
    spp_llama, spp_nerd, spp_nerd_v2, spp_mistral, spp_yi, spp_gemma, spp_jamba,
    claude_tokenizer, llama3_tokenizer, commandRTokenizer, commandATokenizer,
    qwen2Tokenizer, nemoTokenizer, deepseekTokenizer,
    countSentencepieceTokens, countSentencepieceArrayTokens,
    getTiktokenChunks, getWebTokenizersChunks,
    getTokenizerModel, getTiktokenTokenizer, countWebTokenizerTokens,
    CHARS_PER_TOKEN,
} from './tokenizer-engine.js';

// Re-export everything from the engine for backward compatibility
export {
    TEXT_COMPLETION_MODELS,
    sentencepieceTokenizers,
    webTokenizers,
    getSentencepiceTokenizer,
    getWebTokenizer,
    getTokenizerModel,
    getTiktokenTokenizer,
    countWebTokenizerTokens,
} from './tokenizer-engine.js';

/**
 * Creates an API handler for encoding Sentencepiece tokens.
 * @param {object} tokenizer Sentencepiece tokenizer
 * @returns {Function} Handler function
 */
function createSentencepieceEncodingHandler(tokenizer) {
    return async function (request, response) {
        try {
            if (!request.body) {
                return response.sendStatus(400);
            }

            const text = request.body.text || '';
            const instance = await tokenizer?.get();
            const { ids, count } = await countSentencepieceTokens(tokenizer, text);
            const chunks = instance?.encodePieces(text);
            return response.send({ ids, count, chunks });
        } catch (error) {
            console.error(error);
            return response.send({ ids: [], count: 0, chunks: [] });
        }
    };
}

/**
 * Creates an API handler for decoding Sentencepiece tokens.
 * @param {object} tokenizer Sentencepiece tokenizer
 * @returns {Function} Handler function
 */
function createSentencepieceDecodingHandler(tokenizer) {
    return async function (request, response) {
        try {
            if (!request.body) {
                return response.sendStatus(400);
            }

            const ids = request.body.ids || [];
            const instance = await tokenizer?.get();
            if (!instance) throw new Error('Failed to load the Sentencepiece tokenizer');
            const ops = ids.map(id => instance.decodeIds([id]));
            const chunks = await Promise.all(ops);
            const text = chunks.join('');
            return response.send({ text, chunks });
        } catch (error) {
            console.error(error);
            return response.send({ text: '', chunks: [] });
        }
    };
}

/**
 * Creates an API handler for encoding Tiktoken tokens.
 * @param {string} modelId Tiktoken model ID
 * @returns {Function} Handler function
 */
function createTiktokenEncodingHandler(modelId) {
    return async function (request, response) {
        try {
            if (!request.body) {
                return response.sendStatus(400);
            }

            const text = request.body.text || '';
            const tokenizer = getTiktokenTokenizer(modelId);
            const tokens = Object.values(tokenizer.encode(text));
            const chunks = await getTiktokenChunks(tokenizer, tokens);
            return response.send({ ids: tokens, count: tokens.length, chunks });
        } catch (error) {
            console.error(error);
            return response.send({ ids: [], count: 0, chunks: [] });
        }
    };
}

/**
 * Creates an API handler for decoding Tiktoken tokens.
 * @param {string} modelId Tiktoken model ID
 * @returns {Function} Handler function
 */
function createTiktokenDecodingHandler(modelId) {
    return async function (request, response) {
        try {
            if (!request.body) {
                return response.sendStatus(400);
            }

            const ids = request.body.ids || [];
            const tokenizer = getTiktokenTokenizer(modelId);
            const textBytes = tokenizer.decode(new Uint32Array(ids));
            const text = new TextDecoder().decode(textBytes);
            return response.send({ text });
        } catch (error) {
            console.error(error);
            return response.send({ text: '' });
        }
    };
}

/**
 * Creates an API handler for encoding WebTokenizer tokens.
 * @param {object} tokenizer WebTokenizer instance
 * @returns {Function} Handler function
 */
function createWebTokenizerEncodingHandler(tokenizer) {
    return async function (request, response) {
        try {
            if (!request.body) {
                return response.sendStatus(400);
            }

            const text = request.body.text || '';
            const instance = await tokenizer?.get();
            if (!instance) throw new Error('Failed to load the Web tokenizer');
            const tokens = Array.from(instance.encode(text));
            const chunks = getWebTokenizersChunks(instance, tokens);
            return response.send({ ids: tokens, count: tokens.length, chunks });
        } catch (error) {
            console.error(error);
            return response.send({ ids: [], count: 0, chunks: [] });
        }
    };
}

/**
 * Creates an API handler for decoding WebTokenizer tokens.
 * @param {object} tokenizer WebTokenizer instance
 * @returns {Function} Handler function
 */
function createWebTokenizerDecodingHandler(tokenizer) {
    return async function (request, response) {
        try {
            if (!request.body) {
                return response.sendStatus(400);
            }

            const ids = request.body.ids || [];
            const instance = await tokenizer?.get();
            if (!instance) throw new Error('Failed to load the Web tokenizer');
            const chunks = getWebTokenizersChunks(instance, ids);
            const text = instance.decode(new Int32Array(ids));
            return response.send({ text, chunks });
        } catch (error) {
            console.error(error);
            return response.send({ text: '', chunks: [] });
        }
    };
}

export const router = express.Router();

// Per-model encode/decode routes
router.post('/llama/encode', createSentencepieceEncodingHandler(spp_llama));
router.post('/nerdstash/encode', createSentencepieceEncodingHandler(spp_nerd));
router.post('/nerdstash_v2/encode', createSentencepieceEncodingHandler(spp_nerd_v2));
router.post('/mistral/encode', createSentencepieceEncodingHandler(spp_mistral));
router.post('/yi/encode', createSentencepieceEncodingHandler(spp_yi));
router.post('/gemma/encode', createSentencepieceEncodingHandler(spp_gemma));
router.post('/jamba/encode', createSentencepieceEncodingHandler(spp_jamba));
router.post('/gpt2/encode', createTiktokenEncodingHandler('gpt2'));
router.post('/claude/encode', createWebTokenizerEncodingHandler(claude_tokenizer));
router.post('/llama3/encode', createWebTokenizerEncodingHandler(llama3_tokenizer));
router.post('/qwen2/encode', createWebTokenizerEncodingHandler(qwen2Tokenizer));
router.post('/command-r/encode', createWebTokenizerEncodingHandler(commandRTokenizer));
router.post('/command-a/encode', createWebTokenizerEncodingHandler(commandATokenizer));
router.post('/nemo/encode', createWebTokenizerEncodingHandler(nemoTokenizer));
router.post('/deepseek/encode', createWebTokenizerEncodingHandler(deepseekTokenizer));
router.post('/llama/decode', createSentencepieceDecodingHandler(spp_llama));
router.post('/nerdstash/decode', createSentencepieceDecodingHandler(spp_nerd));
router.post('/nerdstash_v2/decode', createSentencepieceDecodingHandler(spp_nerd_v2));
router.post('/mistral/decode', createSentencepieceDecodingHandler(spp_mistral));
router.post('/yi/decode', createSentencepieceDecodingHandler(spp_yi));
router.post('/gemma/decode', createSentencepieceDecodingHandler(spp_gemma));
router.post('/jamba/decode', createSentencepieceDecodingHandler(spp_jamba));
router.post('/gpt2/decode', createTiktokenDecodingHandler('gpt2'));
router.post('/claude/decode', createWebTokenizerDecodingHandler(claude_tokenizer));
router.post('/llama3/decode', createWebTokenizerDecodingHandler(llama3_tokenizer));
router.post('/qwen2/decode', createWebTokenizerDecodingHandler(qwen2Tokenizer));
router.post('/command-r/decode', createWebTokenizerDecodingHandler(commandRTokenizer));
router.post('/command-a/decode', createWebTokenizerDecodingHandler(commandATokenizer));
router.post('/nemo/decode', createWebTokenizerDecodingHandler(nemoTokenizer));
router.post('/deepseek/decode', createWebTokenizerDecodingHandler(deepseekTokenizer));

// OpenAI-compatible dynamic routing
router.post('/openai/encode', async function (req, res) {
    try {
        const queryModel = String(req.query.model || '');

        if (queryModel.includes('llama3') || queryModel.includes('llama-3')) {
            return createWebTokenizerEncodingHandler(llama3_tokenizer)(req, res);
        }
        if (queryModel.includes('llama')) {
            return createSentencepieceEncodingHandler(spp_llama)(req, res);
        }
        if (queryModel.includes('mistral')) {
            return createSentencepieceEncodingHandler(spp_mistral)(req, res);
        }
        if (queryModel.includes('yi')) {
            return createSentencepieceEncodingHandler(spp_yi)(req, res);
        }
        if (queryModel.includes('claude')) {
            return createWebTokenizerEncodingHandler(claude_tokenizer)(req, res);
        }
        if (queryModel.includes('gemma') || queryModel.includes('gemini')) {
            return createSentencepieceEncodingHandler(spp_gemma)(req, res);
        }
        if (queryModel.includes('jamba')) {
            return createSentencepieceEncodingHandler(spp_jamba)(req, res);
        }
        if (queryModel.includes('qwen2')) {
            return createWebTokenizerEncodingHandler(qwen2Tokenizer)(req, res);
        }
        if (queryModel.includes('command-r')) {
            return createWebTokenizerEncodingHandler(commandRTokenizer)(req, res);
        }
        if (queryModel.includes('command-a')) {
            return createWebTokenizerEncodingHandler(commandATokenizer)(req, res);
        }
        if (queryModel.includes('nemo')) {
            return createWebTokenizerEncodingHandler(nemoTokenizer)(req, res);
        }
        if (queryModel.includes('deepseek')) {
            return createWebTokenizerEncodingHandler(deepseekTokenizer)(req, res);
        }

        const model = getTokenizerModel(queryModel);
        return createTiktokenEncodingHandler(model)(req, res);
    } catch (error) {
        console.error(error);
        return res.send({ ids: [], count: 0, chunks: [] });
    }
});

router.post('/openai/decode', async function (req, res) {
    try {
        const queryModel = String(req.query.model || '');

        if (queryModel.includes('llama3') || queryModel.includes('llama-3')) {
            return createWebTokenizerDecodingHandler(llama3_tokenizer)(req, res);
        }
        if (queryModel.includes('llama')) {
            return createSentencepieceDecodingHandler(spp_llama)(req, res);
        }
        if (queryModel.includes('mistral')) {
            return createSentencepieceDecodingHandler(spp_mistral)(req, res);
        }
        if (queryModel.includes('yi')) {
            return createSentencepieceDecodingHandler(spp_yi)(req, res);
        }
        if (queryModel.includes('claude')) {
            return createWebTokenizerDecodingHandler(claude_tokenizer)(req, res);
        }
        if (queryModel.includes('gemma') || queryModel.includes('gemini')) {
            return createSentencepieceDecodingHandler(spp_gemma)(req, res);
        }
        if (queryModel.includes('jamba')) {
            return createSentencepieceDecodingHandler(spp_jamba)(req, res);
        }
        if (queryModel.includes('qwen2')) {
            return createWebTokenizerDecodingHandler(qwen2Tokenizer)(req, res);
        }
        if (queryModel.includes('command-r')) {
            return createWebTokenizerDecodingHandler(commandRTokenizer)(req, res);
        }
        if (queryModel.includes('command-a')) {
            return createWebTokenizerDecodingHandler(commandATokenizer)(req, res);
        }
        if (queryModel.includes('nemo')) {
            return createWebTokenizerDecodingHandler(nemoTokenizer)(req, res);
        }
        if (queryModel.includes('deepseek')) {
            return createWebTokenizerDecodingHandler(deepseekTokenizer)(req, res);
        }

        const model = getTokenizerModel(queryModel);
        return createTiktokenDecodingHandler(model)(req, res);
    } catch (error) {
        console.error(error);
        return res.send({ text: '' });
    }
});

router.post('/openai/count', async function (req, res) {
    try {
        if (!req.body) return res.sendStatus(400);

        let num_tokens = 0;
        const queryModel = String(req.query.model || '');
        const model = getTokenizerModel(queryModel);

        if (model === 'claude') {
            const instance = await claude_tokenizer.get();
            if (!instance) throw new Error('Failed to load the Claude tokenizer');
            num_tokens = countWebTokenizerTokens(instance, req.body);
            return res.send({ 'token_count': num_tokens });
        }

        if (model === 'llama3' || model === 'llama-3') {
            const instance = await llama3_tokenizer.get();
            if (!instance) throw new Error('Failed to load the Llama3 tokenizer');
            num_tokens = countWebTokenizerTokens(instance, req.body);
            return res.send({ 'token_count': num_tokens });
        }

        if (model === 'llama') {
            num_tokens = await countSentencepieceArrayTokens(spp_llama, req.body);
            return res.send({ 'token_count': num_tokens });
        }

        if (model === 'mistral') {
            num_tokens = await countSentencepieceArrayTokens(spp_mistral, req.body);
            return res.send({ 'token_count': num_tokens });
        }

        if (model === 'yi') {
            num_tokens = await countSentencepieceArrayTokens(spp_yi, req.body);
            return res.send({ 'token_count': num_tokens });
        }

        if (model === 'gemma' || model === 'gemini') {
            num_tokens = await countSentencepieceArrayTokens(spp_gemma, req.body);
            return res.send({ 'token_count': num_tokens });
        }

        if (model === 'jamba') {
            num_tokens = await countSentencepieceArrayTokens(spp_jamba, req.body);
            return res.send({ 'token_count': num_tokens });
        }

        if (model === 'qwen2') {
            const instance = await qwen2Tokenizer.get();
            if (!instance) throw new Error('Failed to load the Qwen2 tokenizer');
            num_tokens = countWebTokenizerTokens(instance, req.body);
            return res.send({ 'token_count': num_tokens });
        }

        if (model === 'command-r') {
            const instance = await commandRTokenizer.get();
            if (!instance) throw new Error('Failed to load the Command-R tokenizer');
            num_tokens = countWebTokenizerTokens(instance, req.body);
            return res.send({ 'token_count': num_tokens });
        }

        if (model === 'command-a') {
            const instance = await commandATokenizer.get();
            if (!instance) throw new Error('Failed to load the Command-A tokenizer');
            num_tokens = countWebTokenizerTokens(instance, req.body);
            return res.send({ 'token_count': num_tokens });
        }

        if (model === 'nemo') {
            const instance = await nemoTokenizer.get();
            if (!instance) throw new Error('Failed to load the Nemo tokenizer');
            num_tokens = countWebTokenizerTokens(instance, req.body);
            return res.send({ 'token_count': num_tokens });
        }

        if (model === 'deepseek') {
            const instance = await deepseekTokenizer.get();
            if (!instance) throw new Error('Failed to load the DeepSeek tokenizer');
            num_tokens = countWebTokenizerTokens(instance, req.body);
            return res.send({ 'token_count': num_tokens });
        }

        const tokensPerName = queryModel.includes('gpt-3.5-turbo-0301') ? -1 : 1;
        const tokensPerMessage = queryModel.includes('gpt-3.5-turbo-0301') ? 4 : 3;
        const tokensPadding = 3;

        const tokenizer = getTiktokenTokenizer(model);

        for (const msg of req.body) {
            try {
                num_tokens += tokensPerMessage;
                for (const [key, value] of Object.entries(msg)) {
                    num_tokens += tokenizer.encode(value).length;
                    if (key == 'name') {
                        num_tokens += tokensPerName;
                    }
                }
            } catch {
                console.warn('Error tokenizing message:', msg);
            }
        }
        num_tokens += tokensPadding;

        // NB: Since 2023-10-14, the GPT-3.5 Turbo 0301 model shoves in 7-9 extra tokens to every message.
        if (queryModel.includes('gpt-3.5-turbo-0301')) {
            num_tokens += 9;
        }

        res.send({ 'token_count': num_tokens });
    } catch (error) {
        console.error('An error counting tokens, using fallback estimation method', error);
        const jsonBody = JSON.stringify(req.body);
        const num_tokens = Math.ceil(jsonBody.length / CHARS_PER_TOKEN);
        res.send({ 'token_count': num_tokens });
    }
});

router.post('/remote/kobold/count', async function (request, response) {
    if (!request.body) {
        return response.sendStatus(400);
    }
    const text = String(request.body.text) || '';
    const baseUrl = String(request.body.url);

    try {
        const args = {
            method: 'POST',
            body: JSON.stringify({ 'prompt': text }),
            headers: { 'Content-Type': 'application/json' },
        };

        let url = String(baseUrl).replace(/\/$/, '');
        url += '/extra/tokencount';

        const result = await fetch(url, args);

        if (!result.ok) {
            console.warn(`API returned error: ${result.status} ${result.statusText}`);
            return response.send({ error: true });
        }

        /** @type {any} */
        const data = await result.json();
        const count = data.value;
        const ids = data.ids ?? [];
        return response.send({ count, ids });
    } catch (error) {
        console.error(error);
        return response.send({ error: true });
    }
});

router.post('/remote/textgenerationwebui/encode', async function (request, response) {
    if (!request.body) {
        return response.sendStatus(400);
    }
    const text = String(request.body.text) || '';
    const baseUrl = String(request.body.url);
    const vllmModel = String(request.body.vllm_model) || '';
    const aphroditeModel = String(request.body.aphrodite_model) || '';

    try {
        const args = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        };

        setAdditionalHeaders(request, args, baseUrl);

        // Convert to string + remove trailing slash + /v1 suffix
        let url = String(baseUrl).replace(/\/$/, '').replace(/\/v1$/, '');

        switch (request.body.api_type) {
            case TEXTGEN_TYPES.TABBY:
                url += '/v1/token/encode';
                args.body = JSON.stringify({ 'text': text });
                break;
            case TEXTGEN_TYPES.KOBOLDCPP:
                url += '/api/extra/tokencount';
                args.body = JSON.stringify({ 'prompt': text });
                break;
            case TEXTGEN_TYPES.LLAMACPP:
                url += '/tokenize';
                args.body = JSON.stringify({ 'content': text });
                break;
            case TEXTGEN_TYPES.VLLM:
                url += '/tokenize';
                args.body = JSON.stringify({ 'model': vllmModel, 'prompt': text });
                break;
            case TEXTGEN_TYPES.APHRODITE:
                url += '/v1/tokenize';
                args.body = JSON.stringify({ 'model': aphroditeModel, 'prompt': text });
                break;
            default:
                url += '/v1/internal/encode';
                args.body = JSON.stringify({ 'text': text });
                break;
        }

        const result = await fetch(url, args);

        if (!result.ok) {
            console.warn(`API returned error: ${result.status} ${result.statusText}`);
            return response.send({ error: true });
        }

        /** @type {any} */
        const data = await result.json();
        const count = (data?.length ?? data?.count ?? data?.value ?? data?.tokens?.length);
        const ids = (data?.tokens ?? data?.ids ?? []);

        return response.send({ count, ids });
    } catch (error) {
        console.error(error);
        return response.send({ error: true });
    }
});
