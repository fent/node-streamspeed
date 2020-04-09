const StreamSpeed = require('..');
const MockStream  = require('./mockstream');
const assert      = require('assert');
const sinon       = require('sinon');


describe('Create a group and write to it', () => {
  it('All streams added show up', () => {
    const group = new StreamSpeed();
    const s1 = new MockStream();
    const s2 = new MockStream();
    const s3 = new MockStream();

    group.add(s1);
    group.add(s2);
    group.add(s3);

    assert.equal(group.getStreams().length, 3);
  });

  describe('Try adding the same stream again', () => {
    it('Throws error', () => {
      assert.throws(() => {
        const group = new StreamSpeed();
        const s1 = new MockStream();
        group.add(s1);
        group.add(s1);
      }, /already in group/);
    });
  });

  it('Should emit `speed` event once for each stream', (done) => {
    const group = new StreamSpeed();
    const s1 = new MockStream();
    const s2 = new MockStream();

    group.add(s1);
    group.add(s2);

    const spy = sinon.spy();
    group.on('speed', spy);

    // Write at 500 B/s on 2 streams, 1000 B/s in total.
    s1.interval(100, 6, 200, { end: true, skipTick: true });
    s2.interval(100, 6, 200, { end: true });
    s2.on('finish', () => {
      assert.deepEqual(spy.firstCall.args, [500, 500]);
      assert.deepEqual(spy.secondCall.args, [1000, 1000]);
      done();
    });
  });

  it('Should remove a stream when it ends', (done) => {
    const group = new StreamSpeed();
    const s1 = new MockStream();
    const s2 = new MockStream();

    group.add(s1);
    group.add(s2);

    const spy = sinon.spy();
    group.on('speed', spy);

    assert.equal(group.getStreams().length, 2);
    s1.interval(100, 6, 200, { end: true });
    s1.on('end', () => {
      assert.equal(group.getStreams().length, 1);
      done();
    });
  });
});
