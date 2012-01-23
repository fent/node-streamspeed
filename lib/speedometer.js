/**
 * Helps count the number of bytes per data event in streams
 * @param (number) per
 * @param (EventEmitter) ee
 * @param (Stream) stream
 * @param (function) callback Called every time there is a speed change.
 * @constructor
 */
var Speedometer = module.exports = function(per) {
  this.per = per || 1000;
  this.lasttime = null;
  this.total = 0;
  this.iteration = 0;
  this.speed = 0;
  this.avg = 0;
};


/**
 * Called when new data arrives.
 * @param (Buffer|string) data
 * @param (?string) encoding
 * @param (function) callback
 */
Speedometer.prototype.update = function(data, encoding, callback) {
  var now = Date.now();

  // check if this is the first data event
  if (this.lasttime === null) {
    this.lasttime = now;
    return;
  }

  // compare now to last time
  var length = Buffer.isBuffer(data)
    ? data.length : Buffer.byteLength(data, encoding);
  var bps = Math.round((length / (now - this.lasttime || 1)) *
                       this.per);
  this.lasttime = now;

  // get average speed
  this.total += bps
  var avg = Math.round(this.total / ++this.iteration);

  var change = this.speed !== bps || this.avg !== avg;
  this.speed = bps;
  this.avg = avg;

  // only emit event if there is a change in speed or avg
  if (change) callback(bps, avg);
};
