const StreamSpeed = require('..');
const MockStream  = require('./mockstream');
const PassThrough = require('stream').PassThrough;
const assert      = require('assert');
const sinon       = require('sinon');


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
  it('Emits no events after calling remove', (done) => {
    const ss = new StreamSpeed(1);
    const s = new MockStream();
    ss.add(s);
    const spy = sinon.spy();
    ss.on('speed', spy);

    // Write at 1 bps for 0.5 seconds.
    s.write(Buffer.alloc(100), null, () => {
      s.write(Buffer.alloc(100), null, () => {
        assert.equal(spy.callCount, 1);
        ss.remove(s);
        s.write(Buffer.alloc(100), () => {
          assert.equal(spy.callCount, 1);
          done();
        });
      });
    });
  });

  describe('Try removing stream again', () => {
    it('Throws error', () => {
      assert.throws(() => {
        const ss = new StreamSpeed(1);
        const s = new MockStream();
        ss.add(s);
        ss.remove(s);
        ss.remove(s);
      }, /not found/);
    });
  });
});
