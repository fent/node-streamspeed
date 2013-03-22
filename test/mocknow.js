/**
 * Mocks the `Date.now()` function so that it returns the an exact value.
 * This is used because normally it can be about 4ms off and tests
 * need exact values.
 *
 * @param {Number} n The number that the next call to `Date.now` returns.
 */
var original = Date.now;
module.exports = function(n) {
  Date.now = function() {
    console.log('mock now');
    Date.now = original;
    return n;
  };
};
