var util         = require('util');
var EventEmitter = require('events').EventEmitter;
var Speedometer  = require('./speedometer');


/**
 * Emits speed for a group of streams.
 *
 * @constructor
 * @extends {EventEmitter}
 * @param {Number} per The time unit speed will be measured in.
 */
var StreamSpeed = module.exports = function(per) {
  this.per = per || 1000;
  this._streams = [];
  this.speed = 0;
  this.avg = 0;
};

util.inherits(StreamSpeed, EventEmitter);


/**
 * Updates the group with the latest change in speed.
 *
 * @param {Object} meta
 * @param {Number} speed
 * @param {Number} avg
 */
StreamSpeed.prototype._update = function(meta, speed, avg) {
  console.log('_update');
  meta.speed = speed;
  meta.avg = avg;

  this._streams.forEach(function(m) {
    // Skip own stream, streams that haven't started,
    // and streams that are paused.
    if (m === meta || m.speed === 0 || m.stream.paused) {
      return;
    }

    // Add other streams' speeds to total.
    speed += m.speed;
    avg += m.avg;
  });

  var change = this.speed !== speed || this.avg !== avg;
  if (change) {
    this.speed = speed;
    this.avg = avg;
    this.emit('speed', speed, avg);
  }
};


/**
 * Convenient method that returns list of streams in this group.
 *
 * @return {Array.<Readable>}
 */
StreamSpeed.prototype.getStreams = function() {
  return this._streams.map(function(m) { return m.stream; });
};


/**
 * Add stream to group.
 *
 * @param {Stream} stream
 */
StreamSpeed.prototype.add = function(stream) {
  // Check if stream is already in group.
  if (this._streams.some(function(m) { return m.stream === stream; })) {
    throw Error('Stream already in group');
  }

  var meta = {
    stream: stream,
    speed: 0,
    avg: 0,
    onData: onData,
    cleanup: cleanup
  };
  this._streams.push(meta);
  var self = this;
  var reader = new Speedometer(this.per);
  var onUpdate = self._update.bind(self, meta);
  
  function onData(data, encoding) {
    reader.update(data, encoding, onUpdate);
  }

  function cleanup() {
    stream.removeListener('data', onData);
    stream.removeListener('end', cleanup);
    stream.removeListener('error', cleanup);
    self._streams.splice(self._streams.indexOf(meta), 1);
  }

  stream.on('data', onData);
  stream.on('end', cleanup);
  stream.on('error', cleanup);
};


/**
 * Remove stream from group.
 *
 * @param {Readable} stream
 */
StreamSpeed.prototype.remove = function(stream) {
  // Check if stream is in group.
  var meta;
  if (!this._streams.some(function(m) {
      meta = m;
      return m.stream === stream;
    })) {
    throw Error('Stream has not been added');
  }

  meta.cleanup();
};


/**
 * Converts bytes to human readable unit.
 * Thank you Amir from StackOverflow.
 *
 * @param {Number} bytes
 * @return {String}
 */
var units = ' KMGTPEZYXWVU';
StreamSpeed.toHuman = function(bytes, timeUnit) {
  if (bytes <= 0) { return 0; }
  timeUnit = timeUnit ? '/' + timeUnit : '';
  var t2 = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 12);
  return (Math.round(bytes * 100 / Math.pow(1024, t2)) / 100) +
          units.charAt(t2).replace(' ', '') + 'B' + timeUnit;
};
