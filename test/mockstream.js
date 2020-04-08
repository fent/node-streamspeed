const PassThrough = require('stream').PassThrough;
const sinon       = require('sinon');

let clock;
before(() => { clock = sinon.useFakeTimers(); });
after(() => { clock.restore(); });


/**
 * Mock a readable/writable stream for testing.
 */
module.exports = class Mock extends PassThrough {
  /**
   * Runs the function run n times every interval.
   *
   * @param {number} length
   * @param {number} n
   * @param {number} interval
   * @param {boolean} end
   * @param {boolean} skipTick
   */
  interval(length, n, interval, end, skipTick) {
    const callback = this.end.bind(this);
    let i = 0;

    const iid = setInterval(() => {
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
