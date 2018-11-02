'use strict';

const tmi = require('tmi.js');
const request = require('request-promise');
const storage = require('node-persist');
const AsyncLock = require('node-async-locks').AsyncLock;
const Timer = require('./edit-timer').Timer;
const config = require('./config');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const knownCommands = [events, notifyme, removeme, subscribed, help, bot, ping, setData, debugData, debug, quit];

// the main data storage object.
// stores for each channel (key):
// "forsen": { "title": <title>, "game": <game>, "live": true/false, }
let currentData = {};

// available events for signing up for pings
let availableEvents = {
    "title": {
        "matcher": function (key, value) {
            return key === "title";
        }
    },
    "game": {
        "matcher": function (key, value) {
            return key === "game";
        },
    },
    "live": {
        "matcher": function (key, value) {
            return key === "live" && value === true;
        },
    },
    "offline": {
        "matcher": function (key, value) {
            return key === "live" && value === false;
        }
    }
};

// List of users that want to be pinged for certain events in certain channels
// "forsen": { "title": ['randers00', 'n_888'], "game": [], "live": ['randers00', 'n_888'] }
let pingLists = {};

async function refreshData() {
    for (let [channelName, channelConfig] of Object.entries(config.enabledChannels)) {
        let channelId = channelConfig["id"];

        // title, game updates
        await doChannelAPIUpdates(channelName, channelId);

        // live/offline status
        await doStreamAPIUpdates(channelName, channelId);
    }
}

// do all the updates possible by calling the /channels/:channelId API endpoint
async function doChannelAPIUpdates(channelName, channelId) {
    let options = {
        method: 'GET',
        json: true,
        uri: 'https://api.twitch.tv/kraken/channels/' + channelId,
        headers: {
            "Client-ID": config.krakenClientId,
            "Accept": "application/vnd.twitchtv.v5+json"
        }
    };

    try {
        let response = await request(options);

        await updateChannelProperty(channelName, "title", response["status"]);
        await updateChannelProperty(channelName, "game", response["game"]);
        await updateChannelProperty(channelName, "id", response["_id"]);

    } catch (error) {
        console.log(error);

        await updateChannelProperty(channelName, "title", null);
        await updateChannelProperty(channelName, "game", null);
        await updateChannelProperty(channelName, "id", null);
    }

}

// do all the updates possible by calling the /streams/:channelId API endpoint
async function doStreamAPIUpdates(channelName, channelId) {
    let options = {
        method: 'GET',
        json: true,
        uri: 'https://api.twitch.tv/kraken/streams/' + channelId,
        headers: {
            "Client-ID": config.krakenClientId,
            "Accept": "application/vnd.twitchtv.v5+json"
        }
    };

    try {
        let response = await request(options);

        if (response["stream"] !== null) {
            await updateChannelProperty(channelName, "live", true);
        } else {
            await updateChannelProperty(channelName, "live", false);
        }

    } catch (error) {
        console.log(error);

        await updateChannelProperty(channelName, "live", null);
    }

}

async function updateChannelProperty(channel, key, value) {
    let channelData = currentData[channel];
    if (typeof channelData === "undefined") {
        // initialize channel
        channelData = {};
        currentData[channel] = channelData;
    }

    let oldValue = channelData[key];

    // If this key doesnt exist, set the value either way (even if it is null).
    if (typeof channelData[key] === "undefined") {
        channelData[key] = value;
        return;
    }

    // If this key already exists, set the value only if the new value is not null/undefined.
    if (typeof value !== "undefined" && value !== null) {
        channelData[key] = value;
    }


    // if this was an actual "update", send the notification message to that channel
    // and ping all users that signed up for being pinged.

    // oldValue actually needs to be something valid, otherwise
    // this is the first run that populates the table
    if (oldValue != null && value != null && oldValue !== value) {
        await runChangeNotify(channel, key, value);
    }

}

const valueRegex = /\$VALUE\$/g;

