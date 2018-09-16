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
        processURL(msg.payload.url).then(response => {
            sendResponse(response);
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
    port.onMessage.addListener(msg => {
        onReceivingMsgContentScript(msg);
    });
    port.onDisconnect.addListener(onPortDisconnected);
}

/**
 * Callback when receive message from content script
 *
 * @param {any} msg
 */
function onReceivingMsgContentScript(msg) {
    console.debug(
        EXT_NAME +
            ': In background script, received message from content script',
        msg
    );
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
    if (supportedDomains.indexOf(getHostName(url)) > -1) {
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
 * @returns
 */
function processURL(url) {
    return new Promise(resolve => {
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
 * If the original URL for the clicked link is in cache, copy it to clipboard
 *
 * @param {*} info
 * @param {*} tab
 */
function onClickContextMenu(info, tab) {
    if (info.menuItemId === MENU_ID_COPY_URL) {
        var messageToContent;
        getCachedUrl(info.linkUrl, cachedUrl => {
            if (!!cachedUrl && Object.keys(cachedUrl).length > 0) {
                const originalUrl = cachedUrl[info.linkUrl].originalUrl;
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
            portFromContentScript.get(tab.id).postMessage({
                command: CMD_DISPLAY_MESSAGE,
                payload: {
                    message: messageToContent
                }
            });
        });
    }
}
