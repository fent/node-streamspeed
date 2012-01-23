var util         = require('util')
  , EventEmitter = require('events').EventEmitter

/**
 * Converts bytes to human readable unit.
 * Thank you Amir from StackOverflow.
 * @param (number) bytes
 * @return (string)
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
 * Helps count the number of bytes per data event in streams
 * @param (number) per
 * @constructor
 */
function Counter(per) {
  this.per = per || 1000;
  this.lasttime = null;
  this.total = 0;
  this.iteration = 0;
  this.speed = 0;
  this.avg = 0;
};


/**
 * Handles data from emitted `data` events and `write()` calls
 */
Counter.prototype.update = function(data, encoding, ee, event) {
  var now = Date.now();
  console.log('now:', now);

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
  if (change) ee.emit(event, bps, avg);
};


/**
 * Creates function to be used when stream emits `data` events
 * @param (Counter) counter
 * @param (EventEmitter) ee
 * @return (function(data))
 */
function createOnData(counter, ee, stream) {
  var fn = function(data, encoding) {
    counter.update(data, encoding, ee, 'readspeed');
  };

  stream.on('data', fn);
  return fn;
}


/**
 * Creates function to be used to replace stream's `write()`
 * @param (Counter) counter
 * @param (EventEmitter) ee
 * @return (function(data, encoding))
 */
function createOnWrite(counter, ee, stream, oldWrite) {
  return stream.write = function(data, encoding) {
    counter.update(data, encoding, ee, 'writespeed');
    oldWrite.apply(stream, Array.prototype.slice.call(arguments));
  };
}


/**
 * watch a stream and report the speed when it emits any `data`
 * @param (Stream) stream
 * @param (?number) per A unit of time, defaults to 1000 which is 1 second.
 * @param (?Counter) r Possible reader can be given.
 * @param (?Counter) w Possible writer can be given.
 */
var watch = exports.watch = function(stream, per) {
  if (stream._streamspeed) return;
  var ss = stream._streamspeed = {};

  if (stream.readable) {
    ss.onData = createOnData(new Counter(per), stream, stream);
  }

  if (stream.writable) {
    ss.oldWrite = stream.write;
    createOnWrite(new Counter(per), stream, stream, stream.write);
  }
};


/**
 * Stops watching a stream for `data` events and stops emitting
 *   `readspeed` and `writespeed` events
 * @param (Stream) stream
 */
var unwatch = exports.unwatch = function(stream) {
  var ss = stream._streamspeed;
  if (!ss) return;

  // remove data listener
  if (ss.onData) {
    stream.removeListener('data', ss.onData);
  }

  // restore write function
  if (ss.oldWrite) {
    stream.write = ss.oldWrite;
  }

  delete stream._streamspeed;
};


/**
 * Emits speed for a group of streams
 * @constructor
 * @extends (EventEmitter)
 */
var Group = exports.Group = function(per) {
  this._streams = [];
  this._onData = [];
  this._oldWrite = [];
  this._reader = new Counter(per);
  this._writer = new Counter(per);
};

util.inherits(Group, EventEmitter);


/**
 * Add stream to group
 * @param (Stream) stream
 */
Group.prototype.watch = function(stream) {
  if (this._streams.indexOf(stream) !== -1) return;
  var i = this._streams.push(stream) - 1;

  if (stream.readable) {
    this._onData[i] = createOnData(this._reader, this, stream);
  }

  if (stream.writable) {
    this._oldWrite[i] = stream.write;
    createOnWrite(this._writer, this, stream, stream.write);
  }
};


/**
 * Remove stream from group
 * @param (Stream) stream
 */
Group.prototype.unwatch = function(stream) {
  var i = this.streams.indexOf(stream);
  if (i === -1) return;

  // remove data listener
  if (this._onData[i]) {
    stream.removeListener('data', this._onData[i]);
  }

  // restore write function
  if (this._oldWrite[i]) {
    stream.write = this._oldWrite[i];
  }

  this._streams.splice(i, 1);
  this._onData.splice(i, 1);
  this._oldWrite.splice(i, 1);
};
