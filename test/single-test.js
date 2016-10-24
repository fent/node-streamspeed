var StreamSpeed = require('..');
var MockStream  = require('./mockstream');
var PassThrough = require('stream').PassThrough;
var assert      = require('assert');
var sinon       = require('sinon');


describe('Read from a stream', function() {
  describe('with a unit', function() {
    var ss = new StreamSpeed(1);
    var rs = new MockStream();
    ss.add(rs);

    var spy = sinon.spy();
    ss.on('speed', spy);

    it('Emitted one speed event', function(done) {
      // Write data of length 100 3 times to stream
      // at a speed of 1 byte per ms.
      rs.interval(100, 3, 100);

      rs.on('end', function() {
        assert.ok(spy.calledOnce);
        done();
      });
    });

    it('Calculates correct ending speed and avg speed in bytes', function() {
      assert.ok(spy.calledWith(1, 1));
    });

  });

  describe('with no unit', function() {
    var ss = new StreamSpeed();
    var rs = new MockStream();
    ss.add(rs);

    var spy = sinon.spy();
    ss.on('speed', spy);

    it('Emited one speed event', function(done) {
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

  describe('Written to at the rate of the unit', function() {
    var ss = new StreamSpeed(100);
    var rs = new MockStream();
    ss.add(rs);

    var spy = sinon.spy();
    ss.on('speed', spy);

    it('Speed and avg speed are constant', function(done) {
      rs.on('end', function() {
        assert.ok(spy.calledOnce);
        assert.ok(spy.firstCall.calledWith(400, 400));
        done();
      });
      rs.interval(400, 10, 100);
    });
  });
});

describe('Read when stream speed is sporadic', function() {
  var ss = new StreamSpeed();
  var rs = new MockStream();
  ss.add(rs);

  var spy = sinon.spy();
  ss.on('speed', spy);

  it('Speed and avg speed changes', function() {
    rs.write(new Buffer(100));
    rs.write(new Buffer(100));
    rs.write(new Buffer(200));
    rs.write(new Buffer(200));
    rs.end();
    assert.ok(spy.firstCall.calledWith(100000, 100000));
    assert.ok(spy.secondCall.calledWith(200000, 150000));
  });
});
