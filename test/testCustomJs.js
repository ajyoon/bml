const expect = require('expect');

const EvalBlock = require('../src/evalBlock.js').EvalBlock;
const FunctionCall = require('../src/functionCall.js').FunctionCall;
const _errors = require('../src/errors.js');
const FunctionNotFoundError = _errors.FunctionNotFoundError;
const NotAFunctionError = _errors.NotAFunctionError;

describe('Custom JS (EvalBlock & FunctionCall)', function() {
  it('allows definition and use of custom functions', function() {
    let src = `
        provide({
            testFunc: () => 'testFunc result'
        });
    `;
    let evalBlock = new EvalBlock(src);
    let userDefs = evalBlock.execute();
    expect(userDefs).toContainKey('testFunc');
    expect(userDefs.testFunc).toBeInstanceOf(Function);
    let functionCall = new FunctionCall('testFunc');
    let result = functionCall.execute(userDefs, null, '', 0);
    expect(result).toBe('testFunc result');
  });
  
  it('propagates errors inside custom functions', function() {
    let src = `
        provide({
          testFunc: () => {
            throw new Error('test');
          }
        });
    `;
    let evalBlock = new EvalBlock(src);
    let userDefs = evalBlock.execute();
    let functionCall = new FunctionCall('testFunc');
    expect(() => {
      functionCall.execute(userDefs, null, '', 0);
    }).toThrowError('test');
  });
  
  it('allows custom functions to access the eval api', function() {
    let src = `
        function assert(obj) {
            if (!obj) {
                throw new Error('' + obj + ' was not truthy');
            }
        }

        provide({
          testFunc: () => {
            // Try accessing every field in the eval API
            assert(bml.WeightedChoice);
            assert(bml.weightedChoose);
            assert(bml.randomInt);
            assert(bml.randomFloat);
          }
        });
    `;
    let evalBlock = new EvalBlock(src);
    let userDefs = evalBlock.execute();
    let functionCall = new FunctionCall('testFunc');
    functionCall.execute(userDefs, null, '', 0);
  });
  
  it('Gives error when calling non-existent function', function() {
    let evalBlock = new EvalBlock('');
    let userDefs = evalBlock.execute();
    let functionCall = new FunctionCall('nonExistentFunc');
    expect(() => {
      functionCall.execute(userDefs, null, 'stub source', 0);
    }).toThrowError(FunctionNotFoundError);
  });
  
  it('Gives error when calling non-function', function() {
    let src = `
        provide({
            notAFunc: 'notAFunc'
        });
    `;
    let evalBlock = new EvalBlock(src);
    let userDefs = evalBlock.execute();
    let functionCall = new FunctionCall('notAFunc');
    expect(() => {
      functionCall.execute(userDefs, null, 'stub source', 0);
    }).toThrowError(NotAFunctionError);
  });
  

});
