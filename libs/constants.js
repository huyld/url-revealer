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
const FB_REDIRECT_URL_REGEX = /[^=]*=(.+)(?=&h=)/;
const YOUTUBE_REDIRECT_URL_REGEX = /^.*q=([^&]*)&?/;
const HOSTNAME_REGEX = /:\/\/(www[0-9]?\.)?(.[^/:]+)/i;

// DOMAINS
const FACEBOOK_COM = 'facebook.com';
const FACEBOOK_REDIRECT_URL = 'l.facebook.com/l.php?u=';
const YOUTUBE_COM = 'youtube.com';
const YOUTUBE_REDIRECT_URL = '/redirect';

// CONFIGURATION
const WAITING_INTERVAL = 2000;
const WAITING_RETRY_MAX = 10;

const TARGET_DOMS = {
    'facebook.com': [
        {   // Feed
            selector: 'div[role="feed"]',
            mutable: true
        }
    ],
    'youtube.com': [
        {   // Description
            selector: 'div#meta-contents div#container'
        },
        {   // Comments
            selector: 'ytd-comments#comments div#contents',
            mutable: true
        }
    ]
};
