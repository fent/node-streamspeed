var StreamSpeed = require('..');
var MockStream  = require('./mockstream');
var assert      = require('assert');
var sinon       = require('sinon');


describe('Read from a stream', function() {
  describe('with a unit', function() {
    var ss = new StreamSpeed(1);
    var rs = new MockStream();
    ss.add(rs);

    var spy = sinon.spy();
    ss.on('speed', spy);

    it('Only emitted one speed event', function(done) {
      // Write data of length 100 3 times to stream
      // at a speed of 1 byte per ms.
      rs.interval(100, 3, 100);

      rs.on('end', function() {
        assert.ok(spy.calledOnce);
        done();
      });
    });

    it('Calculates correct ending speed, and avg speed in bytes', function() {
      assert.ok(spy.calledWith(1, 1));
    });

  });

  describe('with no unit', function() {
    var ss = new StreamSpeed();
    var rs = new MockStream();
    ss.add(rs);

    var spy = sinon.spy();
    ss.on('speed', spy);

    it('Emited one readspeed event', function(done) {
      // Write at 10*400 bytes per second.
      rs.interval(400, 10, 100);

      rs.on('end', function() {
        assert.ok(spy.calledOnce);
        done();
      });
    });

    it('Calculates correct ending speed and avg speed', function() {
      assert.ok(spy.calledWith(4000, 4000));
    });
  });
});
