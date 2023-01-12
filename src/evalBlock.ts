import * as evalApi from './evalApi';
import { UserDefs, validateUserDefs } from './userDefs';

const evalFuncTemplate = `
  const bml = this;

  const __new_bindings = {};

  function bind(obj) {
    for (let key in obj) {
      __new_bindings[key] = obj[key];
    }

  }

  ***USER DEFS BINDING SLOT***

  let __output = '';

  function insert(str) {
    __output += str;
  }

  ////////// start user code

  ***USER CODE SLOT***

  ////////// end user code

  ***SAVE USER MUTATIONS SLOT***

  return {output: __output, bindings: __new_bindings};
`;


export type EvalResult = {
  output: string;
  bindings: UserDefs;
};


export class EvalBlock {
  contents: string;

  constructor(contents: string) {
    this.contents = contents;
  }

  toString(): string {
    return `EvalBlock('${this.contents}')`;
  }

  generateBindingCode(userDefs: UserDefs): string {
    let lines = [];
    if (userDefs.settings) {
      lines.push('let settings = __user_def_bindings.settings;');
    }
    for (let key in userDefs) {
      lines.push(`let ${key} = __user_def_bindings.${key}`)
    }
    return lines.join('\n');
  }

  generateSaveUserMutationsCode(userDefs: UserDefs): string {
    let lines = [];
    if (userDefs.settings) {
      lines.push('__user_def_bindings.settings = settings;');
    }
    for (let key in userDefs) {
      lines.push(`__user_def_bindings.${key} = ${key};`)
    }
    return lines.join('\n');
  }

  toFunc(userDefs: UserDefs): Function {
    let funcSrc = evalFuncTemplate.replace('***USER CODE SLOT***', this.contents);
    funcSrc = funcSrc.replace('***USER DEFS BINDING SLOT***',
      this.generateBindingCode(userDefs));
    funcSrc = funcSrc.replace('***SAVE USER MUTATIONS SLOT***',
      this.generateSaveUserMutationsCode(userDefs));
    let funcContext = Object.assign({}, evalApi.api);
    return new Function('__user_def_bindings', funcSrc).bind(funcContext);
  }

  execute(userDefs: UserDefs): EvalResult {
    let result = this.toFunc(userDefs)(userDefs);
    validateUserDefs(result.bindings);
    return result;
  }
}

