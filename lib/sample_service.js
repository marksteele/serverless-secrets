'use strict';
process.env.TZ = 'utc';
const Service = require('./service.js');
require('datejs');

class SampleService extends Service {
    constructor() {
        super(); // Call parent constructor
        // Implementation specific constructor code goes here
        this.cache.bar = {};
    }

    init(secrets) {
        return super.init(secrets) // First call parent init
        .then(res => {
            // Do implementation specific stuff here
            return Promise.resolve(true);
        });
    }

    // Implementation specific functions go here. This is where the non-common code lives.
    checkCacheTimer() {
        var oldCacheTime = this.cacheTime;
        super.checkCacheTimer(); // First call service level cache clearning
        // Then do implementation specific cache clean-up
        if (this.now - oldCacheTime > this.CACHE_TIMEOUT) {
            // Clear the cache
            this.cache.bar = {};
        }
    }

    populateBarCache() {        
        if (Object.keys(this.cache.bar).length === 0) {
            // Nothing in cache, populate it.
            return this.pool.query("select bar,baz from someothertable")
                .then(rows => {
                    rows.forEach(row => {
                        this.cache.bar[row.foo] = row.baz;
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

}
module.exports = SampleService;

