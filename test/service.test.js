process.env.TZ = 'utc';
const AWS = require('aws-sdk-mock');
const sinon = require('sinon');
const Promise = require("bluebird");
const Secrets = require("../lib/secrets.js");
const mysql = require('promise-mysql');
const Service = require('../lib/service.js');
require('datejs');

describe('Test getOp', () => {
    it('should return the operation', () => {
        var service = new Service();
        sinon.assert.match(service.getOp({ "queryStringParameters": { "op": "bar" } }), "bar");
        sinon.assert.match(service.getOp({}), null);
    });
});


describe('Test populateFooCache', () => {
    it('should populate the cache', () => {
        var queryStub = sinon.stub().resolves([{'blargh':'foo','fargh': 'buz'}]);
        var stubMySQL = sinon
            .stub(mysql, 'createPool')
            .resolves({ 'query': queryStub, 'end': sinon.stub().resolves() });
        var secretsMock = sinon.stub(Secrets.prototype, 'init').resolves(true);
        var service = new Service();
        var secrets = new Secrets({
            'DB_USER': 'root',
            'DB_PASSWORD': 'pass',
            'DB_HOST': 'localhost',
            'DB_NAME': 'service'
        });
        return secrets.init().then(res => {
            return service.init(secrets);
        })
            .then(res => {
                return service.populateFooCache();
            })
            .then(res => {
                sinon.assert.match(secretsMock.callCount, 1);
                sinon.assert.match(stubMySQL.callCount, 1);
                sinon.assert.match(queryStub.callCount, 1);
                sinon.assert.match(queryStub.getCalls()[0].args[0], 'select blargh,fargh from sometable');
                sinon.assert.match(res, true);
                sinon.assert.match(service.cache.foo, {"foo": 'buz'});
                stubMySQL.restore();
                secretsMock.restore();
            });
    });
});

describe('Test checkCacheTimer', () => {
    it('should clear the cache', () => {
        var queryStub = sinon.stub().resolves([{'blargh':'foo','fargh': 'buz'}]);
        var stubMySQL = sinon
            .stub(mysql, 'createPool')
            .resolves({ 'query': queryStub, 'end': sinon.stub().resolves() });
        var secretsMock = sinon.stub(Secrets.prototype, 'init').resolves(true);
        var service = new Service();
        var secrets = new Secrets({
            'DB_USER': 'root',
            'DB_PASSWORD': 'pass',
            'DB_HOST': 'localhost',
            'DB_NAME': 'service'
        });
        return secrets.init().then(res => {
            return service.init(secrets);
        })
            .then(res => {
                return service.populateFooCache(); // popluates the cache
            })
            .then(res => {
                sinon.assert.match(secretsMock.callCount, 1);
                sinon.assert.match(stubMySQL.callCount, 1);
                sinon.assert.match(queryStub.callCount, 1);
                sinon.assert.match(queryStub.getCalls()[0].args[0], 'select blargh,fargh from sometable');
                sinon.assert.match(res, true);
                sinon.assert.match(service.cache.foo, {"foo": 'buz'});
                service.cacheTime = 0;
                service.checkCacheTimer();
                sinon.assert.match({}, service.cache.foo);
                stubMySQL.restore();
                secretsMock.restore();
            });
    });
});