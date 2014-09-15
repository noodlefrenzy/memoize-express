memoize-express
===============

A memoization library that replays responses for [Expressjs](http://expressjs.com/) calls.  Uses [Replayer](https://github.com/noodlefrenzy/replayer), so is limited by the same caveats that apply for that package.

## Usage

Simply require the package, initialize your cache, and memoize whichever methods you want:

    function demonstrateMemoizeExpress() {
    	var cache = require('lru-cache')({ max: 1000, maxAge: 60*1000 });
		var memoizer = require('memoize-express')(cache);
		var toWatch = new MyObject();
		var watched = replayer.watch(toWatch);

		// Invoke some operations....
		var result1 = watched.myMethod(param1, param2);
		var result2 = watched.myMethod(param3, param4);

		// Then replay them on a new instance.
		var newInstance = new MyObject();
		var results = watched.replay(newInstance);

		// results should be [result1, result2];
    }

## Cache Dependence

The memoizer depends on a cache that supports the following methods:

* ```set('key', value)```
* ```get('key')```
* ```has('key')```

Conveniently, ```lru-cache``` supports this.  Other caches should be easy to modify or wrap to support this syntax as well.

## Installation

Installs via *npm*:

```
npm install memoize-express
```

## License

Apache v2, see LICENSE