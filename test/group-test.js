var ss = require('..')
  , MockStream = require('./mockstream')
  , assert = require('assert')


describe('Create a group and write to it', function() {
  var group = new ss.Group()
    , s1 = new MockStream()
    , s2 = new MockStream()
    , s3 = new MockStream()
  group.watch(s1);
  group.watch(s2);
  group.watch(s3);

  var readspeed, readavg, readm = 0;
  group.on('readspeed', function(a, b) {
    readm++;
    readspeed = a;
    readavg = b;
  });

  var writespeed, writeavg, writem = 0;
  group.on('writespeed', function(a, b) {
    writem++;
    writespeed = a;
    writeavg = b;
  });

  it('Should emit events total number of times written to', function(done) {
    // emit to first 2 streams first fast then slow
    s1.emitInterval(100, 5, 200, function() {
      s1.emit('end');
    });
    s2.emitInterval(100, 3, 150);

    // write once with third stream
    s3.writeInterval(2000, 2, 200);

    group.on('end', function() {
      assert.equal(readm, 7);
      done();
    });
  });

  it('Should have read speed at about 500 bps', function() {
    assert.ok(450 < readspeed && readspeed < 550);
  });

  it('Should have average read speed of about 1000 bps', function() {
    assert.ok(800 < readavg && readavg < 1200, readavg);
  });

  it('Emitted writespeed event only once', function() {
    assert.equal(writem, 1);
  });

  it('Speed written to and average should match the one case', function() {
    assert.ok(9800 < writespeed && writespeed < 10200, writespeed);
    assert.ok(9800 < writeavg && writeavg < 10200, writeavg);
  });
});
