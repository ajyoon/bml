var assert = require('assert');
var fs = require('fs');

var _rand = require('../src/rand.js');

var normalizeWeights = _rand.normalizeWeights;


describe('normalizeWeights', function() {
  it('should do nothing when all weights sum to 100', function() {
    var weights = [{option: 1, chance: 40}, {option: 1, chance: 60}];
    assert.deepEqual(normalizeWeights(weights), weights);
  });
});
