'use strict';

const secrets = require('./secrets');

const opts = {
    identity: {
        username: 'titlechange_bot',
        password: secrets.ircPassword
    },
    channels: [
        '#randers00',
        '#forsen',
        '#akkirasetsu',
        '#pajlada'/**/
    ]
};

// Valid commands start with:
const commandPrefix = '!';

// Twitch API Client ID
const krakenClientId = secrets.krakenClientId;

// list of users with superuser privileges. Use with extreme caution, since
// these users have access to arbitrary code execution with !debug
let administrators = [
    'randers00'
];

// The bot will post a "I am running"-style message to this channel on startup.
const startupChannel = 'randers00';

// tip: use !userid <usernames...> command in the #pajlada chat to get user IDs
// add the "protection" object to enable pajbot banphrase checking protection
let enabledChannels = {
    "randers00": {
        "id": 40286300,
        "formats": {
            "title": "/me PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "/me PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "/me ppHop randers00 is live ppHop 👉 ",
            "offline": "/me MistyHisty randers00 has gone offline MistyHisty 👉 "
        }
    },
    "forsen": {
        "id": 22484632,
        "formats": {
            "title": "/me PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "/me PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "/me KKool GuitarTime FORSEN HAS GONE LIVE! KKool GuitarTime 👉 ",
            "offline": "/me FeelsBadMan FORSEN HAS GONE OFFLINE! FeelsBadMan 👉 "
        },
        "protection": {
            "endpoint": "https://forsen.tv/api/v1/banphrases/test"
        }
    },
    "pajlada": {
        "id": 11148817,
        "formats": {
            "title": "/me PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "/me PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "/me PagChomp 👉 pajlada has gone live pajaH 👉 ",
            "offline": "/me pajaSad pajlada has gone offline pajaSad 👉 "
        },
        "protection": {
            "endpoint": "https://paj.pajlada.se/api/v1/banphrases/test"
        }
    },
    "akkirasetsu": {
        "id": 117423271,
        "formats": {
            "title": "/me RoWOW NEW TITLE! RoWOW 👉 $VALUE$ 👉 ",
            "game": "/me RoWOW NEW GAME! RoWOW 👉 $VALUE$ 👉 ",
            "live": "/me RoWOW 👉 AkkiRasetsu has gone live POI 👉 ",
            "offline": "/me FeelsAkariMan AkkiRasetsu has gone offline FeelsAkariMan  👉 "
        },
    }/**/
};

module.exports = {
    "opts": opts,
    "commandPrefix": commandPrefix,
    "krakenClientId": krakenClientId,
    "administrators": administrators,
    "startupChannel": startupChannel,
    "enabledChannels": enabledChannels
};