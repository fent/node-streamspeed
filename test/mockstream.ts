import { PassThrough } from 'stream';
import sinon from 'sinon';

let clock: sinon.SinonFakeTimers;
beforeEach(() => { clock = sinon.useFakeTimers(); });
afterEach(() => { clock.restore(); });

interface IntervalOptions {
  end?: boolean;
  skipTick?: boolean;
  amountPerInterval?: number;
}


/**
 * Mock a readable/writable stream for testing.
 */
export default class Mock extends PassThrough {
  /**
   * Runs the function run n times every interval.
   *
   * @param {number} length
   * @param {number} amount
   * @param {number} interval
   * @param {Object} options
   * @param {boolean} options.end
   * @param {boolean} options.skipTick
   * @param {number} options.amountPerInterval
   */
  interval(length: number, amount: number, interval: number, options: IntervalOptions = {}) {
    return new Promise((resolve) => {
      options.amountPerInterval = options.amountPerInterval || 1;
      let i = 0;

      const iid = setInterval(async () => {
        for (let soFar = 0; soFar < options.amountPerInterval; soFar++) {
          await this.writeSize(length);
        }
        if (++i === amount) {
          clearInterval(iid);
          if (options.end) {
            process.nextTick(this.end.bind(this));
          }
          resolve();
        } else if (!options.skipTick) {
          process.nextTick(clock.tick.bind(clock, interval));
        }
      }, interval);
      if (!options.skipTick) {
        if (interval) {
          process.nextTick(clock.tick.bind(clock, interval));
        } else {
          process.nextTick(clock.next);
        }
      }
    });
  }

  /**
   * An async function that writes arbitrary data to the stream.
   *
   * @param {number} length
   */
  writeSize(length: number) {
    return new Promise((resolve) => {
      this.write(Buffer.alloc(length), resolve);
    });
  }

  static get clock() {
    return clock;
  }
}
