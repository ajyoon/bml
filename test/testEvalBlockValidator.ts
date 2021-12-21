import expect from 'expect';

import { EvalBlock } from '../src/evalBlock';
import { validateEvalBlock } from '../src/evalBlockValidator';
import { spyConsole } from './utils';

let spy = spyConsole();

type TestFn = () => void;

function expectToWarn(fn: TestFn, warningContains: string) {
  fn();
  expect(console.warn).toHaveBeenCalledTimes(1);
  expect(spy.consoleWarn.mock.calls[0][0]).toContain(warningContains);
}

function expectNotToWarn(fn: TestFn) {
  fn();
  expect(console.warn).not.toHaveBeenCalled();
}

describe('validateEvalBlock', function() {


  it('warns when Math.random is used', function() {
    expectToWarn(() => validateEvalBlock(new EvalBlock(`
      provide({
          foo: Math.random()
      });
    `)), 'Math.random');
  });

  it('doesnt warn when code similar to Math.random is used', function() {
    expectNotToWarn(() => validateEvalBlock(new EvalBlock(`
      provide({
          foo: NotActuallyMath.random()
      });
    `)));
  });

  it('warns when `provide` is not called', function() {
    expectToWarn(() => validateEvalBlock(new EvalBlock('')), 'provide({})');
  });

  it('warns when only functions similar to `provide` are called', function() {
    expectToWarn(() => validateEvalBlock(new EvalBlock('customprovide({})')), 'provide({})');
  });

  it('doesnt warn when code calls `provide` correctly', function() {
    expectNotToWarn(() => validateEvalBlock(new EvalBlock(`
      provide({
          test: () => 'test'
      });
    `)));
  });
});

