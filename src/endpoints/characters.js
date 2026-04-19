import path from 'node:path';
import fs from 'node:fs';
import { promises as fsPromises } from 'node:fs';

import express from 'express';
import sanitize from 'sanitize-filename';
import _ from 'lodash';
import mime from 'mime-types';

import { tryParse, deepMerge, mutateJsonString } from '../util.js';
import { TavernCardValidator } from '../validator/TavernCardValidator.js';
import { read, write } from '../character-card-parser.js';
import { invalidateThumbnail } from './thumbnails.js';
import { getChatInfo } from './chats.js';
import { default as validateAvatarUrlMiddleware, getFileNameValidationFunction } from '../middleware/validateFileName.js';
import cacheBuster from '../middleware/cacheBuster.js';

// Sub-module imports
import { diskCache, useShallowCharacters } from './characters/disk-cache.js';
import {
    readCharacterData,
    writeCharacterData,
    applyAvatarCropResize,
    processCharacter,
    getCharaCardV2,
    unsetPrivateFields,
    charaFormatData,
} from './characters/character-io.js';
import {
    getPngName,
    getPreservedName,
    importFromYaml,
    importFromCharX,
    importFromByaf,
    importFromJson,
    importFromPng,
} from './characters/character-import.js';

// Re-exports for backward compatibility
export { diskCache } from './characters/disk-cache.js';
export { applyAvatarCropResize } from './characters/character-io.js';

export const router = express.Router();

router.post('/create', getFileNameValidationFunction('file_name'), async function (request, response) {
    try {
        if (!request.body) return response.sendStatus(400);

        request.body.ch_name = sanitize(request.body.ch_name);

        const char = JSON.stringify(charaFormatData(request.body, request.user.directories));
        const internalName = request.body.file_name || getPngName(request.body.ch_name, request.user.directories);
        const avatarName = `${internalName}.png`;
        const chatsPath = path.join(request.user.directories.chats, internalName);

        if (!fs.existsSync(chatsPath)) fs.mkdirSync(chatsPath);

        if (!request.file) {
            await writeCharacterData(DEFAULT_AVATAR_PATH, char, internalName, request);
            return response.send(avatarName);
        } else {
            const crop = tryParse(request.query.crop);
            const uploadPath = path.join(request.file.destination, request.file.filename);
            await writeCharacterData(uploadPath, char, internalName, request, crop);
            fs.unlinkSync(uploadPath);
            return response.send(avatarName);
        }
    } catch (err) {
        console.error(err);
        response.sendStatus(500);
    }
});

router.post('/rename', validateAvatarUrlMiddleware, async function (request, response) {
    if (!request.body.avatar_url || !request.body.new_name) {
        return response.sendStatus(400);
    }

    const oldAvatarName = request.body.avatar_url;
    const newName = sanitize(request.body.new_name);
    const oldInternalName = path.parse(request.body.avatar_url).name;
    const newInternalName = getPngName(newName, request.user.directories);
    const newAvatarName = `${newInternalName}.png`;

    const oldAvatarPath = path.join(request.user.directories.characters, oldAvatarName);

    const oldChatsPath = path.join(request.user.directories.chats, oldInternalName);
    const newChatsPath = path.join(request.user.directories.chats, newInternalName);

    try {
        // Read old file, replace name int it
        const rawOldData = await readCharacterData(oldAvatarPath);
        if (rawOldData === undefined) throw new Error('Failed to read character file');

        const oldData = getCharaCardV2(JSON.parse(rawOldData), request.user.directories);
        _.set(oldData, 'data.name', newName);
        _.set(oldData, 'name', newName);
        const newData = JSON.stringify(oldData);

        // Write data to new location
        await writeCharacterData(oldAvatarPath, newData, newInternalName, request);

        // Rename chats folder
        if (fs.existsSync(oldChatsPath) && !fs.existsSync(newChatsPath)) {
            fs.cpSync(oldChatsPath, newChatsPath, { recursive: true });
            fs.rmSync(oldChatsPath, { recursive: true, force: true });
        }

        // Remove the old character file
        fs.unlinkSync(oldAvatarPath);

        // Return new avatar name to ST
        return response.send({ avatar: newAvatarName });
    }
    catch (err) {
        console.error(err);
        return response.sendStatus(500);
    }
});

