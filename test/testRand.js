let assert = require('assert');
let fs = require('fs');
var decache = require('decache');
let expect = require('chai').expect;
let sha = require('sha.js');

let rand = require('../src/rand.js');
let WeightedChoice = require('../src/weightedChoice.js').WeightedChoice;

function testGeneratorFunctionTypeAndRange(randomFunction, typeValidationFunction, min, max) {
  for (let i = 0; i < 100; i++) {
    let value = randomFunction(min, max);
    expect(value).to.satisfy((v) => typeValidationFunction(v));
    expect(value).to.be.at.least(min);
    expect(value).to.be.at.most(max);
  }
}

function testGeneratorFunctionOutputMean(randomFunction, min, max) {
  sum = 0;
  for (let i = 0; i < 1000; i++) {
    sum += randomFunction(min, max);
  }
  mean = sum / 1000;
  tolerance = (max - min) / 4;
  expect(mean).to.be.closeTo((min + max) / 2, tolerance);
}

describe('randomFloat', function() {
  function isFloat(number) {
    return number % 1 !== 0;
  }

  it('generates floats within the given range', function() {
    testGeneratorFunctionTypeAndRange(rand.randomFloat, isFloat, 0, 10);
  });

  it('generates values whose mean is near bounds midpoint', function() {
    testGeneratorFunctionOutputMean(rand.randomFloat, 0, 10);
  });
});

describe('randomInt', function() {
  function isInt(number) {
    return number % 1 === 0;
  }

  it('generates ints within the given range', function() {
    testGeneratorFunctionTypeAndRange(rand.randomInt, isInt, 0, 10);
  });

  it('generates values whose mean is near bounds midpoint', function() {
    testGeneratorFunctionOutputMean(rand.randomInt, 0, 10);
  });
});

describe('normalizeWeights', function() {
  it('should do nothing when all weights sum to 100', function() {
    let weights = [
      new WeightedChoice(1, 40),
      new WeightedChoice(1, 60),
    ];
    assert.deepStrictEqual(rand.normalizeWeights(weights), weights);
  });
});

describe('setRandomSeed', function() {
  function reloadRandModule() {
    // Remove the rand module from the require cache so we can import a
    // fresh copy of the module. This prevents random seed settings from
    // test runs from interfering with each other.
    decache('../src/rand.js');
    rand = require('../src/rand.js');
  }

  before(function () {
    reloadRandModule();
  });

  after(function () {
    reloadRandModule();
  });

  it('should make the output of randomFloat predictable', function() {
    rand.setRandomSeed(1234);
    let firstResult = rand.randomFloat(0, 1);
    rand.setRandomSeed(1234);
    expect(rand.randomFloat(0, 1)).to.be.closeTo(firstResult, 0.0001);
  });

  it('should make the output of randomInt predictable', function() {
    rand.setRandomSeed(1234);
    let firstResult = rand.randomInt(0, 1000);
    rand.setRandomSeed(1234);
    expect(rand.randomInt(0, 1000)).to.be.equal(firstResult);
  });

  it('when not called, should produce different outputs on program runs', function() {
    let firstResult = rand.randomFloat(0, 1);
    reloadRandModule();
    expect(rand.randomFloat(0, 1)).to.not.be.closeTo(firstResult, 0.0001);
  });
  
  it('produces stable results forever', function() {
    rand.setRandomSeed(1234);
    let results = [];
    for (let i = 0; i < 100000; i++) {
      results.push(rand.randomInt());
    }
    let hash = sha('sha256').update(results).digest('hex');
    expect(hash).to.be.equal('9192c25b734fcbadbe32dadc28089c60db0e39f90cc20ce2e5733f57261acc0c');
  });
});
