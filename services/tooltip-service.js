var anchors = document.getElementsByTagName('a');

setUrlAttributeForAnchors();

/**
 * Get original URL of anchors and set the result as its attribute.
 * Use cached data if available.
 *
 */
function setUrlAttributeForAnchors() {
    for (let i = 0; i < anchors.length; i++) {
        const anchor = anchors[i];
        if (supportedDomains.indexOf(getHostName(anchor.href)) > -1) {
            getCachedUrl(anchor.href).then(storedInfo => {
                // Check if the URL is stored in cache
                if (isCacheDataValid(storedInfo)) {
                    anchor.setAttribute(
                        'data-url-tooltip',
                        storedInfo[anchor.href].originalUrl
                    );
                } else {
                    // Make new request for original URL if it's not in cache or too old
                    requestUrl(anchor.href).then(originalURL => {
                        anchor.setAttribute('data-url-tooltip', originalURL);
                        updateUrl(anchor.href, originalURL);
                    });
                }
            });
        }
    }
}
