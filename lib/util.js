/**
 * Rounds a number to n decimal places.
 * @param (number) num
 * @param (number) dec
 * @return (number)
 */
exports.round = function(num, dec) {
  var pow = Math.pow(10, dec);
  return Math.round(num * pow) / pow;
}

