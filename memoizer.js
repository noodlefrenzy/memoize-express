var replayer = require('replayer');

/**
 * For a given Expressjs request object, constructs the cache key.
 *
 * @param {Request} req     The request for which we should build a key.
 */
function requestKey(req) {
    return req.method + ' ' + req.originalUrl;
}

/**
 * Memoizer is a simple memoization class, currently tuned to working with Expressjs,
 * allowing you to cache a response by recording all method calls on the response object and replaying them
 * when the same request comes in.
 *
 * Request 'sameness' is judged by the VERB and the URI, not considering protocol, headers and cookies.
 * However, this behavior can be overridden by passing in your own keygen(Req) function.
 *
 * Replaying the response uses Replayer, so is limited by the caveats of that class.
 *
 * The cache is expected to implement has/get/set.  For instance, lru-cache works fine.  I'm considering an async
 * version, but that comes with several issues related to in-flight requests, so I just haven't done it yet.
 *
 * @param {Object} cache            The cache to use for storing response replayers.
 * @param {Function} [keygen]       The key generating function, takes an Expressjs Request.  Optional, defaults to {@link requestKey}.
 * @constructor
 */
var Memoizer = function(cache, keygen) {
	this.cache = cache;
    this.keyGenerator = keygen || requestKey;
};

/**
 * Memoize a given Expressjs request/response function - e.g. app.get('/path', memoizer.memoize(...
 *
 * @param {Function} fn         Expressjs request function to wrap.  Any subsequent calls that map to the same
 *                              key, will return the same response (via "replaying" the previous response's function
 *                              invocations on the current response).
 * @returns {Function}          Wrapped function.
 */
Memoizer.prototype.memoize = function (fn) {
    var theCache = this.cache;
	return function(req, res) {
        var key = requestKey(req);
        if (theCache.has(key)) {
            var prevRes = theCache.get(key);
            prevRes.replay(res);
        } else {
            var fakeRes = replayer.watch(res);
            theCache.set(key, fakeRes);
            fn(req, fakeRes);
        }
    };
};

function createMemoizer(cache) {
    return new Memoizer(cache);
}

module.exports = createMemoizer;