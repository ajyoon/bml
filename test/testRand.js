let assert = require('assert');
let fs = require('fs');

let _rand = require('../src/rand.js');
let normalizeWeights = _rand.normalizeWeights;
let WeightedChoice = require('../src/weightedChoice.js').WeightedChoice;


describe('normalizeWeights', function() {
  it('should do nothing when all weights sum to 100', function() {
    let weights = [
      new WeightedChoice(1, 40),
      new WeightedChoice(1, 60),
    ];
    assert.deepStrictEqual(normalizeWeights(weights), weights);
  });
});
