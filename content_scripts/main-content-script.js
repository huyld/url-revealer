
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
