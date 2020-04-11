const EventEmitter = require('events').EventEmitter;
const PassThrough  = require('stream').PassThrough;
const Speedometer  = require('./speedometer');


module.exports = class StreamSpeed extends EventEmitter {
  /**
   * Emits speed for a group of streams.
   *
   * @constructor
   * @extends {EventEmitter}
   * @param {Object?} options
   * @param {number?} options.timeUnit The time unit speed will be measured in.
   * @param {number?} options.range Time in ms to calculate speed over.
   */
  constructor(options = {}) {
    super();
    this.options = Object.assign({
      timeUnit: 1000,
      range: 1000,
    }, options);
    this._streams = [];
  }


  /**
   * Updates the group with the latest change in speed.
   *
   * @param {Object} meta
   * @param {number} speed
   */
  _update(meta, speed) {
    this._streams.forEach((m) => {
      // Skip own stream.
      if (m === meta) {
        return;
      }

      // Add other streams' speeds to total.
      speed += m.speedo.getSpeed();
    });

    this.emit('speed', speed);
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
   * @param {Readable} stream
   */
  add(origstream) {
    // Check if stream is already in group.
    if (this._streams.some(m => m.stream === origstream)) {
      throw Error('Stream already in group');
    }

    const onReadable = () => {
      const data = stream.read();
      if (data) {
        reader.update(data, onUpdate);
      }
    };

    const cleanup = () => {
      stream.removeListener('readable', onReadable);
      stream.removeListener('end', cleanup);
      origstream.removeListener('error', cleanup);
      this._streams.splice(this._streams.indexOf(meta), 1);
    };

    const reader = new Speedometer(this.options);
    const stream = origstream.pipe(new PassThrough());

    const meta = {
      stream  : origstream,
      speedo  : reader,
      cleanup,
    };
    this._streams.push(meta);
    const onUpdate = this._update.bind(this, meta);

    stream.on('readable', onReadable);
    origstream.on('end', cleanup);
    origstream.on('error', cleanup);
  }


  /**
   * Remove stream from group.
   *
   * @param {Readable} stream
   */
  remove(stream) {
    // Check if stream is in group.
    const meta = this._streams.find(m => m.stream === stream);
    if (!meta) {
      throw Error('Stream not found in group');
    }
    meta.cleanup();
  }


  /**
   * Get current speed across all streams.
   */
  getSpeed() {
    return this._streams
      .reduce((sum, meta) => sum + meta.speedo.getSpeed(), 0);
  }


  /**
   * Get an individual stream's speed.
   *
   * @param {Readable} stream
   */
  getStreamSpeed(stream) {
    const meta = this._streams.find(m => m.stream === stream);
    if (!meta) {
      throw Error('Stream not found in group');
    }
    return meta.speedo.getSpeed();
  }


  /**
   * Converts bytes to human readable unit.
   * Thank you Amir from StackOverflow.
   *
   * @param {number} bytes
   * @param {Object} options
   * @param {string} options.timeUnit
   * @param {number?} options.precision
   * @return {string}
   */
  static toHuman(bytes, options = {}) {
    const units = ' KMGTPEZYXWVU';
    if (bytes <= 0) { return '0'; }
    options.timeUnit = options.timeUnit ? '/' + options.timeUnit : '';
    const t2 = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 12);
    let rate = Math.round(bytes * 100 / Math.pow(1024, t2)) / 100;
    rate = options.precision ? rate.toPrecision(options.precision) : rate;
    return rate + units.charAt(t2).replace(' ', '') + 'B' + options.timeUnit;
  }
};
