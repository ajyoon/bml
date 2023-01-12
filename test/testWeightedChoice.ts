import expect from 'expect';

import { WeightedChoice } from '../src/weightedChoice';
import { EvalBlock } from '../src/evalBlock';

describe('Replacer', function() {
  it('has a useful toString for all choice types', function() {
    expect(new WeightedChoice(['foo'], 1).toString())
      .toBe('WeightedChoice{choice: foo, weight: 1}');
    expect(new WeightedChoice(new EvalBlock('foo'), 1).toString())
      .toBe('WeightedChoice{choice: EvalBlock(\'foo\'), weight: 1}');
  });
});
