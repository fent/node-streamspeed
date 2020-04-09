module.exports = class Speedometer {
  /**
   * Helps count the number of bytes per data event in streams.
   *
   * @constructor
   * @param {number} per
   */
  constructor(per) {
    this.per = per;
    this.starttime = null;
    this.history = [];
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
    if (!this.starttime) {
      this.starttime = now;
      return;
    }

    let lastpoint = this.history[this.history.length - 1];
    let currpoint;

    if (now === this.starttime) {
      // Do nothing on the rare occassion we get all the data at the start.
      // We need two time points to measure speed.
      return;

    } else if (lastpoint && now === lastpoint.time) {
      // If more data is read on the same ms, aggregate it.
      let lastlastpoint = this.history[this.history.length - 2];
      if (!lastlastpoint) { return; }
      currpoint = lastpoint;
      currpoint.speed += data.length / (now - lastlastpoint.time);

    } else {
      // Compare now to last time.
      let lasttime = lastpoint ? lastpoint.time : this.starttime;
      this.history.push(currpoint = { 
        speed: data.length / (now - lasttime),
        time: now,
      });
    }

    let speed = Math.round(currpoint.speed * this.per);

    // Get average speed.
    let total = this.history.reduce((sum, point) => point.speed + sum, 0);
    const avg = Math.round((total * this.per) / this.history.length);

    const change = this.speed !== speed || this.avg !== avg;
    this.speed = speed;
    this.avg = avg;

    // Only emit event if there is a change in speed or avg.
    if (change) {
      callback(speed, avg);
    }
  }
};
