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
   */
  interval(length, n, interval) {
    var callback = this.end.bind(this);
    var i = 0;

    var iid = setInterval(() => {
      this.write(new Buffer(length));
      if (++i === n) {
        clearInterval(iid);
        process.nextTick(callback);
      } else {
        clock.tick(interval);
      }
    }, interval);
    clock.tick(interval);
  }
};
