// Listen to connection from content script
browser.runtime.onConnect.addListener(onContentScriptConnected);

var portFromContentScript;

/**
 * Listener to connection from content script
 *
 * @param {any} port
 */
function onContentScriptConnected(port) {
    portFromContentScript = port;
    portFromContentScript.postMessage({ greeting: "hi there content script!" });
    portFromContentScript.onMessage.addListener(msg => {
        onReceivingMsgContentScript(msg);
    });
}

/**
 * Callback when receive message from content script
 *
 * @param {any} msg
 */
function onReceivingMsgContentScript(msg) {
    console.log("In background script, received message from content script")
}
