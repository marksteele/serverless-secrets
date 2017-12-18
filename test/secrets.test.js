const AWS = require('aws-sdk-mock');
const sinon = require('sinon');
const Promise = require("bluebird");
const Secrets = require("../lib/secrets.js");

describe('Flattens parameters', () => {
    it('should return a flattened list of parameters, stripping leading paths.', () => {
      var secrets = new Secrets({
        'DB_USER': 'root',
        'DB_PASSWORD': 'pass',
        'DB_HOST': 'localhost',
        'DB_NAME': 'service'
    });
      var fixtures = [{'Name': '/Foo/Bar/baz','Value': 'buz'},{'Name': '/far/ble','Value':'boo'}];
        sinon.assert.match(secrets.flattenParameters(fixtures),{'ble':'boo','baz':'buz'});
    });
  });
  
describe('Check SSM parameters', () => {
    it('should call SSM with correct parameters', () => {
      var ssmmock = AWS.mock('SSM', 'getParameters', function (params, callback){
        callback(null, {
          "InvalidParameters": [], 
          "Parameters": [
            {"Type": "SecureString", 
              "Name": "/foo/DB_USER", 
              "Value": "foobar"},
            {"Type": "SecureString", 
              "Name": "/foo/DB_PASSWORD", 
              "Value": "foobar"},
            {"Type": "SecureString", 
              "Name": "/foo/DB_HOST", 
              "Value": "foobar"},
            {"Type": "SecureString", 
              "Name": "/foo/DB_NAME", 
              "Value": "foobar"}
          ]
        });
      });
      var secrets = new Secrets({
        'DB_USER': 'root',
        'DB_PASSWORD': 'pass',
        'DB_HOST': 'localhost',
        'DB_NAME': 'services'
    });
    secrets.init();
    sinon.assert.match(ssmmock.stub.callCount,1);
    // Names will be undefined since these are set via env vars...
    sinon.assert.match(ssmmock.stub.getCalls()[0].args[0],{ Names: 
      [
        undefined, 
        undefined, 
        undefined, 
        undefined ],
            WithDecryption: true } );
        AWS.restore();     
    });
  });