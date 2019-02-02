'use strict';

const tmi = require('tmi.js');
const request = require('request-promise');
const storage = require('node-persist');
const AsyncLock = require('node-async-locks').AsyncLock;
const escapeStringRegexp = require('escape-string-regexp');
const Timer = require('./edit-timer').Timer;
const config = require('./config');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// use in array.filter() to ensure all values are unique
// https://stackoverflow.com/a/14438954
function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

const knownCommands = [
    events,
    notifyme,
    removeme,
    subscribed,
    title,
    game,
    islive,
    help,
    titlechangebot_help,
    titlechangebothelp,
    tcb_help,
    tcbhelp,
    bot,
    titlechange_bot,
    titlechangebot,
    ping,
    tcbping,
    setData,
    debugData,
    debug,
    tcbdebug,
    quit,
    tcbquit];

// the main data storage object.
// stores for each channel (key):
// "forsen": { "title": <title>, "game": <game>, "live": true/false, }
let currentData = {};

// only the events that have a configured format are supported by a channel.
function getChannelAvailableEvents(channelName) {
    // available events for signing up for pings
    const availableEvents = {
        title: {
            matcher: function (key, value) {
                return key === "title";
            },
            hasValue: true,
            description: "when the title changes"
        },
        game: {
            matcher: function (key, value) {
                return key === "game";
            },
            hasValue: true,
            description: "when the game changes"
        },
        live: {
            matcher: function (key, value) {
                return key === "live" && value === true;
            },
            hasValue: false,
            description: "when the streamer goes live"
        },
        offline: {
            matcher: function (key, value) {
                return key === "live" && value === false;
            },
            hasValue: false,
            description: "when the streamer goes offline"
        },
        partner: {
            matcher: function (key, value) {
                return key === "partner" && value === true;
            },
            hasValue: false,
            description: "when this streamer becomes partnered"
        }
    };

    let returnObject = {};

    Object.keys(availableEvents)
        .filter(evName => evName in config.enabledChannels[channelName]["formats"])
        .forEach(evName => returnObject[evName] = availableEvents[evName]);

    return returnObject;
}

function getListOfAvailableEvents(channelName) {
    let eventArray = Object.keys(getChannelAvailableEvents(channelName));
    eventArray.sort();
    return eventArray.join(", ");
}

// print all events
async function events(channelName, context, params) {
    let channelAvailableEvents = getChannelAvailableEvents(channelName);
    let eventArray = Object.keys(channelAvailableEvents);
    let allEventsString = eventArray.sort()
        .map(evName => `${evName} (${channelAvailableEvents[evName].description})`)
        .join(', ');

    await sendReply(channelName, context["display-name"], `Available events: ${allEventsString}. ` +
        'Type "!notifyme <event> [optional value]" to subscribe to an event!');
}

