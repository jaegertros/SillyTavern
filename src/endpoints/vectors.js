import path from 'node:path';
import fs from 'node:fs';

import * as lancedb from '@lancedb/lancedb';
import express from 'express';
import sanitize from 'sanitize-filename';

import { getConfigValue } from '../util.js';

import { getNomicAIBatchVector, getNomicAIVector } from '../vectors/nomicai-vectors.js';
import { getOpenAIVector, getOpenAIBatchVector } from '../vectors/openai-vectors.js';
import { getTransformersVector, getTransformersBatchVector } from '../vectors/embedding.js';
import { getExtrasVector, getExtrasBatchVector } from '../vectors/extras-vectors.js';
import { getMakerSuiteVector, getMakerSuiteBatchVector } from '../vectors/google-vectors.js';
import { getVertexVector, getVertexBatchVector } from '../vectors/google-vectors.js';
import { getCohereVector, getCohereBatchVector } from '../vectors/cohere-vectors.js';
import { getLlamaCppVector, getLlamaCppBatchVector } from '../vectors/llamacpp-vectors.js';
import { getVllmVector, getVllmBatchVector } from '../vectors/vllm-vectors.js';
import { getOllamaVector, getOllamaBatchVector } from '../vectors/ollama-vectors.js';

// Don't forget to add new sources to the SOURCES array
const SOURCES = [
    'transformers',
    'mistral',
    'openai',
    'extras',
    'palm',
    'togetherai',
    'nomicai',
    'cohere',
    'ollama',
    'llamacpp',
    'vllm',
    'webllm',
    'koboldcpp',
    'vertexai',
    'electronhub',
    'openrouter',
    'chutes',
    'nanogpt',
];

/**
 * Gets the vector for the given text from the given source.
 * @param {string} source - The source of the vector
 * @param {Object} sourceSettings - Settings for the source, if it needs any
 * @param {string} text - The text to get the vector for
 * @param {boolean} isQuery - If the text is a query for embedding search
 * @param {import('../users.js').UserDirectoryList} directories - The directories object for the user
 * @returns {Promise<number[]>} - The vector for the text
 */
async function getVector(source, sourceSettings, text, isQuery, directories) {
    switch (source) {
        case 'nomicai':
            return getNomicAIVector(text, source, directories);
        case 'togetherai':
        case 'mistral':
        case 'openai':
            return getOpenAIVector(text, source, directories, sourceSettings.model);
        case 'electronhub':
            return getOpenAIVector(text, source, directories, sourceSettings.model);
        case 'openrouter':
            return getOpenAIVector(text, source, directories, sourceSettings.model);
        case 'transformers':
            return getTransformersVector(text);
        case 'extras':
            return getExtrasVector(text, sourceSettings.extrasUrl, sourceSettings.extrasKey);
        case 'palm':
            return getMakerSuiteVector(text, sourceSettings.model, sourceSettings.request);
        case 'vertexai':
            return getVertexVector(text, sourceSettings.model, sourceSettings.request);
        case 'cohere':
            return getCohereVector(text, isQuery, directories, sourceSettings.model);
        case 'llamacpp':
            return getLlamaCppVector(text, sourceSettings.apiUrl, directories);
        case 'vllm':
            return getVllmVector(text, sourceSettings.apiUrl, sourceSettings.model, directories);
        case 'ollama':
            return getOllamaVector(text, sourceSettings.apiUrl, sourceSettings.model, sourceSettings.keep, directories);
        case 'webllm':
            return sourceSettings.embeddings[text];
        case 'koboldcpp':
            return sourceSettings.embeddings[text];
        case 'chutes':
            return getOpenAIVector(text, source, directories, sourceSettings.model);
        case 'nanogpt':
            return getOpenAIVector(text, source, directories, sourceSettings.model);
    }

    throw new Error(`Unknown vector source ${source}`);
}

/**
 * Gets the vector for the given text batch from the given source.
 * @param {string} source - The source of the vector
 * @param {Object} sourceSettings - Settings for the source, if it needs any
 * @param {string[]} texts - The array of texts to get the vector for
 * @param {boolean} isQuery - If the text is a query for embedding search
 * @param {import('../users.js').UserDirectoryList} directories - The directories object for the user
 * @returns {Promise<number[][]>} - The array of vectors for the texts
 */
