var StreamSpeed = require('..');
var MockStream  = require('./mockstream');
var assert      = require('assert');


describe('Immediately remove a stream', function() {
  var ss = new StreamSpeed();
  var s = new MockStream();
  ss.add(s);
  ss.remove(s);

  // Listen for things.
  var n = 0;
  s.on('speed', function() {
    n++;
  });

  it('Does not emit any events', function(done) {
    s.on('end', function() {
      assert.equal(n, 0);
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

  var speed, avg, m = 0;
  ss.on('speed', function(a, b) {
    speed = a;
    avg = b;
  });

  it('Emits no events after calling remove', function(done) {
    // Write at 1 bps for 0.5 seconds.
    s.interval(100, 5, 100, function() {
      ss.remove(s);
      s.write(new Buffer(20000));
      s.end();
    });

    s.on('end', function() {
      assert.ok(1 <= m <= 5);
      done();
    });
  });

  it('Calculates speed that is not over 1 bps', function() {
    assert.equal(speed, 1);
  });

  it('Calculates average speed not affected by speed spike after removing',
     function() {
       assert.equal(avg, 1);
     });
});
