/**
 * Debounced wrappers — separated from state.js to avoid importing SCC members.
 * Uses late binding for the wrapped functions (bound during app init).
 * @module core/debounced
 */

import { debounce } from '../utils.js';
import { DEFAULT_SAVE_EDIT_TIMEOUT, DEFAULT_PRINT_TIMEOUT } from './state.js';
import { FilterHelper } from '../filters.js';

// Late-bound function references (set by script.js during init)
let _saveSettings;
let _printCharacters;

/** @param {Function} fn */
export function bindSaveSettings(fn) { _saveSettings = fn; }
/** @param {Function} fn */
export function bindPrintCharacters(fn) { _printCharacters = fn; }

export const saveSettingsDebounced = debounce((loopCounter = 0) => _saveSettings?.(loopCounter), DEFAULT_SAVE_EDIT_TIMEOUT);
export const saveCharacterDebounced = debounce(() => document.querySelector('#create_button')?.click(), DEFAULT_SAVE_EDIT_TIMEOUT);
export const printCharactersDebounced = debounce(() => { _printCharacters?.(false); }, DEFAULT_PRINT_TIMEOUT);

export const entitiesFilter = new FilterHelper(printCharactersDebounced);

