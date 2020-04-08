const StreamSpeed = require('..');
const MockStream  = require('./mockstream');
const PassThrough = require('stream').PassThrough;
const assert      = require('assert');
const sinon       = require('sinon');


describe('Read from a stream', () => {
  describe('with a unit', () => {
    it('Emit one speed event', (done) => {
      const ss = new StreamSpeed(1);
      const rs = new MockStream();
      ss.add(rs);

      const spy = sinon.spy();
      ss.on('speed', spy);

      // Write data of length 100 3 times to stream
      // at a speed of 1 byte per ms.
      rs.interval(100, 3, 100, true);

      rs.on('end', () => {
        assert.ok(spy.calledOnce);
        done();
      });
    });

    it('Calculates correct ending speed and avg speed in bytes', (done) => {
      const ss = new StreamSpeed(1);
      const rs = new MockStream();
      ss.add(rs);

      const spy = sinon.spy();
      ss.on('speed', spy);

      rs.interval(100, 3, 100, true);
      rs.on('end', () => {
        assert.ok(spy.calledWith(1, 1));
        done();
      });
    });

  });

  describe('with no unit', () => {
    it('Emited one speed event', (done) => {
      const ss = new StreamSpeed();
      const rs = new MockStream();
      ss.add(rs);

      const spy = sinon.spy();
      ss.on('speed', spy);

      // Write at 10*400 bytes per second.
      rs.interval(400, 10, 100, true);

      rs.on('end', () => {
        assert.ok(spy.calledOnce);
        done();
      });
    });

    it('Calculates correct ending speed and avg speed', (done) => {
      const ss = new StreamSpeed();
      const rs = new MockStream();
      ss.add(rs);

      const spy = sinon.spy();
      ss.on('speed', spy);

      rs.on('end', () => {
        assert.ok(spy.calledWith(4000, 4000));
        done();
      });

      rs.interval(400, 10, 100, true);
    });
  });

  describe('Written to at the rate of the unit', () => {
    it('Speed and avg speed are constant', (done) => {
      const ss = new StreamSpeed(100);
      const rs = new MockStream();
      ss.add(rs);

      const spy = sinon.spy();
      ss.on('speed', spy);

      rs.on('end', () => {
        assert.ok(spy.calledOnce);
        assert.ok(spy.firstCall.calledWith(400, 400));
        done();
      });
      rs.interval(400, 10, 100, true);
    });
  });
});

describe('Read when stream speed is sporadic', () => {
  it('Speed and avg speed changes', () => {
    const ss = new StreamSpeed();
    const rs = new MockStream();
    ss.add(rs);

    const spy = sinon.spy();
    ss.on('speed', spy);

    rs.interval(100, 2, 100, false);
    setTimeout(() => {
      rs.interval(200, 2, 100, true);
    }, 200);
    rs.on('end', () => {
      assert.ok(spy.firstCall.calledWith(1000, 1000));
      assert.ok(spy.secondCall.calledWith(2000, 1500));
    });
  });
});

describe('Data is read on the same millisecond', () => {
  it('Speed is accurately calculated', (done) => {
    let clock = sinon.useFakeTimers();
    after(clock.restore);

    const ss = new StreamSpeed();
    const rs = new MockStream();
    ss.add(rs);

    const spy = sinon.spy();
    ss.on('speed', spy);

    // Write at 2*400 bytes per second.
    setTimeout(() => {
      rs.write(Buffer.alloc(400), () => {
        rs.write(Buffer.alloc(400), () => {
          process.nextTick(rs.end.bind(rs));
        });
      });
    }, 100);
    process.nextTick(clock.tick.bind(clock, 100));

    rs.on('end', () => {
      assert.ok(spy.called);
      done();
    });
  });
});

describe('Stream being monitored has an error', () => {
  it('Stream gets removed', () => {
    const ss = new StreamSpeed();
    const rs = new PassThrough();
    rs.on('error', () => {});
    ss.add(rs);
    rs.emit('error', Error('my error'));
    assert.equal(ss.getStreams().length, 0);
  });
});
