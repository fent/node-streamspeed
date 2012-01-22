var ss = require('..')
  , MockStream = require('./mockstream')
  , assert = require('assert')


describe('Write to a stream', function() {
  var ws = new MockStream();
  ss.watch(ws);

  var speed, avg, m = 0;
  ws.on('writespeed', function(a, b) {
    m++;
    speed = a;
    avg = b;
  });


  it('Emits event only on speed change', function(done) {
    // write at 500 bps for 1 second
    ws.writeInterval(100, 5, 200, function() {
      ws.emit('end');
    });

    ws.on('end', function() {
      assert.ok(1 <= m <= 5);
      done();
    });
  });

  it('Calculates correct ending write speed', function() {
    assert.ok(450 < speed && speed < 550);
  });

  it('Calculates correct average speed', function() {
    assert.ok(480 < avg && avg < 520);
  });
});
