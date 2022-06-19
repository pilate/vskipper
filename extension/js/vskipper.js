const APP = "vSkipper";
var WIN = window.wrappedJSObject;


function skipTo(newTime, contentId, category) {
    WIN.playerControl.seekAccurate(newTime.toString());
    console.debug(`[${APP}][${contentId}][${category}] Seeking to ${newTime}s`);
}

// Return map of matching categories and timestamp to jump to
function skipCheck(contentId, time, duration) {
    var hits = {};

    if (!contentId || !(contentId in VSKIPDB)) {
        return hits;
    }

    for (const [category, skips] of Object.entries(VSKIPDB[contentId])) {
        if (category[0] == "_")
            continue;

        for (var i=0; i<skips.length; i++) {
            var skip = skips[i];

            if (skip.length == 1) {
                if (time > skip[0]) {
                    hits[category] = Math.max(duration, hits[category] || 0);
                }
            }
            else if ((skip[0] + skip[1]) > time > skip[0]) {
                hits[category] = Math.max(skip[0] + skip[1], hits[category] || 0);
            }
        }
    }

    return hits;
}

function onTime(details) {
    const contentId = WIN.playerControl.props.contentId;
    console.log(`[${APP}][${contentId}] onTime: ${JSON.stringify(details)}`);

    var skips = skipCheck(contentId, details.time, details.duration);
    for (const [category, offset] of Object.entries(skips)) {
        if (category[0] == "_")
            continue;

        skipTo(offset, contentId, category);
        break;
    }
}

const setupInterval = setInterval(function () {
    if (!WIN.playerControl) {
        console.debug(`[${APP}] setup delayed, no playerControl`);
        return;
    }
    clearInterval(setupInterval);

    exportFunction(onTime, window, {defineAs: 'onTime'});
    WIN.playerControl.subscribeHelper.subscribe("PLAYER_TIME", WIN.onTime);

    console.debug(`[${APP}] setup success`);
}, 100);
