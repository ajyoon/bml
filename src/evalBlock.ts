import * as evalApi from './evalApi';
import { DocumentSettings } from './settings';

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

  ////////// end user code

  return __USER_DEFS;
`;


export class EvalBlock {
  contents: string;

  constructor(contents: string) {
    this.contents = contents;
  }

  toString(): string {
    return `EvalBlock('${this.contents}')`;
  }

  toFunc(): Function {
    let funcSrc = evalFuncTemplate.replace('***USER CODE SLOT***', this.contents);
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
