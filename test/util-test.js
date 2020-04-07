const StreamSpeed = require('..');
const assert      = require('assert');


describe('StreamSpeed.toHuman()', () => {
  it('Does not give a unit to 0 bytes', () => {
    assert.equal(StreamSpeed.toHuman(0, 'MB'), '0');
  });

  it('Turns bytes into human readable size', () => {
    assert.equal(StreamSpeed.toHuman(1024), '1KB');
    assert.equal(StreamSpeed.toHuman(1024 * 1024 * 1.5), '1.5MB');
  });

  describe('With `timeUnit`', () => {
    it('Turns bytes into human readable size', () => {
      assert.equal(StreamSpeed.toHuman(1024, {
        timeUnit: 's'
      }), '1KB/s');
      assert.equal(StreamSpeed.toHuman(1024 * 1024 * 1.5, {
        timeUnit: 's'
      }), '1.5MB/s');
    });
  });

  describe('With `precision`', () => {
    it('Formats speed with requested number of precision', () => {
      assert.equal(StreamSpeed.toHuman(1024 * 1024 * 1.5, {
        precision: 3
      }), '1.50MB');
      assert.equal(StreamSpeed.toHuman(1024 * 1024 * 1.1234567, {
        precision: 2
      }), '1.1MB');
    });
  });
});