router.post('/edit', validateAvatarUrlMiddleware, async function (request, response) {
    if (!request.body) {
        console.warn('Error: no response body detected');
        response.status(400).send('Error: no response body detected');
        return;
    }

    if (request.body.ch_name === '' || request.body.ch_name === undefined || request.body.ch_name === '.') {
        console.warn('Error: invalid name.');
        response.status(400).send('Error: invalid name.');
        return;
    }

    let char = charaFormatData(request.body, request.user.directories);
    char.chat = request.body.chat;
    char.create_date = request.body.create_date;
    char = JSON.stringify(char);
    let targetFile = (request.body.avatar_url).replace('.png', '');

    try {
        if (!request.file) {
            const avatarPath = path.join(request.user.directories.characters, request.body.avatar_url);
            await writeCharacterData(avatarPath, char, targetFile, request);
        } else {
            const crop = tryParse(request.query.crop);
            const newAvatarPath = path.join(request.file.destination, request.file.filename);
            invalidateThumbnail(request.user.directories, 'avatar', request.body.avatar_url);
            await writeCharacterData(newAvatarPath, char, targetFile, request, crop);
            fs.unlinkSync(newAvatarPath);

            // Bust cache to reload the new avatar
            cacheBuster.bust(request, response);
        }

        return response.sendStatus(200);
    } catch (err) {
        console.error('An error occurred, character edit invalidated.', err);
        return response.sendStatus(500);
    }
});

router.post('/edit-avatar', validateAvatarUrlMiddleware, async function (request, response) {
    try {
        if (!request.file) {
            return response.status(400).send('Error: no file uploaded');
        }

        if (!request.body || !request.body.avatar_url) {
            return response.status(400).send('Error: no avatar_url in request body');
        }

        const uploadPath = path.join(request.file.destination, request.file.filename);
        if (!fs.existsSync(uploadPath)) {
            return response.status(400).send('Error: uploaded file does not exist');
        }
        const characterPath = path.join(request.user.directories.characters, request.body.avatar_url);
        if (!fs.existsSync(characterPath)) {
            return response.status(400).send('Error: character file does not exist');
        }
        const data = await readCharacterData(characterPath);
        if (!data) {
            return response.status(400).send('Error: failed to read character data');
        }

        const crop = tryParse(request.query.crop);
        const fileName = request.body.avatar_url.replace('.png', '');
        await writeCharacterData(uploadPath, data, fileName, request, crop);

        // Remove uploaded temp file
        fs.unlinkSync(uploadPath);

        // Reset images caches
        cacheBuster.bust(request, response);
        invalidateThumbnail(request.user.directories, 'avatar', request.body.avatar_url);

        return response.sendStatus(200);
    } catch (err) {
        console.error('An error occurred while editing avatar', err);
        return response.sendStatus(500);
    }
});

/**
 * Handle a POST request to edit a character attribute.
 *
 * This function reads the character data from a file, updates the specified attribute,
 * and writes the updated data back to the file.
 *
 * @param {Object} request - The HTTP request object.
 * @param {Object} response - The HTTP response object.
 * @returns {void}
 */
router.post('/edit-attribute', validateAvatarUrlMiddleware, async function (request, response) {
    console.debug(request.body);
    if (!request.body) {
        console.warn('Error: no response body detected');
        return response.status(400).send('Error: no response body detected');
    }

    if (request.body.ch_name === '' || request.body.ch_name === undefined || request.body.ch_name === '.') {
        console.warn('Error: invalid name.');
        return response.status(400).send('Error: invalid name.');
    }

    if (request.body.field === 'json_data') {
        console.warn('Error: cannot edit json_data field.');
        return response.status(400).send('Error: cannot edit json_data field.');
    }

    try {
        const avatarPath = path.join(request.user.directories.characters, request.body.avatar_url);
        const charJSON = await readCharacterData(avatarPath);
        if (typeof charJSON !== 'string') throw new Error('Failed to read character file');

        const char = JSON.parse(charJSON);
        //check if the field exists
        if (char[request.body.field] === undefined && char.data[request.body.field] === undefined) {
            console.warn('Error: invalid field.');
            response.status(400).send('Error: invalid field.');
            return;
        }
        char[request.body.field] = request.body.value;
        char.data[request.body.field] = request.body.value;
        let newCharJSON = JSON.stringify(char);
        const targetFile = (request.body.avatar_url).replace('.png', '');
        await writeCharacterData(avatarPath, newCharJSON, targetFile, request);
        return response.sendStatus(200);
    } catch (err) {
        console.error('An error occurred, character edit invalidated.', err);
        return response.sendStatus(500);
    }
});

/**
 * Handle a POST request to edit character properties.
 *
 * Merges the request body with the selected character and
 * validates the result against TavernCard V2 specification.
 *
 * @param {Object} request - The HTTP request object.
 * @param {Object} response - The HTTP response object.
 *
 * @returns {void}
 * */