// requiredValue = null - any value
// requiredValue = "something" - only when new value contains this
// [ { channel: "forsen", user: "n_888", event: "title", requiredValue: null } ]
let userSubscriptions = [];

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
        await updateChannelProperty(channelName, "partner", response["partner"]);
        await updateChannelProperty(channelName, "id", response["_id"]);

    } catch (error) {
        console.log(error);

        await updateChannelProperty(channelName, "title", null);
        await updateChannelProperty(channelName, "game", null);
        await updateChannelProperty(channelName, "partner", null);
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

    let channelData = config.enabledChannels[channelName];
    let formats = channelData["formats"];

    let protection = channelData["protection"] || {};
    // do we have a char limit (for whole messages)? otherwise use default limit of 500.
    let lengthLimit = protection["lengthLimit"] || 500;
    // leave two characters for chatterino alternate character (this is added in the sendMessageUnsafe function later)
    lengthLimit -= 2;

    // do we have a value length limit? (e.g. length limit for the title/game/etc. field)?
    // If not use 1/4 of the length limit.
    let valueLengthLimit = protection["valueLengthLimit"] || (lengthLimit / 4);

    // clip value length
    if (value.length > valueLengthLimit) {
        // shorten value to length - 1, to leave one char space for the ellipsis character
        value = value.substring(0, valueLengthLimit - 1);
        value += "…";
    }

    let offlineChatOnly = protection["offlineOnly"];
    if (typeof offlineChatOnly === "undefined") {
        offlineChatOnly = false;
    }

    // this is the channel all notify messages for this event are sent to.
    // this can be different for offline-only channels that are currently live.
    let sendChannel = channelName;
    let eventFormatPrefix = "";
    if (offlineChatOnly && key !== "live" && currentData[channelName]["live"]) {
        sendChannel = config.onlinePrintChannel;
        eventFormatPrefix = `[via #${channelName}] `;
        console.log(`Channel #${channelName} is currently live and change occurred, printing notify to #${sendChannel}`);
    }

    let noPingMode = protection["noPingMode"];
    if (noPingMode == null) {
        noPingMode = false;
    }

    //
    //  now do the pings.
    //
    for (let [eventName, eventConfig] of Object.entries(getChannelAvailableEvents(channelName))) {
        if (!(eventConfig["matcher"](key, value))) {
            // event does not match.
            continue;
        }

        let usersToPing = userSubscriptions
            .filter(sub => sub.channel === channelName)
            .filter(sub => sub.event === eventName)
            .filter(sub => {
                if (!eventConfig.hasValue) {
                    return true;
                }
                return String(value).toUpperCase().indexOf(sub.requiredValue.toUpperCase()) >= 0;
            })
            .filter(onlyUnique)
            .map(sub => sub.user);

        // get the message format
        let eventFormat = formats[eventName];
        if (key === "live" && !value) {
            eventFormat = formats["offline"];
        }
        // prepend [via #forsen] if printing to the offline-protection channel
        eventFormat = eventFormatPrefix + eventFormat;
        eventFormat = ".me " + eventFormat;

        // substitute $VALUE$ with the actual value
        eventFormat = eventFormat.replace(valueRegex, value);

        // send this notify WITHOUT any pings, just one message. return immediately.
        if (noPingMode) {
            await sendMessage(sendChannel, eventFormat);
            return;
        }

//        if (usersToPing.length <= 0) {
//            // no users signed up for this event, skip
//            continue;
//        }


        let buildNotifyMsg = function (usersArray) {
            let msg = eventFormat;
            msg += usersArray.join(' ');
            msg = msg.trim();
            return msg;
        };
        // join into individual messages, each up to >lengthLimit< characters long.
        // eventFormat is the message prefix.
        let messagesToPrint = [];

        let currentStartIndex = 0;
        // start with one user.
        for (let i = 1; i <= usersToPing.length; i++) {
            let thisIterationUsers = usersToPing.slice(currentStartIndex, i);
            // note that this will technically be out of bounds for the last iteration,
            // but JS accepts the too-big end index and just returns the same array as
            // thisIterationUsers.
            let nextIterationUsers = usersToPing.slice(currentStartIndex, i + 1);

            // build message for this iteration
            let thisIterationMessage = buildNotifyMsg(thisIterationUsers);
            let nextIterationMessage = buildNotifyMsg(nextIterationUsers);

            if (nextIterationMessage.length > lengthLimit) {
                messagesToPrint.push(thisIterationMessage);
                // begin again with one user.
                currentStartIndex = i;
            }

            // if last iteration.
            if (thisIterationUsers.length === nextIterationUsers.length) {
                messagesToPrint.push(thisIterationMessage);
            }
        }

        if (eventName === "live") {
            // print the MOTD
            let channelMotd = channelMotds[channelName];
            if (channelMotd == null) {
                channelMotd = defaultMotd;
            }
            if (channelMotd != null) {
                messagesToPrint.push(channelMotd);
            }
        }

        for (let msgToPrint of messagesToPrint) {
            await sendMessage(sendChannel, msgToPrint);
        }
    }

}

