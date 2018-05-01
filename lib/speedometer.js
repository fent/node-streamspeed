module.exports = class Speedometer {
  /**
   * Helps count the number of bytes per data event in streams.
   *
   * @param {Number} per
   * @constructor
   */
  constructor(per) {
    this.per = per;
    this.lasttime = null;
    this.total = 0;
    this.iteration = 0;
    this.speed = 0;
    this.avg = 0;
  }


  /**
   * Called when new data arrives.
   *
   * @param {Buffer|String} data
   * @param {Function} callback
   */
  update(data, callback) {
    var now = Date.now();

    // Check if this is the first data event.
    if (this.lasttime === null) {
      this.lasttime = now;
      return;
    }

    // Compare now to last time.
    var speed = Math.round((data.length / (now - this.lasttime)) *
                         this.per);
    this.lasttime = now;

    // Get average speed.
    this.total += speed;
    var avg = Math.round(this.total / ++this.iteration);

    var change = this.speed !== speed || this.avg !== avg;
    this.speed = speed;
    this.avg = avg;

    // Only emit event if there is a change in speed or avg.
    if (change) {
      callback(speed, avg);
    }
  }
};
