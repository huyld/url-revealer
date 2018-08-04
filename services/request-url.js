/**
 * Return the final destination URL from the shortened URL
 *
 * @param {string} sourceUrl
 * @returns
 */
function requestUrl(sourceUrl) {
    var hostname = getHostName(sourceUrl);
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = onStateChangeCallback.bind(this, resolve, reject, xhr);
        switch (hostname) {
            default:
                xhr.open('HEAD', sourceUrl, true);
                break;
        }
        xhr.send();
    });
}

/**
 * Callback for readystatechange event
 *
 * @param {*} resolve
 * @param {*} reject
 * @param {*} xhr
 * @param {*} event
 */
function onStateChangeCallback(resolve, reject, xhr, event) {
    if (event.target.readyState == 2) {
        resolve(event.target.responseURL);

        // Only the header is necessary
        xhr.abort();
    }
}
