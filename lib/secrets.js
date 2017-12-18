'use strict';
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

class Secrets {
    constructor(secretList) {
        this.secretList = secretList;
        Object.keys(secretList).forEach(secret => {
            this[secret] = secretList[secret];
        });
        this.secretsLoaded = false;
    }
    flattenParameters(params) {
        var flat = {};
        params.forEach(param => {
            flat[param.Name.replace(/^.+\/(.+)$/,"$1")] = param.Value;
        });
        return flat;
    }
    init() {
        // Don't load if already loaded OR we're running offline, but do load in unit tests (mocked)
        if ((!this.secretsLoaded && !process.env.IS_OFFLINE) || process.env.IS_TEST) {
            var ssm = new AWS.SSM();
            var secretNames = [];
            Object.keys(this.secretList).forEach(secret => {
                secretNames.push(process.env[secret]);
            });
            // There is a max of 10 items per SSM parameter request, so we chunk them up.
            var promises = [];
            while(secretNames.length > 10) {
                 var subSet = secretNames.splice(0,10);
                 promises.push(
                    ssm.getParameters( 
                        {Names: subSet,
                        WithDecryption: true})
                        .promise()
                 );
            }
            if (secretNames.length !== 0) {
                promises.push(
                    ssm.getParameters( 
                        {Names: secretNames,
                        WithDecryption: true})
                        .promise()
                 );
            }
            return Promise.all(promises)
            .then(secrets => {
                var settingsArray = [];
                secrets.forEach(secretSet => {
                    settingsArray.push.apply(settingsArray,secretSet.Parameters);
                });
                var settings = this.flattenParameters(settingsArray);
                Object.keys(settings).forEach(setting => {
                    this[setting] = settings[setting];
                });
                this.secretsLoaded = true;  
                return Promise.resolve(true); 
            });
        } else {
            return Promise.resolve(true);
        }
    }
  }
  
module.exports = Secrets;