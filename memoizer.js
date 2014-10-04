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
 * Predicate that determines, for a given request, whether it should be cached.
 *
 * @function reqPredicate
 * @param {Request} req         Express Request object to check.
 * @return {bool}               True if request's response should be cached.
 */

/**
 * Predicate that determines, for a given response, whether it should be cached.
 *
 * @function resPredicate
 * @param {Response} res        Express Response object to check.
 * @return {bool}               True if response should be cached.
 */

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
 * @param {Object} cache                    The cache to use for storing response replayers.
 * @param {Function} [keygen]               The key generating function, takes an Expressjs Request.  Optional, defaults to {@link requestKey}.
 * @param {reqPredicate} [shouldCacheReq]   Whether the request should be cached (defaults to always true).
 * @param {resPredicate} [shouldCacheRes]   Whether the response should be cached (defaults to always true).
 * @constructor
 */
var Memoizer = function(cache, keygen, shouldCacheReq, shouldCacheRes) {
	this.cache = cache;
    this.keyGenerator = keygen || requestKey;
    this.shouldCacheRequest = shouldCacheReq || function () { return true; };
    this.shouldCacheResponse = shouldCacheRes || function() { return true; };
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
    var shouldCacheReq = this.shouldCacheRequest;
    var shouldCacheRes = this.shouldCacheResponse;
	return function(req, res) {
        if (shouldCacheReq(req)) {
            var key = requestKey(req);
            if (theCache.has(key)) {
                var prevRes = theCache.get(key);
                if (shouldCacheRes(prevRes)) {
                    prevRes.replay(res);
                    return;
                }
            }
            var fakeRes = replayer.watch(res);
            theCache.set(key, fakeRes);
            fn(req, fakeRes);
        } else {
            fn(req, res);
        }
    };
};

function createMemoizer(cache) {
    return new Memoizer(cache);
}

module.exports = createMemoizer;