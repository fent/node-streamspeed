const StreamSpeed = require('..');
const MockStream  = require('./mockstream');
const PassThrough = require('stream').PassThrough;
const assert      = require('assert');
const sinon       = require('sinon');


describe('Immediately remove a stream', () => {
  const ss = new StreamSpeed();
  const s = new PassThrough();
  ss.add(s);
  ss.remove(s);

  // Listen for things.
  const spy = sinon.spy();
  s.on('speed', spy);

  it('Does not emit any events', (done) => {
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
  const ss = new StreamSpeed(1);
  const s = new MockStream();
  ss.add(s);

  const spy = sinon.spy();
  ss.on('speed', spy);

  it('Emits no events after calling remove', (done) => {
    // Write at 1 bps for 0.5 seconds.
    s.interval(100, 5, 100, true);
    s.on('finish', done);
  });

  it('Speed that is not over 1 bps, and avg not affected', () => {
    assert.ok(spy.calledWith(1, 1));
  });

  describe('Try removing stream again', () => {
    it('Throws error', () => {
      assert.throws(() => {
        ss.remove(s);
      }, /not found/);
    });
  });
});
