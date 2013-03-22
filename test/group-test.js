var StreamSpeed = require('..');
var MockStream = require('./mockstream');
var assert = require('assert');


describe('Create a group and write to it', function() {
  var group = new StreamSpeed();
  var s1 = new MockStream();
  var s2 = new MockStream();
  var s3 = new MockStream();

  group.add(s1);
  group.add(s2);
  group.add(s3);

  var speed, avg, n = 0;
  group.on('speed', function(a, b) {
    console.log('speed', a, b);
    n++;
    speed = a;
    avg = b;
  });

  it('Should emit `speed` event once for each stream', function(done) {
    // Emit to first 2 streams first fast then slow
    // read at 500 B/s on 2 streams, so 1000 B/s.
    s1.interval(100, 6, 200, s1.end.bind(s1));
    s2.interval(100, 6, 200, s2.end.bind(s2));
    s2.on('finish', function() {
      console.log('finish');
      done();
    });
  });

  it('Should have speed at 1000 B/s', function() {
    assert.equal(speed, 1000);
  });

  it('Should have average speed of 1000 B/s', function() {
    assert.equal(avg, 1000);
  });
});
process.on('uncaughtException', console.log);
