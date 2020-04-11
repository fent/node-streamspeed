import { EventEmitter } from 'events';
import { PassThrough, Readable } from 'stream';
import { Speedometer, Options } from './speedometer';


namespace StreamSpeed {
  export interface Options {
    timeUnit?: number;
    range?: number;
  }

  export interface ToHumanOptions {
    timeUnit?: string;
    precision?: number;
  }
}

interface Meta {
  speedo: Speedometer;

}

class StreamSpeed extends EventEmitter {
  public options: Options;
  private _streams: Map<Readable, {
    speedo: Speedometer;
    cleanup: () => void;
  }>;

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
    this._streams = new Map();
  }


  /**
   * Updates the group with the latest change in speed.
   *
   * @param {Readable} origstream
   * @param {number} speed
   */
  _update(origstream: Readable, speed: number) {
    for (let [stream, m] of this._streams) {
      // Skip own stream.
      if (stream === origstream) {
        continue;
      }

      // Add other streams' speeds to total.
      speed += m.speedo.getSpeed();
    }

    this.emit('speed', speed);
  }


  /**
   * Convenient method that returns list of streams in this group.
   *
   * @return {Array.<Readable>}
   */
  getStreams() {
    return Array.from(this._streams.keys());
  }


  /**
   * Add stream to group.
   *
   * @param {Readable} stream
   */
  add(origstream: Readable) {
    // Check if stream is already in group.
    if (this._streams.has(origstream)) {
      throw Error('Stream already in group');
    }

    const onUpdate = this._update.bind(this, origstream);
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
      this._streams.delete(origstream);
    };

    const reader = new Speedometer(this.options);
    const stream = origstream.pipe(new PassThrough());

    this._streams.set(origstream, {
      speedo: reader,
      cleanup,
    });

    stream.on('readable', onReadable);
    origstream.on('end', cleanup);
    origstream.on('error', cleanup);
  }


  /**
   * Remove stream from group.
   *
   * @param {Readable} stream
   */
  remove(stream: Readable) {
    // Check if stream is in group.
    const meta = this._streams.get(stream);
    if (!meta) {
      throw Error('Stream not found in group');
    }
    meta.cleanup();
  }


  /**
   * Get current speed across all streams.
   */
  getSpeed() {
    return Array.from(this._streams.values())
      .reduce((sum, meta) => sum + meta.speedo.getSpeed(), 0);
  }


  /**
   * Get an individual stream's speed.
   *
   * @param {Readable} stream
   */
  getStreamSpeed(stream: Readable) {
    const meta = this._streams.get(stream);
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
  static toHuman(bytes: number, options: StreamSpeed.ToHumanOptions = {}) {
    const units = ' KMGTPEZYXWVU';
    let timeUnit = options.timeUnit ? '/' + options.timeUnit : '';
    let t2 = bytes > 0 ?
      Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 12) : 0;
    let rate = Math.round(bytes * 100 / Math.pow(1024, t2)) / 100;
    let prate = options.precision ? rate.toPrecision(options.precision) : rate;
    return prate + units.charAt(t2).replace(' ', '') + 'B' + timeUnit;
  }
}

export = StreamSpeed;