router.post('/merge-attributes', getFileNameValidationFunction('avatar'), async function (request, response) {
    try {
        const update = request.body;
        const avatarPath = path.join(request.user.directories.characters, update.avatar);

        const pngStringData = await readCharacterData(avatarPath);

        if (!pngStringData) {
            console.error('Error: invalid character file.');
            return response.status(400).send('Error: invalid character file.');
        }

        let character = JSON.parse(pngStringData);

        _.unset(update, 'json_data');
        _.unset(character, 'json_data');

        character = deepMerge(character, update);

        const validator = new TavernCardValidator(character);
        const targetImg = (update.avatar).replace('.png', '');

        //Accept either V1 or V2.
        if (validator.validate()) {
            await writeCharacterData(avatarPath, JSON.stringify(character), targetImg, request);
            response.sendStatus(200);
        } else {
            console.warn(validator.lastValidationError);
            response.status(400).send({ message: `Validation failed for ${character.name}`, error: validator.lastValidationError });
        }
    } catch (exception) {
        response.status(500).send({ message: 'Unexpected error while saving character.', error: exception.toString() });
    }
});

router.post('/delete', validateAvatarUrlMiddleware, async function (request, response) {
    if (!request.body || !request.body.avatar_url) {
        return response.sendStatus(400);
    }

    if (request.body.avatar_url !== sanitize(request.body.avatar_url)) {
        console.error('Malicious filename prevented');
        return response.sendStatus(403);
    }

    const avatarPath = path.join(request.user.directories.characters, request.body.avatar_url);
    if (!fs.existsSync(avatarPath)) {
        return response.sendStatus(400);
    }

    fs.unlinkSync(avatarPath);
    invalidateThumbnail(request.user.directories, 'avatar', request.body.avatar_url);
    let dir_name = (request.body.avatar_url.replace('.png', ''));

    if (!dir_name.length) {
        console.error('Malicious dirname prevented');
        return response.sendStatus(403);
    }

    if (request.body.delete_chats == true) {
        try {
            await fs.promises.rm(path.join(request.user.directories.chats, sanitize(dir_name)), { recursive: true, force: true });
        } catch (err) {
            console.error(err);
            return response.sendStatus(500);
        }
    }

    return response.sendStatus(200);
});

/**
 * HTTP POST endpoint for the "/api/characters/all" route.
 *
 * This endpoint is responsible for reading character files from the `charactersPath` directory,
 * parsing character data, calculating stats for each character and responding with the data.
 * Stats are calculated only on the first run, on subsequent runs the stats are fetched from
 * the `charStats` variable.
 * The stats are calculated by the `calculateStats` function.
 * The characters are processed by the `processCharacter` function.
 *
 * @param  {import("express").Request} request The HTTP request object.
 * @param  {import("express").Response} response The HTTP response object.
 * @return {void}
 */
router.post('/all', async function (request, response) {
    try {
        const files = fs.readdirSync(request.user.directories.characters);
        const pngFiles = files.filter(file => file.endsWith('.png'));
        const processingPromises = pngFiles.map(file => processCharacter(file, request.user.directories, { shallow: useShallowCharacters }));
        const data = (await Promise.all(processingPromises)).filter(c => c.name);
        return response.send(data);
    } catch (err) {
        console.error(err);
        const isRangeError = err instanceof RangeError;
        response.status(500).send({ overflow: isRangeError, error: true });
    }
});

router.post('/get', validateAvatarUrlMiddleware, async function (request, response) {
    try {
        if (!request.body) return response.sendStatus(400);
        const item = request.body.avatar_url;
        const filePath = path.join(request.user.directories.characters, item);

        if (!fs.existsSync(filePath)) {
            return response.sendStatus(404);
        }

        const data = await processCharacter(item, request.user.directories, { shallow: false });

        return response.send(data);
    } catch (err) {
        console.error(err);
        response.sendStatus(500);
    }
});

router.post('/chats', validateAvatarUrlMiddleware, async function (request, response) {
    try {
        if (!request.body) return response.sendStatus(400);

        const characterDirectory = (request.body.avatar_url).replace('.png', '');
        const chatsDirectory = path.join(request.user.directories.chats, characterDirectory);

        if (!fs.existsSync(chatsDirectory)) {
            return response.send({ error: true });
        }

        const files = fs.readdirSync(chatsDirectory, { withFileTypes: true });
        const jsonFiles = files.filter(file => file.isFile() && path.extname(file.name) === '.jsonl').map(file => file.name);

        if (jsonFiles.length === 0) {
            return response.send([]);
        }

        if (request.body.simple) {
            return response.send(jsonFiles.map(file => ({ file_name: file, file_id: path.parse(file).name })));
        }

        const jsonFilesPromise = jsonFiles.map((file) => {
            const withMetadata = !!request.body.metadata;
            const pathToFile = path.join(request.user.directories.chats, characterDirectory, file);
            return getChatInfo(pathToFile, {}, withMetadata);
        });

        const chatData = (await Promise.allSettled(jsonFilesPromise)).filter(x => x.status === 'fulfilled').map(x => x.value);
        const validFiles = chatData.filter(i => i.file_name);

        return response.send(validFiles);
    } catch (error) {
        console.error(error);
        return response.send({ error: true });
    }
});


