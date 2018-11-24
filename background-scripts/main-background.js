// Input field used to set original URL to be copied to clipboard
let clipboardDom;

// List of ports connected to content scripts
var portFromContentScript = new Map();

// Create context menu for link elements
chrome.contextMenus.create(
    {
        id: MENU_ID_COPY_URL,
        title: chrome.i18n.getMessage('menuItemCopyUrl'),
        contexts: ['link'],
        onclick: onClickContextMenu
    },
    onMenuCreated
);

// Listen to connection from content script
chrome.runtime.onConnect.addListener(onContentScriptConnected);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.debug(
        EXT_NAME + ': Receive message from tab %s: ',
        sender.tab.id,
        msg.command,
        msg.payload
    );
    if (msg.command === CMD_CHECK_AND_HANDLE_URL) {
        processURL(msg.payload.url)
            .then(response => {
                sendResponse(response);
            }).catch(errorResponse => {
                console.info(EXT_NAME + ': Unable to send request to shortened URL. Detail: ', errorResponse.message);
                sendResponse(errorResponse);
            });
    }
    return true;
});

/**
 * Listener to connection from content script
 *
 * @param {any} port
 */
function onContentScriptConnected(port) {
    portFromContentScript.set(port.sender.tab.id, port);
    port.onMessage.addListener((msg, port) => {
        onReceivingMsgContentScript(msg, port);
    });
    port.onDisconnect.addListener(onPortDisconnected);
}

/**
 * Callback when receive message from content script
 *
 * @param {any} msg
 * @param {Port} port the port the the content script that sent the message
 */
function onReceivingMsgContentScript(msg, port) {
    console.debug(
        EXT_NAME +
            ': In background script, received message from content script',
        msg
    );

    if (msg.command === CMD_LONG_LINK_EXTRACTED) {
        copyDestinationURL(msg.payload.url).then(messageToContent => {
            port.postMessage({
                command: CMD_DISPLAY_MESSAGE,
                payload: {
                    message: messageToContent
                }
            });
        });
    }
}

/**
 * Listener to disconnection from content script (tab closed or error occurs)
 *
 * @param {*} port
 */
function onPortDisconnected(port) {
    if (chrome.runtime.lastError) {
        console.error(
            EXT_NAME + ': port disconnected due to an error',
            chrome.runtime.lastError.message
        );
    } else {
        console.debug(
            EXT_NAME + ': port from tab %s disconnected',
            port.sender.tab.id,
            port
        );
    }
    const x = portFromContentScript.delete(port.sender.tab.id);
}

/**
 * Check if the URL is in supported domain list
 *
 * @param {*} url
 * @returns
 */
function isURLSupported(url) {
    if (SUPPORTED_DOMAINS.indexOf(getHostName(url)) > -1) {
        const hostname = getHostName(url);
        // The string after the hostname. E.g. '/abc' in 'tinyurl.com/abc'
        const tail = url.substring(url.indexOf(hostname) + hostname.length, url.length);
        if (tail === '/' || tail === '') {
            // The URL is just the homepage of the shortening service
            return false;
        } else {
            return true;
        }
    }
    return false;
}

/**
 * Get destination of raw URL of if it belongs to a supported domain
 * Use cached data if available.
 *
 * @param {string} url
 * @returns {Promise<{success: boolean, originalURL?: string, message?: string}}
 */
function processURL(url) {
    return new Promise((resolve, reject) => {
        if (isURLSupported(url)) {
            getCachedUrl(url, storedInfo => {
                var response = {};
                // Check if the URL is stored in cache
                if (isCacheDataValid(storedInfo)) {
                    response['success'] = true;
                    response['originalURL'] = storedInfo[url].originalUrl;
                    resolve(response);
                } else {
                    // Make new request for original URL if it's not in cache or too old
                    requestUrl(url).then(originalURL => {
                        updateUrl(url, originalURL, () => {
                            response['success'] = true;
                            response['originalURL'] = originalURL;
                            resolve(response);
                        });
                    })
                    .catch(error => {
                        response['success'] = false;
                        response['message'] = error.toString();
                        reject(response);
                    });
                }
            });
        } else {
            var response = {};
            response['success'] = false;
            resolve(response);
        }
    });
}

/**
 * Callback after context menu created
 *
 */
function onMenuCreated() {
    if (chrome.runtime.lastError) {
        console.log(
            EXT_NAME + ': Error on creating menu: ',
            chrome.runtime.lastError
        );
    }
}

/**
 * Handle event context menu clicked
 * Request content script to extract long URL from redirecting URL (if any)
 *
 * @param {*} info
 * @param {*} tab
 */
function onClickContextMenu(info, tab) {
    if (info.menuItemId === MENU_ID_COPY_URL) {
        portFromContentScript.get(tab.id).postMessage({
            command: CMD_EXTRACT_LONG_LINK_FROM_ANCHOR
        });
    }
}

/**
 * If the original URL for the clicked link is in cache, copy it to clipboard
 *
 * @param {string} url
 * @returns {Promise<string>} the message indicates whether destination URL copied successfully
 */
function copyDestinationURL(url) {
    return new Promise(resolve => {
        getCachedUrl(url, cachedUrl => {
            let messageToContent;
            if (!!cachedUrl && Object.keys(cachedUrl).length > 0) {
                const originalUrl = cachedUrl[url].originalUrl;
                if (!clipboardDom) {
                    clipboardDom = document.createElement('input');
                    clipboardDom.style.top = '-300px';
                    clipboardDom.style.position = 'absolute';
                    document.body.appendChild(clipboardDom);
                }
                clipboardDom.value = originalUrl;
                clipboardDom.select();
                const successCopied = document.execCommand('copy');
                if (successCopied) {
                    messageToContent = chrome.i18n.getMessage('msgCopySuccess');
                } else {
                    messageToContent = chrome.i18n.getMessage('msgCopyFailed');
                }
            } else {
                messageToContent = chrome.i18n.getMessage('msgNotSupportUrl');
            }

            resolve(messageToContent);
        });
    });
}
