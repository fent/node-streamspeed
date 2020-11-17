import StreamSpeed from '..';
import MockStream from './mockstream';
import assert from 'assert';
import sinon from 'sinon';


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

  it('Should emit `speed` event once for each stream', (done) => {
    const group = new StreamSpeed();
    const s1 = new MockStream();
    const s2 = new MockStream();

    group.add(s1);
    group.add(s2);

    const spy = sinon.spy();
    group.on('speed', spy);

    // Write at 500 B/s on 2 streams, 1000 B/s in total.
    s1.interval(500, 6, 1000, { end: true, skipTick: true });
    s2.interval(500, 6, 1000, { end: true });

    s2.on('finish', () => {
      assert.equal(spy.callCount, 2);
      assert.deepEqual(spy.getCall(0).args, [500]);
      assert.deepEqual(spy.getCall(1).args, [1000]);
      assert.equal(group.getSpeed(), 1000);
      assert.equal(group.getStreamSpeed(s1), 500);
      assert.equal(group.getStreamSpeed(s2), 500);
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
      setImmediate(() => {
        assert.throws(() => {
          group.getStreamSpeed(s1);
        }, /not found/);
        assert.equal(group.getStreams().length, 1);
        assert.equal(group.getSpeed(), 0);
        done();
      });
      MockStream.clock.tick(0);
    });
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
});
