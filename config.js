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
        '#zauros0',
        '#redshell',
        '#weebyshell',
        '#actualsw3tz',
        '#360zeus',
        '#weest',
        '#fabzeef',
        '#nosignal_1337',
        '#vesp3r',
        '#sinris',
        '#nymnsmodsweirdchamp',
        '#ourlordtalos',
        '#college_boi',
        '#elina',
        '#rooftophobo',
        '#tene__',
        '#ebbel',
        '#echoflexx',
        '#beem0o',
        '#laden',
        '#zemmygo',
        '#nam______________________',
        '#smaczny',
        '#iownyouanyway',
        '#shibez__',
        '#okhuntre',
        '#teischente',
        '#kiansly',
        '#omegamk19',
        '#emergencycurse',
        '#harmfulopinions',
        '#chickendins',
        '#hadezzishappy',
        '#sohyp3d',
        '#ali2465',
        '#shungite_dealer_rauuuul',
        '#marinak0s',
        '#cubiie',
        '#romydank',
        '#thanhschaefer',
        '#acrivfx',
        '#znicuuu',
        '#pulcsi_',
        '#connerxdd',
        '#thegoldenfury',
        '#senderak',
        '#kattah',
        '#katsugara',
        '#lukickk',
        '#mrolle_',
        '#knobo_',
        '#0ut3',
        '#swzzl',
        '#ggft4',
        '#kehlery',
        '#daie_',
        '#seanc26',
        '#psychonautandy',
        '#sodapoppin',
    ]
};

// Valid commands start with:
const commandPrefix = '!';

// Twitch API Client ID
const krakenClientId = secrets.krakenClientId;

// list of users with superuser privileges. Use with extreme caution, since
// these users have access to arbitrary code execution with !debug
let administrators = ['randers'];

// The bot will post a "I am running"-style message to this channel on startup.
const startupChannel = 'randers';

// if a channel is offline-only protected, and a change occurs, the bot prints
// to this channel instead of the channel the change occurred in.
const onlinePrintChannel = 'titlechange_bot';

// list of channel names where the bot is not limited to the global 1.2 second
// slowmode (channels it is broadcaster, moderator or VIP in)
const modChannels = ['titlechange_bot', 'randers', 'forsen', 'vadikus007'];

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
const invisibleAntiPingCharacter = '\u{E0000}';

function obfuscateName(str) {
    return [...str].join(invisibleAntiPingCharacter);
}

const globalLengthLimit = 480;

