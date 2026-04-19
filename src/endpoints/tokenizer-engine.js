/**
 * Tokenizer engine — classes, instances, model resolution, and counting utilities.
 * Extracted from tokenizers.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import zlib from 'node:zlib';
import { promisify } from 'node:util';

import fetch from 'node-fetch';
import { sync as writeFileAtomicSync } from 'write-file-atomic';

import { Tokenizer } from '@agnai/web-tokenizers';
import { SentencePieceProcessor } from '@agnai/sentencepiece-js';
import tiktoken from 'tiktoken';

import { convertClaudePrompt } from '../prompt-converters.js';
import { getConfigValue, isValidUrl } from '../util.js';

/**
 * @typedef { (req: import('express').Request, res: import('express').Response) => Promise<any> } TokenizationHandler
 */

/**
 * @type {{[key: string]: import('tiktoken').Tiktoken}} Tokenizers cache
 */
const tokenizersCache = {};

/**
 * @type {string[]}
 */
export const TEXT_COMPLETION_MODELS = [
    'gpt-3.5-turbo-instruct',
    'gpt-3.5-turbo-instruct-0914',
    'text-davinci-003',
    'text-davinci-002',
    'text-davinci-001',
    'text-curie-001',
    'text-babbage-001',
    'text-ada-001',
    'code-davinci-002',
    'code-davinci-001',
    'code-cushman-002',
    'code-cushman-001',
    'text-davinci-edit-001',
    'code-davinci-edit-001',
    'text-embedding-ada-002',
    'text-similarity-davinci-001',
    'text-similarity-curie-001',
    'text-similarity-babbage-001',
    'text-similarity-ada-001',
    'text-search-davinci-doc-001',
    'text-search-curie-doc-001',
    'text-search-babbage-doc-001',
    'text-search-ada-doc-001',
    'code-search-babbage-code-001',
    'code-search-ada-code-001',
];

export const CHARS_PER_TOKEN = 3.35;
const IS_DOWNLOAD_ALLOWED = getConfigValue('enableDownloadableTokenizers', true, 'boolean');
const gunzip = promisify(zlib.gunzip);

/**
 * Gets a path to the tokenizer model. Downloads the model if it's a URL.
 * @param {string} model Model URL or path
 * @param {string|undefined} fallbackModel Fallback model path
 * @returns {Promise<string>} Path to the tokenizer model
 */
