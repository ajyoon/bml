let rand = require('../src/rand.js');
let WeightedChoice = require('../src/weightedChoice.js').WeightedChoice;
let Replacer = require('../src/replacer.js').Replacer;
let expect = require('chai').expect;
const noOp = require('../src/noOp.js');

describe('Replacer', function() {

  before(function() {
    rand.setRandomSeed(0); // pin seed for reproducibility
  });

  it('inserts no-op according to constructor arg', function() {
    let weights = [
      new WeightedChoice('foo', 40),
      new WeightedChoice('bar', 60),
    ];
    let replacer = new Replacer(weights, false, null);
    expect(replacer.weights).to.have.lengthOf(2);
    
    replacer = new Replacer(weights, true, null);
    expect(replacer.weights).to.have.lengthOf(3);
    expect(replacer.weights[2].choice).to.equal(noOp);
    // no-op attachment should not affect input weights
    expect(weights).to.have.lengthOf(2);
  });
  
  it('on call returns well-formed object', function() {
    let weights = [
      new WeightedChoice('foo', 40),
      new WeightedChoice('bar', 60),
    ];
    let replacer = new Replacer(weights, false, null);
    let result = replacer.call();
    expect(result.replacement).to.equal('foo');
    expect(result.choiceIndex).to.equal(0);
  });
});
