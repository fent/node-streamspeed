const StreamSpeed = require('..');
const MockStream  = require('./mockstream');
const assert      = require('assert');
const sinon       = require('sinon');


describe('Create a group and write to it', () => {
  var group = new StreamSpeed();
  var s1 = new MockStream();
  var s2 = new MockStream();
  var s3 = new MockStream();

  group.add(s1);
  group.add(s2);
  group.add(s3);

  var spy = sinon.spy();
  group.on('speed', spy);

  it('All streams added show up', () => {
    assert.equal(group.getStreams().length, 3);
  });

  describe('Try adding the same stream again', () => {
    it('Throws error', () => {
      assert.throws(() => {
        group.add(s3);
      }, /already in group/);
    });
  });

  it('Should emit `speed` event once for each stream', (done) => {
    // Emit to first 2 streams first fast then slow
    // read at 500 B/s on 2 streams, so 1000 B/s.
    s1.interval(100, 6, 200);
    s2.interval(100, 6, 200);
    s2.on('finish', done);
  });

  it('Should have speed  and avg speed at 1000 B/s', () => {
    assert.ok(spy.calledWith(1000, 1000));
  });

  it('Should remove a stream when it ends', () => {
    assert.equal(group.getStreams().length, 1);
  });
});
