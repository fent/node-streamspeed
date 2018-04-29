'use strict';

const PassThrough = require('stream').PassThrough;
const sinon       = require('sinon');

var clock;
before(() => { clock = sinon.useFakeTimers(); });
after(() => { clock.restore(); });


module.exports = class Mock extends PassThrough {
  /**
   * Mock a readable/writable stream for testing.
   *
   * @constructor
   * @extends {PassThrough}
   */
  constructor() {
    super();
  }


  /**
   * Runs the function run n times every interval.
   *
   * @param {Number} length
   * @param {Number} n
   * @param {Number} interval
   * @param {Boolean} end
   * @param {Boolean} skipTick
   */
  interval(length, n, interval, end, skipTick) {
    var callback = this.end.bind(this);
    var i = 0;

    var iid = setInterval(() => {
      this.write(Buffer.alloc(length));
      if (++i === n) {
        clearInterval(iid);
        if (end) {
          process.nextTick(callback);
        }
      } else if (!skipTick) {
        process.nextTick(clock.tick.bind(clock, interval));
      }
    }, interval);
    if (!skipTick) {
      process.nextTick(clock.tick.bind(clock, interval));
    }
  }
};
