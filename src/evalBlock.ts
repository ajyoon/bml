import * as evalApi from './evalApi';
import { DocumentSettings } from './settings';
import { UserDefs, validateAndBuildUserDefs } from './userDefs';

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
    return validateAndBuildUserDefs(this.toFunc()());
  }
}

