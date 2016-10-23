var StreamSpeed = require('..');
var MockStream  = require('./mockstream');
var assert      = require('assert');
var sinon       = require('sinon');


describe('Create a group and write to it', function() {
  var group = new StreamSpeed();
  var s1 = new MockStream();
  var s2 = new MockStream();
  var s3 = new MockStream();

  group.add(s1);
  group.add(s2);
  group.add(s3);

  var spy = sinon.spy();
  group.on('speed', spy);

  it('Should emit `speed` event once for each stream', function(done) {
    // Emit to first 2 streams first fast then slow
    // read at 500 B/s on 2 streams, so 1000 B/s.
    s1.interval(100, 6, 200);
    s2.interval(100, 6, 200);
    s2.on('finish', done);
  });

  it('Should have speed  and avg speed at 1000 B/s', function() {
    assert.ok(spy.calledWith(1000, 1000));
  });
});
