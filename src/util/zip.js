/**
 * ZIP archive utilities — extracted from util.js
 */
import path from 'node:path';
import fs from 'node:fs';
import { Buffer } from 'node:buffer';

import yauzl from 'yauzl';
import mime from 'mime-types';

/**
 * Extracts a file with given extension from an ArrayBuffer containing a ZIP archive.
 * @param {ArrayBufferLike} archiveBuffer Buffer containing a ZIP archive
 * @param {string} fileExtension File extension to look for
 * @returns {Promise<Buffer|null>} Buffer containing the extracted file. Null if the file was not found.
 */
export async function extractFileFromZipBuffer(archiveBuffer, fileExtension) {
    return await new Promise((resolve) => {
        try {
            yauzl.fromBuffer(Buffer.from(archiveBuffer), { lazyEntries: true }, (err, zipfile) => {
                if (err) {
                    console.warn(`Error opening ZIP file: ${err.message}`);
                    return resolve(null);
                }

                zipfile.readEntry();

                zipfile.on('entry', (entry) => {
                    if (entry.fileName.endsWith(fileExtension) && !entry.fileName.startsWith('__MACOSX')) {
                        zipfile.openReadStream(entry, (err, readStream) => {
                            if (err) {
                                console.warn(`Error opening read stream: ${err.message}`);
                                return zipfile.readEntry();
                            } else {
                                const chunks = [];
                                readStream.on('data', (chunk) => {
                                    chunks.push(chunk);
                                });

                                readStream.on('end', () => {
                                    const buffer = Buffer.concat(chunks);
                                    resolve(buffer);
                                    zipfile.readEntry(); // Continue to the next entry
                                });

                                readStream.on('error', (err) => {
                                    console.warn(`Error reading stream: ${err.message}`);
                                    zipfile.readEntry();
                                });
                            }
                        });
                    } else {
                        zipfile.readEntry();
                    }
                });

                zipfile.on('error', (err) => {
                    console.warn('ZIP processing error', err);
                    resolve(null);
                });

                zipfile.on('end', () => resolve(null));
            });
        } catch (error) {
            console.warn('Failed to process ZIP buffer', error);
            resolve(null);
        }
    });
}

/**
 * Normalizes a ZIP entry path for safe extraction.
 * @param {string} entryName The entry name from the ZIP archive
 * @returns {string|null} Normalized path or null if invalid
 */
export function normalizeZipEntryPath(entryName) {
    if (typeof entryName !== 'string') {
        return null;
    }

    let normalized = entryName.replace(/\\/g, '/').trim();

    if (!normalized) {
        return null;
    }

    normalized = normalized.replace(/^\.\/+/g, '');
    normalized = path.posix.normalize(normalized);

    if (!normalized || normalized === '.' || normalized.startsWith('..')) {
        return null;
    }

    if (normalized.startsWith('/')) {
        normalized = normalized.slice(1);
    }

    return normalized;
}

/**
 * Extracts multiple files from an ArrayBuffer containing a ZIP archive.
 * @param {ArrayBufferLike} archiveBuffer Buffer containing a ZIP archive
 * @param {string[]} fileNames Array of file paths to extract
 * @returns {Promise<Map<string, Buffer>>} Map of normalized paths to their extracted buffers
 */