async function saveUserSubscriptions() {
    await storage.setItem('userSubscriptions', userSubscriptions);
}

async function loadUserSubscriptions() {
    let loadedObj = await storage.getItem('userSubscriptions');
    if (typeof loadedObj !== "undefined") {
        userSubscriptions = loadedObj;
    }
}

// the motd is printed after the live notify in a channel as a separate message
let defaultMotd = "";
let channelMotds = {};

async function saveMotd() {
    await storage.setItem('defaultMotd', defaultMotd);
    await storage.setItem('channelMotds', channelMotds);
}

async function loadMotd() {
    let loadedDefaultMotd = await storage.getItem('defaultMotd');
    if (typeof loadedDefaultMotd !== "undefined") {
        defaultMotd = loadedDefaultMotd;
    }

    let loadedChannelMotds = await storage.getItem('channelMotds');
    if (typeof loadedChannelMotds !== "undefined") {
        channelMotds = loadedChannelMotds;
    }
}

// call this as the owner with !tcbdebug importPingLists()
async function importPingLists() {
    if (userSubscriptions.length > 0) {
        return "userSubscriptions array is not empty!";
    }

    let pingLists = await storage.getItem('pingLists');
    // format:
    // "forsen": { "title": ['randers00', 'n_888'], "game": [], "live": ['randers00', 'n_888'] }
    if (typeof pingLists === "undefined") {
        return "No pingLists object found in persistent storage";
    }

    for (let [channelName, channelPingLists] of Object.entries(pingLists)) {
        for (let [eventName, userList] of Object.entries(channelPingLists)) {
            for (let username of  userList) {
                userSubscriptions.push({
                    channel: channelName,
                    user: username,
                    event: eventName,
                    requiredValue: ""
                });
            }
        }
    }

    return `Imported ${userSubscriptions.length} subscriptions!`;
}

