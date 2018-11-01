function Timer(t, minimumTime, fn) {
    this.fn = fn;
    const createTime = Date.now();
    this.time = createTime + t;
    this.earliestRelease = createTime + minimumTime;
    console.log(`Started timer with ${this.time - createTime} remaining`);
    this.updateTimer();
}

// update the current time remaining, except dont fall below the minimum time since create time.
Timer.prototype.update = function (t) {
    let timeLeft = getTimeLeft(this.timer);

    const timeNow = Date.now();
    let targetTime = timeNow + t;

    // dont release earlier than earliestRelease
    this.time = Math.max(targetTime, this.earliestRelease);

    console.log(`Updated timer to ${this.time - timeNow} remaining`);
    this.updateTimer();
};

Timer.prototype.stop = function () {
    if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
    }
};

Timer.prototype.updateTimer = function () {
    var self = this;
    this.stop();
    var delta = this.time - Date.now();
    if (delta > 0) {
        this.timer = setTimeout(function () {
            self.timer = null;
            console.log(`Timer ended`);
            self.fn();
        }, delta);
    }
};

function getTimeLeft(timeout) {
    return Math.ceil((timeout._idleStart + timeout._idleTimeout - Date.now()) / 1000);
}

module.exports = {
    "Timer": Timer
};