// List of ports connected to content scripts
var portFromContentScript = [];

// Listen to connection from content script
chrome.runtime.onConnect.addListener(onContentScriptConnected);

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
