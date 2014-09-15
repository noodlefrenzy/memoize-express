module.exports = createMemoizer;

var replayer = require('replayer');

var Memoizer = function(cache) {
	this.cache = cache;
};

Memoizer.prototype.memoize = function (fn) {
    var theCache = this.cache;
	return function(req, res) {
        if (theCache.has(req.originalUrl)) {
            var prevRes = theCache.get(req.originalUrl);
            prevRes.replay(res);
        } else {
            var fakeRes = replayer.watch(res);
            theCache.set(req.originalUrl, fakeRes);
            fn(req, fakeRes);
        }
    };
};

function createMemoizer(cache) {
    return new Memoizer(cache);
}