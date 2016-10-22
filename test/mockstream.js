var PassThrough = require('stream').PassThrough;
var util        = require('util');
var sinon       = require('sinon');

var clock;
before(function() { clock = sinon.useFakeTimers(); });
after(function() { clock.restore(); });


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
 *
 * @param {Number} length
 * @param {Number} n
 * @param {Number} interval
 */
Mock.prototype.interval = function(length, n, interval) {
  var callback = this.end.bind(this);
  var self = this;
  var i = 0;

  var iid = setInterval(function() {
    self.write(new Buffer(length));
    if (++i === n) {
      clearInterval(iid);
      process.nextTick(callback);
    } else {
      clock.tick(interval);
    }
  }, interval);
  clock.tick(interval);
};
