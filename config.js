'use strict';

const secrets = require('./secrets');

const opts = {
    connection: {
        secure: true
    },
    identity: {
        username: 'titlechange_bot',
        password: secrets.ircPassword
    },
    channels: [
        '#titlechange_bot',
        '#randers00',
        '#forsen',
        '#akkirasetsu',
        '#supinic',
        '#nymn',
        '#vadikus007',
        '#bajlada',
        '#fourtf',
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

// if a channel is offline-only protected, and a change occurs, the bot prints
// to this channel instead of the channel the change occurred in.
const onlinePrintChannel = 'titlechange_bot';

// list of channel names where the bot is not limited to the global 1.2 second
// slowmode (channels it is broadcaster, moderator or VIP in)
const modChannels = [
    'titlechange_bot',
    'randers00'
];

// tip: use !userid <usernames...> command in the #pajlada chat to get user IDs
// add the "protection" object to enable pajbot banphrase checking protection
// pajbotLinkFilter filters out parts of the message that would match the link regex
// add lengthLimit and/or valueLengthLimit to set message length limits and length limits
// for the value printed into notify messages (value will be clipped otherwise)
// if unset, default values of 500 and lengthLimit/4 will be used
// add offlineOnly = true to make the bot only print notifies while channel is offline (or changing live status)
// disabledCommands can be an array of (lowercase) command names to disable

// this character is injected into some channels where the broadcaster asked to not get pinged
// by notifies in his channel
const invisibleAntiPingCharacter = "\u206D";

function obfuscateName(str) {
    return str.split('').join(invisibleAntiPingCharacter);
}

let enabledChannels = {
    "randers00": {
        "id": 40286300,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "ppHop randers00 is live ppHop 👉 ",
            "offline": "MistyHisty randers00 has gone offline MistyHisty 👉 ",
            "partner": "lol partnered "
        }, "protection": {
            "valueLengthLimit": 80
        }
    },
    "forsen": {
        "id": 22484632,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "KKool GuitarTime FORSEN HAS GONE LIVE! KKool GuitarTime 👉 ",
            "offline": "FeelsGoodMan Clap FORSEN HAS GONE OFFLINE! FeelsGoodMan Clap 👉 "
        },
        "protection": {
            "endpoint": "https://forsen.tv/api/v1/banphrases/test",
            "pajbotLinkFilter": true,
            "offlineOnly": true,
            "disabledCommands": [
                "debug"
            ]
        }
    },
    "pajlada": {
        "id": 11148817,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": `PagChomp 👉 ${obfuscateName("pajlada")} has gone live pajaH 👉 `,
            "offline": `pajaSad ${obfuscateName("pajlada")} has gone offline pajaSad 👉 `
        },
        "protection": {
            "endpoint": "https://paj.pajlada.se/api/v1/banphrases/test",
            "disabledCommands": [
                "bot",
                "ping",
                "help",
                "game",
                "title",
                "debug"
            ]
        }
    },
    "supinic": {
        "id": 31400525,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "ppHop supinic has gone live ppHop 👉 ",
            "offline": "FeelsBadMan supinic has gone offline FeelsBadMan 👉 "
        },
    },
    "nymn": {
        "id": 62300805,
        "formats": {
            "title": "peepoPog NEW TITLE! peepoPog 👉 $VALUE$ 👉 ",
            "game": "peepoPog NEW GAME! peepoPog 👉 $VALUE$ 👉 ",
            "live": "peepoPog NYMN HAS GONE LIVE! peepoPog 👉 ",
            "offline": "FeelsBadMan NYMN HAS GONE OFFLINE! FeelsBadMan 👉 "
        },
        "protection": {
            "endpoint": "https://nymn.pajbot.com/api/v1/banphrases/test",
            "lengthLimit": 300, // only in online chat
            //"noPingMode": true,
            "disabledCommands": [
                // "notifyme"
            ]
        }
    },
    "bajlada": {
        "id": 159849156,
        "formats": {
            "title": "yeetDog NEW TITLE! yeetDog 👉 $VALUE$ 👉 ",
            "game": "yeetDog NEW GAME! yeetDog 👉 $VALUE$ 👉 ",
            "live": "yeetDog bajlada HAS GONE LIVE! yeetDog 👉 ",
            "offline": "yeetDog bajlada HAS GONE OFFLINE! yeetDog 👉 "
        }
    },
    "fourtf": {
        "id": 54633016,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp FeelsPingedMan 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp FeelsPingedMan 👉 $VALUE$ 👉 ",
            "live": "PagChomp FOURTF HAS GONE LIVE! PagChomp FeelsPingedMan 👉 ",
            "offline": "FeelsBadMan FOURTF HAS GONE OFFLINE! FeelsBadMan 👉 ",
        }
    },
    "vadikus007": {
        "id": 72256775,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp FeelsPingedMan 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp FeelsPingedMan 👉 $VALUE$ 👉 ",
            "live": "PagChomp VADIKUS HAS GONE LIVE! PagChomp FeelsPingedMan 👉 ",
            "offline": "FeelsBadMan VADIKUS HAS GONE OFFLINE! FeelsBadMan 👉 ",
            "partner": "PagChomp PagChomp PagChomp PagChomp 👉 VADIKUS IS NOW A TWITCH PARTNER!!!! PagChomp PagChomp PagChomp PagChomp 👉 "
        },
        "protection": {
            "lengthLimit": 250
        }
    },
    "akkirasetsu": {
        "id": 117423271,
        "formats": {
            "title": "RoWOW NEW TITLE! RoWOW 👉 $VALUE$ 👉 ",
            "game": "RoWOW NEW GAME! RoWOW 👉 $VALUE$ 👉 ",
            "live": "RoWOW 👉 AkkiRasetsu has gone live POI 👉 ",
            "offline": "FeelsAkariMan AkkiRasetsu has gone offline FeelsAkariMan  👉 "
        },
    }/**/
};

module.exports = {
    "opts": opts,
    "commandPrefix": commandPrefix,
    "krakenClientId": krakenClientId,
    "administrators": administrators,
    "startupChannel": startupChannel,
    "onlinePrintChannel": onlinePrintChannel,
    "modChannels": modChannels,
    "enabledChannels": enabledChannels
};