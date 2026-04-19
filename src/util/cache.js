/**
 * Cache utilities — extracted from util.js
 */
import bytes from 'bytes';

export class Cache {
    /**
     * @param {number} ttl Time to live in milliseconds
     */
    constructor(ttl) {
        this.cache = new Map();
        this.ttl = ttl;
    }

    /**
     * Gets a value from the cache.
     * @param {string} key Cache key
     */
    get(key) {
        const value = this.cache.get(key);
        if (value?.expiry > Date.now()) {
            return value.value;
        }

        // Cache miss or expired, remove the key
        this.cache.delete(key);
        return null;
    }

    /**
     * Sets a value in the cache.
     * @param {string} key Key
     * @param {object} value Value
     */
    set(key, value) {
        this.cache.set(key, {
            value: value,
            expiry: Date.now() + this.ttl,
        });
    }

    /**
     * Removes a value from the cache.
     * @param {string} key Key
     */
    remove(key) {
        this.cache.delete(key);
    }

    /**
     * Clears the cache.
     */
    clear() {
        this.cache.clear();
    }
}

export class MemoryLimitedMap {
    /**
     * Creates an instance of MemoryLimitedMap.
     * @param {string} cacheCapacity - Maximum memory usage in human-readable format (e.g., '1 GB').
     */
    constructor(cacheCapacity) {
        this.maxMemory = bytes.parse(cacheCapacity) ?? 0;
        this.currentMemory = 0;
        this.map = new Map();
        this.queue = [];
    }

    /**
     * Estimates the memory usage of a string in bytes.
     * Assumes each character occupies 2 bytes (UTF-16).
     * @param {string} str
     * @returns {number}
     */
    static estimateStringSize(str) {
        return str ? str.length * 2 : 0;
    }

    /**
     * Adds or updates a key-value pair in the map.
     * If adding the new value exceeds the memory limit, evicts oldest entries.
     * @param {string} key
     * @param {string} value
     */
    set(key, value) {
        if (this.maxMemory <= 0) {
            return;
        }

        if (typeof key !== 'string' || typeof value !== 'string') {
            return;
        }

        const newValueSize = MemoryLimitedMap.estimateStringSize(value);

        // If the new value itself exceeds the max memory, reject it
        if (newValueSize > this.maxMemory) {
            return;
        }

        // Check if the key already exists to adjust memory accordingly
        if (this.map.has(key)) {
            const oldValue = this.map.get(key);
            const oldValueSize = MemoryLimitedMap.estimateStringSize(oldValue);
            this.currentMemory -= oldValueSize;
            // Remove the key from its current position in the queue
            const index = this.queue.indexOf(key);
            if (index > -1) {
                this.queue.splice(index, 1);
            }
        }

        // Evict oldest entries until there's enough space
        while (this.currentMemory + newValueSize > this.maxMemory && this.queue.length > 0) {
            const oldestKey = this.queue.shift();
            const oldestValue = this.map.get(oldestKey);
            const oldestValueSize = MemoryLimitedMap.estimateStringSize(oldestValue);
            this.map.delete(oldestKey);
            this.currentMemory -= oldestValueSize;
        }

        // After eviction, check again if there's enough space
        if (this.currentMemory + newValueSize > this.maxMemory) {
            return;
        }

        // Add the new key-value pair
        this.map.set(key, value);
        this.queue.push(key);
        this.currentMemory += newValueSize;
    }

    /**
     * Retrieves the value associated with the given key.
     * @param {string} key
     * @returns {string | undefined}
     */
    get(key) {
        return this.map.get(key);
    }

    /**
     * Checks if the map contains the given key.
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
        return this.map.has(key);
    }

    /**
     * Deletes the key-value pair associated with the given key.
     * @param {string} key
     * @returns {boolean} - Returns true if the key was found and deleted, else false.
     */
    delete(key) {
        if (!this.map.has(key)) {
            return false;
        }
        const value = this.map.get(key);
        const valueSize = MemoryLimitedMap.estimateStringSize(value);
        this.map.delete(key);
        this.currentMemory -= valueSize;

        // Remove the key from the queue
        const index = this.queue.indexOf(key);
        if (index > -1) {
            this.queue.splice(index, 1);
        }

        return true;
    }

    /**
     * Clears all entries from the map.
     */
    clear() {
        this.map.clear();
        this.queue = [];
        this.currentMemory = 0;
    }

    /**
     * Returns the number of key-value pairs in the map.
     * @returns {number}
     */
    size() {
        return this.map.size;
    }

    /**
     * Returns the current memory usage in bytes.
     * @returns {number}
     */
    totalMemory() {
        return this.currentMemory;
    }

    /**
     * Returns an iterator over the keys in the map.
     * @returns {IterableIterator<string>}
     */
    keys() {
        return this.map.keys();
    }

    /**
     * Returns an iterator over the values in the map.
     * @returns {IterableIterator<string>}
     */
    values() {
        return this.map.values();
    }

    /**
     * Iterates over the map in insertion order.
     * @param {Function} callback - Function to execute for each element.
     */
    forEach(callback) {
        this.map.forEach((value, key) => {
            callback(value, key, this);
        });
    }

    /**
     * Makes the MemoryLimitedMap iterable.
     * @returns {Iterator} - Iterator over [key, value] pairs.
     */
    [Symbol.iterator]() {
        return this.map[Symbol.iterator]();
    }
}
