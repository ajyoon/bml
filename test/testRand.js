const expect = require('expect');
const fs = require('fs');
const sha = require('sha.js');

const WeightedChoice = require('../src/weightedChoice.ts').WeightedChoice;

// this import is made mutable for test purposes
let rand = require('../src/rand.ts');

function testGeneratorFunctionTypeAndRange(randomFunction, typeValidationFunction, min, max) {
  for (let i = 0; i < 100; i++) {
    let value = randomFunction(min, max);
    expect(value).toSatisfy((v) => typeValidationFunction(v));
    expect(value).toBeGreaterThanOrEqual(min);
    expect(value).toBeLessThanOrEqual(max);
  }
}

function testGeneratorFunctionOutputMean(randomFunction, min, max) {
  let sum = 0;
  for (let i = 0; i < 1000; i++) {
    sum += randomFunction(min, max);
  }
  let mean = sum / 1000;
  let diff = Math.abs(mean - ((min + max) / 2));
  expect(diff).toBeLessThan((min + max) / 4);
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
    expect(rand.normalizeWeights(weights)).toEqual(weights);
  });
});

describe('setRandomSeed', function() {
  it('should make the output of randomFloat predictable', function() {
    jest.isolateModules(() => rand = require('../src/rand.ts'));
    rand.setRandomSeed(1234);
    let firstResult = rand.randomFloat(0, 1);
    rand.setRandomSeed(1234);
    expect(rand.randomFloat(0, 1)).toBeCloseTo(firstResult);
  });

  it('should make the output of randomInt predictable', function() {
    jest.isolateModules(() => rand = require('../src/rand.ts'));
    rand.setRandomSeed(1234);
    let firstResult = rand.randomInt(0, 1000);
    rand.setRandomSeed(1234);
    expect(rand.randomInt(0, 1000)).toBe(firstResult);
  });

  it('when not called, should produce different outputs on program runs', function() {
    jest.isolateModules(() => rand = require('../src/rand.ts'));
    let firstResult = rand.randomFloat(0, 1);
    expect(rand.randomFloat(0, 1)).not.toBeCloseTo(firstResult);
  });
  
  it('produces stable results forever', function() {
    jest.isolateModules(() => rand = require('../src/rand.ts'));
    rand.setRandomSeed(1234);
    let results = [];
    for (let i = 0; i < 100000; i++) {
      results.push(rand.randomInt());
    }
    let hash = sha('sha256').update(results).digest('hex');
    expect(hash).toBe('9192c25b734fcbadbe32dadc28089c60db0e39f90cc20ce2e5733f57261acc0c');
  });
});

describe('weightedChoose', function() {
  beforeEach(function() {
    rand.setRandomSeed(0); // pin seed for reproducibility
  });
  it('behaves on well-formed weights', function() {
    let weights = [
      new WeightedChoice('foo', 40),
      new WeightedChoice('bar', 60),
    ];
    let result = rand.weightedChoose(weights);
    expect(result.choice).toBe('foo');
    expect(result.choiceIndex).toBe(0);
    
    result = rand.weightedChoose(weights);
    expect(result.choice).toBe('foo');
    expect(result.choiceIndex).toBe(0);

    result = rand.weightedChoose(weights);
    expect(result.choice).toBe('bar');
    expect(result.choiceIndex).toBe(1);
  });
});
