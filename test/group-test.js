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

  it('Should emit readspeed event once for each stream', function(done) {
    // emit to first 2 streams first fast then slow
    // read at 500 B/s on 2 streams, so 1000 B/s
    s1.emitInterval(100, 6, 200, function() { s1.emit('end'); });
    s2.emitInterval(100, 6, 200, function() { s2.emit('error', 'no!'); });

    // write twice with third stream
    s3.writeInterval(2000, 2, 600, function() {
      assert.equal(group._streams.length, 1);
      s3.emit('end');
      assert.equal(group._streams.length, 0);
      assert.equal(readm, 2);
      done();
    });
  });

  it('Should have read speed at 1000 B/s', function() {
    assert.equal(readspeed, 1000);
  });

  it('Should have average read speed of 1000 B/s', function() {
    assert.equal(readavg, 1000);
  });

  it('Emitted writespeed event only once', function() {
    assert.equal(writem, 1);
  });

  it('Speed written to and average should match the one case', function() {
    assert.equal(writespeed, 3333);
    assert.equal(writeavg, 3333);
  });
});
