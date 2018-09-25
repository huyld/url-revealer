/**
 * Extract hostname from full URL
 *
 * @param {*} url
 * @returns
 */
function getHostName(url) {
    var match = url.match(HOSTNAME_REGEX);
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
