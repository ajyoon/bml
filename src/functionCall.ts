import {
  FunctionNotFoundError,
  NotAFunctionError
} from './errors.ts';


export class FunctionCall {
  functionName: string;

  constructor(functionName: string) {
    this.functionName = functionName;
  }

  toString(): string {
    return `functionCall('${this.functionName}')`;
  }

  // TODO work out these types
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
