var util         = require('util');
var EventEmitter = require('events').EventEmitter;
var Speedometer  = require('./speedometer');


/**
 * Converts bytes to human readable unit.
 * Thank you Amir from StackOverflow.
 *
 * @param {Number} bytes
 * @return {String}
 */
var units = ' KMGTPEZYXWVU';
exports.toHuman = function(bytes, timeUnit) {
  if (bytes <= 0) { return 0; }
  timeUnit = timeUnit ? '/' + timeUnit : '';
  var t2 = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 12);
  return (Math.round(bytes * 100 / Math.pow(1024, t2)) / 100) +
          units.charAt(t2).replace(' ', '') + 'B' + timeUnit;
};


/**
 * Creates function to be used when stream emits `data` events
 *
 * @param {Speedometer} speedometer
 * @param {EventEmitter} ee
 * @return {Function(data)}
 */
function createOnData(speedometer, stream, callback) {
  callback = callback || individual(stream, 'readspeed');

  var fn = function(data, encoding) {
    speedometer.update(data, encoding, callback);
  };

  stream.on('data', fn);
  return fn;
}


/**
 * Creates function to be used to replace stream's `write()`
 *
 * @param {Speedometer} speedometer
 * @param {EventEmitter} ee
 * @return {Function(data, encoding)}
 */
function createOnWrite(speedometer, stream, oldWrite, callback) {
  callback = callback || individual(stream, 'writespeed');

  return stream.write = function(data, encoding) {
    speedometer.update(data, encoding, callback);
    oldWrite.apply(stream, Array.prototype.slice.call(arguments));
  };
}


/**
 * Used to measure speed of individual streams. Not groups.
 *
 * @param {Stream} stream
 * @param {String} event
 */
function individual(stream, event) {
  return function(speed, avg) {
    stream.emit(event, speed, avg);
  };
}


/**
 * Watch a stream and report the speed when it emits any `data`.
 *
 * @param {Stream} stream
 * @param {!Number} per A unit of time, defaults to 1000 which is 1 second.
 */
exports.watch = function(stream, per) {
  if (stream._streamspeed) return;
  var ss = stream._streamspeed = {};

  if (stream.readable) {
    ss.onData = createOnData(new Speedometer(per), stream);
  }

  if (stream.writable) {
    ss.oldWrite = stream.write;
    createOnWrite(new Speedometer(per), stream, stream.write);
  }

  function cleanup() {
    stream.removeListener('end', cleanup);
    stream.removeListener('error', cleanup);
    unwatch(stream);
  }
  stream.on('end', cleanup);
  stream.on('error', cleanup);
};


/**
 * Stops watching a stream for `data` events and stops emitting
 * `readspeed` and `writespeed` events.
 *
 * @param {Stream} stream
 */
var unwatch = exports.unwatch = function(stream) {
  var ss = stream._streamspeed;
  if (!ss) return;

  // Remove data listener.
  if (ss.onData) {
    stream.removeListener('data', ss.onData);
  }

  // Restore write function.
  if (ss.oldWrite) {
    stream.write = ss.oldWrite;
  }

  delete stream._streamspeed;
};


/**
 * Emits speed for a group of streams.
 *
 * @constructor
 * @extends {EventEmitter}
 */
var Group = exports.Group = function() {
  this._streams = [];
  this.speed = 0;
  this.avg = 0;
};

util.inherits(Group, EventEmitter);


/**
 * Updates the group with the latest change in speed.
 *
 * @param {Number} speed
 * @param {Number} avg
 * @param {Object} meta
 * @param {Number} i
 * @param {String} type
 */
Group.prototype._update = function(speed, avg, meta, type) {
  meta[type].speed = speed;
  meta[type].avg = avg;

  this._streams.forEach(function(m) {
    // Skip own stream, streams that haven't started,
    // and streams that are paused.
    var mtype = m[type];
    if (m === meta || !mtype || mtype.speed === 0 || m.stream.paused) {
      return;
    }

    // Add other streams' speeds to total.
    speed += mtype.speed;
    avg += mtype.avg;
  });

  var change = this.speed !== speed || this.avg !== avg;
  this.speed = speed;
  this.avg = avg;
  if (change) this.emit(type + 'speed', speed, avg);
};


/**
 * Convenient method that returns list of streams in this group.
 *
 * @return {Array.<Stream>}
 */
Group.prototype.getStreams = function() {
  return this._streams.map(function(m) { return m.stream; });
};


/**
 * Add stream to group.
 *
 * @param {Stream} stream
 */
Group.prototype.watch = function(stream) {
  // Check if stream is already in group.
  if (this._streams.some(function(m) { return m.stream === stream; })) {
    return;
  }

  var meta = { stream: stream };
  this._streams.push(meta);
  var self = this;

  if (stream.readable) {
    var reader = new Speedometer(this.per);
    meta.read = { speed: 0, avg: 0 };
    meta.onData = createOnData(reader, stream, function(a, b) {
      self._update(a, b, meta, 'read');
    });
  }

  if (stream.writable) {
    var writer = new Speedometer(this.per);
    meta.write = { speed: 0, avg: 0 };
    meta.oldWrite = stream.write;
    createOnWrite(writer, stream, stream.write, function(a, b) {
      self._update(a, b, meta, 'write');
    });
  }

  function cleanup() {
    stream.removeListener('end', cleanup);
    stream.removeListener('error', cleanup);
    self.unwatch(stream);
  }

  stream.on('end', cleanup);
  stream.on('error', cleanup);
};


/**
 * Remove stream from group.
 *
 * @param {Stream} stream
 */
Group.prototype.unwatch = function(stream) {
  // Check if stream is in group.
  var meta, i;
  if (!this._streams.some(function(m, k) {
      meta = m;
      i = k;
      return m.stream === stream;
    })) {
    return;
  }

  // Remove data listener.
  if (meta.onData) {
    stream.removeListener('data', meta.onData);
  }

  // Restore write function.
  if (meta.oldWrite) {
    stream.write = meta.oldWrite;
  }

  this._streams.splice(i, 1);
};
