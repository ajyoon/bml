import * as evalApi from './evalApi';
import { DocumentSettings } from './settings';


// TODO run some basic checks against provided code,
// like ensuring there are no uses of `Math.random`

const evalFuncTemplate = `
  const bml = this;
  const __USER_DEFS = {};

  function provide(obj) {
    for (let key in obj) {
      __USER_DEFS[key] = obj[key];
    }
  }

  ////////// start user code

  ***USER CODE SLOT***

  ///////// end userspace code

  return __USER_DEFS;
`;


export class EvalBlock {
  string: string;

  constructor(string: string) {
    this.string = string;
  }

  toString(): string {
    return `EvalBlock('${this.string}')`;
  }

  toFunc(): Function {
    let funcSrc = evalFuncTemplate.replace('***USER CODE SLOT***', this.string);
    return new Function(funcSrc).bind(evalApi.api);
  }

  execute(): UserDefs {
    let rawResult = this.toFunc()();
    let defs: UserDefs = { funcs: {} };
    for (let [key, value] of Object.entries(rawResult)) {
      if (key === 'settings') {
        defs.settings = <DocumentSettings>value;
      } else {
        defs.funcs[key] = <Function>value;
      }
    }
    return defs;
  }
}

export type UserDefs = {
  settings?: DocumentSettings,
  funcs: { [index: string]: Function }
}