async function getBatchVector(source, sourceSettings, texts, isQuery, directories) {
    const batchSize = 10;
    const batches = Array(Math.ceil(texts.length / batchSize)).fill(undefined).map((_, i) => texts.slice(i * batchSize, i * batchSize + batchSize));

    let results = [];
    for (let batch of batches) {
        switch (source) {
            case 'nomicai':
                results.push(...await getNomicAIBatchVector(batch, source, directories));
                break;
            case 'togetherai':
            case 'mistral':
            case 'openai':
                results.push(...await getOpenAIBatchVector(batch, source, directories, sourceSettings.model));
                break;
            case 'electronhub':
                results.push(...await getOpenAIBatchVector(batch, source, directories, sourceSettings.model));
                break;
            case 'openrouter':
                results.push(...await getOpenAIBatchVector(batch, source, directories, sourceSettings.model));
                break;
            case 'transformers':
                results.push(...await getTransformersBatchVector(batch));
                break;
            case 'extras':
                results.push(...await getExtrasBatchVector(batch, sourceSettings.extrasUrl, sourceSettings.extrasKey));
                break;
            case 'palm':
                results.push(...await getMakerSuiteBatchVector(batch, sourceSettings.model, sourceSettings.request));
                break;
            case 'vertexai':
                results.push(...await getVertexBatchVector(batch, sourceSettings.model, sourceSettings.request));
                break;
            case 'cohere':
                results.push(...await getCohereBatchVector(batch, isQuery, directories, sourceSettings.model));
                break;
            case 'llamacpp':
                results.push(...await getLlamaCppBatchVector(batch, sourceSettings.apiUrl, directories));
                break;
            case 'vllm':
                results.push(...await getVllmBatchVector(batch, sourceSettings.apiUrl, sourceSettings.model, directories));
                break;
            case 'ollama':
                results.push(...await getOllamaBatchVector(batch, sourceSettings.apiUrl, sourceSettings.model, sourceSettings.keep, directories));
                break;
            case 'webllm':
                results.push(...texts.map(x => sourceSettings.embeddings[x]));
                break;
            case 'koboldcpp':
                results.push(...texts.map(x => sourceSettings.embeddings[x]));
                break;
            case 'chutes':
                results.push(...await getOpenAIBatchVector(batch, source, directories, sourceSettings.model));
                break;
            case 'nanogpt':
                results.push(...await getOpenAIBatchVector(batch, source, directories, sourceSettings.model));
                break;
            default:
                throw new Error(`Unknown vector source ${source}`);
        }
    }

    return results;
}

/**
 * Extracts settings for the vectorization sources from the HTTP request headers.
 * @param {string} source - Which source to extract settings for.
 * @param {object} request - The HTTP request object.
 * @returns {object} - An object that can be used as `sourceSettings` in functions that take that parameter.
 */
function getSourceSettings(source, request) {
    switch (source) {
        case 'togetherai':
            return {
                model: String(request.body.model),
            };
        case 'openai':
            return {
                model: String(request.body.model),
            };
        case 'electronhub':
            return {
                model: String(request.body.model || 'text-embedding-3-small'),
            };
        case 'openrouter':
            return {
                model: String(request.body.model) || 'openai/text-embedding-3-large',
            };
        case 'cohere':
            return {
                model: String(request.body.model),
            };
        case 'llamacpp':
            return {
                apiUrl: String(request.body.apiUrl),
            };
        case 'vllm':
            return {
                apiUrl: String(request.body.apiUrl),
                model: String(request.body.model),
            };
        case 'ollama':
            return {
                apiUrl: String(request.body.apiUrl),
                model: String(request.body.model),
                keep: Boolean(request.body.keep),
            };
        case 'extras':
            return {
                extrasUrl: String(request.body.extrasUrl),
                extrasKey: String(request.body.extrasKey),
            };
        case 'transformers':
            return {
                model: getConfigValue('extensions.models.embedding', ''),
            };
        case 'palm':
        case 'vertexai':
            return {
                model: String(request.body.model || 'text-embedding-005'),
                request: request, // Pass the request object to get API key and URL
            };
        case 'mistral':
            return {
                model: 'mistral-embed',
            };
        case 'nomicai':
            return {
                model: 'nomic-embed-text-v1.5',
            };
        case 'webllm':
            return {
                model: String(request.body.model),
                embeddings: request.body.embeddings ?? {},
            };
        case 'koboldcpp':
            return {
                model: String(request.body.model),
                embeddings: request.body.embeddings ?? {},
            };
        case 'chutes':
            return {
                model: String(request.body.model || 'chutes-qwen-qwen3-embedding-8b'),
            };
        case 'nanogpt':
            return {
                model: String(request.body.model || 'text-embedding-3-small'),
            };
        default:
            return {};
    }
}

