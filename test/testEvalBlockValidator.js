const expect = require('expect');

import { EvalBlock } from '../src/evalBlock';
import { validateEvalBlock } from '../src/evalBlockValidator';
import { spyConsole } from './utils';


describe('validateEvalBlock', function() {

  let spy = spyConsole();

  function expectToWarn(code, warningContains) {
    let block = new EvalBlock(code);
    validateEvalBlock(block);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(spy.consoleWarn.mock.calls[0][0]).toContain(warningContains);
  }

  function expectNotToWarn(code) {
    let block = new EvalBlock(code);
    validateEvalBlock(block);
    expect(console.warn).not.toHaveBeenCalled();
  }

  it('warns when Math.random is used', function() {
    expectToWarn(`
      provide({
          foo: Math.random()
      });
    `, 'Math.random');
  });

  it('doesnt warn when code similar to Math.random is used', function() {
    expectNotToWarn(`
      provide({
          foo: NotActuallyMath.random()
      });
    `);
  });

  it('warns when `provide` is not called', function() {
    expectToWarn('', 'provide({})');
  });

  it('warns when only functions similar to `provide` are called', function() {
    expectToWarn('customprovide({})', 'provide({})');
  });

  it('doesnt warn when code calls `provide` correctly', function() {
    expectNotToWarn(`
      provide({
          test: () => 'test'
      });
    `);
  });
});
