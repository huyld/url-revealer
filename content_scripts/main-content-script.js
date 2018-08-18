
// Port connected to background script
var backgroundPort;

(function() {

    // Create connection with background script
    connectToBackgroundScript(onReceivingMsgBackgroundScript);
})();

/**
 * Create connection with background script
 *
 * @param {any} callback
 */
function connectToBackgroundScript(callback) {
    backgroundPort = chrome.runtime.connect({ name: "port-from-cs" });
    backgroundPort.postMessage({ greeting: "hello from content script" });
    backgroundPort.onMessage.addListener(msg => {
        callback(msg);
    });
}

/**
 * Callback when receive message from background script
 *
 * @param {any} msg
 */
function onReceivingMsgBackgroundScript(msg) {
    console.log("In content script, received message from background script: ");
    console.log(msg.greeting);
}

/**
 * Send the raw URL to background to handle it
 * The background script will return a response object
 * boolean success:
 *      true if background script was able to retrieve original URL of the raw URL
 *      false if raw URL is invalid or does not belongs to a supported domain
 * string url?: (optional) the original URL, only if success is true.
 *
 * @param {string} url
 */
function sendURLToBackground(url) {
    return new Promise(resolve => {
        chrome.runtime.sendMessage(
            null,
            {
                command: 'check-and-handle-url',
                payload: {
                    url: url
                }
            },
            null,
            response => {
                resolve(response);
            }
        );
    });
}