/**
 * Gets the model scope for the source.
 * @param {object} sourceSettings - The settings for the source
 * @returns {string} The model scope for the source
 */
function getModelScope(sourceSettings) {
    return (sourceSettings?.model || '');
}

/** @type {string} Name of the vectors table within each LanceDB database */
const VECTORS_TABLE = 'vectors';

/**
 * Opens (or creates) a LanceDB database + table for the given collection.
 * Each collection/source/model combination gets its own LanceDB directory.
 *
 * @param {import('../users.js').UserDirectoryList} directories - User directories
 * @param {string} collectionId - The collection ID
 * @param {string} source - The source of the vector
 * @param {object} sourceSettings - The model for the source
 * @returns {Promise<{ db: import('@lancedb/lancedb').Connection, table: import('@lancedb/lancedb').Table | null, dbPath: string }>}
 */
async function getIndex(directories, collectionId, source, sourceSettings) {
    const model = getModelScope(sourceSettings);
    const dbPath = path.join(directories.vectors, sanitize(source), sanitize(collectionId), sanitize(model));

    // Ensure the directory exists
    await fs.promises.mkdir(dbPath, { recursive: true });

    const db = await lancedb.connect(dbPath);
    const tableNames = await db.tableNames();
    const table = tableNames.includes(VECTORS_TABLE) ? await db.openTable(VECTORS_TABLE) : null;

    return { db, table, dbPath };
}

/**
 * Inserts items into the vector collection
 * @param {import('../users.js').UserDirectoryList} directories - User directories
 * @param {string} collectionId - The collection ID
 * @param {string} source - The source of the vector
 * @param {Object} sourceSettings - Settings for the source, if it needs any
 * @param {{ hash: number; text: string; index: number; }[]} items - The items to insert
 */
async function insertVectorItems(directories, collectionId, source, sourceSettings, items) {
    const { db, table } = await getIndex(directories, collectionId, source, sourceSettings);

    const vectors = await getBatchVector(source, sourceSettings, items.map(x => x.text), false, directories);

    const rows = items.map((item, i) => ({
        vector: vectors[i],
        hash: item.hash,
        text: item.text,
        index: item.index,
    }));

    if (table) {
        // Delete existing items with the same hashes, then add new ones (upsert)
        const hashes = items.map(x => x.hash);
        await table.delete(`hash IN (${hashes.join(',')})`);
        await table.add(rows);
    } else {
        // First insert — create the table
        await db.createTable(VECTORS_TABLE, rows);
    }
}

/**
 * Gets the hashes of the items in the vector collection
 * @param {import('../users.js').UserDirectoryList} directories - User directories
 * @param {string} collectionId - The collection ID
 * @param {string} source - The source of the vector
 * @param {Object} sourceSettings - Settings for the source, if it needs any
 * @returns {Promise<number[]>} - The hashes of the items in the collection
 */
async function getSavedHashes(directories, collectionId, source, sourceSettings) {
    const { table } = await getIndex(directories, collectionId, source, sourceSettings);

    if (!table) {
        return [];
    }

    const items = await table.query().select(['hash']).toArray();
    const hashes = items.map(x => Number(x.hash));

    return hashes;
}

/**
 * Deletes items from the vector collection by hash
 * @param {import('../users.js').UserDirectoryList} directories - User directories
 * @param {string} collectionId - The collection ID
 * @param {string} source - The source of the vector
 * @param {Object} sourceSettings - Settings for the source, if it needs any
 * @param {number[]} hashes - The hashes of the items to delete
 */
async function deleteVectorItems(directories, collectionId, source, sourceSettings, hashes) {
    const { table } = await getIndex(directories, collectionId, source, sourceSettings);

    if (!table || hashes.length === 0) {
        return;
    }

    await table.delete(`hash IN (${hashes.join(',')})`);
}

