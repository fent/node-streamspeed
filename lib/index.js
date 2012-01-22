var util         = require('util')
  , EventYoshi   = require('eventyoshi')

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
Counter.prototype.update = function(data, encoding) {
  var now = Date.now();

  // check if this is the first data event
  if (this.lasttime === null) {
    this.lasttime = now;
    return false;
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

  var o = { speed: bps, avg: avg };
  var change = this.speed !== bps || this.avg !== avg;
  this.speed = bps;
  this.avg = avg;
  return change ? o : false;
};


/**
 * watch a stream and report the speed when it emits any `data`
 * @param (Stream) stream
 * @param (?number) per A unit of time, defaults to 1000 which is 1 second.
 * @param (?Counter) r Possible reader can be given.
 * @param (?Counter) w Possible writer can be given.
 */
var watch = exports.watch = function(stream, per, r, w) {
  if (stream._streamspeed) return;
  var ss = stream._streamspeed = {};

  if (stream.readable) {
    var reader = r || new Counter(per);
    ss.ondata = function(data, encoding) {
      var rs = reader.update(data, encoding);
      if (rs !== false) {
        stream.emit('readspeed', rs.speed, rs.avg);
      }
    };

    stream.on('data', ss.ondata);
  }

  if (stream.writable) {
    var writer = w || new Counter(per);
    ss.oldwrite = stream.write;

    stream.write = function(data, encoding) {
      var rs = writer.update(data, encoding);
      if (rs !== false) {
        stream.emit('writespeed', rs.speed, rs.avg);
      }

      ss.oldwrite.call(stream, data, encoding);
    };
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
  if (ss.ondata) {
    stream.removeListener('data', ss.ondata);
  }

  // restore write function
  if (ss.oldwrite) {
    stream.write = ss.oldwrite;
  }

  delete stream._streamspeed;
};


/**
 * Emits speed for a group of streams
 * @constructor
 * @extends (EventYoshi)
 */
var Group = exports.Group = function(per) {
  EventYoshi.call(this);
  this._reader = new Counter(per);
  this._writer = new Counter(per);
};

util.inherits(Group, EventYoshi);


/**
 * Add stream to group
 * @param (Stream) stream
 */
Group.prototype.watch = function(stream) {
  this.add(stream);
  watch(stream, null, this._reader, this._writer);
};


/**
 * Remove stream from group
 * @param (Stream) stream
 */
Group.prototype.unwatch = function(stream) {
  this.remove(stream);
  unwatch(stream);
};