async function notifyme(channelName, context, params) {

    if (params.length < 1) {
        await sendReply(channelName, context["display-name"], `Please specify an event to subscribe to. ` +
            `The following events are available: ${getListOfAvailableEvents(channelName)}`);
        return;
    }

    let eventName = params[0];
    eventName = eventName.toLowerCase();

    if (!(eventName in getChannelAvailableEvents(channelName))) {
        await sendReply(channelName, context["display-name"], `The given event name is not valid. ` +
            `The following events are available: ${getListOfAvailableEvents(channelName)}`);
        return;
    }

    let requiredValue = params.slice(1).join(" ");

    let eventConfig = getChannelAvailableEvents(channelName)[eventName];

    if (!eventConfig.hasValue && requiredValue.length > 0) {
        // requesting specific value when this is not an event that takes on a value. (e.g. live/offline)
        requiredValue = "";
    }

    // check if requesting generic sub, and user has specific subs
    let specificSubs = userSubscriptions
        .filter(sub => sub.channel === channelName)
        .filter(sub => sub.user === context["username"])
        .filter(sub => sub.event === eventName)
        .filter(sub => sub.requiredValue.length > 0);
    if (requiredValue.length <= 0 && specificSubs.length > 0) {
        // user is requesting generic sub when they have specific ones on record.
        // remove all their subs and replace them with one generic one.
        userSubscriptions = userSubscriptions
            .filter(sub => sub.channel === channelName)
            .filter(sub => sub.user === context["username"])
            .filter(sub => sub.event === eventName);
        userSubscriptions.push({
            channel: channelName,
            user: context["username"],
            event: eventName,
            requiredValue: requiredValue
        });
        await sendReply(channelName, context["display-name"], `Successfully subscribed you to the event ` +
            `"${eventName}". You previously had subscriptions for this event that were set to only match specific values. ` +
            `These subscriptions have been removed and you will now be notified regardless of the value. SeemsGood`);
        return;
    }


    // check if a general subscription or this exact sub already exists
    let duplicateSubs = userSubscriptions
        .filter(sub => sub.channel === channelName)
        .filter(sub => sub.user === context["username"])
        .filter(sub => sub.event === eventName)
        .filter(sub => sub.requiredValue.length <= 0 || sub.requiredValue.toUpperCase() === requiredValue.toUpperCase());

    if (duplicateSubs.length > 0) {
        if (duplicateSubs.length > 2) {
            // this shouldnt (tm) happen because it would mean the user has a general match-all subscription
            // (requiredValue="") and a specific one. This method aims to prevent that.
            console.warn(`User has two duplicates for eventName=${eventName} with requiredValue=${requiredValue}, ` +
                `found these duplicates: ${JSON.stringify(duplicateSubs)}`);
        }

        // following combinations are possible:
        // inputRequiredValue="" duplicateRequiredValue="" (duplicate generic sub)
        // inputRequiredValue="something" duplicateRequiredValue="" (specific sub when generic one exists)
        // this is not possible: inputRequiredValue="" duplicateRequiredValue="something" (handled previously)
        // inputRequiredValue="something" duplicateRequiredValue="something" (duplicate specific sub)

        let duplicateSub = duplicateSubs[0];
        if (duplicateSub.requiredValue.length <= 0) {
            // user is trying to add either duplicate generic subscription, or a specific one when they have a generic one.
            if (requiredValue.length > 0) {
                await sendReply(channelName, context["display-name"], `You already have a subscription for the ` +
                    `event "${eventName}" that matches *all* values. Should you want to only get pinged on specific values, ` +
                    `type "!removeme ${eventName}" and run this command again.`);
            } else {
                await sendReply(channelName, context["display-name"], `You already have a subscription for the ` +
                    `event "${eventName}". If you want to unsubscribe, type "!removeme ${eventName}".`);
            }
            return;
        } else {
            // user is trying to add specific subscription, and already has this exact specific subscription.
            await sendReply(channelName, context["display-name"], `You already have a subscription for the event ` +
                `"${eventName}" with the value "${requiredValue}".`);
            return;
        }
    }


    // by now: user does not have a duplicating subscription on record
    // (or a generic one when requesting a specific one)
    // we can add this subscription now without issue.

    userSubscriptions.push({
        channel: channelName,
        user: context["username"],
        event: eventName,
        requiredValue: requiredValue
    });
    await saveUserSubscriptions();
    if (requiredValue.length <= 0) {
        // new generic sub
        await sendReply(channelName, context["display-name"],
            `I will now ping you in chat when ${eventConfig.description}!`);
    } else {
        // new specific sub
        await sendReply(channelName, context["display-name"],
            `I will now ping you in chat when ${eventConfig.description}, but only when the value contains `
            + `"${requiredValue}"!`);
    }

}

