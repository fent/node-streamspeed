module.exports = class Speedometer {
  /**
   * Helps count the number of bytes per data event in streams.
   *
   * @constructor
   * @param {number} per
   */
  constructor(per) {
    this.per = per;
    this.lasttime = null;
    this.lastsize = 0;
    this.lastlasttime = Date.now();
    this.total = 0;
    this.iteration = 0;
    this.speed = 0;
    this.avg = 0;
  }


  /**
   * Called when new data arrives.
   *
   * @param {Buffer|string} data
   * @param {Function} callback
   */
  update(data, callback) {
    const now = Date.now();

    // Check if this is the first data event.
    if (this.lasttime === null) {
      this.lasttime = now;
      return;
    }

    let speed;
    if (now === this.lasttime) {
      // If more data is read on the same ms, aggregate it.
      this.lastsize += data.length;
      speed = this.lastsize / (now - this.lastlasttime);

    } else {
      // Compare now to last time.
      speed = data.length / (now - this.lasttime);
      this.lastsize = data.length;
      this.lastlasttime = this.lasttime;
      this.lasttime = now;
    }
    speed = Math.round(speed * this.per);

    // Get average speed.
    this.total += speed;
    const avg = Math.round(this.total / ++this.iteration);

    const change = this.speed !== speed || this.avg !== avg;
    this.speed = speed;
    this.avg = avg;

    // Only emit event if there is a change in speed or avg.
    if (change) {
      callback(speed, avg);
    }
  }
};
