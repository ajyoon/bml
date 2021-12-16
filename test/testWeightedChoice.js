const expect = require('expect');

const WeightedChoice = require('../src/weightedChoice.ts').WeightedChoice;
const noOp = require('../src/noOp.ts');
const FunctionCall = require('../src/functionCall.ts').FunctionCall;

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
