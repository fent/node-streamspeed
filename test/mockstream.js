var Stream  = require('stream').Stream
  , util    = require('util')
  , mocknow = require('./mocknow')


/**
 * Mock a readable/writable stream for testing
 * @constructor
 * @extends (Stream)
 */
var Mock = module.exports = function() {
  Stream.call(this);
  this.readable = true;
  this.writable = true;
};

util.inherits(Mock, Stream);


/**
 * Filler function
 */
Mock.prototype.write = function() {};


/**
 * Runs the function run n times every interval.
 * Calls callback when finished calling it n times.
 * @param (number) n
 * @param (number) interval
 * @param (function) run
 * @param (function) callback
 */
Mock.prototype.interval = function(n, interval, run, callback) {
  var self = this;
  var i = 0;

  var iid = setInterval(function() {
    mocknow(interval * ++i);
    run();
    if (i === n) {
      clearInterval(iid);
      if (typeof callback === 'function') callback();
    }
  }, interval);
};


/**
 * Emits fixed length `data` events n times in an interval
 * @param (number) n
 * @param (number) times
 * @param (number) interval
 * @param (function) callback
 */
Mock.prototype.emitInterval = function(length, n, interval, callback) {
  var self = this;
  this.interval(n, interval, function() {
    self.emit('data', new Buffer(length));
  }, callback);
};


/**
 * Writes length `data` n times in an interval
 * @param (number) n
 * @param (number) times
 * @param (number) interval
 * @param (function) callback
 */
Mock.prototype.writeInterval = function(length, n, interval, callback) {
  var self = this;
  this.interval(n, interval, function() {
    self.write(new Buffer(length));
  }, callback);
};
