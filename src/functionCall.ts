import {
  FunctionNotFoundError,
  NotAFunctionError
} from './errors.ts';
import { UserDefs } from './evalBlock.ts';


export class FunctionCall {
  functionName: string;

  constructor(functionName: string) {
    this.functionName = functionName;
  }

  toString(): string {
    return `functionCall('${this.functionName}')`;
  }

  execute(userDefs: UserDefs, match: string[], documentString: string, charIndex: number): string {
    let func = userDefs[this.functionName];
    if (typeof func === 'undefined') {
      throw new FunctionNotFoundError(this.functionName, documentString, charIndex);
    } else if (!(func instanceof Function)) {
      throw new NotAFunctionError(this.functionName, documentString, charIndex);
    }
    return func(match || [''], documentString, charIndex);
  }
}
