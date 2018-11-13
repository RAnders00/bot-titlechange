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
        '#supinic',
        '#zflare3',
        '#nymn',
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
// add lengthLimit and/or valueLengthLimit to set message length limits and length limits
// for the value printed into notify messages (value will be clipped otherwise)
// if unset, default values of 400 and lengthLimit/4 will be used
// add offlineOnly = true to make the bot only print notifies while channel is offline (or changing live status)
let enabledChannels = {
    "randers00": {
        "id": 40286300,
        "formats": {
            "title": "/me PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "/me PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "/me ppHop randers00 is live ppHop 👉 ",
            "offline": "/me MistyHisty randers00 has gone offline MistyHisty 👉 "
        }, "protection": {
            "valueLengthLimit": 80
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
            "endpoint": "https://forsen.tv/api/v1/banphrases/test",
            "offlineOnly": true
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
    "supinic": {
        "id": 31400525,
        "formats": {
            "title": "/me PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "/me PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "/me ppHop supinic has gone live ppHop 👉 ",
            "offline": "/me FeelsBadMan supinic has gone offline FeelsBadMan 👉 "
        },
    },
    "zflare3": {
        "id": 143339442,
        "formats": {
            "title": "/me Bestboy NEW TITLE! Bestboy  👉 $VALUE$ 👉 ",
            "game": "/me Bestboy NEW GAME! Bestboy  👉 $VALUE$ 👉 ",
            "live": "/me Bestboy Zflare3 has gone live Bestboy  👉 ",
            "offline": "/me FeelsBadMan Zflare3 has gone offline FeelsBadMan 👉 "
        },
    },
    "nymn": {
        "id": 62300805,
        "formats": {
            "title": "/me PogU NEW TITLE! PogU 👉 $VALUE$ 👉 ",
            "game": "/me PogU NEW GAME! PogU 👉 $VALUE$ 👉 ",
            "live": "/me PogU NYMN HAS GONE LIVE! PogU 👉 ",
            "offline": "/me FeelsBadMan NYMN HAS GONE OFFLINE! FeelsBadMan 👉 "
        },
        "protection": {
            "endpoint": "https://nymn.pajbot.com/api/v1/banphrases/test",
            "lengthLimit": 300 // only in online chat
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