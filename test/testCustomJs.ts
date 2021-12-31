import expect from 'expect';

import { EvalBlock } from '../src/evalBlock';
import { FunctionCall, InlineCall } from '../src/functionCall';
import { FunctionNotFoundError } from '../src/errors';

const someInput = { input: '', index: 0 }

function runBmlCustomFunc(body: string, arg: RegExpMatchArray | InlineCall) {
  let src = `
    function assert(obj) {
        if (!obj) {
            throw new Error('' + obj + ' was not truthy');
        }
    }
    provide({
        testFunc: (match, inlineCall) => {
            ${body}
        }
    });`;
  let evalBlock = new EvalBlock(src);
  let userDefs = evalBlock.execute();
  expect(userDefs.funcs.testFunc).toBeInstanceOf(Function);
  let functionCall = new FunctionCall('testFunc');
  return functionCall.execute(userDefs, arg);
}

describe('Custom JS (EvalBlock & FunctionCall)', function() {
  it('allows definition and use of custom functions', function() {
    let result = runBmlCustomFunc(`return 'testFunc result';`, someInput);
    expect(result).toBe('testFunc result');
  });

  it('binds regexp matches correctly', function() {
    let src = `
      assert(match !== null);
      assert(inlineCall === null);
      assert(match.index === 18);
      assert(match.input.includes('non-matching text'));
      assert(match[0] === 'test');`;
    let match = /test/.exec('non-matching text\ntest');
    runBmlCustomFunc(src, match!);
  });

  it('binds inline call matches correctly', function() {
    let src = `
      assert(match === null);
      assert(inlineCall !== null);
      assert(inlineCall.index === 123);
      assert(inlineCall.input.includes('some input text'));`;
    runBmlCustomFunc(src, { input: 'some input text', index: 123 });
  })

  it('propagates errors inside custom functions', function() {
    expect(() => {
      runBmlCustomFunc(`throw new Error('test');`, someInput);
    }).toThrowError('test');
  });

  it('allows custom functions to access the eval api', function() {
    let src = `
      // Try accessing every field in the eval API
      assert(bml.WeightedChoice);
      assert(bml.weightedChoose);
      assert(bml.randomInt);
      assert(bml.randomFloat);`;
    runBmlCustomFunc(src, someInput);
  });

  it('Gives error when calling non-existent function', function() {
    let evalBlock = new EvalBlock('');
    let userDefs = evalBlock.execute();
    let functionCall = new FunctionCall('nonExistentFunc');
    expect(() => {
      functionCall.execute(userDefs, { input: 'stub source', index: 0 });
    }).toThrowError(FunctionNotFoundError);
  });
});
