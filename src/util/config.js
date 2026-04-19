/**
 * Configuration management — extracted from util.js
 */
import path from 'node:path';
import fs from 'node:fs';
import process from 'node:process';

import yaml from 'yaml';
import _ from 'lodash';
import chalk from 'chalk';

import { LOG_LEVELS } from '../constants.js';

export const color = chalk;

/**
 * Converts various JavaScript primitives to boolean values.
 * @param {any} value - The value to convert to boolean
 * @returns {boolean} - The boolean representation of the value
 */
export function toBoolean(value) {
    if (typeof value === 'string') {
        const trimmedLower = value.trim().toLowerCase();
        if (trimmedLower === 'true') return true;
        if (trimmedLower === 'false') return false;
    }
    return Boolean(value);
}

/**
 * @param {string} str
 * @returns {any}
 */
function tryParseInternal(str) {
    try {
        return JSON.parse(str);
    } catch {
        return undefined;
    }
}

/**
 * Parsed config object.
 */
let CACHED_CONFIG = null;
let CONFIG_PATH = null;

/**
 * Converts a configuration key to an environment variable key.
 * @param {string} key Configuration key
 * @returns {string} Environment variable key
 */
export const keyToEnv = (key) => 'SILLYTAVERN_' + String(key).toUpperCase().replace(/\./g, '_');

/**
 * Set the config file path.
 * @param {string} configFilePath Path to the config file
 */
export function setConfigFilePath(configFilePath) {
    if (CONFIG_PATH !== null) {
        console.error(color.red('Config file path already set. Please restart the server to change the config file path.'));
    }
    CONFIG_PATH = path.resolve(configFilePath);
}

/**
 * Returns the config object from the config.yaml file.
 * @returns {object} Config object
 */
export function getConfig() {
    if (CONFIG_PATH === null) {
        console.trace();
        console.error(color.red('No config file path set. Please set the config file path using setConfigFilePath().'));
        process.exit(1);
    }
    if (CACHED_CONFIG) {
        return CACHED_CONFIG;
    }
    if (!fs.existsSync(CONFIG_PATH)) {
        console.error(color.red('No config file found. Please create a config.yaml file. The default config file can be found in the /default folder.'));
        console.error(color.red('The program will now exit.'));
        process.exit(1);
    }

    try {
        const config = yaml.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        CACHED_CONFIG = config;
        return config;
    } catch (error) {
        console.error(color.red('FATAL: Failed to read config.yaml. Please check the file for syntax errors.'));
        console.error(error.message);
        process.exit(1);
    }
}

/**
 * Returns the value for the given key from the config object.
 * @param {string} key - Key to get from the config object
 * @param {any} defaultValue - Default value to return if the key is not found
 * @param {'number'|'boolean'|null} typeConverter - Type to convert the value to
 * @returns {any} Value for the given key
 */
export function getConfigValue(key, defaultValue = null, typeConverter = null) {
    function _getValue() {
        const envKey = keyToEnv(key);
        if (envKey in process.env) {
            const needsJsonParse = defaultValue && typeof defaultValue === 'object';
            const envValue = process.env[envKey];
            return needsJsonParse ? (tryParseInternal(envValue) ?? defaultValue) : envValue;
        }
        const config = getConfig();
        return _.get(config, key, defaultValue);
    }

    const value = _getValue();
    switch (typeConverter) {
        case 'number':
            return isNaN(parseFloat(value)) ? defaultValue : parseFloat(value);
        case 'boolean':
            return toBoolean(value);
        default:
            return value;
    }
}

/**
 * THIS FUNCTION IS DEPRECATED AND ONLY EXISTS FOR BACKWARDS COMPATIBILITY. DON'T USE IT.
 * @param {any} _key Unused
 * @param {any} _value Unused
 * @deprecated Configs are read-only. Use environment variables instead.
 */
export function setConfigValue(_key, _value) {
    console.trace(color.yellow('setConfigValue is deprecated and should not be used.'));
}

/**
 * Setup the minimum log level
 */
export function setupLogLevel() {
    const logLevel = getConfigValue('logging.minLogLevel', LOG_LEVELS.DEBUG, 'number');

    globalThis.console.debug = logLevel <= LOG_LEVELS.DEBUG ? console.debug : () => { };
    globalThis.console.info = logLevel <= LOG_LEVELS.INFO ? console.info : () => { };
    globalThis.console.warn = logLevel <= LOG_LEVELS.WARN ? console.warn : () => { };
    globalThis.console.error = logLevel <= LOG_LEVELS.ERROR ? console.error : () => { };
}
