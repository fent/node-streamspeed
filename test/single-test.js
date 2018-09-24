const StreamSpeed = require('..');
const MockStream  = require('./mockstream');
const PassThrough = require('stream').PassThrough;
const assert      = require('assert');
const sinon       = require('sinon');


describe('Read from a stream', () => {
  describe('with a unit', () => {
    const ss = new StreamSpeed(1);
    const rs = new MockStream();
    ss.add(rs);

    const spy = sinon.spy();
    ss.on('speed', spy);

    it('Emitted one speed event', (done) => {
      // Write data of length 100 3 times to stream
      // at a speed of 1 byte per ms.
      rs.interval(100, 3, 100, true);

      rs.on('end', () => {
        assert.ok(spy.calledOnce);
        done();
      });
    });

    it('Calculates correct ending speed and avg speed in bytes', () => {
      assert.ok(spy.calledWith(1, 1));
    });

  });

  describe('with no unit', () => {
    const ss = new StreamSpeed();
    const rs = new MockStream();
    ss.add(rs);

    const spy = sinon.spy();
    ss.on('speed', spy);

    it('Emited one speed event', (done) => {
      // Write at 10*400 bytes per second.
      rs.interval(400, 10, 100, true);

      rs.on('end', () => {
        assert.ok(spy.calledOnce);
        done();
      });
    });

    it('Calculates correct ending speed and avg speed', () => {
      assert.ok(spy.calledWith(4000, 4000));
    });
  });

  describe('Written to at the rate of the unit', () => {
    const ss = new StreamSpeed(100);
    const rs = new MockStream();
    ss.add(rs);

    const spy = sinon.spy();
    ss.on('speed', spy);

    it('Speed and avg speed are constant', (done) => {
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
  const ss = new StreamSpeed();
  const rs = new MockStream();
  ss.add(rs);

  const spy = sinon.spy();
  ss.on('speed', spy);

  it('Speed and avg speed changes', () => {
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
