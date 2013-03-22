var StreamSpeed = require('..');
var MockStream  = require('./mockstream');
var assert      = require('assert');


describe('Read from a stream', function() {
  describe('with a unit', function() {
    var ss = new StreamSpeed(1);
    var rs = new MockStream();
    ss.add(rs);

    var speed, avg, m = 0;
    ss.on('speed', function(a, b) {
      m++;
      speed = a;
      avg = b;
    });

    it('Only emitted one readspeed event', function(done) {
      // Write data of length 100 5 times to stream
      // at a speed of 1 byte per ms.
      rs.interval(100, 3, 100);

      rs.on('end', function() {
        assert.equal(m, 1);
        done();
      });
    });

    it('Calculates correct ending speed in bytes', function() {
      assert.equal(speed, 1);
    });

    it('Calculates correct average speed in bytes', function() {
      assert.equal(avg, 1);
    });

  });

  describe('with no unit', function() {
    var ss = new StreamSpeed();
    var rs = new MockStream();
    ss.add(rs);

    var speed, avg, m = 0;
    ss.on('speed', function(a, b) {
      m++;
      speed = a;
      avg = b;
    });

    it('Emited one readspeed event', function(done) {
      // Write at 20*400 bytes per second.
      rs.interval(400, 10, 100);

      rs.on('end', function() {
        assert.equal(m, 1);
        done();
      });
    });

    it('Calculates correct ending speed', function() {
      assert.equal(speed, 4000);
    });

    it('Calculates correct average speed in bytes', function() {
      assert.equal(speed, 4000);
    });
  });
});
