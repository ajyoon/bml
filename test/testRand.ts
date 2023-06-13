import expect from 'expect';
import sha from 'sha.js';
import { Buffer } from 'buffer';

import { WeightedChoice } from '../src/weightedChoice';
let rand = require('../src/rand.ts');

type RandomFunction = (a: number, b: number) => number;
type ValidateNumberKind = (a: number) => boolean;

function testGeneratorFunctionTypeAndRange(
  randomFunction: RandomFunction, typeValidationFunction: ValidateNumberKind,
  min: number, max: number) {
  for (let i = 0; i < 100; i++) {
    let value = randomFunction(min, max);
    expect(typeValidationFunction(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(min);
    expect(value).toBeLessThanOrEqual(max);
  }
}

function testGeneratorFunctionOutputMean(
  randomFunction: RandomFunction, min: number, max: number) {
  let sum = 0;
  for (let i = 0; i < 1000; i++) {
    sum += randomFunction(min, max);
  }
  let mean = sum / 1000;
  let diff = Math.abs(mean - ((min + max) / 2));
  expect(diff).toBeLessThan((min + max) / 4);
}

describe('randomFloat', function() {
  function isFloat(n: number): boolean {
    return n % 1 !== 0;
  }

  it('generates floats within the given range', function() {
    testGeneratorFunctionTypeAndRange(rand.randomFloat, isFloat, 0, 10);
  });

  it('generates values whose mean is near bounds midpoint', function() {
    testGeneratorFunctionOutputMean(rand.randomFloat, 0, 10);
  });
});

describe('randomInt', function() {
  function isInt(n: number) {
    return n % 1 === 0;
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
      new WeightedChoice(['a'], 40),
      new WeightedChoice(['b'], 60),
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
    expect(rand.randomFloat(0, 1)).not.toBeCloseTo(firstResult, 10);
  });

  it('produces stable results forever', function() {
    jest.isolateModules(() => rand = require('../src/rand.ts'));
    rand.setRandomSeed(1234);
    let iters = 100000;
    let results = Buffer.alloc(iters * 8);
    for (let i = 0; i < iters; i++) {
      results.writeFloatBE(rand.randomInt(), i * 8);
    }
    let hash = sha('sha256').update(results).digest('hex');
    expect(hash).toBe('f2f381924630531a5e188f5cdbd110b90f90b796f7daf0dcf402070e8d46ae80');
  });
});

describe('weightedChoose', function() {
  beforeEach(function() {
    rand.setRandomSeed(0); // pin seed for reproducibility
  });
  it('behaves on well-formed weights', function() {
    let weights = [
      new WeightedChoice(['foo'], 40),
      new WeightedChoice(['bar'], 60),
    ];
    let result = rand.weightedChoose(weights);
    expect(result.choice).toStrictEqual(['foo']);
    expect(result.choiceIndex).toBe(0);

    result = rand.weightedChoose(weights);
    expect(result.choice).toStrictEqual(['foo']);
    expect(result.choiceIndex).toBe(0);

    result = rand.weightedChoose(weights);
    expect(result.choice).toStrictEqual(['bar']);
    expect(result.choiceIndex).toBe(1);
  });
});
