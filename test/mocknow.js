/**
 * Mocks the `Date.now()` function.
 * @param (number) n The number that the next call to `Date.now` returns.
 */
var original = Date.now;
module.exports = function(times_args) {
  var rs = Array.prototype.slice.call(arguments)
    , i = 0
    , now = Date.now()

  Date.now = function() {
    var n = rs[i++];
    if (i === rs.length) Date.now = original;
    return n + now;
  }
};
module.exports = function(n) {
  Date.now = function() {
    Date.now = original;
    return n;
  };
};