// in reality the API can sometimes be indecisive at boundary points (e.g. when channel goes offline, it
// can return live -> live -> live -> (channel goes offline) -> offline -> live (causes wrong notify) -> offline
// remember the last dates when notifies were sent, and dont send too fast if key changes again
// this array is indexed by the value key, e.g. "title", "game", "live" (and not "offline")
const lastNotifies = {};
// in milliseconds, for each channel and each value
// 30 seconds, because the live -> offline transition is very inconsistent with the API
const notifyCooldown = 30000;

async function runChangeNotify(channelName, key, value) {
    console.log(`notify: ${channelName} ${key} ${value}`);

    //
    // notify cooldown
    //
    let channelLastNotifies = lastNotifies[channelName];
    if (typeof channelLastNotifies === "undefined") {
        channelLastNotifies = {};
        lastNotifies[channelName] = channelLastNotifies;
    }

    let lastNotified = channelLastNotifies[key];
    if (typeof lastNotified === "undefined") {
        lastNotified = 0;
    }
    let timeNow = Date.now();
    let timeSinceLastNotify = timeNow - lastNotified;
    if (timeSinceLastNotify <= notifyCooldown) {
        // notify wasn't run, don't save the time.
        console.log(`lastNotified: ${lastNotified}`);
        console.log(`timeSinceLastNotify: ${timeSinceLastNotify}`);
        console.log("skipping notify due to cooldown");
        return;
    }
    channelLastNotifies[key] = timeNow;

    //
    // username processing
    //
    let channelData = config.enabledChannels[channelName];
    let formats = channelData["formats"];

    let channelPingLists = pingLists[channelName] || {};

    // ensure value is not banphrased
    let isValueBanphrased = await isMessageBanphrased(channelName, value);
    if (isValueBanphrased === null) {
        value = "[cannot comply, banphrase api failed to respond]";
    } else if (isValueBanphrased) {
        value = "[banphrased value]";
    }

    //
    //  now do the pings.
    //
    for (let [eventName, eventConfig] of Object.entries(availableEvents)) {
        if (!(eventConfig["matcher"](key, value))) {
            // event does not match.
            continue;
        }

        // get the message format
        let eventFormat = formats[eventName];
        if (key === "live" && !value) {
            eventFormat = formats["offline"];
        }

        // substitute $VALUE$ with the actual value
        eventFormat = eventFormat.replace(valueRegex, value);

        // iterate all users. Check them individually for being banphrased
        let userList = channelPingLists[eventName] || [];
        // copy so we dont modify the original array and replace usernames in it
        userList = userList.slice();

        if (userList.length <= 0) {
            // no users signed up for this event, skip
            continue;
        }

        for (let i = 0; i < userList.length; i++) {
            let user = userList[i];
            let isUsernameBanphrased = await isMessageBanphrased(channelName, user);
            if (isUsernameBanphrased === null) {
                userList[i] = "[cannot comply]";
            } else if (isUsernameBanphrased) {
                userList[i] = "[banphrased username]";
            }
        }

        // join into individual messages, each up to 400 characters long.
        // eventFormat is the message prefix
        let msg = eventFormat;
        let currentMsgUserCount = 0;
        for (let i = 0; i < userList.length; i++) {
            let user = userList[i];

            let newMessage = msg + user;
            if (newMessage.length > 180) {
                // send out the current message and start a new message
                await sendMessage(channelName, msg);
                currentMsgUserCount = 0;
                msg = eventFormat;
            }

            msg += user;
            currentMsgUserCount += 1;

            if ((i + 1) < userList.length) {
                msg += ", ";
            }

        }

        if (currentMsgUserCount > 0) {
            await sendMessage(channelName, msg);
        }
    }

}

async function savePingLists() {
    await storage.setItem('pingLists', pingLists);
}

async function loadPingLists() {
    let loadedObj = await storage.getItem('pingLists');
    if (typeof loadedObj !== "undefined") {
        pingLists = loadedObj;
    }
}

