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
      rs.interval(100, 3, 100, { end: true });

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

      rs.interval(100, 3, 100, { end: true });
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
      rs.interval(400, 10, 100, { end: true });

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

      rs.interval(400, 10, 100, { end: true });
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
        assert.deepEqual(spy.firstCall.args, [400, 400]);
        done();
      });
      rs.interval(400, 10, 100, { end: true });
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

    rs.interval(100, 2, 100, { end: false });
    setTimeout(() => {
      rs.interval(200, 2, 100, { end: true });
    }, 200);
    rs.on('end', () => {
      assert.deepEqual(spy.firstCall.args, [1000, 1000]);
      assert.deepEqual(spy.secondCall.args, [2000, 1500]);
    });
  });
});

describe('Data is read on the same millisecond', () => {
  it('Speed is accurately calculated', async () => {
    const ss = new StreamSpeed();
    const rs = new MockStream();
    ss.add(rs);

    const spy = sinon.spy();
    ss.on('speed', spy);

    // Write at 10*400 bytes per second.
    await rs.interval(400, 1, 100, { amountPerInterval: 2 });
    assert.ok(!spy.called);
    await rs.interval(400, 2, 100, { amountPerInterval: 2, end: true });
    assert.ok(spy.called);
    assert.deepEqual(spy.firstCall.args, [4000, 4000]);
    assert.deepEqual(spy.secondCall.args, [8000, 6000]);
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
