/**
 * Save short URL, original URL and current time to local storage
 * {
 *      <shortenedUrl>: {
 *          originalUrl: string,
 *          cachedDate: Date
 *      }
 * }
 *
 * @param {*} shortUrl
 * @param {*} originalUrl
 */
function updateUrl(shortUrl, originalUrl) {
    let contentToStore = {};
    contentToStore[shortUrl] = {
        originalUrl: originalUrl,
        cachedDate: Date.now()
    };
    browser.storage.local.set(contentToStore);
}

/**
 * Get information of short URL from local storage
 *
 * @param {*} shortUrl
 * @returns
 */
function getCachedUrl(shortUrl) {
    return browser.storage.local.get(shortUrl);
}

/**
 * Check if cached data is valid or not
 *
 * @param {*} data
 * @returns
 */
function isCacheDataValid(data) {
    // Check if cached data is an empty object
    if (Object.keys(data).length === 0 && data.constructor === Object) {
        return false;
    }

    // Check if cached data is too old (more than 30 days)
    if (
        !!data[Object.keys(data)].cachedDate &&
        new Date() - data[Object.keys(data)].cachedDate > 1000 * 3600 * 24 * 30
    ) {
        return false;
    }

    return true;
}