async function removeme(channelName, context, params) {

    if (params.length < 1) {
        await sendReply(channelName, context["display-name"], `Please specify an event to unsubscribe from. ` +
            `The following events are available: ${getListOfAvailableEvents(channelName)}`);
        return;
    }

    let eventName = params[0];
    eventName = eventName.toLowerCase();

    if (!(eventName in getChannelAvailableEvents(channelName))) {
        await sendReply(channelName, context["display-name"], `The given event name is not valid. ` +
            `The following events are available: ${getListOfAvailableEvents(channelName)}. You can view all your subscriptions `);
        return;
    }

    let requiredValue = params.slice(1).join(" ");

    let eventConfig = getChannelAvailableEvents(channelName)[eventName];

    if (!eventConfig.hasValue && requiredValue.length > 0) {
        // requesting specific value when this is not an event that takes on a value. (e.g. live/offline)
        requiredValue = "";
    }

    // if requiredValue is empty, remove the user from all subscriptions to this event.
    // if requiredValue is non-empty, only remove the subscription that matches that value.

    let toRemove = userSubscriptions
        .filter(sub => sub.channel === channelName)
        .filter(sub => sub.user === context["username"])
        .filter(sub => sub.event === eventName)
        .filter(sub => {
            if (requiredValue.length <= 0) {
                // no value passed to the function, match all
                return true;
            }

            // value passed, match only on case-insensitive match
            return requiredValue.toUpperCase() === sub.requiredValue.toUpperCase();
        });

    if (toRemove.length < 1) {
        if (requiredValue.length <= 0) {
            // user was not subbed to this event at all
            await sendReply(channelName, context["display-name"],
                `You are not subscribed to the event "${eventName}". You can view all your ` +
                `subscriptions with "!subscribed".`);
        } else {
            // did not match that requiredValue
            await sendReply(channelName, context["display-name"],
                `You are not subscribed to the event "${eventName}" with the value "${requiredValue}" o_O ` +
                `You can view all your subscriptions with "!subscribed".`);
        }
        return;
    }

    userSubscriptions = userSubscriptions.filter(sub => !toRemove.includes(sub));

    await saveUserSubscriptions();

    await sendReply(channelName, context["display-name"],
        `Successfully unsubscribed you from the event "${eventName}" ` +
        `${requiredValue.length > 0 ? `for the value "${requiredValue}" ` : ''}` +
        `(removed ${toRemove.length} ` +
        `subscription${toRemove.length === 1 ? '' : 's'})`);
}


async function subscribed(channelName, context, params) {

    let activeSubscriptions = userSubscriptions
        .filter(sub => sub.channel === channelName)
        .filter(sub => sub.user === context["username"]);

    let eventNames = activeSubscriptions
        .map(sub => sub.event)
        .filter(onlyUnique);

    let msgParts = [];
    for (let eventName of eventNames) {
        let eventConfig = getChannelAvailableEvents(channelName)[eventName];
        let eventSubscriptions = activeSubscriptions
            .filter(sub => sub.event === eventName);

        if (!eventConfig.hasValue) {
            // the user has a subscription for this event, but this is a event type
            // without a value so only possible situation is that the user has exactly one generic sub to this event.
            msgParts.push(
                `${eventName} (${eventConfig.description})`
            );
            continue;
        }

        // this is an event that has a value (game/title for example), and the user has at least 1 sub to this event.
        if (eventSubscriptions.length === 1 && eventSubscriptions[0].requiredValue.length <= 0) {
            // generic sub
            msgParts.push(
                `${eventName} (${eventConfig.description})`
            );
            continue;
        }

        // user has 1 or more specific subs
        let requiredValues = [];
        for (let sub of eventSubscriptions) {
            requiredValues.push(
                `"${sub.requiredValue}"`
            );
        }

        msgParts.push(
            `${eventName} (${eventConfig.description}) for the values ${requiredValues.join(', ')}`
        );
    }

    if (msgParts.length < 1) {
        await sendReply(channelName, context["display-name"],
            "You are not subscribed to any events. Use !notifyme <event> [optional value] to subscribe. " +

            `Valid events are: ${getListOfAvailableEvents(channelName)}`
        );
        return;
    }

    await sendReply(channelName, context["display-name"],

        `Your subscriptions in this channel: ${msgParts.join(', ')}`
    );
}

async function title(channelName, context, params) {

    if (!(channelName in config.enabledChannels)) {
        await sendReply(channelName, context["display-name"], "Error: This channel is not enabled.");
        return;
    }

    await sendReply(channelName, context["display-name"],
        `Current title: ${currentData[channelName]["title"]}`
    );

}

async function game(channelName, context, params) {

    if (!(channelName in config.enabledChannels)) {
        await sendReply(channelName, context["display-name"], "Error: This channel is not enabled.");
        return;
    }

    await sendReply(channelName, context["display-name"],
        `Current game: ${currentData[channelName]["game"]}`
    );

}

