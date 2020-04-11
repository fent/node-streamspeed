module.exports = class Speedometer {
  /**
   * Helps count the number of bytes per data event in streams.
   *
   * @constructor
   * @param {Object?} options
   * @param {number?} options.timeUnit
   * @param {number?} options.range
   */
  constructor(options) {
    this.options = options;
    this.history = [];
    this.speed = 0;
  }


  /**
   * Called when new data arrives.
   *
   * @param {Buffer|string} data
   * @param {Function} callback
   */
  update(data, callback) {
    const now = Date.now();

    if (this.history.length) {
      // Remove old data events.
      let index = this.history.findIndex(item => {
        return item.time > now - this.options.range;
      });
      this.history = index > -1 ? this.history.slice(index) : [];
    }

    this.history.push({ 
      speed: data.length,
      time: now,
    });

    // Get total data emitted in `range` time period.
    let totaldata = this.history.reduce((sum, point) => point.speed + sum, 0);

    let speed = Math.round(
      totaldata / this.options.range * this.options.timeUnit
    );

    const change = this.speed !== speed;
    this.speed = speed;

    // Only emit event if there is a change in speed.
    if (change) {
      callback(speed);
    }
  }
};
