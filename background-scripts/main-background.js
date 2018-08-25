// ID of context menu
const copyTrueUrlMenuID = 'url-revealer-copy';

// Input field used to set original URL to be copied to clipboard
let clipboardDom;

// Create context menu for link elements
chrome.contextMenus.create(
    {
        id: copyTrueUrlMenuID,
        title: chrome.i18n.getMessage('menuItemCopyUrl'),
        contexts: ['link'],
        onclick: onClickContextMenu
    },
    onMenuCreated
);

// List of ports connected to content scripts
var portFromContentScript = [];

// Listen to connection from content script
chrome.runtime.onConnect.addListener(onContentScriptConnected);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.debug('URL Revealer: Receive message from tab %s: ', sender.tab.id, msg.command, msg.payload);
    if (msg.command === 'check-and-handle-url') {
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
    portFromContentScript.push(port);
    port.postMessage({ greeting: "hi there content script!" });
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
    console.log("In background script, received message from content script", msg);
}

/**
 * Listener to disconnection from content script (tab closed or error occurs)
 *
 * @param {*} port
 */
function onPortDisconnected(port) {
    if (chrome.runtime.lastError) {
        console.error('URL Revealer: port disconnected due to an error', chrome.runtime.lastError.message);
    } else {
        console.debug('URL Revealer: port from tab %s disconnected', port.sender.tab.id, port);
    }
    const index = portFromContentScript.indexOf(port);
    if (index > -1) {
        portFromContentScript.splice(index, 1);
    }
}

/**
 * Check if the URL is in supported domain list
 *
 * @param {*} url
 * @returns
 */
function isURLSupported(url) {
    return supportedDomains.indexOf(getHostName(url)) > -1 ? true : false;
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
                    response['orignalURL'] = storedInfo[url].originalUrl;
                    resolve(response);
                } else {
                    // Make new request for original URL if it's not in cache or too old
                    requestUrl(url).then(originalURL => {
                        updateUrl(url, originalURL);
                        response['success'] = true;
                        response['orignalURL'] = storedInfo[url].originalUrl;
                        resolve(response);
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
        console.log(`URL Revealer: Error: ${chrome.runtime.lastError}`);
    } else {
        console.log('URL Revealer: Context menu created successfully');
    }
}

/**
 * Handle event context menu clicked
 *
 * @param {*} info
 * @param {*} tab
 */
function onClickContextMenu(info, tab) {
}
