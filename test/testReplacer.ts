import expect from 'expect';
import * as rand from '../src/rand';
import { WeightedChoice } from '../src/weightedChoice';
import { ChoiceFork } from '../src/choiceFork';

describe('ChoiceFork', function() {

  beforeEach(function() {
    rand.setRandomSeed(0); // pin seed for reproducibility
  });

  it('on call returns well-formed object', function() {
    let weights = [
      new WeightedChoice(['foo'], 40),
      new WeightedChoice(['bar'], 60),
    ];
    let choiceFork = new ChoiceFork(weights, null, false);
    let result = choiceFork.call();
    expect(result.replacement).toStrictEqual(['foo']);
    expect(result.choiceIndex).toBe(0);
  });

  it('has a useful toString', function() {
    let weights = [
      new WeightedChoice(['foo'], 40),
      new WeightedChoice(['bar'], 60),
    ];
    let choiceFork = new ChoiceFork(weights, 'identifier', true);
    expect(choiceFork.toString()).toBe(
      'ChoiceFork{weights: WeightedChoice{choice: foo, weight: 40},'
      + 'WeightedChoice{choice: bar, weight: 60}, identifier: identifier, isSilent: true}');
  });
});
