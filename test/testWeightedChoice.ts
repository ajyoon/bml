import expect from 'expect';

import { WeightedChoice, sumWeights } from '../src/weightedChoice';
import { EvalBlock } from '../src/evalBlock';

describe('WeightedChoice', function() {
  it('has a useful toString for all choice types', function() {
    expect(new WeightedChoice(['foo'], 1).toString())
      .toBe('WeightedChoice{choice: foo, weight: 1}');
    expect(new WeightedChoice(new EvalBlock('foo'), 1).toString())
      .toBe('WeightedChoice{choice: EvalBlock(\'foo\'), weight: 1}');
  });
});

describe('sumWeights', function() {
  it('Converts null weights to 0', function() {
    let weights = [
      new WeightedChoice(['foo'], null),
      new WeightedChoice(['bar'], 5),
    ];
    expect(sumWeights(weights)).toEqual(5);
  });

  it('Accepts empty arrays', function() {
    expect(sumWeights([])).toEqual(0);
  });

  it('Works on simple cases', function() {
    let weights = [
      new WeightedChoice(['foo'], 2),
      new WeightedChoice(['bar'], 5),
      new WeightedChoice(['biz'], 6),
    ];
    expect(sumWeights(weights)).toEqual(13);
  });

});