async function islive(channelName, context, params) {

    if (!(channelName in config.enabledChannels)) {
        await sendReply(channelName, context["display-name"], "Error: This channel is not enabled.");
        return;
    }

    await sendReply(channelName, context["display-name"],
        `Current live status: ${currentData[channelName]["live"] ? "The channel is live!" : "The channel is offline :("}`
    );

}

async function help(channelName, context, params) {

    if (!(channelName in config.enabledChannels)) {
        await sendReply(channelName, context["display-name"], "Error: This channel is not enabled.");
        return;
    }

    await sendReply(channelName, context["display-name"], "Available commands: !notifyme <event> [optional value], " +
        "!removeme <event> [optional value], !subscribed, !events, !title, !game, !islive, !help");
}

async function titlechangebot_help(channelName, context, params) {
    await help(channelName, context, params);
}

async function titlechangebothelp(channelName, context, params) {
    await help(channelName, context, params);
}

async function tcb_help(channelName, context, params) {
    await help(channelName, context, params);
}

async function tcbhelp(channelName, context, params) {
    await help(channelName, context, params);
}

async function bot(channelName, context, params) {

    if (!(channelName in config.enabledChannels)) {
        await sendReply(channelName, context["display-name"], "Error: This channel is not enabled.");
        return;
    }

    await sendReply(channelName, context["display-name"], "I am a bot made by RAnders00. I can notify you when the channel goes live or the title changes. Try !help for a list of commands. pajaDank");
}

async function titlechange_bot(channelName, context, params) {
    await bot(channelName, context, params);
}

async function titlechangebot(channelName, context, params) {
    await bot(channelName, context, params);
}

async function ping(channelName, context, params) {
    await sendReply(channelName, context["display-name"], "Reporting for duty NaM 7");
}

async function tcbping(channelName, context, params) {
    await ping(channelName, context, params);
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

    console.log(
        `triggered debug print from ${JSON.stringify(channelName)}`
    );
    console.log("=== enabledChannels ===");
    console.log(config.enabledChannels);
    console.log("=== currentData ===");
    console.log(currentData);
    console.log("=== userSubscriptions ===");
    console.log(userSubscriptions);

}

async function debug(channelName, context, params) {

    if (!config.administrators.includes(context["username"])) {
        return;
    }

    try {
        let result = eval(params.join(" "));

        // await if result is promise
        if (result !== null && typeof result === 'object' && typeof result.then === 'function') {
            result = await result;
        }

        await sendReply(channelName, context["display-name"], JSON.stringify(result));
        console.log(result);
    } catch (e) {
        console.log(e);
        await sendReply(channelName, context["display-name"],
            `Error thrown: ${String(e)}`
        );
    }
}

async function tcbdebug(channelName, context, params) {
    await debug(channelName, context, params);
}

async function quit(channelName, context, params) {

    if (!config.administrators.includes(context["username"])) {
        return;
    }

    await sendReply(channelName, context["display-name"], "Quitting/restarting...");
    process.exit(1);

}

async function tcbquit(channelName, context, params) {
    await quit(channelName, context, params);
}

const pajbotLinkRegex = new RegExp("\\(?(?:(http|https):\\/\\/)?(?:((?:[^\\W\\s]|\\.|-|[:]{1})+)@{1})?" +
    "((?:www.)?(?:[^\\W\\s]|\\.|-)+[\\.][^\\W\\s]{2,4}|localhost(?=\\/)|\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}" +
    "\\.\\d{1,3})(?::(\\d*))?([\\/]?[^\\s\\?]*[\\/]{1})*(?:\\/?([^\\s\\n\\?\\[\\]\\{\\}\\#]*(?:(?=\\.))" +
    "{1}|[^\\s\\n\\?\\[\\]\\{\\}\\.\\#]*)?([\\.]{1}[^\\s\\?\\#]*)?)?(?:\\?{1}([^\\s\\n\\#\\[\\]]*))?" +
    "([\\#][^\\s\\n]*)?\\)?", "gi");

