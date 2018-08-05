/**
 * There was an error executing the script.
 */
function reportExecuteScriptError(error) {
    console.error(`Failed to execute main content script: ${error.message}`);
}

/**
 * When the popup loads, inject a content script into the active tab.
 * If we couldn't inject the script, handle the error.
 */
chrome.tabs.executeScript({ file: "/content_scripts/popup-content-script.js" })
    .catch(reportExecuteScriptError);
