// List of all anchor elements in the current page
var anchors = document.getElementsByTagName('a');

// Port connected to background script
var backgroundPort;

// DOM object to display message
var announcer;

(function() {
    createAnnouncer();

    // Create connection with background script
    connectToBackgroundScript(onReceivingMsgBackgroundScript);

    processAnchorElements();
})();

/**
 * Creating the annoucer DOM object and append it to the body
 *
 */
function createAnnouncer() {
    announcer = document.createElement('div');
    announcer.classList.add(CSS_ANNOUNCER_CLASS);
    document.body.appendChild(announcer);
}

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
    if (msg.command === CMD_DISPLAY_MESSAGE) {
        displayMessage(msg.payload.message);
    }
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
                command: CMD_CHECK_AND_HANDLE_URL,
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

/**
 * Send url of all anchor tags to background for further process.
 * If the response.success is true, this means the URL belongs to a supported domain,
 * then set the result as anchor's attribute.
 *
 */
function processAnchorElements() {
    for (let i = 0; i < anchors.length; i++) {
        const anchor = anchors[i];
        sendURLToBackground(anchor.href).then(response => {
            if (response.success) {
                anchor.setAttribute('data-url-tooltip', response.orignalURL);
            }
        });
    }
}

/**
 * Displaying the message using announcer DOM object
 *
 * @param {string} msg
 */
function displayMessage(msg) {
    if (!!msg) {
        announcer.textContent = msg;
        announcer.classList.add(CSS_ANNOUNCER_SHOW_CLASS);
        setTimeout(() => {
            announcer.textContent = '';
            announcer.classList.remove(CSS_ANNOUNCER_SHOW_CLASS);
        }, 3000);
    }
}