router.post('/import', async function (request, response) {
    if (!request.body || !request.file) return response.sendStatus(400);

    const uploadPath = path.join(request.file.destination, request.file.filename);
    const format = request.body.file_type;
    const preservedFileName = getPreservedName(request);

    const formatImportFunctions = {
        'yaml': importFromYaml,
        'yml': importFromYaml,
        'json': importFromJson,
        'png': importFromPng,
        'charx': importFromCharX,
        'byaf': importFromByaf,
    };

    try {
        const importFunction = formatImportFunctions[format];

        if (!importFunction) {
            throw new Error(`Unsupported format: ${format}`);
        }

        const fileName = await importFunction(uploadPath, { request, response }, preservedFileName);

        if (!fileName) {
            console.warn('Failed to import character');
            return response.sendStatus(400);
        }

        if (preservedFileName) {
            invalidateThumbnail(request.user.directories, 'avatar', `${preservedFileName}.png`);
        }

        response.send({ file_name: fileName });
    } catch (err) {
        console.error(err);
        response.send({ error: true });
    }
});

router.post('/duplicate', validateAvatarUrlMiddleware, async function (request, response) {
    try {
        if (!request.body.avatar_url) {
            console.warn('avatar URL not found in request body');
            console.debug(request.body);
            return response.sendStatus(400);
        }
        let filename = path.join(request.user.directories.characters, sanitize(request.body.avatar_url));
        if (!fs.existsSync(filename)) {
            console.error('file for dupe not found', filename);
            return response.sendStatus(404);
        }
        let suffix = 1;
        let newFilename = filename;

        // If filename ends with a _number, increment the number
        const nameParts = path.basename(filename, path.extname(filename)).split('_');
        const lastPart = nameParts[nameParts.length - 1];

        let baseName;

        if (!isNaN(Number(lastPart)) && nameParts.length > 1) {
            suffix = parseInt(lastPart) + 1;
            baseName = nameParts.slice(0, -1).join('_'); // construct baseName without suffix
        } else {
            baseName = nameParts.join('_'); // original filename is completely the baseName
        }

        newFilename = path.join(request.user.directories.characters, `${baseName}_${suffix}${path.extname(filename)}`);

        while (fs.existsSync(newFilename)) {
            let suffixStr = '_' + suffix;
            newFilename = path.join(request.user.directories.characters, `${baseName}${suffixStr}${path.extname(filename)}`);
            suffix++;
        }

        fs.copyFileSync(filename, newFilename);
        console.info(`${filename} was copied to ${newFilename}`);
        response.send({ path: path.parse(newFilename).base });
    }
    catch (error) {
        console.error(error);
        return response.send({ error: true });
    }
});

router.post('/export', validateAvatarUrlMiddleware, async function (request, response) {
    try {
        if (!request.body.format || !request.body.avatar_url) {
            return response.sendStatus(400);
        }

        let filename = path.join(request.user.directories.characters, sanitize(request.body.avatar_url));

        if (!fs.existsSync(filename)) {
            return response.sendStatus(404);
        }

        switch (request.body.format) {
            case 'png': {
                const rawBuffer = await fsPromises.readFile(filename);
                const rawData = read(rawBuffer);
                const mutatedData = mutateJsonString(rawData, unsetPrivateFields);
                const mutatedBuffer = write(rawBuffer, mutatedData);
                const contentType = mime.lookup(filename) || 'image/png';
                response.setHeader('Content-Type', contentType);
                response.setHeader('Content-Disposition', `attachment; filename="${encodeURI(path.basename(filename))}"`);
                return response.send(mutatedBuffer);
            }
            case 'json': {
                try {
                    const json = await readCharacterData(filename);
                    if (json === undefined) return response.sendStatus(400);
                    const jsonObject = getCharaCardV2(JSON.parse(json), request.user.directories);
                    unsetPrivateFields(jsonObject);
                    return response.type('json').send(JSON.stringify(jsonObject, null, 4));
                }
                catch {
                    return response.sendStatus(400);
                }
            }
        }

        return response.sendStatus(400);
    } catch (err) {
        console.error('Character export failed', err);
        response.sendStatus(500);
    }
});
