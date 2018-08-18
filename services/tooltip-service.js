var anchors = document.getElementsByTagName('a');

setUrlAttributeForAnchors();

/**
 * Send url of all anchor tags to background for further process.
 * If the response.success is true, this means the URL belongs to a supported domain,
 * then set the result as anchor's attribute.
 *
 */
function setUrlAttributeForAnchors() {
    for (let i = 0; i < anchors.length; i++) {
        const anchor = anchors[i];
        sendURLToBackground(anchor.href).then(response => {
            if (response.success) {
                anchor.setAttribute(
                    'data-url-tooltip',
                    response.orignalURL
                );
            }
        });
    }
}
