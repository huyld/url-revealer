var anchors = document.getElementsByTagName('a');

setUrlAttributeForAnchors();

/**
 * Get original URL of anchors and set the result as its attribute
 *
 */
function setUrlAttributeForAnchors() {
    for (let i = 0; i < anchors.length; i++) {
        const anchor = anchors[i];
        if (supportedDomains.indexOf(getHostName(anchor.href)) > -1) {
            requestUrl(anchor.href).then(originalURL => {
                anchor.setAttribute('data-url-tooltip', originalURL);
            });
        }
    }
}