// validates that the given input message is not banned in the given channel. If it is banned,
// the method will recursively replace all banphrases with "***" until the message is no longer
// banned.
async function censorBanphrases(channelName, message) {
    let channelConfig = config.enabledChannels[channelName];
    if (typeof channelConfig === "undefined") {
        // no info about this channel
        console.log(
            `banphrase check skipped for >${message}< in ch ${channelName} (channel not configured)`
        );
        return message;
    }

    let channelProtectionData = channelConfig["protection"];

    if (channelProtectionData == null || channelProtectionData["endpoint"] == null) {
        // banphrase protection not enabled in that channel
        console.log(`banphrase check skipped for >${message}< in ch ${channelName} (channel not protected)`);
        return message;
    }

    if (channelProtectionData["pajbotLinkFilter"] === true) {
        // censor links with pajbot regex
        let noLinksMessage = message.replace(pajbotLinkRegex, "[link]");
        if (noLinksMessage !== message) {
            console.log(`replaced links, output string: ${noLinksMessage}`);
            message = noLinksMessage;
        }
    }

    console.log(`beginning banphrase check for >${message}< in ch ${channelName}`);

    let banned = true;
    do {
        // detect whether message is banned, replace the banphrase if it is banned.
        let options = {
            method: 'POST',
            json: true,
            uri: channelProtectionData["endpoint"],
            formData: {message: String(message)}
        };

        try {
            let response = await request(options);

            banned = response["banned"];

            // note: the banphrase API only returns the first detected banphrase,
            // which is why this API call may be executed multiple times
            // if needed.
            if (banned) {
                let banphraseData = response["banphrase_data"];

                let phrase = banphraseData["phrase"];
                let caseSensitive = banphraseData["case_sensitive"];
                // https://github.com/pajlada/pajbot/blob/c90b7ebf19776919f1b06eb2d0e4a7e7b57d9c27/pajbot/web/routes/admin/banphrases.py#L68
                // ['contains', 'startswith', 'endswith', 'exact', 'regex']
                let operator = banphraseData["operator"];
                let name = banphraseData["name"];
                let id = banphraseData["id"];
                let permanent = banphraseData["permanent"];

                let regex;
                if (operator === "regex") {
                    regex = phrase;
                } else {
                    // contains, startswith, endswith or exact
                    regex = escapeStringRegexp(phrase);
                    if (operator === "startswith" || operator === "exact") {
                        regex =
                            `^${regex}`
                        ;
                    }
                    if (operator === "endswith" || operator === "exact") {
                        regex =
                            `${regex}$`
                        ;
                    }
                }
                let flags = "g";
                if (!caseSensitive) {
                    flags += "i";
                }

                console.log(
                    `Built regex: >${regex}< flags >${flags}<`
                );
                let phraseRegex = new RegExp(regex, flags);
                let censoredMessage = message.replace(phraseRegex, "***");
                if (censoredMessage === message) {
                    console.error("Was unable to modify the string with the built regex at all. Returning error message");
                    return "error while trying to censor banphrases monkaOMEGA @RAnders00";
                }
                message = censoredMessage;
                console.log(
                    `Censored banphrase ${id} (name: ${name}) (op: ${operator}) (perm: ${permanent}) (caseSensitive: ${caseSensitive}} >${phrase}<`
                );
            }

        } catch (error) {
            console.log(error);

            message = "cannot comply, banphrase API failed to respond monkaS";
            break;
        }
    } while (banned);

    console.log(
        `banphrase check completed for >${message}< in ch ${channelName}`
    );
    return message;

}

async function sendReply(channelName, username, message) {
    await sendMessage(channelName,
        `@${username}, ${message}`
    );
}

let lastEgressMessages = [];
let egressMessageLocks = [];
let egressMessageTimers = [];

