const _errors = require('./errors.js');
const FunctionNotFoundError = _errors.FunctionNotFoundError;
const NotAFunctionError = _errors.NotAFunctionError;


class FunctionCall {
  constructor(functionName) {
    this.functionName = functionName;
  }

  toString() {
    return `functionCall('${this.functionName}')`;
  }
  
  execute(userDefs, match, documentString, charIndex) {
    let func = userDefs[this.functionName];
    if (typeof func === 'undefined') {
      throw new FunctionNotFoundError(this.functionName, documentString, charIndex);
    } else if (!(func instanceof Function)) {
      throw new NotAFunctionError(this.functionName, documentString, charIndex);
    }
    return func(match || [''], documentString, charIndex);
  }
}

exports.FunctionCall = FunctionCall;