async function getPathToTokenizer(model, fallbackModel) {
    if (!isValidUrl(model)) {
        return model;
    }

    try {
        const url = new URL(model);

        if (!['https:', 'http:'].includes(url.protocol)) {
            throw new Error('Invalid URL protocol');
        }

        const fileName = url.pathname.split('/').pop();

        if (!fileName) {
            throw new Error('Failed to extract the file name from the URL');
        }

        const CACHE_PATH = path.join(globalThis.DATA_ROOT, '_cache');
        if (!fs.existsSync(CACHE_PATH)) {
            fs.mkdirSync(CACHE_PATH, { recursive: true });
        }

        // If an uncompressed version exists, return it
        const isCompressed = path.extname(fileName) === '.gz';
        const uncompressedName = path.basename(fileName, '.gz');
        const uncompressedPath = path.join(CACHE_PATH, uncompressedName);
        if (isCompressed && fs.existsSync(uncompressedPath)) {
            return uncompressedPath;
        }

        const cachedFile = path.join(CACHE_PATH, fileName);
        if (fs.existsSync(cachedFile)) {
            if (isCompressed) {
                const compressedBuffer = await fs.promises.readFile(cachedFile);
                const decompressedBuffer = await gunzip(compressedBuffer);
                writeFileAtomicSync(uncompressedPath, decompressedBuffer);
                await fs.promises.unlink(cachedFile);
                return uncompressedPath;
            }
            return cachedFile;
        }

        if (!IS_DOWNLOAD_ALLOWED) {
            throw new Error('Downloading tokenizers is disabled, the model is not cached');
        }

        console.info('Downloading tokenizer model:', model);
        const response = await fetch(model);
        if (!response.ok) {
            throw new Error(`Failed to fetch the model: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        if (isCompressed) {
            const decompressedBuffer = await gunzip(arrayBuffer);
            writeFileAtomicSync(uncompressedPath, decompressedBuffer);
            return uncompressedPath;
        }

        writeFileAtomicSync(cachedFile, Buffer.from(arrayBuffer));
        return cachedFile;
    } catch (error) {
        const getLastSegment = str => str?.split('/')?.pop() || '';
        if (fallbackModel) {
            console.error(`Could not get a tokenizer from ${getLastSegment(model)}. Reason: ${error.message}. Using a fallback model: ${getLastSegment(fallbackModel)}.`);
            return fallbackModel;
        }

        throw new Error(`Failed to instantiate a tokenizer and fallback is not provided. Reason: ${error.message}`);
    }
}

/**
 * Sentencepiece tokenizer for tokenizing text.
 */
class SentencePieceTokenizer {
    /** @type {import('@agnai/sentencepiece-js').SentencePieceProcessor} */
    #instance;
    /** @type {string} */
    #model;
    /** @type {string|undefined} */
    #fallbackModel;

    constructor(model, fallbackModel) {
        this.#model = model;
        this.#fallbackModel = fallbackModel;
    }

    async get() {
        if (this.#instance) {
            return this.#instance;
        }

        try {
            const pathToModel = await getPathToTokenizer(this.#model, this.#fallbackModel);
            this.#instance = new SentencePieceProcessor();
            await this.#instance.load(pathToModel);
            console.info('Instantiated the tokenizer for', path.parse(pathToModel).name);
            return this.#instance;
        } catch (error) {
            console.error('Sentencepiece tokenizer failed to load: ' + this.#model, error);
            return null;
        }
    }
}

/**
 * Web tokenizer for tokenizing text.
 */
class WebTokenizer {
    /** @type {Tokenizer} */
    #instance;
    /** @type {string} */
    #model;
    /** @type {string|undefined} */
    #fallbackModel;

    constructor(model, fallbackModel) {
        this.#model = model;
        this.#fallbackModel = fallbackModel;
    }

    async get() {
        if (this.#instance) {
            return this.#instance;
        }

        try {
            const pathToModel = await getPathToTokenizer(this.#model, this.#fallbackModel);
            const fileBuffer = await fs.promises.readFile(pathToModel);
            this.#instance = await Tokenizer.fromJSON(fileBuffer);
            console.info('Instantiated the tokenizer for', path.parse(pathToModel).name);
            return this.#instance;
        } catch (error) {
            console.error('Web tokenizer failed to load: ' + this.#model, error);
            return null;
        }
    }
}

// Tokenizer instances
export const spp_llama = new SentencePieceTokenizer('src/tokenizers/llama.model');
export const spp_nerd = new SentencePieceTokenizer('src/tokenizers/nerdstash.model');
export const spp_nerd_v2 = new SentencePieceTokenizer('src/tokenizers/nerdstash_v2.model');
export const spp_mistral = new SentencePieceTokenizer('src/tokenizers/mistral.model');
export const spp_yi = new SentencePieceTokenizer('src/tokenizers/yi.model');
export const spp_gemma = new SentencePieceTokenizer('src/tokenizers/gemma.model');
export const spp_jamba = new SentencePieceTokenizer('src/tokenizers/jamba.model');
export const claude_tokenizer = new WebTokenizer('src/tokenizers/claude.json');
export const llama3_tokenizer = new WebTokenizer('src/tokenizers/llama3.json');
export const commandRTokenizer = new WebTokenizer('https://github.com/SillyTavern/SillyTavern-Tokenizers/raw/main/command-r.json.gz', 'src/tokenizers/llama3.json');
export const commandATokenizer = new WebTokenizer('https://github.com/SillyTavern/SillyTavern-Tokenizers/raw/main/command-a.json.gz', 'src/tokenizers/llama3.json');
export const qwen2Tokenizer = new WebTokenizer('https://github.com/SillyTavern/SillyTavern-Tokenizers/raw/main/qwen2.json.gz', 'src/tokenizers/llama3.json');
export const nemoTokenizer = new WebTokenizer('https://github.com/SillyTavern/SillyTavern-Tokenizers/raw/main/nemo.json.gz', 'src/tokenizers/llama3.json');
export const deepseekTokenizer = new WebTokenizer('https://github.com/SillyTavern/SillyTavern-Tokenizers/raw/main/deepseek.json.gz', 'src/tokenizers/llama3.json');

export const sentencepieceTokenizers = [
    'llama', 'nerdstash', 'nerdstash_v2', 'mistral', 'yi', 'gemma', 'jamba',
];

export const webTokenizers = [
    'claude', 'llama3', 'command-r', 'command-a', 'qwen2', 'nemo', 'deepseek',
];

/**
 * Gets the Sentencepiece tokenizer by the model name.
 * @param {string} model Sentencepiece model name
 * @returns {SentencePieceTokenizer|null} Sentencepiece tokenizer
 */
export function getSentencepiceTokenizer(model) {
    if (model.includes('llama')) return spp_llama;
    if (model.includes('nerdstash_v2')) return spp_nerd_v2;
    if (model.includes('nerdstash')) return spp_nerd;
    if (model.includes('mistral')) return spp_mistral;
    if (model.includes('yi')) return spp_yi;
    if (model.includes('gemma')) return spp_gemma;
    if (model.includes('jamba')) return spp_jamba;
    return null;
}

/**
 * Gets the Web tokenizer by the model name.
 * @param {string} model Web tokenizer model name
 * @returns {WebTokenizer|null} Web tokenizer
 */
export function getWebTokenizer(model) {
    if (model.includes('llama3')) return llama3_tokenizer;
    if (model.includes('claude')) return claude_tokenizer;
    if (model.includes('command-r')) return commandRTokenizer;
    if (model.includes('command-a')) return commandATokenizer;
    if (model.includes('qwen2')) return qwen2Tokenizer;
    if (model.includes('nemo')) return nemoTokenizer;
    if (model.includes('deepseek')) return deepseekTokenizer;
    return null;
}

/**
 * Counts the token ids for the given text using the Sentencepiece tokenizer.
 * @param {SentencePieceTokenizer} tokenizer Sentencepiece tokenizer
 * @param {string} text Text to tokenize
 * @returns { Promise<{ids: number[], count: number}> } Tokenization result
 */
export async function countSentencepieceTokens(tokenizer, text) {
    const instance = await tokenizer?.get();

    if (!instance) {
        return {
            ids: [],
            count: Math.ceil(text.length / CHARS_PER_TOKEN),
        };
    }

    let cleaned = text;
    let ids = instance.encodeIds(cleaned);
    return { ids, count: ids.length };
}

/**
 * Counts the tokens in the given array of objects using the Sentencepiece tokenizer.
 * @param {SentencePieceTokenizer} tokenizer
 * @param {object[]} array Array of objects to tokenize
 * @returns {Promise<number>} Number of tokens
 */
export async function countSentencepieceArrayTokens(tokenizer, array) {
    const jsonBody = array.flatMap(x => Object.values(x)).join('\n\n');
    const result = await countSentencepieceTokens(tokenizer, jsonBody);
    return result.count;
}

export async function getTiktokenChunks(tokenizer, ids) {
    const decoder = new TextDecoder();
    const chunks = [];

    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const chunkTextBytes = await tokenizer.decode(new Uint32Array([id]));
        const chunkText = decoder.decode(chunkTextBytes);
        chunks.push(chunkText);
    }

    return chunks;
}

/**
 * Gets the token chunks for the given token IDs using the Web tokenizer.
 * @param {Tokenizer} tokenizer Web tokenizer instance
 * @param {number[]} ids Token IDs
 * @returns {string[]} Token chunks
 */
export function getWebTokenizersChunks(tokenizer, ids) {
    const chunks = [];

    for (let i = 0, lastProcessed = 0; i < ids.length; i++) {
        const chunkIds = ids.slice(lastProcessed, i + 1);
        const chunkText = tokenizer.decode(new Int32Array(chunkIds));
        if (chunkText === '�') {
            continue;
        }
        chunks.push(chunkText);
        lastProcessed = i + 1;
    }

    return chunks;
}

/**
 * Gets the tokenizer model by the model name.
 * @param {string} requestModel Models to use for tokenization
 * @returns {string} Tokenizer model to use
 */
export function getTokenizerModel(requestModel) {
    if (requestModel === 'o1' || requestModel.includes('o1-preview') || requestModel.includes('o1-mini') || requestModel.includes('o3-mini')) {
        return 'o1';
    }
    if (requestModel.includes('gpt-5') || requestModel.includes('o3') || requestModel.includes('o4-mini')) {
        return 'o1';
    }
    if (requestModel.includes('gpt-4o') || requestModel.includes('chatgpt-4o-latest')) {
        return 'gpt-4o';
    }
    if (requestModel.includes('gpt-4.1') || requestModel.includes('gpt-4.5')) {
        return 'gpt-4o';
    }
    if (requestModel.includes('gpt-4-32k')) return 'gpt-4-32k';
    if (requestModel.includes('gpt-4')) return 'gpt-4';
    if (requestModel.includes('gpt-3.5-turbo-0301')) return 'gpt-3.5-turbo-0301';
    if (requestModel.includes('gpt-3.5-turbo')) return 'gpt-3.5-turbo';
    if (TEXT_COMPLETION_MODELS.includes(requestModel)) return requestModel;
    if (requestModel.includes('claude')) return 'claude';
    if (requestModel.includes('llama3') || requestModel.includes('llama-3')) return 'llama3';
    if (requestModel.includes('llama')) return 'llama';
    if (requestModel.includes('mistral')) return 'mistral';
    if (requestModel.includes('yi')) return 'yi';
    if (requestModel.includes('deepseek')) return 'deepseek';
    if (requestModel.includes('gemma') || requestModel.includes('gemini') || requestModel.includes('learnlm')) return 'gemma';
    if (requestModel.includes('jamba')) return 'jamba';
    if (requestModel.includes('qwen2')) return 'qwen2';
    if (requestModel.includes('command-r')) return 'command-r';
    if (requestModel.includes('command-a')) return 'command-a';
    if (requestModel.includes('nemo')) return 'nemo';
    return 'gpt-3.5-turbo';
}

export function getTiktokenTokenizer(model) {
    if (tokenizersCache[model]) {
        return tokenizersCache[model];
    }

    const tokenizer = tiktoken.encoding_for_model(model);
    console.info('Instantiated the tokenizer for', model);
    tokenizersCache[model] = tokenizer;
    return tokenizer;
}

/**
 * Counts the tokens for the given messages using the WebTokenizer and Claude prompt conversion.
 * @param {Tokenizer} tokenizer Web tokenizer
 * @param {object[]} messages Array of messages
 * @returns {number} Number of tokens
 */
export function countWebTokenizerTokens(tokenizer, messages) {
    const convertedPrompt = convertClaudePrompt(messages, false, '', false, false, '', false);

    if (!tokenizer) {
        return Math.ceil(convertedPrompt.length / CHARS_PER_TOKEN);
    }

    const count = tokenizer.encode(convertedPrompt).length;
    return count;
}
