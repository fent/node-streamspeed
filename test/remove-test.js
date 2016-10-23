var StreamSpeed = require('..');
var MockStream  = require('./mockstream');
var assert      = require('assert');
var sinon       = require('sinon');


describe('Immediately remove a stream', function() {
  var ss = new StreamSpeed();
  var s = new MockStream();
  ss.add(s);
  ss.remove(s);

  // Listen for things.
  var spy = sinon.spy();
  s.on('speed', spy);

  it('Does not emit any events', function(done) {
    s.on('finish', function() {
      assert.ok(!spy.called);
      done();
    });

    // Write to it.
    s.write(new Buffer(100));
    s.write(new Buffer(200));
    s.end();

  });
});


describe('Unwatch after several writes', function() {
  var ss = new StreamSpeed(1);
  var s = new MockStream();
  ss.add(s);

  var spy = sinon.spy();
  ss.on('speed', spy);

  it('Emits no events after calling remove', function(done) {
    // Write at 1 bps for 0.5 seconds.
    s.interval(100, 5, 100, function() {
      ss.remove(s);
      s.write(new Buffer(20000));
      s.end();
    });

    s.on('finish', done);
  });

  it('Speed that is not over 1 bps, and avg not affected', function() {
    assert.ok(spy.calledWith(1, 1));
  });
});
