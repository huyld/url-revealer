const hostnnameRegex = /:\/\/(www[0-9]?\.)?(.[^/:]+)/i;

/**
 * Extract hostname from full URL
 *
 * @param {*} url
 * @returns
 */
function getHostName(url) {
    var match = url.match(hostnnameRegex);
    if (
        match != null &&
        match.length > 2 &&
        typeof match[2] === 'string' &&
        match[2].length > 0
    ) {
        return match[2];
    } else {
        return null;
    }
}
