const expect = require('expect');
const rand = require('../src/rand.ts');
const WeightedChoice = require('../src/weightedChoice.js').WeightedChoice;
const Replacer = require('../src/replacer.js').Replacer;
const noOp = require('../src/noOp.js');

describe('Replacer', function() {

  beforeEach(function() {
    rand.setRandomSeed(0); // pin seed for reproducibility
  });
  
  it('on call returns well-formed object', function() {
    let weights = [
      new WeightedChoice('foo', 40),
      new WeightedChoice('bar', 60),
    ];
    let replacer = new Replacer(weights, false, null);
    let result = replacer.call();
    expect(result.replacement).toBe('foo');
    expect(result.choiceIndex).toBe(0);
  });
});
