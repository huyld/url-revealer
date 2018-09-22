// Extension information
const EXT_NAME = chrome.i18n.getMessage('extensionName');

// CSS class
const CSS_ANNOUNCER_CLASS = 'url-revealer-announcer';
const CSS_ANNOUNCER_SHOW_CLASS = 'url-revealer-announcer-show';

// ID of context menu
const MENU_ID_COPY_URL = 'url-revealer-copy';

// COMMANDS
const CMD_DISPLAY_MESSAGE = 'display-message';
const CMD_CHECK_AND_HANDLE_URL = 'check-and-handle-url';

// REGEX
const HOSTNAME_REGEX = /:\/\/(www[0-9]?\.)?(.[^/:]+)/i;