/**
 * Converts LanceDB distance (lower = more similar) to a similarity score (higher = more similar).
 * Uses cosine distance: similarity = 1 - distance.
 * @param {number} distance - The distance value from LanceDB
 * @returns {number} - A similarity score where higher is more similar
 */
function distanceToScore(distance) {
    return 1 - distance;
}

/**
 * Gets the hashes of the items in the vector collection that match the search text
 * @param {import('../users.js').UserDirectoryList} directories - User directories
 * @param {string} collectionId - The collection ID
 * @param {string} source - The source of the vector
 * @param {Object} sourceSettings - Settings for the source, if it needs any
 * @param {string} searchText - The text to search for
 * @param {number} topK - The number of results to return
 * @param {number} threshold - The threshold for the search
 * @returns {Promise<{hashes: number[], metadata: object[]}>} - The metadata of the items that match the search text
 */
async function queryCollection(directories, collectionId, source, sourceSettings, searchText, topK, threshold) {
    const { table } = await getIndex(directories, collectionId, source, sourceSettings);

    if (!table) {
        return { metadata: [], hashes: [] };
    }

    const vector = await getVector(source, sourceSettings, searchText, true, directories);
    const results = await table.search(vector).limit(topK).toArray();

    const scored = results.map(r => ({
        score: distanceToScore(r._distance),
        hash: Number(r.hash),
        text: r.text,
        index: r.index,
    }));

    const metadata = scored.filter(x => x.score >= threshold).map(x => ({ hash: x.hash, text: x.text, index: x.index }));
    const hashes = scored.map(x => x.hash);
    return { metadata, hashes };
}

/**
 * Queries multiple collections for the given search queries. Returns the overall top K results.
 * @param {import('../users.js').UserDirectoryList} directories - User directories
 * @param {string[]} collectionIds - The collection IDs to query
 * @param {string} source - The source of the vector
 * @param {Object} sourceSettings - Settings for the source, if it needs any
 * @param {string} searchText - The text to search for
 * @param {number} topK - The number of results to return
 * @param {number} threshold - The threshold for the search
 *
 * @returns {Promise<Record<string, { hashes: number[], metadata: object[] }>>} - The top K results from each collection
 */
async function multiQueryCollection(directories, collectionIds, source, sourceSettings, searchText, topK, threshold) {
    const vector = await getVector(source, sourceSettings, searchText, true, directories);
    const results = [];

    for (const collectionId of collectionIds) {
        const { table } = await getIndex(directories, collectionId, source, sourceSettings);

        if (!table) {
            continue;
        }

        const queryResults = await table.search(vector).limit(topK).toArray();
        results.push(...queryResults.map(r => ({
            collectionId,
            score: distanceToScore(r._distance),
            hash: Number(r.hash),
            text: r.text,
            index: r.index,
        })));
    }

    // Sort results by descending similarity, apply threshold, and take top K
    const sortedResults = results
        .sort((a, b) => b.score - a.score)
        .filter(x => x.score >= threshold)
        .slice(0, topK);

    /**
     * Group the results by collection ID
     * @type {Record<string, { hashes: number[], metadata: object[] }>}
     */
    const groupedResults = {};
    for (const result of sortedResults) {
        if (!groupedResults[result.collectionId]) {
            groupedResults[result.collectionId] = { hashes: [], metadata: [] };
        }

        groupedResults[result.collectionId].hashes.push(result.hash);
        groupedResults[result.collectionId].metadata.push({ hash: result.hash, text: result.text, index: result.index });
    }

    return groupedResults;
}

/**
 * Performs a request to regenerate the index if it is corrupted.
 * @param {import('express').Request} req Express request object
 * @param {import('express').Response} res Express response object
 * @param {Error} error Error object
 * @returns {Promise<any>} Promise
 */
async function regenerateCorruptedIndexErrorHandler(req, res, error) {
    if (!req.query.regenerated) {
        const collectionId = String(req.body.collectionId);
        const source = String(req.body.source) || 'transformers';
        const sourceSettings = getSourceSettings(source, req);

        if (collectionId && source) {
            const { db, table, dbPath } = await getIndex(req.user.directories, collectionId, source, sourceSettings);

            if (table) {
                console.warn(`Corrupted index detected at ${dbPath}, regenerating...`);
                await db.dropTable(VECTORS_TABLE);
                return res.redirect(307, req.originalUrl + '?regenerated=true');
            }
        }
    }

    console.error(error);
    return res.sendStatus(500);
}