let enabledChannels = {
    randers: {
        id: 40286300,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'ppHop randers is live ppHop 👉 ',
            offline: 'MistyHisty randers has gone offline MistyHisty 👉 ',
            partner: 'lol partnered '
        },
        protection: {
            valueLengthLimit: 80
        }
    },
    forsen: {
        id: 22484632,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'KKool GuitarTime FORSEN HAS GONE LIVE! KKool GuitarTime 👉 ',
            offline: 'Okayeg TeaTime FORSEN HAS GONE OFFLINE! Okayeg TeaTime 👉 '
        },
        protection: {
            endpoint: 'https://forsen.tv/api/v1/banphrases/test',
            pajbotLinkFilter: true,
            offlineOnly: true
        }
    },
    pajlada: {
        id: 11148817,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: `PagChomp 👉 ${obfuscateName('pajlada')} has gone live pajaH 👉 `,
            offline: `${obfuscateName(
                'pajlada'
            )} has gone offline pajaWalk1 pajaWalk2 pajaWalk3 🚪 `
        },
        protection: {
            endpoint: 'https://pajlada.pajbot.com/api/v1/banphrases/test',
            disabledCommands: ['bot', 'ping', 'help', 'game', 'title']
        },
    },
    supinic: {
        id: 31400525,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'ppBounce supinic has gone live ppBounce 👉 ',
            offline: 'SadCat supinic has gone offline SadCat 👉 '
        }
    },
    nymn: {
        id: 62300805,
        formats: {
            title: 'peepoPog NEW TITLE! peepoPog 👉 $VALUE$ 👉 ',
            game: 'peepoPog NEW GAME! peepoPog 👉 $VALUE$ 👉 ',
            live: 'peepoPog NYMN HAS GONE LIVE! peepoPog 👉 ',
            offline:
                'FeelsBadMan TeaTime NYMN HAS GONE OFFLINE! FeelsBadMan TeaTime 👉 '
        },
        protection: {
            endpoint: 'https://nymn.pajbot.com/api/v1/banphrases/test'
        }
    },
    bajlada: {
        id: 159849156,
        formats: {
            title: 'yeetDog NEW TITLE! yeetDog 👉 $VALUE$ 👉 ',
            game: 'yeetDog NEW GAME! yeetDog 👉 $VALUE$ 👉 ',
            live: 'yeetDog bajlada HAS GONE LIVE! yeetDog 👉 ',
            offline: 'yeetDog bajlada HAS GONE OFFLINE! yeetDog 👉 '
        }
    },
    fourtf: {
        id: 54633016,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp FeelsPingedMan 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp FeelsPingedMan 👉 $VALUE$ 👉 ',
            live: 'PagChomp FOURTF HAS GONE LIVE! PagChomp FeelsPingedMan 👉 ',
            offline: 'FeelsBadMan FOURTF HAS GONE OFFLINE! FeelsBadMan 👉 '
        }
    },
    splitcrumbs: {
        id: 53111939,
        formats: {
            title: 'PoiWOW NEW TITLE! PoiWOW 👉 $VALUE$ 👉 ',
            game: 'PoiWOW NEW GAME! PoiWOW 👉 $VALUE$ 👉 ',
            live: 'PoiWOW SPLITCRUMBS HAS GONE LIVE! PoiWOW 👉 ',
            offline: 'FeelsBadMan SPLITCRUMBS HAS GONE OFFLINE! FeelsBadMan 👉 '
        }
    },
    vadikus007: {
        id: 72256775,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp FeelsPingedMan 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp FeelsPingedMan 👉 $VALUE$ 👉 ',
            live: 'PagChomp VADIKUS HAS GONE LIVE! PagChomp FeelsPingedMan 👉 ',
            offline: 'FeelsBadMan VADIKUS HAS GONE OFFLINE! FeelsBadMan 👉 '
        },
        protection: {
            endpoint: 'https://vadikus007.botfactory.live/api/v1/banphrases/test',
            lengthLimit: 350,
            disabledCommands: ['quit', 'debug']
        }
    },
    apa420: {
        id: 43309508,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp APA420 HAS GONE LIVE! PagChomp 👉 ',
            offline: 'FeelsBadMan APA420 HAS GONE OFFLINE! FeelsBadMan 👉 '
        }
    },
    haxk: {
        id: 91582847,
        formats: {
            title: 'WeirdChamp NEW TITLE! WeirdChamp 👉 $VALUE$ 👉 ',
            game: 'WeirdChamp NEW GAME! WeirdChamp 👉 $VALUE$ 👉 ',
            live: 'WeirdChamp HAXK HAS GONE LIVE! WeirdChamp 👉 ',
            offline: 'FeelsBadChamp HAXK HAS GONE OFFLINE! FeelsBadChamp 👉 '
        }
    },
    akylus_: {
        id: 106921761,
        formats: {
            title: 'WeirdChamp NEW TITLE! WeirdChamp 👉 $VALUE$ 👉 ',
            game: 'WeirdChamp NEW GAME! WeirdChamp 👉 $VALUE$ 👉 ',
            live: 'WeirdChamp AKYLUS HAS GONE LIVE! WeirdChamp 👉 ',
            offline: 'WeirdChamp AKYLUS HAS GONE OFFLINE! WeirdChamp 👉 '
        }
    },
    akkirasetsu: {
        id: 117423271,
        formats: {
            title: 'RoWOW NEW TITLE! RoWOW 👉 $VALUE$ 👉 ',
            game: 'RoWOW NEW GAME! RoWOW 👉 $VALUE$ 👉 ',
            live: 'RoWOW 👉 AkkiRasetsu has gone live POI 👉 ',
            offline: 'FeelsAkariMan AkkiRasetsu has gone offline FeelsAkariMan 👉 '
        }
    },
    icdb: {
        id: 38949074,
        formats: {
            title: 'himExcite NEW TITLE! himExcite 👉 $VALUE$ 👉 ',
            game: 'himExcite NEW GAME! himExcite 👉 $VALUE$ 👉 ',
            live: 'himExcite 👉 icdb has gone live himExcite 👉 ',
            offline: 'worryCry icdb has gone offline worryCry 👉 '
        }
    },
    samme1g: {
        id: 100139411,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 samme1g has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan samme1g has gone offline FeelsBadMan 👉 '
        }
    },
    seastv: {
        id: 95734841,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 SeasTV has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan SeasTV has gone offline FeelsBadMan 👉 '
        }
    },
    fabulouspotato69: {
        id: 79237040,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 FabulousPotato69 has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan FabulousPotato69 has gone offline FeelsBadMan 👉 '
        }
    },
    teyn: {
        id: 133114467,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 Teyn has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan Teyn has gone offline FeelsBadMan 👉 '
        },
        protection: {
            endpoint: 'https://teyn.botfactory.live/api/v1/banphrases/test',
            lengthLimit: 350
        }
    },
    coral: {
        id: 42197189,
        formats: {
            title: 'PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ',
            game: 'PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ',
            live: 'PogChamp 👉 coral has gone live PogChamp 👉 ',
            offline: 'FeelsBadMan coral has gone offline FeelsBadMan 👉 '
        }
    },
    thesigge989: {
        id: 89959359,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 TheSigge989 has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan TheSigge989 has gone offline FeelsBadMan 👉 '
        }
    },
    karabast: {
        id: 128194205,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 Karabast has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan Karabast has gone offline FeelsBadMan 👉 '
        }
    },
    leebaxd: {
        id: 143473217,
        formats: {
            title: 'KokoPes NEW TITLE! KokoPes 👉 $VALUE$ 👉 ',
            game: 'KokoPes NEW GAME! KokoPes 👉 $VALUE$ 👉 ',
            live: 'KokoPes 👉 LeebaXD has gone live KokoPes 👉 ',
            offline: 'monkeyLick LeebaXD has gone offline monkeyLick 👉 '
        }
    },
    shadopi: {
        id: 159309353,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 shadopi has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan shadopi has gone offline FeelsBadMan 👉 '
        }
    },
    teodorv: {
        id: 60168804,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 Teodorv has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan Teodorv has gone offline FeelsBadMan 👉 '
        }
    },
    tolekk: {
        id: 37438411,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 tolekk has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan tolekk has gone offline FeelsBadMan 👉 '
        }
    },
    sneesi: {
        id: 63668719,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 sneesi has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan sneesi has gone offline FeelsBadMan 👉 '
        }
    },
    pepsicolasoda: {
        id: 156028645,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 PepsiColaSoda has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan PepsiColaSoda has gone offline FeelsBadMan 👉 '
        }
    },
    constera: {
        id: 133402806,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 Constera has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan Constera has gone offline FeelsBadMan 👉 '
        }
    },
    thesupergogo: {
        id: 120573538,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 Thesupergogo has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan Thesupergogo has gone offline FeelsBadMan 👉 '
        }
    },
    edomer: {
        id: 104380748,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 edomer has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan edomer has gone offline FeelsBadMan 👉 '
        }
    },
    seirion: {
        id: 62031020,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 Seirion has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan Seirion has gone offline FeelsBadMan 👉 '
        }
    },
    zauros0: {
        id: 202839258,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 zauros0 has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan zauros0 has gone offline FeelsBadMan 👉 '
        }
    },
    redshell: {
        id: 157440062,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 Redshell has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan Redshell has gone offline FeelsBadMan 👉 '
        }
    },
    weebyshell: {
        id: 452807029,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 weebyshell has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan weebyshell has gone offline FeelsBadMan 👉 '
        }
    },
    actualsw3tz: {
        id: 438122606,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 actualsw3tz has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan actualsw3tz has gone offline FeelsBadMan 👉 '
        }
    },
    '360zeus': {
        id: 93116362,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 360ZEUS has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan 360ZEUS has gone offline FeelsBadMan 👉 '
        }
    },
    weest: {
        id: 130924701,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 Weest has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan Weest has gone offline FeelsBadMan 👉 '
        },
        protection: {
            disabledCommands: ['game', 'title']
        }
    },
    fabzeef: {
        id: 148973258,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 fabZeef has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan fabZeef has gone offline FeelsBadMan 👉 '
        }
    },
    nosignal_1337: {
        id: 24230701,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 NoSignaL_1337 has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan NoSignaL_1337 has gone offline FeelsBadMan 👉 '
        }
    },
    vesp3r: {
        id: 71528774,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 Vesp3r has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan Vesp3r has gone offline FeelsBadMan 👉 '
        }
    },
    sinris: {
        id: 40379362,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 sinris has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan sinris has gone offline FeelsBadMan 👉 '
        }
    },
    nymnsmodsweirdchamp: {
        id: 413915251,
        formats: {
            title: 'KKona NEW TITLE! KKona 👉 $VALUE$ 👉 ',
            game: 'KKona NEW GAME! KKona 👉 $VALUE$ 👉 ',
            live: 'KKona channel HAS GONE LIVE! KKona 👉 ',
            offline: 'KKona channel HAS GONE OFFLINE! KKona 👉 '
        }
    },
    ourlordtalos: {
        id: 74933545,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 OurLordTalos has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan OurLordTalos has gone offline FeelsBadMan 👉 '
        }
    },
    college_boi: {
        id: 216958596,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 College_Boi has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan College_Boi has gone offline FeelsBadMan 👉 '
        }
    },
    elina: {
        id: 174141858,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 Elina has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan Elina has gone offline FeelsBadMan 👉 '
        }
    },
    rooftophobo: {
        id: 30994789,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 rooftophobo has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan rooftophobo has gone offline FeelsBadMan 👉 '
        }
    },
    tene__: {
        id: 257151910,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 Tene__ has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan Tene__ has gone offline FeelsBadMan 👉 '
        }
    },
    ebbel: {
        id: 132186555,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 Ebbel has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan Ebbel has gone offline FeelsBadMan 👉 '
        }
    },
    echoflexx: {
        id: 128217169,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 EchoFlexx has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan EchoFlexx has gone offline FeelsBadMan 👉 '
        }
    },
    beem0o: {
        id: 132351085,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 beem0o has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan beem0o has gone offline FeelsBadMan 👉 '
        }
    },
    laden: {
        id: 35984883,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 Laden has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan Laden has gone offline FeelsBadMan 👉 '
        }
    },
    zemmygo: {
        id: 406511841,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 zemmygo has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan zemmygo has gone offline FeelsBadMan 👉 '
        }
    },
    nam______________________: {
        id: 120183018,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 NaM______________________ has gone live PagChomp 👉 ',
            offline:
                'FeelsBadMan NaM______________________ has gone offline FeelsBadMan 👉 '
        }
    },
    smaczny: {
        id: 25452828,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 Smaczny has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan Smaczny has gone offline FeelsBadMan 👉 '
        }
    },
    iownyouanyway: {
        id: 49958737,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 iOwnYouAnyWay has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan iOwnYouAnyWay has gone offline FeelsBadMan 👉 '
        }
    },
    shibez__: {
        id: 241530558,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 Shibez__ has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan Shibez__ has gone offline FeelsBadMan 👉 '
        }
    },
    okhuntre: {
        id: 411374255,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 okhuntre has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan okhuntre has gone offline FeelsBadMan 👉 '
        }
    },
    teischente: {
        id: 147950640,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 teischEnte has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan teischEnte has gone offline FeelsBadMan 👉 '
        }
    },
    kiansly: {
        id: 414653932,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 kiansly has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan kiansly has gone offline FeelsBadMan 👉 '
        }
    },
    omegamk19: {
        id: 465461503,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 omegamk19 has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan omegamk19 has gone offline FeelsBadMan 👉 '
        }
    },
    emergencycurse: {
        id: 76943040,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 EmergencyCurse has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan EmergencyCurse has gone offline FeelsBadMan 👉 '
        }
    },
    harmfulopinions: {
        id: 93028966,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 HarmfulOpinions has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan HarmfulOpinions has gone offline FeelsBadMan 👉 '
        }
    },
    chickendins: {
        id: 182227186,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 ChickenDins has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan ChickenDins has gone offline FeelsBadMan 👉 '
        }
    },
    hadezzishappy: {
        id: 201362720,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 hadezzishappy has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan hadezzishappy has gone offline FeelsBadMan 👉 '
        }
    },
    sohyp3d: {
        id: 98459625,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 SoHyp3d has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan SoHyp3d has gone offline FeelsBadMan 👉 '
        }
    },
    ali2465: {
        id: 194267009,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 ali2465 has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan ali2465 has gone offline FeelsBadMan 👉 '
        }
    },
    shungite_dealer_rauuuul: {
        id: 532564619,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 SHUNGITE_DEALER_RAUUUUL has gone live PagChomp 👉 ',
            offline:
                'FeelsBadMan SHUNGITE_DEALER_RAUUUUL has gone offline FeelsBadMan 👉 '
        }
    },
    marinak0s: {
        id: 168260539,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 marinak0s has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan marinak0s has gone offline FeelsBadMan 👉 '
        }
    },
    cubiie: {
        id: 153180326,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 Cubiie has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan Cubiie has gone offline FeelsBadMan 👉 '
        }
    },
    romydank: {
        id: 134551603,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 romyDank has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan romyDank has gone offline FeelsBadMan 👉 '
        }
    },
    thanhschaefer: {
        id: 46223674,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 ThanhSchaefer has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan ThanhSchaefer has gone offline FeelsBadMan 👉 '
        }
    },
    acrivfx: {
        id: 139965635,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 AcriVFX has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan AcriVFX has gone offline FeelsBadMan 👉 '
        }
    },
    znicuuu: {
        id: 190740518,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 znicuuu has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan znicuuu has gone offline FeelsBadMan 👉 '
        }
    },
    pulcsi_: {
        id: 133407467,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 pulcsi_ has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan pulcsi_ has gone offline FeelsBadMan 👉 '
        }
    },
    connerxdd: {
        id: 109537937,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 ConnerxDD has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan ConnerxDD has gone offline FeelsBadMan 👉 '
        }
    },
    thegoldenfury: {
        id: 142050511,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 TheGoldenFury has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan TheGoldenFury has gone offline FeelsBadMan 👉 '
        }
    },
    senderak: {
        id: 161786214,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 senderak has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan senderak has gone offline FeelsBadMan 👉 '
        }
    },
    kattah: {
        id: 137199626,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 Kattah has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan Kattah has gone offline FeelsBadMan 👉 '
        }
    },
    katsugara: {
        id: 159756249,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 Katsugara has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan Katsugara has gone offline FeelsBadMan 👉 '
        }
    },
    lukickk: {
        id: 187193365,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 LUKICKK has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan LUKICKK has gone offline FeelsBadMan 👉 '
        }
    },
    mrolle_: {
        id: 41157245,
        formats: {
            title: 'peepoPog NEW TITLE! peepoPog 👉 $VALUE$ 👉 ',
            game: 'peepoPog NEW GAME! peepoPog 👉 $VALUE$ 👉 ',
            live: 'peepoPog 👉 MrOlle_ has gone live peepoPog 👉 ',
            offline: 'FeelsBadMan MrOlle_ has gone offline FeelsBadMan 👉 '
        }
    },
    knobo_: {
        id: 173227489,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 Knobo_ has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan Knobo_ has gone offline FeelsBadMan 👉 '
        }
    },
    '0ut3': {
        id: 406182011,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 0ut3 has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan 0ut3 has gone offline FeelsBadMan 👉 '
        }
    },
    swzzl: {
        id: 129875987,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 Swzzl has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan Swzzl has gone offline FeelsBadMan 👉 '
        }
    },
    ggft4: {
        id: 197512025,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 GgFt4 has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan GgFt4 has gone offline FeelsBadMan 👉 '
        }
    },
    kehlery: {
        id: 202644529,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 kehlery has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan kehlery has gone offline FeelsBadMan 👉 '
        }
    },
    daie_: {
        id: 502130459,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 dAIe_ has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan dAIe_ has gone offline FeelsBadMan 👉 '
        }
    },
    seanc26: {
        id: 216046607,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 Seanc26 has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan Seanc26 has gone offline FeelsBadMan 👉 '
        }
    },
    psychonautandy: {
        id: 46205532,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 PsychonautAndy has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan PsychonautAndy has gone offline FeelsBadMan 👉 '
        }
    },
    sodapoppin: {
        id: 26301881,
        formats: {
            title: 'PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ',
            game: 'PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ',
            live: 'PagChomp 👉 sodapoppin has gone live PagChomp 👉 ',
            offline: 'FeelsBadMan sodapoppin has gone offline FeelsBadMan 👉 '
        }
    }
};

module.exports = {
    opts: opts,
    commandPrefix: commandPrefix,
    krakenClientId: krakenClientId,
    administrators: administrators,
    startupChannel: startupChannel,
    onlinePrintChannel: onlinePrintChannel,
    modChannels: modChannels,
    enabledChannels: enabledChannels,
    globalLengthLimit: globalLengthLimit
};
