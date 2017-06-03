var assert = require('assert');
var fs = require('fs');

var bml = require('bml');

describe('bml', function() {

  it("doesn't explode when trying to process a sample document.", function() {
    var testString = '' + fs.readFileSync(require.resolve('../sample.bml'));
    bml(testString);
    // If we make it here without an exception, we win
  });

});
