const StreamSpeed = require('..');
const MockStream  = require('./mockstream');
const PassThrough = require('stream').PassThrough;
const assert      = require('assert');
const sinon       = require('sinon');


const assertSpeed = (spy, speeds, startIndex = 0) => {
  assert.equal(spy.callCount, speeds.length + startIndex);
  for (let [index, speed] of speeds.entries()) {
    assert.deepEqual(spy.getCall(index + startIndex).args, [speed]);
  }
};

describe('Read from a stream', () => {
  describe('with no `timeUnit`', () => {
    it('Calculates constant speed', async () => {
      const ss = new StreamSpeed();
      const rs = new MockStream();
      ss.add(rs);
      const spy = sinon.spy();
      ss.on('speed', spy);

      // Write at 1000 B/s.
      await rs.interval(200, 15, 200);

      // Ramps up to 1000 B/s.
      assertSpeed(spy, [200, 400, 600, 800, 1000]);

      // After 5 calls, speed is constant.
      assert.equal(spy.callCount, 5);
      assert.equal(ss.getSpeed(), 1000);

    });
  });

  describe('with a `timeUnit`', () => {
    it('Emit speed according to set unit', (done) => {
      const ss = new StreamSpeed({ timeUnit: 1000 * 60 });
      const rs = new MockStream();
      ss.add(rs);
      const spy = sinon.spy();
      ss.on('speed', spy);

      // Write data of length 100 3 times to stream
      // at a speed of 1 byte per ms.
      rs.interval(100, 3, 100, { end: true });

      rs.on('end', () => {
        assert.equal(spy.callCount, 3);
        assertSpeed(spy, [6000, 12000, 18000]);
        done();
      });
    });
  });

});

describe('Read when stream speed is sporadic', () => {
  it('Speed is reactive', async () => {
    const ss = new StreamSpeed();
    const rs = new MockStream();
    ss.add(rs);
    const spy = sinon.spy();
    ss.on('speed', spy);

    await rs.interval(100, 2, 100, { end: false });
    await MockStream.timeout(900);
    await rs.interval(200, 3, 100, { end: true });

    assertSpeed(spy, [100, 200, 400, 600]);
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

describe('With custom `range`', () => {
  it('Old `data` events are not used for the `avg`', async () => {
    const ss = new StreamSpeed({ range: 2000 });
    const rs = new MockStream();
    ss.add(rs);
    const spy = sinon.spy();
    ss.on('speed', spy);

    // Write at 100 B/s for 4 seconds.
    await rs.interval(100, 4, 1000);
    assertSpeed(spy, [50, 100]);

    // Speed up to 800 B/s.
    await rs.interval(200, 4, 1000);

    // Progressively speeds up per every `data` event.
    assertSpeed(spy, [150, 200], 2);
  });

  describe('Stream stops emitting data for a while', () => {
    it('Speed slows down and picks back up', async () => {
      const ss = new StreamSpeed();
      const rs = new MockStream();
      ss.add(rs);
      const spy = sinon.spy();
      ss.on('speed', spy);

      // Write at 400 B/s for a sec.
      await rs.interval(100, 8, 250);
      assertSpeed(spy, [100, 200, 300, 400]);

      // Pause for a few secs.
      await MockStream.timeout(10000);
      assert.equal(ss.getSpeed(), 0, 'Speed should be 0 by now');

      // Write at 1200 B/s.
      await rs.interval(300, 8, 250);

      // Speed changes quickly.
      assertSpeed(spy, [300, 600, 900, 1200], 4);
      assert.equal(ss.getSpeed(), 1200);
    });
  });
});