// print all events
async function events(channelName, context, params) {
    let msg = "Available events: ";
    let eventArray = Object.keys(availableEvents);
    eventArray.sort();
    msg += eventArray.join(", ");

    await sendReply(channelName, context["display-name"], msg);
}

async function notifyme(channelName, context, params) {

    if (!(channelName in config.enabledChannels)) {
        return;
    }

    if (params.length < 1) {
        await sendReply(channelName, context["display-name"], "Please specify an event to subscribe to. Type !events to get a list of available events.");
        return;
    }

    let eventName = params[0];

    if (!(eventName in availableEvents)) {
        await sendReply(channelName, context["display-name"], "The given event name is not valid. Type !events to get a list of available events.");
        return;
    }

    let thisChannelPingLists = pingLists[channelName];
    if (typeof thisChannelPingLists === "undefined") {
        thisChannelPingLists = {};
        pingLists[channelName] = thisChannelPingLists;
    }

    let userList = thisChannelPingLists[eventName];
    if (typeof userList === "undefined") {
        userList = [];
        thisChannelPingLists[eventName] = userList;
    }

    let username = context["username"];
    if (userList.includes(username)) {
        await sendReply(channelName, context["display-name"], `You are already subscribed to the event "${eventName}". Type "!removeme ${eventName}" to unsubscribe. You can view all your subscriptions with "!subscribed".`);
        return;
    }

    userList.push(username);

    await savePingLists();

    await sendReply(channelName, context["display-name"], `Successfully subscribed you to the event "${eventName}". You will now be pinged in chat when this event occurs.`);

}

async function removeme(channelName, context, params) {

    if (!(channelName in config.enabledChannels)) {
        await sendReply(channelName, context["display-name"], "Error: This channel is not enabled.");
        return;
    }

    if (params.length < 1) {
        await sendReply(channelName, context["display-name"], "Please specify an event to unsubscribe from. Type !events to get a list of available events.");
        return;
    }

    let eventName = params[0];

    if (!(eventName in availableEvents)) {
        await sendReply(channelName, context["display-name"], "The given event name is not valid. Type !events to get a list of available events.");
        return;
    }

    let thisChannelPingLists = pingLists[channelName];
    if (typeof thisChannelPingLists === "undefined") {
        thisChannelPingLists = {};
        pingLists[channelName] = thisChannelPingLists;
    }

    let userList = thisChannelPingLists[eventName];
    if (typeof userList === "undefined") {
        userList = [];
        thisChannelPingLists[eventName] = userList;
    }

    let username = context["username"];
    if (!(userList.includes(username))) {
        await sendReply(channelName, context["display-name"], `You are not subscribed to the event "${eventName}". Type "!notifyme ${eventName}" to subscribe.  You can view all your subscriptions with "!subscribed".`);
        return;
    }

    thisChannelPingLists[eventName] = userList.filter(function (e) {
        return e !== username;
    });

    await savePingLists();

    await sendReply(channelName, context["display-name"], `Successfully unsubscribed you from the event "${eventName}".`);

}

async function subscribed(channelName, context, params) {

    if (!(channelName in config.enabledChannels)) {
        await sendReply(channelName, context["display-name"], "Error: This channel is not enabled.");
        return;
    }

    let username = context["username"];


    let events = [];
    for (let [eventName, userList] of Object.entries(pingLists[channelName] || {})) {
        if (userList.includes(username)) {
            events.push("\"" + eventName + "\"");
        }
    }

    let msg;
    if (events.length >= 1) {
        msg = "You are subscribed to the following events: ";
        msg += events.join(", ");
        msg += ".";
    } else {
        msg = "You are not subscribed to any events. Use !notifyme to subscribe.";
    }

    msg += " You can view all events with \"!events\".";

    await sendReply(channelName, context["display-name"], msg);
}

