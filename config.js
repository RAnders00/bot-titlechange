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
        '#randers',
        '#forsen',
        '#akkirasetsu',
        '#supinic',
        '#nymn',
        '#vadikus007',
        '#bajlada',
        '#fourtf',
        '#apa420',
        '#splitcrumbs',
        '#haxk',
        '#akylus_',
        '#icdb',
        '#pajlada',
        '#samme1g',
        '#seastv',
        '#fabulouspotato69',
        '#teyn',
        '#coral',
        '#thesigge989',
        '#karabast',
        '#leebaxd',
        '#shadopi',
        '#teodorv',
		'#tolekk',
		'#sneesi',
		'#pepsicolasoda',
		'#constera',
		'#thesupergogo',
		'#edomer',
		'#seirion',
    ]
};

// Valid commands start with:
const commandPrefix = '!';

// Twitch API Client ID
const krakenClientId = secrets.krakenClientId;

// list of users with superuser privileges. Use with extreme caution, since
// these users have access to arbitrary code execution with !debug
let administrators = [
    'randers'
];

// The bot will post a "I am running"-style message to this channel on startup.
const startupChannel = 'randers';

// if a channel is offline-only protected, and a change occurs, the bot prints
// to this channel instead of the channel the change occurred in.
const onlinePrintChannel = 'titlechange_bot';

// list of channel names where the bot is not limited to the global 1.2 second
// slowmode (channels it is broadcaster, moderator or VIP in)
const modChannels = [
    'titlechange_bot',
    'randers',
	'forsen',
	'vadikus007'
];

// tip: use !userid <usernames...> command in the #pajlada chat to get user IDs
// add the "protection" object to enable pajbot banphrase checking protection
// pajbotLinkFilter filters out parts of the message that would match the link regex
// add lengthLimit and/or valueLengthLimit to set message length limits and length limits
// for the value printed into notify messages (value will be clipped otherwise)
// if unset, default values of globalLengthLimit and lengthLimit/4 will be used
// add offlineOnly = true to make the bot only print notifies while channel is offline (or changing live status)
// disabledCommands can be an array of (lowercase) command names to disable

// this character is injected into some channels where the broadcaster asked to not get pinged
// by notifies in his channel
const invisibleAntiPingCharacter = "\u{E0000}";

function obfuscateName(str) {
    return [...str].join(invisibleAntiPingCharacter);
}

const globalLengthLimit = 480;

