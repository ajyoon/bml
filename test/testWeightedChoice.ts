import expect from 'expect';

import noOp from '../src/noOp';
import { WeightedChoice } from '../src/weightedChoice';
import { FunctionCall } from '../src/functionCall';

describe('Replacer', function() {
  it('has a useful toString for all choice types', function() {
    expect(new WeightedChoice('foo', 1).toString())
      .toBe('WeightedChoice{choice: foo, weight: 1}');
    expect(new WeightedChoice(noOp, 0).toString())
      .toBe('WeightedChoice{choice: Symbol(noOp), weight: 0}');
    expect(new WeightedChoice(new FunctionCall('foo'), 0).toString())
      .toBe('WeightedChoice{choice: FunctionCall(\'foo\'), weight: 0}');
  });
});
