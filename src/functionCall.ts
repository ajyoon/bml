import {
  FunctionNotFoundError,
  NotAFunctionError
} from './errors';
import { UserDefs } from './userDefs';


export type InlineCall = {
  input: string,
  index: number
};


export class FunctionCall {
  functionName: string;

  constructor(functionName: string) {
    this.functionName = functionName;
  }

  toString(): string {
    return `FunctionCall('${this.functionName}')`;
  }

  execute(userDefs: UserDefs, arg: InlineCall): string {
    let func = userDefs.funcs[this.functionName];
    let input, index;
    let match = null;
    let inlineCall = null;
    inlineCall = arg;
    input = arg.input;
    index = arg.index;
    if (typeof func === 'undefined') {
      throw new FunctionNotFoundError(this.functionName, input, index);
    } else if (!(func instanceof Function)) {
      throw new NotAFunctionError(this.functionName, input, index);
    }
    return func(match, inlineCall);
  }
}
