var should = require('should');
var express = require('express');
var http = require('http');
var request = require('request');

describe('Memoizer', function() {
    var server;
    var app;
    var port = 4321;

    beforeEach(function (done) {
        app = express();
        server = http.createServer(app);
        server.listen.apply(server, [port, 
            function(err, result) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            }]);
    });

    afterEach(function (done) {
        server.close();
        app = null;
        server = null;
        done();
    });

    it('should memoize calls', function(done) {
        var cache = require('lru-cache')({ max: 10000, maxAge: 1000*60 });
        var memoizer = require('../memoizer.js')(cache);
        var callCount = 0;
        app.get('/hello', memoizer.memoize(function (req, res) {
            callCount += 1;
            res.status(200).send('Hello '+callCount);
        }));
        request('http://localhost:'+port+'/hello', function (error, response, body) {
            response.statusCode.should.eql(200);
            body.should.eql('Hello 1');
            request('http://localhost:'+port+'/hello', function (error, response, body) {
                response.statusCode.should.eql(200);
                body.should.eql('Hello 1');
                done();
            });
        });
    });

    it('should be a cache miss for different verbs', function(done) {
        var cache = require('lru-cache')({ max: 10000, maxAge: 1000*60 });
        var memoizer = require('../memoizer.js')(cache);
        var callCount = 0;
        app.get('/hello', memoizer.memoize(function (req, res) {
            callCount += 1;
            res.status(200).send('Hello '+callCount);
        }));
        app.post('/hello', memoizer.memoize(function (req, res) {
            callCount += 1;
            res.status(200).send('Hello '+callCount);
        }));
        request('http://localhost:'+port+'/hello', function (error, response, body) {
            response.statusCode.should.eql(200);
            body.should.eql('Hello 1');
            request.post('http://localhost:'+port+'/hello', function (error, response, body) {
                response.statusCode.should.eql(200);
                body.should.eql('Hello 2');
                done();
            });
        });
    });

    it('should not cache if request predicate rejects it', function(done) {
        var cache = require('lru-cache')({ max: 10000, maxAge: 1000*60 });
        var memoizer = require('../memoizer.js')(cache, null, function(req) { return false; });
        var callCount = 0;
        app.get('/hello', memoizer.memoize(function (req, res) {
            callCount += 1;
            res.status(200).send('Hello '+callCount);
        }));
        app.post('/hello', memoizer.memoize(function (req, res) {
            callCount += 1;
            res.status(200).send('Hello '+callCount);
        }));
        request('http://localhost:'+port+'/hello', function (error, response, body) {
            response.statusCode.should.eql(200);
            body.should.eql('Hello 1');
            request.post('http://localhost:'+port+'/hello', function (error, response, body) {
                response.statusCode.should.eql(200);
                body.should.eql('Hello 2');
                done();
            });
        });
    });

    it('should not cache if response predicate rejects it', function(done) {
        var cache = require('lru-cache')({ max: 10000, maxAge: 1000*60 });
        var memoizer = require('../memoizer.js')(cache, null, null, function(res) { return false; });
        var callCount = 0;
        app.get('/hello', memoizer.memoize(function (req, res) {
            callCount += 1;
            res.status(200).send('Hello '+callCount);
        }));
        app.post('/hello', memoizer.memoize(function (req, res) {
            callCount += 1;
            res.status(200).send('Hello '+callCount);
        }));
        request('http://localhost:'+port+'/hello', function (error, response, body) {
            response.statusCode.should.eql(200);
            body.should.eql('Hello 1');
            request.post('http://localhost:'+port+'/hello', function (error, response, body) {
                response.statusCode.should.eql(200);
                body.should.eql('Hello 2');
                done();
            });
        });
    });
});