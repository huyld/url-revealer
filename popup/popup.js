/**
 * Callback after executing injected script
 */
function executeScriptCallback() {
    if (chrome.runtime.lastError) {
        console.error(
            `Failed to execute main content script: ${chrome.runtime.lastError}`
        );
    }
}

/**
 * When the popup loads, inject a content script into the active tab.
 */
chrome.tabs.executeScript(
    { file: '/content_scripts/popup-content-script1.js' },
    executeScriptCallback
);
