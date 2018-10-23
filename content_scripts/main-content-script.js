// Domain of current page
const currentDomain = getHostName(window.location.href);
var observerList = [];

// Port connected to background script
var backgroundPort;

// DOM object to display message
var announcer;

(function() {
    createAnnouncer();

    // Create connection with background script
    connectToBackgroundScript(onReceivingMsgBackgroundScript);

    switch(currentDomain) {
        case YOUTUBE_COM:
        case FACEBOOK_COM: {
            TARGET_DOMS[currentDomain].forEach(target => {
                waitForTargetDOM(target.selector).then(targetDOM => {
                    if (target.mutable) {
                        // Scan for anchor element and handle the initial ones first
                        const anchors = targetDOM.getElementsByTagName('a');
                        processAnchorElements(anchors);

                        // Then observe further mutations
                        observeMutation(targetDOM);
                    } else {
                        const dom = document.querySelector(target.selector);
                        const anchors = dom.getElementsByTagName('a');
                        processAnchorElements(anchors);
                    }
                }).catch(error => {
                    console.log(
                        EXT_NAME + ': Error on loading target DOMs: ',
                        error.message
                    );
                });
            });
            break;
        }
        default: {
            targetDOMs.forEach(target => {
                const anchors = target.getElementsByTagName('a');
                processAnchorElements(anchors);
            });
            break;
        }
    }
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
    backgroundPort = chrome.runtime.connect({ name: 'port-from-cs' });
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
 * Waiting for a specific section of the page to load so we can query it later
 *
 */
function waitForTargetDOM(selector) {
    return new Promise((resolve, reject) => {
        let tries = 0;
        if (selector === '') {
            resolve(document.body);
        } else {
            const interval = setInterval(() => {
                ++tries;
                const dom = document.querySelector(selector);
                if (dom) {
                    clearInterval(interval);
                    resolve(dom);
                } else if (tries >= WAITING_RETRY_MAX) {
                    reject(new Error('Timeout: waiting for feed too long'));
                }
            }, WAITING_INTERVAL);
        }
    })
}

/**
 * Listen to changes of this DOM.
 * If an anchor is added or an anchor's attribute changes, process that anchor.
 *
 * @param {*} observedTarget
 */
function observeMutation(observedTarget) {
    const config = {
        childList: true,
        subtree: true
    };
    const observer = new MutationObserver(mutationsList => {
        mutationsList.forEach(mutation => {
            if (mutation.type === 'childList') {
                const anchors = Array.prototype.filter.call(
                    mutation.addedNodes,
                    node => node.nodeName.toLowerCase() === 'a' ? true : false
                );
                processAnchorElements(anchors);
            } else if (mutation.type === 'attributes' && mutation.target.nodeName.toLowerCase() === 'a') {
                processAnchorElements([mutation.target]);
            }
        })
    });
    observerList.push(observer);
    observer.observe(observedTarget, config);
}

/**
 * Send url of all anchor tags to background for further process.
 * If the response.success is true, this means the URL belongs to a supported domain,
 * then set the result as anchor's attribute.
 *
 */
function processAnchorElements(anchors) {

    for (let i = 0; i < anchors.length; i++) {
        const anchor = anchors[i];
        var url = '';

        switch (currentDomain) {
            // External links in somesites aren't exposed initially.
            // Thus we need to detect and decode it
            // before sending to background script for further processing
            case FACEBOOK_COM: {
                const href = anchor.href;
                if (href.indexOf(FACEBOOK_REDIRECT_URL) > -1) {
                    // If this URL is an external link, get the external URL and decode it
                    let matches = href.match(FB_REDIRECT_URL_REGEX);
                    if (!!matches && matches.length > 1) {
                        const encodedURL = matches[1];
                        url = decodeURIComponent(encodedURL);
                    } else {
                        continue;
                    }
                } else {
                    continue;
                }
                break;
            }

            case YOUTUBE_COM: {
                const href = anchor.href;
                if (href.indexOf(YOUTUBE_REDIRECT_URL) > -1) {
                    // If this URL is an external link, get the external URL and decode it
                    let matches = href.match(YOUTUBE_REDIRECT_URL_REGEX);
                    if (!!matches && matches.length > 1) {
                        const encodedURL = matches[1];
                        url = decodeURIComponent(encodedURL);
                    } else {
                        continue;
                    }
                } else {
                    continue;
                }
                break;
            }

            default:
                url = anchor.href;
        }
        if (url !== '') {
            sendURLToBackground(url).then(response => {
                if (response.success) {
                    anchor.setAttribute('data-url-tooltip', response.originalURL);
                }
            });
        }
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
