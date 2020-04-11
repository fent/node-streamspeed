import StreamSpeed from'..';
import MockStream from'./mockstream';
import { PassThrough } from'stream';
import assert from'assert';
import sinon from'sinon';


describe('Immediately remove a stream', () => {
  it('Does not emit any events', (done) => {
    const ss = new StreamSpeed();
    const s = new PassThrough();
    ss.add(s);
    ss.remove(s);

    // Listen for things.
    const spy = sinon.spy();
    s.on('speed', spy);

    s.on('finish', () => {
      assert.ok(!spy.called);
      done();
    });

    // Write to it.
    s.write(Buffer.alloc(100));
    s.write(Buffer.alloc(200));
    s.end();

  });
});


describe('Unwatch after several writes', () => {
  it('Emits no events after calling remove', async () => {
    const ss = new StreamSpeed();
    const s = new MockStream();
    ss.add(s);
    const spy = sinon.spy();
    ss.on('speed', spy);

    // Write at 1 bps for 0.5 seconds.
    await s.interval(100, 2, 200, { amountPerInterval: 2 });
    assert.ok(spy.called);
    let callCount = spy.callCount;

    ss.remove(s);
    await s.interval(100, 1, 200, { amountPerInterval: 2 });
    assert.equal(spy.callCount, callCount);
  });

  describe('Try removing stream again', () => {
    it('Throws error', () => {
      assert.throws(() => {
        const ss = new StreamSpeed({ timeUnit: 1 });
        const s = new MockStream();
        ss.add(s);
        ss.remove(s);
        ss.remove(s);
      }, /not found/);
    });
  });
});
