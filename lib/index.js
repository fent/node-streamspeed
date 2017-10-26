'use strict';

const EventEmitter = require('events').EventEmitter;
const PassThrough  = require('stream').PassThrough;
const Speedometer  = require('./speedometer');


module.exports = class StreamSpeed extends EventEmitter {
  /**
   * Emits speed for a group of streams.
   *
   * @constructor
   * @extends {EventEmitter}
   * @param {Number} per The time unit speed will be measured in.
   */
  constructor(per) {
    super();
    this.per = per || 1000;
    this._streams = [];
    this.speed = 0;
    this.avg = 0;
  }


  /**
   * Updates the group with the latest change in speed.
   *
   * @param {Object} meta
   * @param {Number} speed
   * @param {Number} avg
   */
  _update(meta, speed, avg) {
    meta.speed = speed;
    meta.avg = avg;

    this._streams.forEach((m) => {
      // Skip own stream, streams that haven't started,
      // and streams that are paused.
      if (m === meta || m.speed === 0 || m.stream.paused) {
        return;
      }

      // Add other streams' speeds to total.
      speed += m.speed;
      avg += m.avg;
    });

    this.speed = speed;
    this.avg = avg;
    this.emit('speed', speed, avg);
  }


  /**
   * Convenient method that returns list of streams in this group.
   *
   * @return {Array.<Readable>}
   */
  getStreams() {
    return this._streams.map(m => m.stream);
  }


  /**
   * Add stream to group.
   *
   * @param {Stream} stream
   */
  add(origstream) {
    // Check if stream is already in group.
    if (this._streams.some(m => m.stream === origstream)) {
      throw Error('Stream already in group');
    }
    
    var onReadable = () => {
      var data = stream.read();
      if (data) {
        reader.update(data, onUpdate);
      }
    };

    var cleanup = () => {
      stream.removeListener('readable', onReadable);
      stream.removeListener('end', cleanup);
      origstream.removeListener('error', cleanup);
      this._streams.splice(this._streams.indexOf(meta), 1);
    };

    var meta = {
      stream  : origstream,
      speed   : 0,
      avg     : 0,
      cleanup,
    };
    this._streams.push(meta);
    var reader = new Speedometer(this.per);
    var stream = origstream.pipe(new PassThrough());
    var onUpdate = this._update.bind(this, meta);

    stream.on('readable', onReadable);
    stream.on('end', cleanup);
    origstream.on('error', cleanup);
  }


  /**
   * Remove stream from group.
   *
   * @param {Readable} stream
   */
  remove(stream) {
    // Check if stream is in group.
    var meta;
    if (!this._streams.some(function(m) {
      meta = m;
      return m.stream === stream;
    })) {
      throw Error('Stream not found in group');
    }

    meta.cleanup();
  }


  /**
   * Converts bytes to human readable unit.
   * Thank you Amir from StackOverflow.
   *
   * @param {Number} bytes
   * @return {String}
   */
  static toHuman(bytes, timeUnit) {
    var units = ' KMGTPEZYXWVU';
    if (bytes <= 0) { return '0'; }
    timeUnit = timeUnit ? '/' + timeUnit : '';
    var t2 = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 12);
    return (Math.round(bytes * 100 / Math.pow(1024, t2)) / 100) +
            units.charAt(t2).replace(' ', '') + 'B' + timeUnit;
  }
};
