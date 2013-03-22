var PassThrough = require('readable-stream').PassThrough;
var util        = require('util');
var mocknow     = require('./mocknow');


/**
 * Mock a readable/writable stream for testing.
 *
 * @constructor
 * @extends {PassThrough}
 */
var Mock = module.exports = function() {
  PassThrough.call(this);
};

util.inherits(Mock, PassThrough);


/**
 * Runs the function run n times every interval.
 * Calls callback when finished calling it n times.
 *
 * @param {Number} length
 * @param {Number} n
 * @param {Number} interval
 * @param {Function} callback
 */
Mock.prototype.interval = function(length, n, interval, callback) {
  var self = this;
  var i = 0;

  var iid = setInterval(function() {
    mocknow(interval * ++i);
    self.write(new Buffer(length));
    if (i === n) {
      clearInterval(iid);
      if (typeof callback === 'function') process.nextTick(callback);
    }
  }, interval);
};
