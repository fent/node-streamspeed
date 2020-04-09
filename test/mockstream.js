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
   * @param {number} amount
   * @param {number} interval
   * @param {Object} options
   *  {boolean} end
   *  {boolean} skipTick
   *  {number} amountPerInterval
   */
  interval(length, amount, interval, options = {}) {
    return new Promise((resolve) => {
      options.amountPerInterval = options.amountPerInterval || 1;
      let i = 0;

      const iid = setInterval(() => {
        let amountSoFar = 0;
        const write = () => {
          if (++amountSoFar < options.amountPerInterval) {
            this.write(Buffer.alloc(length), write);
          } else {
            this.write(Buffer.alloc(length));
            if (++i === amount) {
              clearInterval(iid);
              if (options.end) {
                process.nextTick(this.end.bind(this));
              }
              resolve();
            } else if (!options.skipTick) {
              process.nextTick(clock.tick.bind(clock, interval));
            }
          }
        };
        write();
      }, interval);
      if (!options.skipTick) {
        process.nextTick(clock.tick.bind(clock, interval));
      }
    });
  }
};
