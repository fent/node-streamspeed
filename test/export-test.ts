import assert from 'node:assert';
import StreamSpeed, { StreamSpeed as NamedStreamSpeed } from '..';

describe('Exports', () => {
  it('Exposes class as default and named export', () => {
    assert.strictEqual(StreamSpeed, NamedStreamSpeed);
    assert.strictEqual(StreamSpeed.StreamSpeed, StreamSpeed);
    assert.strictEqual(StreamSpeed.default, StreamSpeed);
  });
});