export const router = express.Router();

router.post('/query', async (req, res) => {
    try {
        if (!req.body.collectionId || !req.body.searchText) {
            return res.sendStatus(400);
        }

        const collectionId = String(req.body.collectionId);
        const searchText = String(req.body.searchText);
        const topK = Number(req.body.topK) || 10;
        const threshold = Number(req.body.threshold) || 0.0;
        const source = String(req.body.source) || 'transformers';
        const sourceSettings = getSourceSettings(source, req);

        const results = await queryCollection(req.user.directories, collectionId, source, sourceSettings, searchText, topK, threshold);
        return res.json(results);
    } catch (error) {
        return regenerateCorruptedIndexErrorHandler(req, res, error);
    }
});

router.post('/query-multi', async (req, res) => {
    try {
        if (!Array.isArray(req.body.collectionIds) || !req.body.searchText) {
            return res.sendStatus(400);
        }

        const collectionIds = req.body.collectionIds.map(x => String(x));
        const searchText = String(req.body.searchText);
        const topK = Number(req.body.topK) || 10;
        const threshold = Number(req.body.threshold) || 0.0;
        const source = String(req.body.source) || 'transformers';
        const sourceSettings = getSourceSettings(source, req);

        const results = await multiQueryCollection(req.user.directories, collectionIds, source, sourceSettings, searchText, topK, threshold);
        return res.json(results);
    } catch (error) {
        return regenerateCorruptedIndexErrorHandler(req, res, error);
    }
});

router.post('/insert', async (req, res) => {
    try {
        if (!Array.isArray(req.body.items) || !req.body.collectionId) {
            return res.sendStatus(400);
        }

        const collectionId = String(req.body.collectionId);
        const items = req.body.items.map(x => ({ hash: x.hash, text: x.text, index: x.index }));
        const source = String(req.body.source) || 'transformers';
        const sourceSettings = getSourceSettings(source, req);

        await insertVectorItems(req.user.directories, collectionId, source, sourceSettings, items);
        return res.sendStatus(200);
    } catch (error) {
        return regenerateCorruptedIndexErrorHandler(req, res, error);
    }
});

router.post('/list', async (req, res) => {
    try {
        if (!req.body.collectionId) {
            return res.sendStatus(400);
        }

        const collectionId = String(req.body.collectionId);
        const source = String(req.body.source) || 'transformers';
        const sourceSettings = getSourceSettings(source, req);

        const hashes = await getSavedHashes(req.user.directories, collectionId, source, sourceSettings);
        return res.json(hashes);
    } catch (error) {
        return regenerateCorruptedIndexErrorHandler(req, res, error);
    }
});

router.post('/delete', async (req, res) => {
    try {
        if (!Array.isArray(req.body.hashes) || !req.body.collectionId) {
            return res.sendStatus(400);
        }

        const collectionId = String(req.body.collectionId);
        const hashes = req.body.hashes.map(x => Number(x));
        const source = String(req.body.source) || 'transformers';
        const sourceSettings = getSourceSettings(source, req);

        await deleteVectorItems(req.user.directories, collectionId, source, sourceSettings, hashes);
        return res.sendStatus(200);
    } catch (error) {
        return regenerateCorruptedIndexErrorHandler(req, res, error);
    }
});

router.post('/purge-all', async (req, res) => {
    try {
        for (const source of SOURCES) {
            const sourcePath = path.join(req.user.directories.vectors, sanitize(source));
            if (!fs.existsSync(sourcePath)) {
                continue;
            }
            await fs.promises.rm(sourcePath, { recursive: true });
            console.info(`Deleted vector source store at ${sourcePath}`);
        }

        return res.sendStatus(200);
    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
});

router.post('/purge', async (req, res) => {
    try {
        if (!req.body.collectionId) {
            return res.sendStatus(400);
        }

        const collectionId = String(req.body.collectionId);

        for (const source of SOURCES) {
            const sourcePath = path.join(req.user.directories.vectors, sanitize(source), sanitize(collectionId));
            if (!fs.existsSync(sourcePath)) {
                continue;
            }
            await fs.promises.rm(sourcePath, { recursive: true });
            console.info(`Deleted vector index at ${sourcePath}`);
        }

        return res.sendStatus(200);
    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
});