async function sendMessage(channelName, message) {
    message = await censorBanphrases(channelName, message);

    // crop to length limit in this channel, if protected and length limit exists
    let channelConfig = config.enabledChannels[channelName] || {};
    let protectionConfig = channelConfig["protection"] || {};
    let lengthLimit = protectionConfig["lengthLimit"] || 500;
    // leave a space of 2 characters should the sender function decide to add the alternate message
    // invisible character at the end.
    lengthLimit -= 2;
    let trimmedMessage = message.substring(0, lengthLimit);
    if (trimmedMessage.length < message.length) {
        trimmedMessage = message.substring(0, lengthLimit - 1) + "…";
    }

    await sendMessageUnsafe(channelName, trimmedMessage);
}

async function sendMessageUnsafe(channelName, message) {

    // get lock
    let lock = egressMessageLocks[channelName];
    if (typeof lock === "undefined") {
        lock = new AsyncLock();
        egressMessageLocks[channelName] = lock;
    }

    // lock for this channel
    // lock.enter does not take async functions. wrap the whole call inside yet
    // another async function and execute immediately.
    await new Promise(resolve => {
        lock.enter((token) => {
            console.log(
                `locked ${channelName}`
            );
            (async () => {
                let lastEgressMessage = lastEgressMessages[channelName];

                if (lastEgressMessage === message) {
                    message += ' \u206D';
                }
                console.log(
                    `EGRESS [to: ${channelName}] >${message}<`
                );
                await client.say("#" + channelName, message);
                lastEgressMessages[channelName] = message;

                if (config.modChannels.includes(channelName)) {
                    // don't sleep!
                    console.log(
                        `immediately unlocking ${channelName} again`
                    );
                    token.leave();
                    resolve();
                    return;
                }

                // sleep (lock this channel) for 1650 ms (1200ms is minimum, but 1650 prevents us exceeding global limits)
                // use a extendable timer in case we get timed out (then wait longer until lock release)
                // see the onTimeoutHandler for more details
                await new Promise(timerResolve => {
                    let timer = new Timer(1650, 1650, () => {
                        delete egressMessageTimers[channelName];
                        timerResolve();
                    });
                    egressMessageTimers[channelName] = timer;
                });

                console.log(
                    `unlocking ${channelName}`
                );
                // unlock for this channel
                token.leave();
                resolve();
            })();
        });
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
    await loadUserSubscriptions();
    await loadMotd();
    console.log("Connecting to Twitch IRC...");
    await client.connect();

    sendMessage(config.startupChannel, 'Running!');

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


    let channelConfig = config.enabledChannels[target] || {};
    let disabledCommands = (channelConfig.protection || {}).disabledCommands || [];

    for (let i = 0; i < knownCommands.length; i++) {
        if (knownCommands[i].name.toUpperCase() === commandName.toUpperCase()) {
            // is the command disabled?
            if (disabledCommands.includes(commandName.toLowerCase())) {
                console.log(
                    `* Not executing ${commandName} for ${context.username} because command is disabled in ${target}`
                );
                continue;
            }

            knownCommands[i](target, context, params);
            console.log(
                `* Executed ${commandName} command for ${context.username}`
            );
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
            console.log(
                `locked ${channelName} via timeout handler`
            );
            (async () => {
                await new Promise(resolve => {
                    timer = new Timer(duration * 1000, 0, () => {
                        delete egressMessageTimers[channelName];
                        resolve();
                    });
                    egressMessageTimers[channelName] = timer;
                });

                console.log(
                    `unlocking ${channelName} from timeout handler`
                );
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
    console.log(
        `* Connected to ${addr}:${port}`
    );
}

function onDisconnectedHandler(reason) {
    console.log(
        `Disconnected: ${reason}`
    );
    process.exit(1);
}

// noinspection JSIgnoredPromiseFromCall
connect();