let enabledChannels = {
    "randers": {
        "id": 40286300,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "ppHop randers is live ppHop 👉 ",
            "offline": "MistyHisty randers has gone offline MistyHisty 👉 ",
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
            "offline": "FeelsGoodMan TeaTime FORSEN HAS GONE OFFLINE! FeelsGoodMan TeaTime 👉 "
        },
        "protection": {
            "endpoint": "https://forsen.tv/api/v1/banphrases/test",
            "pajbotLinkFilter": true,
            "offlineOnly": true
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
                "title"
            ]
        }
    },
    "supinic": {
        "id": 31400525,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "ppBounce supinic has gone live ppBounce 👉 ",
            "offline": "SadCat supinic has gone offline SadCat 👉 "
        },
    },
    "nymn": {
        "id": 62300805,
        "formats": {
            "title": "peepoPog NEW TITLE! peepoPog 👉 $VALUE$ 👉 ",
            "game": "peepoPog NEW GAME! peepoPog 👉 $VALUE$ 👉 ",
            "live": "peepoPog NYMN HAS GONE LIVE! peepoPog 👉 ",
            "offline": "FeelsBadMan TeaTime NYMN HAS GONE OFFLINE! FeelsBadMan TeaTime 👉 "
        },
        "protection": {
            "endpoint": "https://nymn.pajbot.com/api/v1/banphrases/test"
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
    "splitcrumbs": {
        "id": 53111939,
        "formats": {
            "title": "PoiWOW NEW TITLE! PoiWOW 👉 $VALUE$ 👉 ",
            "game": "PoiWOW NEW GAME! PoiWOW 👉 $VALUE$ 👉 ",
            "live": "PoiWOW SPLITCRUMBS HAS GONE LIVE! PoiWOW 👉 ",
            "offline": "FeelsBadMan SPLITCRUMBS HAS GONE OFFLINE! FeelsBadMan 👉 ",
        }
    },
    "vadikus007": {
        "id": 72256775,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp FeelsPingedMan 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp FeelsPingedMan 👉 $VALUE$ 👉 ",
            "live": "PagChomp VADIKUS HAS GONE LIVE! PagChomp FeelsPingedMan 👉 ",
            "offline": "FeelsBadMan VADIKUS HAS GONE OFFLINE! FeelsBadMan 👉 ",
        },
        "protection": {
            "endpoint": "https://vadikus007.botfactory.live/api/v1/banphrases/test",
            "lengthLimit": 350,
            "disabledCommands": [
                'quit',
                'debug'
            ]
        }
    },
    "apa420": {
        "id": 43309508,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "PagChomp APA420 HAS GONE LIVE! PagChomp 👉 ",
            "offline": "FeelsBadMan APA420 HAS GONE OFFLINE! FeelsBadMan 👉 "
        }
    },
    "haxk": {
        "id": 91582847,
        "formats": {
            "title": "WeirdChamp NEW TITLE! WeirdChamp 👉 $VALUE$ 👉 ",
            "game": "WeirdChamp NEW GAME! WeirdChamp 👉 $VALUE$ 👉 ",
            "live": "WeirdChamp HAXK HAS GONE LIVE! WeirdChamp 👉 ",
            "offline": "FeelsBadChamp HAXK HAS GONE OFFLINE! FeelsBadChamp 👉 "
        }
    },
    "akylus_": {
        "id": 106921761,
        "formats": {
            "title": "WeirdChamp NEW TITLE! WeirdChamp 👉 $VALUE$ 👉 ",
            "game": "WeirdChamp NEW GAME! WeirdChamp 👉 $VALUE$ 👉 ",
            "live": "WeirdChamp AKYLUS HAS GONE LIVE! WeirdChamp 👉 ",
            "offline": "WeirdChamp AKYLUS HAS GONE OFFLINE! WeirdChamp 👉 "
        }
    },
    "akkirasetsu": {
        "id": 117423271,
        "formats": {
            "title": "RoWOW NEW TITLE! RoWOW 👉 $VALUE$ 👉 ",
            "game": "RoWOW NEW GAME! RoWOW 👉 $VALUE$ 👉 ",
            "live": "RoWOW 👉 AkkiRasetsu has gone live POI 👉 ",
            "offline": "FeelsAkariMan AkkiRasetsu has gone offline FeelsAkariMan 👉 "
        },
    },
    "icdb": {
        "id": 38949074,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "PagChomp 👉 icdb has gone live PagChomp 👉 ",
            "offline": "FeelsBadMan icdb has gone offline FeelsBadMan 👉 "
        },
    },
    "samme1g": {
        "id": 100139411,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "PagChomp 👉 samme1g has gone live PagChomp 👉 ",
            "offline": "FeelsBadMan samme1g has gone offline FeelsBadMan 👉 "
        },
    },
    "seastv": {
        "id": 95734841,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "PagChomp 👉 SeasTV has gone live PagChomp 👉 ",
            "offline": "FeelsBadMan SeasTV has gone offline FeelsBadMan 👉 "
        },
    },
    "fabulouspotato69": {
        "id": 79237040,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "PagChomp 👉 FabulousPotato69 has gone live PagChomp 👉 ",
            "offline": "FeelsBadMan FabulousPotato69 has gone offline FeelsBadMan 👉 "
        },
    },
    "teyn": {
        "id": 133114467,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "PagChomp 👉 Teyn has gone live PagChomp 👉 ",
            "offline": "FeelsBadMan Teyn has gone offline FeelsBadMan 👉 "
        },
        "protection": {
            "endpoint": "https://teyn.botfactory.live/api/v1/banphrases/test",
            "lengthLimit": 350
        }
    },
    "coral": {
        "id": 42197189,
        "formats": {
            "title": "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
            "game": "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
            "live": "PogChamp 👉 coral has gone live PogChamp 👉 ",
            "offline": "FeelsBadMan coral has gone offline FeelsBadMan 👉 "
        },
    },
    "thesigge989": {
        "id": 89959359,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "PagChomp 👉 TheSigge989 has gone live PagChomp 👉 ",
            "offline": "FeelsBadMan TheSigge989 has gone offline FeelsBadMan 👉 "
        },
    },
    "karabast": {
        "id": 128194205,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "PagChomp 👉 Karabast has gone live PagChomp 👉 ",
            "offline": "FeelsBadMan Karabast has gone offline FeelsBadMan 👉 "
        },
    },
    "leebaxd": {
        "id": 143473217,
        "formats": {
            "title": "KokoPes NEW TITLE! KokoPes 👉 $VALUE$ 👉 ",
            "game": "KokoPes NEW GAME! KokoPes 👉 $VALUE$ 👉 ",
            "live": "KokoPes 👉 LeebaXD has gone live KokoPes 👉 ",
            "offline": "monkeyLick LeebaXD has gone offline monkeyLick 👉 "
        },
    },
    "shadopi": {
        "id": 159309353,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "PagChomp 👉 shadopi has gone live PagChomp 👉 ",
            "offline": "FeelsBadMan shadopi has gone offline FeelsBadMan 👉 "
        },
    },
    "teodorv": {
        "id": 60168804,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "PagChomp 👉 Teodorv has gone live PagChomp 👉 ",
            "offline": "FeelsBadMan Teodorv has gone offline FeelsBadMan 👉 "
        },
    },
	"tolekk": {
		"id": 37438411,
		"formats": {
            "title": "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "PagChomp 👉 tolekk has gone live PagChomp 👉 ",
            "offline": "FeelsBadMan tolekk has gone offline FeelsBadMan 👉 "
        },
	},
	"sneesi": {
		"id": 63668719,
		"formats": {
            "title": "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "PagChomp 👉 sneesi has gone live PagChomp 👉 ",
            "offline": "FeelsBadMan sneesi has gone offline FeelsBadMan 👉 "
        },
	},
    "pepsicolasoda": {
        "id": 156028645,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "PagChomp 👉 PepsiColaSoda has gone live PagChomp 👉 ",
            "offline": "FeelsBadMan PepsiColaSoda has gone offline FeelsBadMan 👉 "
        },
    },
    "constera": {
        "id": 133402806,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "PagChomp 👉 Constera has gone live PagChomp 👉 ",
            "offline": "FeelsBadMan Constera has gone offline FeelsBadMan 👉 "
        },
    },
    "thesupergogo": {
        "id": 120573538,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "PagChomp 👉 Thesupergogo has gone live PagChomp 👉 ",
            "offline": "FeelsBadMan Thesupergogo has gone offline FeelsBadMan 👉 "
        },
    },
    "edomer": {
        "id": 104380748,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "PagChomp 👉 edomer has gone live PagChomp 👉 ",
            "offline": "FeelsBadMan edomer has gone offline FeelsBadMan 👉 "
        },
    },
    "seirion": {
        "id": 62031020,
        "formats": {
            "title": "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
            "game": "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
            "live": "PagChomp 👉 Seirion has gone live PagChomp 👉 ",
            "offline": "FeelsBadMan Seirion has gone offline FeelsBadMan 👉 "
        },
    }
};

module.exports = {
    "opts": opts,
    "commandPrefix": commandPrefix,
    "krakenClientId": krakenClientId,
    "administrators": administrators,
    "startupChannel": startupChannel,
    "onlinePrintChannel": onlinePrintChannel,
    "modChannels": modChannels,
    "enabledChannels": enabledChannels,
    "globalLengthLimit": globalLengthLimit
};
