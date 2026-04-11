/**
 * thumbnail-url.js
 *
 * Utility for building thumbnail URLs.
 * Extracted from script.js to allow importing without pulling in the full monolith.
 */

/**
 * Gets the URL for a thumbnail of a specific type and file.
 * @param {import('../../src/endpoints/thumbnails.js').ThumbnailType} type The type of the thumbnail to get
 * @param {string} file The file name or path for which to get the thumbnail URL
 * @param {boolean} [t=false] Whether to add a cache-busting timestamp to the URL
 * @returns {string} The URL for the thumbnail
 */
export function getThumbnailUrl(type, file, t = false) {
    return `/thumbnail?type=${type}&file=${encodeURIComponent(file)}${t ? `&t=${Date.now()}` : ''}`;
}
