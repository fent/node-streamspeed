var PassThrough = require('stream').PassThrough;
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
 * @param {Function|Boolean} callback
 */
Mock.prototype.interval = function(length, n, interval, callback) {
  callback = callback || this.end.bind(this);
  var self = this;
  var i = 0;

  var iid = setInterval(function() {
    mocknow(interval * ++i);
    self.write(new Buffer(length));
    if (i === n) {
      clearInterval(iid);
      process.nextTick(callback);
    }
  }, interval);
};
