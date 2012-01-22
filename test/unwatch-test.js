var ss = require('..')
  , MockStream = require('./mockstream')
  , assert = require('assert')


describe('Immediately unwatch a stream', function() {
  var s = new MockStream();
  ss.watch(s);
  ss.unwatch(s);

  // listen for things
  var n = 0;
  var onevent = function() {
    n++;
    console.log('event', n);
  };

  s.on('readspeed', onevent);
  s.on('writespeed', onevent);

  it('Does not emit any events', function() {
    // write to it
    s.write(new Buffer(100));
    s.emit('data', new Buffer(200));

    assert.equal(n, 0);
  });
});


describe('Unwatch after several writes', function() {
  var s = new MockStream();
  ss.watch(s, 1);

  var speed, avg, m = 0;
  s.on('writespeed', function(a, b) {
    speed = a;
    avg = b;
  });


  it('Emits no events after unwatch', function(done) {
    // write at 1 bps for 0.5 seconds
    s.writeInterval(100, 5, 100, function() {
      ss.unwatch(s);
      s.write(new Buffer(20000));
      s.emit('end');
    });

    s.on('end', function() {
      assert.ok(1 <= m <= 5);
      done();
    });
  });

  it('Calculates speed that is not over 1 bps', function() {
    assert.equal(speed, 1);
  });

  it('Calculates average speed not affected by speed spike after unwatch',
     function() {
       assert.equal(avg, 1);
     });
});
