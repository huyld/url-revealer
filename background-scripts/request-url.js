/**
 * Return the final destination URL from the shortened URL
 *
 * @param {string} sourceUrl
 * @returns {Promise<string>} the source URL if success, the error message if fail
 */
function requestUrl(sourceUrl) {
    var hostname = getHostName(sourceUrl);
    return new Promise((resolve, reject) => {
        let method = '';
        switch (hostname) {
            case BITLY_IS:
            case DOIOP_COM:
            case TINYURL_COM:
                // These services don't allow HEAD method
                method = 'GET';
                break;
            default:
                method = 'HEAD';
                break;
        }

        requestUrlHelper(sourceUrl, method)
            .then(result => resolve(result))
            .catch(error => {
                if (error.code === 405) {
                    // Future proof: if services other than the above don't allow HEAD method
                    // Retry to make another request with GET method
                    method = 'GET';
                    requestUrlHelper(sourceUrl, method)
                        .then(result => resolve(result))
                        .catch(error => {
                            // Service still doesn't allow GET method, time to give up 😩
                            reject(new Error(error.message));
                        });
                } else {
                    reject(new Error(error.message));
                }
            });
    });
}

/**
 * Send request to `sourceUrl` using `method`
 *
 * @param {string} sourceUrl
 * @param {string} method `HEAD`, `GET`
 * @returns
 */
function requestUrlHelper(sourceUrl, method) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = onStateChangeCallback.bind(this, resolve, reject, xhr);
        xhr.open(method, sourceUrl, true);
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
    if (event.target.status >= 400) {
        reject({
            code: event.target.status,
            message: `HTTP status ${event.target.status}`
        });
        xhr.abort();
    } else {
        if (event.target.readyState == 2) {
            resolve(event.target.responseURL);

            // Only the header is necessary
            xhr.abort();
        }
    }
}
