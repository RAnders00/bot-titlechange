"use strict";

const secrets = require("./secrets");

const opts = {
  connection: {
    secure: true,
  },
  identity: {
    username: "titlechange_bot",
    password: secrets.ircPassword,
  },
  channels: [],
};

// Valid commands start with:
const commandPrefix = "!";

// Twitch API Client ID
const krakenClientId = secrets.krakenClientId;

// list of users with superuser privileges. Use with extreme caution, since
// these users have access to arbitrary code execution with !debug
let administrators = ["randers"];

// The bot will post a "I am running"-style message to this channel on startup.
const startupChannel = "randers";

// if a channel is offline-only protected, and a change occurs, the bot prints
// to this channel instead of the channel the change occurred in.
const onlinePrintChannel = "titlechange_bot";

// list of channel names where the bot is not limited to the global 1.2 second
// slowmode (channels it is broadcaster, moderator or VIP in)
const modChannels = ["titlechange_bot", "randers", "forsen", "vadikus007"];

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
  randers: {
    id: 40286300,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "ppHop randers is live ppHop 👉 ",
      offline: "xd randers has gone offline 👉 ",
    },
  },
  forsen: {
    id: 22484632,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "KKool GuitarTime FORSEN HAS GONE LIVE! KKool GuitarTime 👉 ",
      offline: "Okayeg TeaTime FORSEN HAS GONE OFFLINE! Okayeg TeaTime 👉 ",
    },
    protection: {
      endpoint: "https://forsen.tv/api/v1/banphrases/test",
      pajbotLinkFilter: true,
      offlineOnly: true,
    },
  },
  pajlada: {
    id: 11148817,
    formats: {
      title: "PAGLADA NEW TITLE! PAGLADA 👉 $VALUE$ 👉 ",
      game: "PAGLADA NEW GAME! PAGLADA 👉 $VALUE$ 👉 ",
      live: `PAGLADA 👉 ${obfuscateName("pajlada")} has gone live pajaH 👉 `,
      offline: `${obfuscateName(
        "pajlada"
      )} has gone offline pajaWalk1 pajaWalk2 pajaWalk3 🚪 `,
    },
    protection: {
      endpoint: "https://pajlada.pajbot.com/api/v1/banphrases/test",
      disabledCommands: ["bot", "ping", "help", "game", "title"],
    },
  },
  supinic: {
    id: 31400525,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "ppBounce supinic has gone live ppBounce 👉 ",
      offline: "SadCat supinic has gone offline SadCat 👉 ",
    },
  },
  nymn: {
    id: 62300805,
    formats: {
      title: "peepoPog NEW TITLE! peepoPog 👉 $VALUE$ 👉 ",
      game: "peepoPog NEW GAME! peepoPog 👉 $VALUE$ 👉 ",
      live: "peepoPog NYMN HAS GONE LIVE! peepoPog 👉 ",
      offline:
        "FeelsBadMan TeaTime NYMN HAS GONE OFFLINE! FeelsBadMan TeaTime 👉 ",
    },
    protection: {
      endpoint: "https://nymn.pajbot.com/api/v1/banphrases/test",
    },
  },
  bajlada: {
    id: 159849156,
    formats: {
      title: "yeetDog NEW TITLE! yeetDog 👉 $VALUE$ 👉 ",
      game: "yeetDog NEW GAME! yeetDog 👉 $VALUE$ 👉 ",
      live: "yeetDog bajlada HAS GONE LIVE! yeetDog 👉 ",
      offline: "yeetDog bajlada HAS GONE OFFLINE! yeetDog 👉 ",
    },
  },
  fourtf: {
    id: 54633016,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp FeelsPingedMan 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp FeelsPingedMan 👉 $VALUE$ 👉 ",
      live: "PagChomp FOURTF HAS GONE LIVE! PagChomp FeelsPingedMan 👉 ",
      offline: "FeelsBadMan FOURTF HAS GONE OFFLINE! FeelsBadMan 👉 ",
    },
  },
  splitcrumbs: {
    id: 53111939,
    formats: {
      title: "PoiWOW NEW TITLE! PoiWOW 👉 $VALUE$ 👉 ",
      game: "PoiWOW NEW GAME! PoiWOW 👉 $VALUE$ 👉 ",
      live: "PoiWOW SPLITCRUMBS HAS GONE LIVE! PoiWOW 👉 ",
      offline: "FeelsBadMan SPLITCRUMBS HAS GONE OFFLINE! FeelsBadMan 👉 ",
    },
  },
  vadikus007: {
    id: 72256775,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp FeelsPingedMan 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp FeelsPingedMan 👉 $VALUE$ 👉 ",
      live: "PagChomp VADIKUS HAS GONE LIVE! PagChomp FeelsPingedMan 👉 ",
      offline: "FeelsBadMan VADIKUS HAS GONE OFFLINE! FeelsBadMan 👉 ",
    },
    protection: {
      endpoint: "https://vadikus007.botfactory.live/api/v1/banphrases/test",
      lengthLimit: 350,
      disabledCommands: ["quit", "debug"],
    },
  },
  apa420: {
    id: 43309508,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp APA420 HAS GONE LIVE! PagChomp 👉 ",
      offline: "FeelsBadMan APA420 HAS GONE OFFLINE! FeelsBadMan 👉 ",
    },
  },
  haxk: {
    id: 91582847,
    formats: {
      title: "WeirdChamp NEW TITLE! WeirdChamp 👉 $VALUE$ 👉 ",
      game: "WeirdChamp NEW GAME! WeirdChamp 👉 $VALUE$ 👉 ",
      live: "WeirdChamp HAXK HAS GONE LIVE! WeirdChamp 👉 ",
      offline: "FeelsBadChamp HAXK HAS GONE OFFLINE! FeelsBadChamp 👉 ",
    },
  },
  akylus_: {
    id: 106921761,
    formats: {
      title: "WeirdChamp NEW TITLE! WeirdChamp 👉 $VALUE$ 👉 ",
      game: "WeirdChamp NEW GAME! WeirdChamp 👉 $VALUE$ 👉 ",
      live: "WeirdChamp AKYLUS HAS GONE LIVE! WeirdChamp 👉 ",
      offline: "WeirdChamp AKYLUS HAS GONE OFFLINE! WeirdChamp 👉 ",
    },
  },
  akkirasetsu: {
    id: 117423271,
    formats: {
      title: "RoWOW NEW TITLE! RoWOW 👉 $VALUE$ 👉 ",
      game: "RoWOW NEW GAME! RoWOW 👉 $VALUE$ 👉 ",
      live: "RoWOW 👉 AkkiRasetsu has gone live POI 👉 ",
      offline: "FeelsAkariMan AkkiRasetsu has gone offline FeelsAkariMan 👉 ",
    },
  },
  icdb: {
    id: 38949074,
    formats: {
      title: "himExcite NEW TITLE! himExcite 👉 $VALUE$ 👉 ",
      game: "himExcite NEW GAME! himExcite 👉 $VALUE$ 👉 ",
      live: "himExcite 👉 icdb has gone live himExcite 👉 ",
      offline: "worryCry icdb has gone offline worryCry 👉 ",
    },
  },
  samme1g: {
    id: 100139411,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 samme1g has gone live PagChomp 👉 ",
      offline: "FeelsBadMan samme1g has gone offline FeelsBadMan 👉 ",
    },
  },
  seastv: {
    id: 95734841,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 SeasTV has gone live PagChomp 👉 ",
      offline: "FeelsBadMan SeasTV has gone offline FeelsBadMan 👉 ",
    },
  },
  fabulouspotato69: {
    id: 79237040,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 FabulousPotato69 has gone live PagChomp 👉 ",
      offline: "FeelsBadMan FabulousPotato69 has gone offline FeelsBadMan 👉 ",
    },
  },
  teyn: {
    id: 133114467,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Teyn has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Teyn has gone offline FeelsBadMan 👉 ",
    },
    protection: {
      endpoint: "https://teyn.botfactory.live/api/v1/banphrases/test",
      lengthLimit: 350,
    },
  },
  coral: {
    id: 42197189,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 coral has gone live PogChamp 👉 ",
      offline: "FeelsBadMan coral has gone offline FeelsBadMan 👉 ",
    },
  },
  thesigge989: {
    id: 89959359,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 TheSigge989 has gone live PagChomp 👉 ",
      offline: "FeelsBadMan TheSigge989 has gone offline FeelsBadMan 👉 ",
    },
  },
  karabast: {
    id: 128194205,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Karabast has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Karabast has gone offline FeelsBadMan 👉 ",
    },
  },
  leebaxd: {
    id: 143473217,
    formats: {
      title: "KokoPes NEW TITLE! KokoPes 👉 $VALUE$ 👉 ",
      game: "KokoPes NEW GAME! KokoPes 👉 $VALUE$ 👉 ",
      live: "KokoPes 👉 LeebaXD has gone live KokoPes 👉 ",
      offline: "monkeyLick LeebaXD has gone offline monkeyLick 👉 ",
    },
  },
  shadopi: {
    id: 159309353,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 shadopi has gone live PagChomp 👉 ",
      offline: "FeelsBadMan shadopi has gone offline FeelsBadMan 👉 ",
    },
  },
  teodorv: {
    id: 60168804,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Teodorv has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Teodorv has gone offline FeelsBadMan 👉 ",
    },
  },
  tolekk: {
    id: 37438411,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 tolekk has gone live PagChomp 👉 ",
      offline: "FeelsBadMan tolekk has gone offline FeelsBadMan 👉 ",
    },
  },
  sneesi: {
    id: 63668719,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 sneesi has gone live PagChomp 👉 ",
      offline: "FeelsBadMan sneesi has gone offline FeelsBadMan 👉 ",
    },
  },
  pepsicolasoda: {
    id: 156028645,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 PepsiColaSoda has gone live PagChomp 👉 ",
      offline: "FeelsBadMan PepsiColaSoda has gone offline FeelsBadMan 👉 ",
    },
  },
  constera: {
    id: 133402806,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Constera has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Constera has gone offline FeelsBadMan 👉 ",
    },
  },
  thesupergogo: {
    id: 120573538,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Thesupergogo has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Thesupergogo has gone offline FeelsBadMan 👉 ",
    },
  },
  edomer: {
    id: 104380748,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 edomer has gone live PagChomp 👉 ",
      offline: "FeelsBadMan edomer has gone offline FeelsBadMan 👉 ",
    },
  },
  seirion: {
    id: 62031020,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Seirion has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Seirion has gone offline FeelsBadMan 👉 ",
    },
  },
  zauros0: {
    id: 202839258,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 zauros0 has gone live PagChomp 👉 ",
      offline: "FeelsBadMan zauros0 has gone offline FeelsBadMan 👉 ",
    },
  },
  redshell: {
    id: 157440062,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Redshell has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Redshell has gone offline FeelsBadMan 👉 ",
    },
  },
  weebyshell: {
    id: 452807029,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 weebyshell has gone live PagChomp 👉 ",
      offline: "FeelsBadMan weebyshell has gone offline FeelsBadMan 👉 ",
    },
  },
  actualsw3tz: {
    id: 438122606,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 actualsw3tz has gone live PagChomp 👉 ",
      offline: "FeelsBadMan actualsw3tz has gone offline FeelsBadMan 👉 ",
    },
  },
  "360zeus": {
    id: 93116362,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 360ZEUS has gone live PagChomp 👉 ",
      offline: "FeelsBadMan 360ZEUS has gone offline FeelsBadMan 👉 ",
    },
  },
  weest: {
    id: 130924701,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Weest has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Weest has gone offline FeelsBadMan 👉 ",
    },
    protection: {
      disabledCommands: ["game", "title"],
    },
  },
  fabzeef: {
    id: 148973258,
    formats: {
      title: "DinkBeef NEW TITLE! DinkBeef 👉 $VALUE$ 👉 ",
      game: "DinkBeef NEW GAME! DinkBeef 👉 $VALUE$ 👉 ",
      live: "dankClappers 👉 fabZeef has gone live dankClappers 👉 ",
      offline: "peepoDownSadDank fabZeef has gone offline peepoDownSadDank 👉 ",
    },
  },
  nosignal_1337: {
    id: 24230701,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 NoSignaL_1337 has gone live PagChomp 👉 ",
      offline: "FeelsBadMan NoSignaL_1337 has gone offline FeelsBadMan 👉 ",
    },
  },
  vesp3r: {
    id: 71528774,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Vesp3r has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Vesp3r has gone offline FeelsBadMan 👉 ",
    },
  },
  sinris: {
    id: 40379362,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 sinris has gone live PagChomp 👉 ",
      offline: "FeelsBadMan sinris has gone offline FeelsBadMan 👉 ",
    },
  },
  nymnsmodsweirdchamp: {
    id: 413915251,
    formats: {
      title: "KKona NEW TITLE! KKona 👉 $VALUE$ 👉 ",
      game: "KKona NEW GAME! KKona 👉 $VALUE$ 👉 ",
      live: "KKona channel HAS GONE LIVE! KKona 👉 ",
      offline: "KKona channel HAS GONE OFFLINE! KKona 👉 ",
    },
  },
  ourlordtalos: {
    id: 74933545,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 OurLordTalos has gone live PagChomp 👉 ",
      offline: "FeelsBadMan OurLordTalos has gone offline FeelsBadMan 👉 ",
    },
  },
  college_boi: {
    id: 216958596,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 College_Boi has gone live PagChomp 👉 ",
      offline: "FeelsBadMan College_Boi has gone offline FeelsBadMan 👉 ",
    },
  },
  elina: {
    id: 174141858,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Elina has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Elina has gone offline FeelsBadMan 👉 ",
    },
  },
  rooftophobo: {
    id: 30994789,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 rooftophobo has gone live PagChomp 👉 ",
      offline: "FeelsBadMan rooftophobo has gone offline FeelsBadMan 👉 ",
    },
  },
  tene__: {
    id: 257151910,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Tene__ has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Tene__ has gone offline FeelsBadMan 👉 ",
    },
  },
  ebbel: {
    id: 132186555,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Ebbel has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Ebbel has gone offline FeelsBadMan 👉 ",
    },
  },
  echoflex: {
    id: 128217169,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 EchoFlex has gone live PagChomp 👉 ",
      offline: "FeelsBadMan EchoFlex has gone offline FeelsBadMan 👉 ",
    },
  },
  beem0o: {
    id: 132351085,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 beem0o has gone live PagChomp 👉 ",
      offline: "FeelsBadMan beem0o has gone offline FeelsBadMan 👉 ",
    },
  },
  laden: {
    id: 35984883,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Laden has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Laden has gone offline FeelsBadMan 👉 ",
    },
  },
  zemmygo: {
    id: 406511841,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 zemmygo has gone live PagChomp 👉 ",
      offline: "FeelsBadMan zemmygo has gone offline FeelsBadMan 👉 ",
    },
  },
  nam______________________: {
    id: 120183018,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 NaM______________________ has gone live PagChomp 👉 ",
      offline:
        "FeelsBadMan NaM______________________ has gone offline FeelsBadMan 👉 ",
    },
  },
  smaczny: {
    id: 25452828,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Smaczny has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Smaczny has gone offline FeelsBadMan 👉 ",
    },
  },
  iownyouanyway: {
    id: 49958737,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 iOwnYouAnyWay has gone live PagChomp 👉 ",
      offline: "FeelsBadMan iOwnYouAnyWay has gone offline FeelsBadMan 👉 ",
    },
  },
  shibez__: {
    id: 241530558,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Shibez__ has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Shibez__ has gone offline FeelsBadMan 👉 ",
    },
  },
  okhuntre: {
    id: 411374255,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 okhuntre has gone live PagChomp 👉 ",
      offline: "FeelsBadMan okhuntre has gone offline FeelsBadMan 👉 ",
    },
  },
  teischente: {
    id: 147950640,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 teischEnte has gone live PagChomp 👉 ",
      offline: "FeelsBadMan teischEnte has gone offline FeelsBadMan 👉 ",
    },
  },
  kiansly: {
    id: 414653932,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 kiansly has gone live PagChomp 👉 ",
      offline: "FeelsBadMan kiansly has gone offline FeelsBadMan 👉 ",
    },
  },
  omegamk19: {
    id: 465461503,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 omegamk19 has gone live PagChomp 👉 ",
      offline: "FeelsBadMan omegamk19 has gone offline FeelsBadMan 👉 ",
    },
  },
  emergencycurse: {
    id: 76943040,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 EmergencyCurse has gone live PagChomp 👉 ",
      offline: "FeelsBadMan EmergencyCurse has gone offline FeelsBadMan 👉 ",
    },
  },
  harmfulopinions: {
    id: 93028966,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 HarmfulOpinions has gone live PagChomp 👉 ",
      offline: "FeelsBadMan HarmfulOpinions has gone offline FeelsBadMan 👉 ",
    },
  },
  chickendins: {
    id: 182227186,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 ChickenDins has gone live PagChomp 👉 ",
      offline: "FeelsBadMan ChickenDins has gone offline FeelsBadMan 👉 ",
    },
  },
  hadezzishappy: {
    id: 201362720,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 hadezzishappy has gone live PagChomp 👉 ",
      offline: "FeelsBadMan hadezzishappy has gone offline FeelsBadMan 👉 ",
    },
  },
  sohyp3d: {
    id: 98459625,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 SoHyp3d has gone live PagChomp 👉 ",
      offline: "FeelsBadMan SoHyp3d has gone offline FeelsBadMan 👉 ",
    },
  },
  ali2465: {
    id: 194267009,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 ali2465 has gone live PagChomp 👉 ",
      offline: "FeelsBadMan ali2465 has gone offline FeelsBadMan 👉 ",
    },
  },
  shungite_dealer_rauuuul: {
    id: 532564619,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 SHUNGITE_DEALER_RAUUUUL has gone live PagChomp 👉 ",
      offline:
        "FeelsBadMan SHUNGITE_DEALER_RAUUUUL has gone offline FeelsBadMan 👉 ",
    },
  },
  marinak0s: {
    id: 168260539,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 marinak0s has gone live PagChomp 👉 ",
      offline: "FeelsBadMan marinak0s has gone offline FeelsBadMan 👉 ",
    },
  },
  cubiie: {
    id: 153180326,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Cubiie has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Cubiie has gone offline FeelsBadMan 👉 ",
    },
  },
  romydank: {
    id: 134551603,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 romyDank has gone live PagChomp 👉 ",
      offline: "FeelsBadMan romyDank has gone offline FeelsBadMan 👉 ",
    },
  },
  thanhschaefer: {
    id: 46223674,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 ThanhSchaefer has gone live PagChomp 👉 ",
      offline: "FeelsBadMan ThanhSchaefer has gone offline FeelsBadMan 👉 ",
    },
  },
  acrivfx: {
    id: 139965635,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 AcriVFX has gone live PagChomp 👉 ",
      offline: "FeelsBadMan AcriVFX has gone offline FeelsBadMan 👉 ",
    },
  },
  znicuuu: {
    id: 190740518,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 znicuuu has gone live PagChomp 👉 ",
      offline: "FeelsBadMan znicuuu has gone offline FeelsBadMan 👉 ",
    },
  },
  pulcsi_: {
    id: 133407467,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 pulcsi_ has gone live PagChomp 👉 ",
      offline: "FeelsBadMan pulcsi_ has gone offline FeelsBadMan 👉 ",
    },
  },
  connerxdd: {
    id: 109537937,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 ConnerxDD has gone live PagChomp 👉 ",
      offline: "FeelsBadMan ConnerxDD has gone offline FeelsBadMan 👉 ",
    },
  },
  thegoldenfury: {
    id: 142050511,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 TheGoldenFury has gone live PagChomp 👉 ",
      offline: "FeelsBadMan TheGoldenFury has gone offline FeelsBadMan 👉 ",
    },
  },
  senderak: {
    id: 161786214,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 senderak has gone live PagChomp 👉 ",
      offline: "FeelsBadMan senderak has gone offline FeelsBadMan 👉 ",
    },
  },
  kattah: {
    id: 137199626,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Kattah has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Kattah has gone offline FeelsBadMan 👉 ",
    },
  },
  katsugara: {
    id: 159756249,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Katsugara has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Katsugara has gone offline FeelsBadMan 👉 ",
    },
  },
  lukickk: {
    id: 187193365,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 LUKICKK has gone live PagChomp 👉 ",
      offline: "FeelsBadMan LUKICKK has gone offline FeelsBadMan 👉 ",
    },
  },
  mrolle_: {
    id: 41157245,
    formats: {
      title: "peepoPog NEW TITLE! peepoPog 👉 $VALUE$ 👉 ",
      game: "peepoPog NEW GAME! peepoPog 👉 $VALUE$ 👉 ",
      live: "peepoPog 👉 MrOlle_ has gone live peepoPog 👉 ",
      offline: "FeelsBadMan MrOlle_ has gone offline FeelsBadMan 👉 ",
    },
  },
  knobo_: {
    id: 173227489,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Knobo_ has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Knobo_ has gone offline FeelsBadMan 👉 ",
    },
  },
  "0ut3": {
    id: 406182011,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 0ut3 has gone live PagChomp 👉 ",
      offline: "FeelsBadMan 0ut3 has gone offline FeelsBadMan 👉 ",
    },
  },
  swzzl: {
    id: 129875987,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Swzzl has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Swzzl has gone offline FeelsBadMan 👉 ",
    },
  },
  ggft4: {
    id: 197512025,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 GgFt4 has gone live PagChomp 👉 ",
      offline: "FeelsBadMan GgFt4 has gone offline FeelsBadMan 👉 ",
    },
  },
  kehlery: {
    id: 202644529,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 kehlery has gone live PagChomp 👉 ",
      offline: "FeelsBadMan kehlery has gone offline FeelsBadMan 👉 ",
    },
  },
  daie_: {
    id: 502130459,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 dAIe_ has gone live PagChomp 👉 ",
      offline: "FeelsBadMan dAIe_ has gone offline FeelsBadMan 👉 ",
    },
  },
  seanc26: {
    id: 216046607,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Seanc26 has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Seanc26 has gone offline FeelsBadMan 👉 ",
    },
  },
  psychonautandy: {
    id: 46205532,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 PsychonautAndy has gone live PagChomp 👉 ",
      offline: "FeelsBadMan PsychonautAndy has gone offline FeelsBadMan 👉 ",
    },
  },
  sodapoppin: {
    id: 26301881,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 sodapoppin has gone live PagChomp 👉 ",
      offline: "FeelsBadMan sodapoppin has gone offline FeelsBadMan 👉 ",
    },
    protection: {
      offlineOnly: true,
      whisperCommandResponses: true,
    },
  },
  ceduce: {
    id: 136329559,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Ceduce has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Ceduce has gone offline FeelsBadMan 👉 ",
    },
  },
  empyrione: {
    id: 111828877,
    formats: {
      title: "FeelsDankMan Clap NEW TITLE! FeelsDankMan Clap 👉 $VALUE$ 👉 ",
      game: "FeelsDankMan Clap NEW GAME! FeelsDankMan Clap 👉 $VALUE$ 👉 ",
      live:
        "FeelsDankMan Clap 👉 empyrione has gone live FeelsDankMan Clap 👉 ",
      offline: "peepoSadDankSip empyrione has gone offline peepoSadDankSip 👉 ",
    },
  },
  mik7: {
    id: 438281108,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 mik7 has gone live PagChomp 👉 ",
      offline: "FeelsBadMan mik7 has gone offline FeelsBadMan 👉 ",
    },
  },
  mr_randomnese: {
    id: 94652036,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Mr_Randomnese has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Mr_Randomnese has gone offline FeelsBadMan 👉 ",
    },
  },
  airflyfilms: {
    id: 222122589,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 airflyfilms has gone live PagChomp 👉 ",
      offline: "FeelsBadMan airflyfilms has gone offline FeelsBadMan 👉 ",
    },
  },
  prodchay: {
    id: 463136599,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 prodchay has gone live PagChomp 👉 ",
      offline: "FeelsBadMan prodchay has gone offline FeelsBadMan 👉 ",
    },
  },
  atoxiv: {
    id: 129089038,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 AtoxiV has gone live PagChomp 👉 ",
      offline: "FeelsBadMan AtoxiV has gone offline FeelsBadMan 👉 ",
    },
  },
  htooony7: {
    id: 165900034,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 htooony7 has gone live PagChomp 👉 ",
      offline: "FeelsBadMan htooony7 has gone offline FeelsBadMan 👉 ",
    },
  },
  rfey: {
    id: 456671028,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 rFey has gone live PagChomp 👉 ",
      offline: "FeelsBadMan rFey has gone offline FeelsBadMan 👉 ",
    },
  },
  tajj: {
    id: 89627190,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Tajj has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Tajj has gone offline FeelsBadMan 👉 ",
    },
  },
  toooore: {
    id: 211200386,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Toooore has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Toooore has gone offline FeelsBadMan 👉 ",
    },
  },
  saan1ty: {
    id: 219784780,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 saan1ty has gone live PagChomp 👉 ",
      offline: "FeelsBadMan saan1ty has gone offline FeelsBadMan 👉 ",
    },
  },
  alecbirdman: {
    id: 164569811,
    formats: {
      title: "AlienRave NEW TITLE! AlienRave 👉 $VALUE$ 👉 ",
      game: "AlienRave NEW GAME! AlienRave 👉 $VALUE$ 👉 ",
      live: "AlienRave 👉 alecbirdman has gone live AlienRave 👉 ",
      offline: "FeelsBadMan alecbirdman has gone offline FeelsBadMan 👉 ",
    },
  },
  sxren_: {
    id: 92271589,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 sXren_ has gone live PagChomp 👉 ",
      offline: "FeelsBadMan sXren_ has gone offline FeelsBadMan 👉 ",
    },
  },
  pepegepaul: {
    id: 182285668,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 PepegePaul has gone live PagChomp 👉 ",
      offline: "FeelsBadMan PepegePaul has gone offline FeelsBadMan 👉 ",
    },
  },
  ondrash_: {
    id: 189892499,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 ondrash_ has gone live PagChomp 👉 ",
      offline: "FeelsBadMan ondrash_ has gone offline FeelsBadMan 👉 ",
    },
  },
  epicmango7: {
    id: 76040250,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 EpicMango7 has gone live PagChomp 👉 ",
      offline: "FeelsBadMan EpicMango7 has gone offline FeelsBadMan 👉 ",
    },
  },
  hackercd: {
    id: 62601648,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 hackerCD has gone live PagChomp 👉 ",
      offline: "FeelsBadMan hackerCD has gone offline FeelsBadMan 👉 ",
    },
  },
  eardintv: {
    id: 238824743,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 EardinTV has gone live PagChomp 👉 ",
      offline: "FeelsBadMan EardinTV has gone offline FeelsBadMan 👉 ",
    },
  },
  justusshg: {
    id: 480792226,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 JustusShG has gone live PagChomp 👉 ",
      offline: "FeelsBadMan JustusShG has gone offline FeelsBadMan 👉 ",
    },
  },
  triefendeorange: {
    id: 480996005,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 TriefendeOrange has gone live PagChomp 👉 ",
      offline: "FeelsBadMan TriefendeOrange has gone offline FeelsBadMan 👉 ",
    },
  },
  fl4tsch: {
    id: 168015577,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 FL4TSCH has gone live PagChomp 👉 ",
      offline: "FeelsBadMan FL4TSCH has gone offline FeelsBadMan 👉 ",
    },
  },
  epicdonutdude_: {
    id: 71901537,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 EpicDonutDude_ has gone live PagChomp 👉 ",
      offline: "FeelsBadMan EpicDonutDude_ has gone offline FeelsBadMan 👉 ",
    },
  },
  ronic76: {
    id: 144430072,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Ronic76 has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Ronic76 has gone offline FeelsBadMan 👉 ",
    },
  },
  kevllln: {
    id: 234538195,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 KEVlllN has gone live PagChomp 👉 ",
      offline: "FeelsBadMan KEVlllN has gone offline FeelsBadMan 👉 ",
    },
  },
  kunszg: {
    id: 178087241,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 KUNszg has gone live PagChomp 👉 ",
      offline: "FeelsBadMan KUNszg has gone offline FeelsBadMan 👉 ",
    },
  },
  viloxow: {
    id: 219556672,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 ViloxOW has gone live PagChomp 👉 ",
      offline: "FeelsBadMan ViloxOW has gone offline FeelsBadMan 👉 ",
    },
  },
  jxjhn: {
    id: 116329936,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 JxJHN has gone live PagChomp 👉 ",
      offline: "FeelsBadMan JxJHN has gone offline FeelsBadMan 👉 ",
    },
  },
  zneix: {
    id: 99631238,
    formats: {
      title: "dankClappers NEW TITLE! dankClappers 👉 $VALUE$ 👉 ",
      game: "dankClappers NEW GAME! dankClappers 👉 $VALUE$ 👉 ",
      live: "dankClappers 👉 zneix has gone live dankClappers 👉 ",
      offline: "peepoSadDankSip zneix has gone offline peepoSadDankSip 👉 ",
    },
  },
  tastiic: {
    id: 104645456,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Tastiic has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Tastiic has gone offline FeelsBadMan 👉 ",
    },
  },
  chyny_: {
    id: 99610133,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 chyny_ has gone live PagChomp 👉 ",
      offline: "FeelsBadMan chyny_ has gone offline FeelsBadMan 👉 ",
    },
  },
  panwiewior: {
    id: 39339122,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 PanWiewior has gone live PagChomp 👉 ",
      offline: "FeelsBadMan PanWiewior has gone offline FeelsBadMan 👉 ",
    },
  },
  robo02wwe: {
    id: 428174505,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Robo02WWE has gone live PagChomp 👉 ",
      offline: "FeelsBadMan Robo02WWE has gone offline FeelsBadMan 👉 ",
    },
  },
  smithyyy69_: {
    id: 445259490,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 smithyyy69_ has gone live PagChomp 👉 ",
      offline: "FeelsBadMan smithyyy69_ has gone offline FeelsBadMan 👉 ",
    },
  },
  simon36: {
    id: 230654310,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 Simon36 has gone live PagChomp 👉 ",
      offline: "Sadge Simon36 has gone offline Sadge 👉 ",
    },
  },
  waeschi: {
    id: 86571205,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 waeschi has gone live PagChomp 👉 ",
      offline: "FeelsBadMan waeschi has gone offline FeelsBadMan 👉 ",
    },
  },
  swushwoi: {
    id: 150648930,
    formats: {
      title: "VisMan NEW TITLE! VisMan 👉 $VALUE$ 👉 ",
      game: "VisMan NEW GAME! VisMan 👉 $VALUE$ 👉 ",
      live: "VisMan 👉 swushwoi has gone live VisMan 👉 ",
      offline: "FeelsBadMan swushwoi has gone offline FeelsBadMan 👉 ",
    },
  },
  tetyys: {
    id: 36175310,
    formats: {
      title: "CatRave NEW TITLE! CatRave 👉 $VALUE$ 👉 ",
      game: "AlienPls2 NEW GAME! AlienPls2 👉 $VALUE$ 👉 ",
      live: "AlienPls 👉 TETYYS has gone live AlienPls 👉 ",
      offline: "how is this possible 👉 ",
    },
  },
  just_che: {
    id: 115280616,
    formats: {
      title: "fasNtnig NEW TITLE! fasNtnig 👉 $VALUE$ 👉 ",
      game: "OhBaby NEW GAME! OhBaby 👉 $VALUE$ 👉 ",
      live: "ReimuPit 👉 just_Che has gone live ReimuPit 👉 ",
      offline: "YuuFuta just_Che has gone offline YuuFuta 👉 ",
    },
  },
  jeffboys123: {
    id: 125906038,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 JEFFBOYS123 has gone live PagChomp 👉 ",
      offline: "FeelsBadMan JEFFBOYS123 has gone offline FeelsBadMan 👉 ",
    },
  },
  flushedjulian: {
    id: 246499041,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 flushedjulian has gone live PogChamp 👉 ",
      offline: "FeelsBadMan flushedjulian has gone offline FeelsBadMan 👉 ",
    },
  },
  likeana: {
    id: 487374604,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 LikeAna has gone live PogChamp 👉 ",
      offline: "FeelsBadMan LikeAna has gone offline FeelsBadMan 👉 ",
    },
  },
  as43_: {
    id: 126457183,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 AS43_ has gone live PogChamp 👉 ",
      offline: "FeelsBadMan AS43_ has gone offline FeelsBadMan 👉 ",
    },
  },
  hotbear1110: {
    id: 135186096,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 HotBear1110 has gone live PogChamp 👉 ",
      offline: "FeelsBadMan HotBear1110 has gone offline FeelsBadMan 👉 ",
    },
  },
  daasra: {
    id: 169609841,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 Daasra has gone live PogChamp 👉 ",
      offline: "FeelsBadMan Daasra has gone offline FeelsBadMan 👉 ",
    },
  },
  loerkas: {
    id: 455941990,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 Loerkas has gone live PogChamp 👉 ",
      offline: "FeelsBadMan Loerkas has gone offline FeelsBadMan 👉 ",
    },
  },
  zamku: {
    id: 154728395,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 Zamku has gone live PogChamp 👉 ",
      offline: "FeelsBadMan Zamku has gone offline FeelsBadMan 👉 ",
    },
  },
  iviegabeatzz: {
    id: 62061893,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 IVIegaBeatzZ has gone live PogChamp 👉 ",
      offline: "FeelsBadMan IVIegaBeatzZ has gone offline FeelsBadMan 👉 ",
    },
  },
  nextfunnymemer: {
    id: 136060664,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 NextFunnyMemer has gone live PogChamp 👉 ",
      offline: "FeelsBadMan NextFunnyMemer has gone offline FeelsBadMan 👉 ",
    },
  },
  mariodertrader: {
    id: 140406390,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 MarioDerTrader has gone live PogChamp 👉 ",
      offline: "FeelsBadMan MarioDerTrader has gone offline FeelsBadMan 👉 ",
    },
  },
  namtheweebs: {
    id: 232490245,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 NaMTheWeebs has gone live PogChamp 👉 ",
      offline: "FeelsBadMan NaMTheWeebs has gone offline FeelsBadMan 👉 ",
    },
  },
  verweisunq: {
    id: 176866885,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 verweisunq has gone live PogChamp 👉 ",
      offline: "FeelsBadMan verweisunq has gone offline FeelsBadMan 👉 ",
    },
  },
  tschuliaan: {
    id: 170755694,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 tschuliaan has gone live PogChamp 👉 ",
      offline: "FeelsBadMan tschuliaan has gone offline FeelsBadMan 👉 ",
    },
  },
  headhunter67: {
    id: 77747881,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 Headhunter67 has gone live PogChamp 👉 ",
      offline: "FeelsBadMan Headhunter67 has gone offline FeelsBadMan 👉 ",
    },
  },
  ooknumber14: {
    id: 471849325,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 ooknumber14 has gone live PogChamp 👉 ",
      offline: "FeelsBadMan ooknumber14 has gone offline FeelsBadMan 👉 ",
    },
  },
  enozo_: {
    id: 70728246,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 ENOZO_ has gone live PogChamp 👉 ",
      offline: "FeelsBadMan ENOZO_ has gone offline FeelsBadMan 👉 ",
    },
  },
  mariuszicutie: {
    id: 406378614,
    formats: {
      title: "PagChomp NEW TITLE! PagChomp 👉 $VALUE$ 👉 ",
      game: "PagChomp NEW GAME! PagChomp 👉 $VALUE$ 👉 ",
      live: "PagChomp 👉 マリウシュキューティ has gone live PagChomp 👉 ",
      offline:
        "FeelsBadMan マリウシュキューティ has gone offline FeelsBadMan 👉 ",
    },
  },
  seanc26_: {
    id: 597080573,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 Seanc26_ has gone live PogChamp 👉 ",
      offline: "FeelsBadMan Seanc26_ has gone offline FeelsBadMan 👉 ",
    },
  },
  schmortyy: {
    id: 210120795,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 Schmortyy has gone live PogChamp 👉 ",
      offline: "FeelsBadMan Schmortyy has gone offline FeelsBadMan 👉 ",
    },
  },
  nurwlan: {
    id: 167943175,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 nurWlan has gone live PogChamp 👉 ",
      offline: "FeelsBadMan nurWlan has gone offline FeelsBadMan 👉 ",
    },
  },
  jacktherippergb: {
    id: 80060141,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 JackTheRipperGB has gone live PogChamp 👉 ",
      offline: "FeelsBadMan JackTheRipperGB has gone offline FeelsBadMan 👉 ",
    },
  },
  speedster05: {
    id: 128973455,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 Speedster05 has gone live PogChamp 👉 ",
      offline: "FeelsBadMan Speedster05 has gone offline FeelsBadMan 👉 ",
    },
  },
  vinxibinxi: {
    id: 164849818,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 VinxiBinxi has gone live PogChamp 👉 ",
      offline: "FeelsBadMan VinxiBinxi has gone offline FeelsBadMan 👉 ",
    },
  },
  splatoxic: {
    id: 463487079,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 Splatoxic has gone live PogChamp 👉 ",
      offline: "FeelsBadMan Splatoxic has gone offline FeelsBadMan 👉 ",
    },
  },
  th3mc: {
    id: 173517095,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 Th3MC has gone live PogChamp 👉 ",
      offline: "FeelsBadMan Th3MC has gone offline FeelsBadMan 👉 ",
    },
  },
  "2o3a": {
    id: 92111909,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 2O3A has gone live PogChamp 👉 ",
      offline: "FeelsBadMan 2O3A has gone offline FeelsBadMan 👉 ",
    },
  },
  incyrox: {
    id: 104529093,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 IncyroX has gone live PogChamp 👉 ",
      offline: "FeelsBadMan IncyroX has gone offline FeelsBadMan 👉 ",
    },
  },
  katelynerika: {
    id: 128577125,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 katelynerika has gone live PogChamp 👉 ",
      offline: "FeelsBadMan katelynerika has gone offline FeelsBadMan 👉 ",
    },
  },
  steamyfreshmeme: {
    id: 79910266,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 SteamyFreshMeme has gone live PogChamp 👉 ",
      offline: "FeelsBadMan SteamyFreshMeme has gone offline FeelsBadMan 👉 ",
    },
  },
  telvann: {
    id: 47978608,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 telvann has gone live PogChamp 👉 ",
      offline: "FeelsBadMan telvann has gone offline FeelsBadMan 👉 ",
    },
  },
  colinzxy: {
    id: 488687677,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 colinzxy has gone live PogChamp 👉 ",
      offline: "FeelsBadMan colinzxy has gone offline FeelsBadMan 👉 ",
    },
  },
  mix____: {
    id: 90805874,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 Mix____ has gone live PogChamp 👉 ",
      offline: "FeelsBadMan Mix____ has gone offline FeelsBadMan 👉 ",
    },
  },
  skurrpy: {
    id: 499896742,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 skurrpy has gone live PogChamp 👉 ",
      offline: "FeelsBadMan skurrpy has gone offline FeelsBadMan 👉 ",
    },
  },
  sommy_x: {
    id: 76848083,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 sommy_x has gone live PogChamp 👉 ",
      offline: "FeelsBadMan sommy_x has gone offline FeelsBadMan 👉 ",
    },
  },
  rumathra: {
    id: 41567638,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 Rumathra has gone live PogChamp 👉 ",
      offline: "FeelsBadMan Rumathra has gone offline FeelsBadMan 👉 ",
    },
  },
  guntyp_: {
    id: 444387719,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 guntyp_ has gone live PogChamp 👉 ",
      offline: "FeelsBadMan guntyp_ has gone offline FeelsBadMan 👉 ",
    },
  },
  pagshake: {
    id: 168486056,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 pagshake has gone live PogChamp 👉 ",
      offline: "FeelsBadMan pagshake has gone offline FeelsBadMan 👉 ",
    },
  },
  jannick__: {
    id: 488942375,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 Jannick__ has gone live PogChamp 👉 ",
      offline: "FeelsBadMan Jannick__ has gone offline FeelsBadMan 👉 ",
    },
  },
  lacari: {
    id: 29400754,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 Lacari has gone live PogChamp 👉 ",
      offline: "FeelsBadMan Lacari has gone offline FeelsBadMan 👉 ",
    },
    protection: {
      endpoint: "https://lacari.live/api/v1/banphrases/test",
      whisperCommandResponses: true,
    },
  },
  "360vinz": {
    id: 438413603,
    formats: {
      title: "PogChamp NEW TITLE! PogChamp 👉 $VALUE$ 👉 ",
      game: "PogChamp NEW GAME! PogChamp 👉 $VALUE$ 👉 ",
      live: "PogChamp 👉 360VinZ has gone live PogChamp 👉 ",
      offline: "FeelsBadMan 360VinZ has gone offline FeelsBadMan 👉 ",
    },
  },
};

opts.channels.push(...Object.keys(enabledChannels));

module.exports = {
  opts: opts,
  commandPrefix: commandPrefix,
  krakenClientId: krakenClientId,
  administrators: administrators,
  startupChannel: startupChannel,
  onlinePrintChannel: onlinePrintChannel,
  modChannels: modChannels,
  enabledChannels: enabledChannels,
  globalLengthLimit: globalLengthLimit,
};
