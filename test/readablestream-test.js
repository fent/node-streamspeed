var ss = require('..')
  , MockStream = require('./mockstream')
  , assert = require('assert')


describe('Read from a stream', function() {
  describe('with a unit', function() {
    var rs = new MockStream();
    ss.watch(rs, 1);

    var speed, avg, m = 0;
    rs.on('readspeed', function(a, b) {
      m++;
      speed = a;
      avg = b;
    });

    it('Only emitted one readspeed event', function(done) {
      // write data of length 100 5 times to stream
      // at a speed of 1 byte per ms
      rs.emitInterval(100, 3, 100, function() {
        rs.emit('end');
      });

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
    var rs = new MockStream();
    ss.watch(rs);

    var speed, avg, m = 0;
    rs.on('readspeed', function(a, b) {
      m++;
      speed = a;
      avg = b;
    });

    it('Emited one readspeed event', function(done) {
      // write at 20*400 bytes per second
      rs.emitInterval(400, 10, 100, function() {
        rs.emit('end');
      });

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
