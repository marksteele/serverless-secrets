process.env.TZ = 'utc';
const AWS = require('aws-sdk-mock');
const sinon = require('sinon');
const Promise = require("bluebird");
const Secrets = require("../lib/secrets.js");
const Service = require("../lib/service.js");
const mysql = require('promise-mysql');
const SampleService = require('../lib/sample_service.js');
const sample = require('../sample.js');
require('datejs');

describe('Invalid operation', () => {
    it('should return error message', () => {
        sample.handler({ "queryStringParameters": { "op": "bar" } }, {}, function (err, res) {
            sinon.assert.match(res, { statusCode: 200, body: 'ERROR: Invalid operation' });
        });
    });
});

describe('Test populateBarCache', () => {
    it('should populate the cache', () => {
        var queryStub = sinon.stub().resolves([{'foo': 'buz','baz':'flurb'}]);
        var stubMySQL = sinon
            .stub(mysql, 'createPool')
            .returns({ 'query': queryStub, 'end': sinon.stub().resolves() });

        var ss = new SampleService();
        ss.setMySQLPool(mysql.createPool({host: 'foo',user: 'bar',password: 'baz',database: 'buz',connectionLimit: 5,dateStrings: true}));
        return ss.populateBarCache()
        .then(res => {
            sinon.assert.match(stubMySQL.callCount, 1);
            sinon.assert.match(queryStub.callCount, 1);
            sinon.assert.match(queryStub.getCalls()[0].args[0], 'select bar,baz from someothertable');
            sinon.assert.match(res, true);
            sinon.assert.match(ss.cache.bar, {
                'buz': 'flurb'
            });
            ss.cacheTime = 0;
            ss.checkCacheTimer();
            sinon.assert.match({}, ss.cache.bar);
            stubMySQL.restore();
        });
    });
});

describe('Test populateBarCache twice', () => {
    it('should populate the cache only once', () => {
        var queryStub = sinon.stub().resolves([{'foo': 'buz','baz':'flurb'}]);        
        var stubMySQL = sinon
            .stub(mysql, 'createPool')
            .returns({ 'query': queryStub, 'end': sinon.stub().resolves() });
        var ss = new SampleService();
        ss.setMySQLPool(mysql.createPool({host: 'foo',user: 'bar',password: 'baz',database: 'buz',connectionLimit: 5,dateStrings: true}));
        return ss.populateBarCache()
        .then(res => {
            return ss.populateBarCache(); // Shouldn't have done any db calls
        })
        .then(res => {
            sinon.assert.match(stubMySQL.callCount, 1);
            sinon.assert.match(queryStub.callCount, 1);
            sinon.assert.match(queryStub.getCalls()[0].args[0], 'select bar,baz from someothertable');
            sinon.assert.match(res, true);
            sinon.assert.match(ss.cache.bar, {
                'buz': 'flurb'
            });
            ss.setCacheTime(new Date().getTime() - 10000000);
            ss.checkCacheTimer(); // Should clear cache
            sinon.assert.match({}, ss.cache.foo);
            sinon.assert.match({}, ss.cache.bar);
            sinon.assert.match(true, ss.cacheTime !== 0); // Clearing cache updates timer
            stubMySQL.restore();
        });
    });
});


describe('Null event', () => {
    it('should return error message', () => {
        sample.handler(null, {}, function (err, res) {
            sinon.assert.match(res, { body: "ERROR: Invalid operation", statusCode: 200 });
        });
    });
});


describe('processSampleEvent', () => {
    it('should work', () => {
        var secretsInitMock = sinon.stub(Secrets.prototype,'init').resolves(true);
        var serviceInitMock = sinon.stub(SampleService.prototype,'init').resolves(true);
        var servicePopulateBarCacheMock = sinon.stub(SampleService.prototype,'populateBarCache').resolves(true);
        var servicePopulateFooCache = sinon.stub(SampleService.prototype,'populateFooCache').resolves(true);
        return sample.processSampleEvent('foo').then(res => {
            sinon.assert.match(res,{ body: "Hello world!", statusCode: 200 });
            sinon.assert.match(secretsInitMock.callCount,1);
            sinon.assert.match(serviceInitMock.callCount,1);
            sinon.assert.match(servicePopulateBarCacheMock.callCount,1);
            sinon.assert.match(servicePopulateFooCache.callCount,1);
            secretsInitMock.restore();
            serviceInitMock.restore();
            servicePopulateBarCacheMock.restore();
            servicePopulateFooCache.restore();
        });
    });
});