export async function extractFilesFromZipBuffer(archiveBuffer, fileNames) {
    const targets = new Map();

    if (Array.isArray(fileNames)) {
        for (const fileName of fileNames) {
            const normalized = normalizeZipEntryPath(fileName);
            if (normalized && !targets.has(normalized)) {
                targets.set(normalized, true);
            }
        }
    }

    if (targets.size === 0) {
        return new Map();
    }

    return await new Promise((resolve) => {
        const results = new Map();

        try {
            yauzl.fromBuffer(Buffer.from(archiveBuffer), { lazyEntries: true }, (err, zipfile) => {
                if (err) {
                    console.warn(`Error opening ZIP file: ${err.message}`);
                    return resolve(results);
                }

                let finished = false;
                const finalize = () => {
                    if (finished) {
                        return;
                    }
                    finished = true;
                    resolve(results);
                };

                zipfile.readEntry();

                zipfile.on('entry', (entry) => {
                    const normalizedEntry = normalizeZipEntryPath(entry.fileName);
                    if (!normalizedEntry || !targets.has(normalizedEntry)) {
                        return zipfile.readEntry();
                    }

                    zipfile.openReadStream(entry, (streamErr, readStream) => {
                        if (streamErr) {
                            console.warn(`Error opening read stream: ${streamErr.message}`);
                            return zipfile.readEntry();
                        }

                        const chunks = [];
                        readStream.on('data', (chunk) => {
                            chunks.push(chunk);
                        });

                        readStream.on('end', () => {
                            results.set(normalizedEntry, Buffer.concat(chunks));
                            targets.delete(normalizedEntry);

                            if (targets.size === 0) {
                                finalize();
                            } else {
                                zipfile.readEntry();
                            }
                        });

                        readStream.on('error', (streamError) => {
                            console.warn(`Error reading stream: ${streamError.message}`);
                            zipfile.readEntry();
                        });
                    });
                });

                zipfile.on('error', (zipError) => {
                    console.warn('ZIP processing error', zipError);
                    finalize();
                });

                zipfile.on('close', () => {
                    finalize();
                });

                zipfile.on('end', () => {
                    finalize();
                });
            });
        } catch (error) {
            console.warn('Failed to process ZIP buffer', error);
            resolve(results);
        }
    });
}

/**
 * Ensures a directory exists, creating it if necessary.
 * @param {string} dirPath Path to the directory
 * @returns {boolean} True if the directory exists or was created, false on error
 */
export function ensureDirectory(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        } else if (!fs.statSync(dirPath).isDirectory()) {
            console.warn(`ensureDirectory: Path ${dirPath} exists and is not a directory.`);
            return false;
        }
        return true;
    } catch (error) {
        console.error(`ensureDirectory: Failed to prepare directory ${dirPath}`, error);
        return false;
    }
}

/**
 * Extracts all images from a ZIP archive.
 * @param {string} zipFilePath Path to the ZIP archive
 * @returns {Promise<[string, Buffer][]>} Array of image buffers
 */
export async function getImageBuffers(zipFilePath) {
    return new Promise((resolve, reject) => {
        // Check if the zip file exists
        if (!fs.existsSync(zipFilePath)) {
            reject(new Error('File not found'));
            return;
        }

        const imageBuffers = [];

        yauzl.open(zipFilePath, { lazyEntries: true }, (err, zipfile) => {
            if (err) {
                reject(err);
            } else {
                zipfile.readEntry();
                zipfile.on('entry', (entry) => {
                    const mimeType = mime.lookup(entry.fileName);
                    if (mimeType && mimeType.startsWith('image/') && !entry.fileName.startsWith('__MACOSX')) {
                        zipfile.openReadStream(entry, (err, readStream) => {
                            if (err) {
                                reject(err);
                            } else {
                                const chunks = [];
                                readStream.on('data', (chunk) => {
                                    chunks.push(chunk);
                                });

                                readStream.on('end', () => {
                                    imageBuffers.push([path.parse(entry.fileName).base, Buffer.concat(chunks)]);
                                    zipfile.readEntry(); // Continue to the next entry
                                });
                            }
                        });
                    } else {
                        zipfile.readEntry(); // Continue to the next entry
                    }
                });

                zipfile.on('end', () => {
                    resolve(imageBuffers);
                });

                zipfile.on('error', (err) => {
                    reject(err);
                });
            }
        });
    });
}

/**
 * Gets all chunks of data from the given readable stream.
 * @param {any} readableStream Readable stream to read from
 * @returns {Promise<Buffer[]>} Array of chunks
 */
export async function readAllChunks(readableStream) {
    return new Promise((resolve, reject) => {
        // Consume the readable stream
        const chunks = [];
        readableStream.on('data', (chunk) => {
            chunks.push(chunk);
        });

        readableStream.on('end', () => {
            //console.log('Finished reading the stream.');
            resolve(chunks);
        });

        readableStream.on('error', (error) => {
            console.error('Error while reading the stream:', error);
            reject();
        });
    });
}