async function help(channelName, context, params) {

    if (!(channelName in config.enabledChannels)) {
        await sendReply(channelName, context["display-name"], "Error: This channel is not enabled.");
        return;
    }

    await sendReply(channelName, context["display-name"], "Available commands: !notifyme [event], !removeme [event], !subscribed, !events, !help");
}

async function bot(channelName, context, params) {

    if (!(channelName in config.enabledChannels)) {
        await sendReply(channelName, context["display-name"], "Error: This channel is not enabled.");
        return;
    }

    await sendReply(channelName, context["display-name"], "I am a bot made by RAnders00. I can notify you when the channel goes live or the title changes. Try !help for a list of commands. pajaDank");
}

async function ping(channelName, context, params) {
    await sendReply(channelName, context["display-name"], "Reporting for duty NaM 7");
}

async function setData(channelName, context, params) {

    if (!config.administrators.includes(context["username"])) {
        return;
    }

    if (!(channelName in config.enabledChannels)) {
        await sendReply(channelName, context["display-name"], "Error: This channel is not enabled.");
        return;
    }

    await updateChannelProperty(channelName, params[0], eval(params.splice(1).join(" ")));
}

function debugData(channelName, context, params) {

    if (!config.administrators.includes(context["username"])) {
        return;
    }

    console.log(`triggered debug print from ${JSON.stringify(channelName)}`);
    console.log("=== enabledChannels ===");
    console.log(config.enabledChannels);
    console.log("=== currentData ===");
    console.log(currentData);
    console.log("=== pingLists ===");
    console.log(pingLists);

}

async function debug(channelName, context, params) {

    if (!config.administrators.includes(context["username"])) {
        return;
    }

    try {
        let result = eval(params.join(" "));

        // await if result is promise
        if (typeof result === 'object' && typeof result.then === 'function') {
            result = await result;
        }

        await sendReply(channelName, context["display-name"], JSON.stringify(result));
        console.log(result);
    } catch (e) {
        console.log(e);
        await sendReply(channelName, context["display-name"], "Error thrown");
    }
}

async function quit(channelName, context, params) {

    if (!config.administrators.includes(context["username"])) {
        return;
    }

    await sendReply(channelName, context["display-name"], "Quitting/restarting...");
    process.exit(1);

}

// returns true or false if message banstatus is known,
// returns null if status could not be determined.
async function isMessageBanphrased(channelName, message) {
    let channelProtectionData = config.enabledChannels[channelName]["protection"];

    if (typeof channelProtectionData === "undefined" || channelProtectionData === null) {
        // protection not enabled in that channel
        return false;
    }

    let options = {
        method: 'POST',
        json: true,
        uri: channelProtectionData["endpoint"],
        formData: {message: String(message)}
    };

    try {
        let response = await request(options);

        return response["banned"];

    } catch (error) {
        console.log(error);

        return null;
    }

}

async function sendReply(channelName, username, message) {
    let isUsernameBanphrased = await isMessageBanphrased(channelName, username);
    if (isUsernameBanphrased === null) {
        username = "[cannot comply]";
    } else if (isUsernameBanphrased) {
        username = "[banphrased username]";
    }

    message = `${username}, ${message}`;
    await sendMessage(channelName, message);
}

let lastEgressMessages = [];
let egressMessageLocks = [];
let egressMessageTimers = [];

