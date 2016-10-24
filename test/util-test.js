var StreamSpeed = require('..');
var assert      = require('assert');


describe('StreamSpeed.toHuman()', function() {
  it('Does not give a unit to 0 bytes', function() {
    assert.equal(StreamSpeed.toHuman(0, 'MB'), '0');
  });

  it('Turns bytes into human readable size', function() {
    assert.equal(StreamSpeed.toHuman(1024, 's'), '1KB/s');
    assert.equal(StreamSpeed.toHuman(1024 * 1024 * 1.5, 's'), '1.5MB/s');
  });

  it('Turns bytes into human readable size (no time unit)', function() {
    assert.equal(StreamSpeed.toHuman(1024), '1KB');
    assert.equal(StreamSpeed.toHuman(1024 * 1024 * 1.5), '1.5MB');
  });
});
