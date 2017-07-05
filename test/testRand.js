var assert = require('assert');
var fs = require('fs');

var _rand = require('../src/rand.js');
var normalizeWeights = _rand.normalizeWeights;
var WeightedChoice = require('../src/weightedChoice.js').WeightedChoice;


describe('normalizeWeights', function() {
  it('should do nothing when all weights sum to 100', function() {
    var weights = [
      new WeightedChoice(1, 40),
      new WeightedChoice(1, 60)
    ];
    assert.deepStrictEqual(normalizeWeights(weights), weights);
  });
});
