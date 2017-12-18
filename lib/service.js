'use strict';
process.env.TZ = 'utc';
const Promise = require("bluebird");
const mysql = require('promise-mysql');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
require('datejs');

// This class contains generic functions that are common to all implementations.
// This is a good place to put things like connection pools, common caches, initialization
// code, post-request clean-up code.
class Service {
    constructor() {
        this.cache = {'foo': {}};
        this.cacheTime = new Date().getTime();
        this.CACHE_TIMEOUT = 600000;
        this.secrets = undefined;
        this.pool = undefined;
        this.now = undefined;
    }

    setCacheTime(time) {
        this.cacheTime = time;
    }

    init(secrets) {
        this.secrets = secrets;
        return Promise.resolve(mysql.createPool({
            host: secrets.DB_HOST,
            user: secrets.DB_USER,
            password: secrets.DB_PASSWORD,
            database: secrets.DB_NAME,
            connectionLimit: 5,
            dateStrings: true}))
        .then(res => {
            this.pool = res;
        })
    }

    getOp(event) {
        if (event && event.constructor === Object &&
            event.hasOwnProperty('queryStringParameters') &&
            event.queryStringParameters.op) {
            return event.queryStringParameters.op;
        } else {
            return null;
        }
    }

    setMySQLPool(pool) {
        this.pool = pool;
    }

    setSecret(secrets) {
        this.secrets = secrets;
    }

    // A sample cache that is shared across all implementations
    populateFooCache() {        
        if (Object.keys(this.cache.foo).length === 0) {
            // Populate the cache
            return this.pool.query("select blargh,fargh from sometable")
                .then(rows => {
                    rows.forEach(row => {
                        this.cache.foo[row.blargh] = row.fargh;
                    });
                })
                .then (res => {
                    return true;                
                })    
        } else {
            // Cache hit.
            return Promise.resolve(true);
        }
    }

    checkCacheTimer() {
        this.now = new Date().getTime();
        if (this.now - this.cacheTime > this.CACHE_TIMEOUT) {
            // Clear the cache
            this.cacheTime = this.now;
            this.cache.foo = {};
        }
    }

    // Used only for tests. 
    setCache(items) {
        this.cache.foo = items.foo;
    }

    end() {
        // This is shutdown code that should be run on each request.
        if (this.pool && this.pool.end) {
            // Shut down the database pool
            return this.pool.end();
        } else {
            return Promise.resolve(true);
        }
    }
}
module.exports = Service;