async function sendMessage(channelName, message) {
    // get lock
    let lock = egressMessageLocks[channelName];
    if (typeof lock === "undefined") {
        lock = new AsyncLock();
        egressMessageLocks[channelName] = lock;
    }

    // lock for this channel
    // lock.enter does not take async functions. wrap the whole call inside yet
    // another async function and execute immediately.
    lock.enter((token) => {
        console.log(`locked ${channelName}`);
        (async () => {
            let lastEgressMessage = lastEgressMessages[channelName];

            if (lastEgressMessage === message) {
                message += ' \u206D';
            }
            console.log(`EGRESS [to: ${channelName}] >${message}<`);
            await client.say("#" + channelName, message);
            lastEgressMessages[channelName] = message;

            // sleep (lock this channel) for 1650 ms (1200ms is minimum, but 1650 prevents us exceeding global limits)
            // use a extendable timer in case we get timed out (then wait longer until lock release)
            // see the onTimeoutHandler for more details
            await new Promise(resolve => {
                let timer = new Timer(1650, 1650, () => {
                    delete egressMessageTimers[channelName];
                    resolve();
                });
                egressMessageTimers[channelName] = timer;
            });

            console.log(`unlocking ${channelName}`);
            // unlock for this channel
            token.leave();
        })();
    });
}

// Create a client with our options:
let client = new tmi.client(config.opts);

// Register our event handlers (defined below):
client.on('message', onMessageHandler);
client.on('timeout', onTimeoutHandler);
client.on('connected', onConnectedHandler);
client.on('disconnected', onDisconnectedHandler);

async function connect() {
    console.log("Initializing storage...");
    await storage.init();
    console.log("Loading from storage...");
    await loadPingLists();
    console.log("Connecting to Twitch IRC...");
    await client.connect();

    await sendMessage(config.startupChannel, 'Running!');

    console.log("Starting refresh loop");

    // intentionally don't await this promise, since we want to start the refresh loop right away.
    // noinspection JSIgnoredPromiseFromCall
    refreshData();
    // poll every X seconds
    setInterval(refreshData, 5 * 1000);
}

const endStripRegex = /[\s\u206D]+$/u;

function onMessageHandler(target, context, msg, self) {
    if (self) {
        return;
    }
    // ignore whispers
    if (context['message-type'] === 'whisper') {
        return;
    }

    msg = msg.replace(endStripRegex, '');
    msg = msg.trim();

    // This isn't a command since it has no prefix:
    if (msg.substr(0, 1) !== config.commandPrefix) {
        return;
    }

    // trim away the leading # character
    target = target.substring(1);

    // Split the message into individual words:
    const parse = msg.slice(1).split(' ');
    // The command name is the first (0th) one:
    const commandName = parse[0];
    // The rest (if any) are the parameters:
    const params = parse.splice(1);


    for (let i = 0; i < knownCommands.length; i++) {
        if (knownCommands[i].name.toUpperCase() === commandName.toUpperCase()) {
            knownCommands[i](target, context, params);
            console.log(`* Executed ${commandName} command for ${context.username}`);
        }
    }
}

function onTimeoutHandler(channelName, username, reason, duration) {
    const ourUsername = config.opts.identity.username;
    if (username !== ourUsername) {
        return;
    }

    // trim away the leading # character
    channelName = channelName.substring(1);

    let timer = egressMessageTimers[channelName];
    if (typeof timer === "undefined") {
        // get lock
        let lock = egressMessageLocks[channelName];
        if (typeof lock === "undefined") {
            lock = new AsyncLock();
            egressMessageLocks[channelName] = lock;
        }

        // create a timer and lock
        lock.enter((token) => {
            console.log(`locked ${channelName} via timeout handler`);
            (async () => {
                await new Promise(resolve => {
                    timer = new Timer(duration * 1000, 0, () => {
                        delete egressMessageTimers[channelName];
                        resolve();
                    });
                    egressMessageTimers[channelName] = timer;
                });

                console.log(`unlocking ${channelName} from timeout handler`);
                // unlock for this channel
                token.leave();
            })();
        });

        return;
    }

    // extend the existing timer.
    // duration is in seconds, we need milliseconds here.
    timer.update(duration * 1000);
}

function onConnectedHandler(addr, port) {
    console.log(`* Connected to ${addr}:${port}`);
}

function onDisconnectedHandler(reason) {
    console.log(`Disconnected: ${reason}`);
    process.exit(1);
}

// noinspection JSIgnoredPromiseFromCall
connect();
