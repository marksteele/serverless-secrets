'use strict';
process.env.TZ = 'utc';
const Promise = require("bluebird");
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const SampleService = require('./lib/sample_service.js');
const Secrets = require("./lib/secrets.js");

let sample = new SampleService();

let secrets = new Secrets({ 
    // These are FAKE. Only used in unit tests, when deployed these 
    // are replaced by values fetched from AWS SSM parameter store.
    'DB_USER': 'fake',
    'DB_PASSWORD': 'news',
    'DB_HOST': 'localhost',
    'DB_NAME': 'sample_service'
});

// Used only in unit tests.
/* istanbul ignore next */
module.exports.getSampleServiceObject = () => {
    return sample;
};

/* istanbul ignore next */
module.exports.handler = (event, context, callback) => {
    processEvent(event)
    .then(res => {
        callback(null,res);
    })
    .catch(err => {
        console.log("Unhandled error");
        console.log(err);
        callback(null,{statusCode: 200,body:'Error'});
    });
};

var processEvent = (event) => {
    // This is here in case you need to have logic for how your events get processed
    switch(sample.getOp(event)) {
        case "EventType1":
        case "EventType2":
            return processSampleEvent(event);
        default:
            // error
            return Promise.resolve({statusCode: 200,body:'ERROR: Invalid operation'});
    }
};
module.exports.processEvent = processEvent;


var processSampleEvent = (event) => {
    return secrets.init().then(res => {
        return sample.init(secrets);
    })
    .then(res => {
        // Setup caches, launch any async initializations we need
        return Promise.all([
            sample.populateBarCache(),
            sample.populateFooCache()
        ])
    })
    .then(res => {
        // Business logic here
        return {statusCode: 200, body: 'Hello world!'};
    })
    .then(res => {
        // Cleaning up 
        return sample.end().then(foo => {
            return res;
        });
    })
    .catch(err => {
        return sample.end().then(foo => {
            console.log(err);
            console.log("Returning error message");
            return Promise.resolve({statusCode: 500, body: err.message});    
        })
    });
};
module.exports.processSampleEvent = processSampleEvent;
