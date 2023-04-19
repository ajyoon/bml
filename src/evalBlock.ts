import * as evalApi from './evalApi';
import { UserDefs, validateUserDefs } from './userDefs';
import { EvalBindingError } from './errors';
import type { Renderer } from './renderer';

const evalFuncTemplate = `
  const bml = this;

  const __new_bindings = {};

  function bind(obj) {
    for (let key in obj) {
      __new_bindings[key] = obj[key];
    }
  }

  // Note this feature is currently unstable. The final structure of forkMap
  // is likely to change before stabilizing.
  bml.forkMap = __context.renderer.choiceResultMap;

  ***USER DEFS BINDING SLOT***


  function insert(str) {
    __context.output += str;
  }

  function include(includePath) {
    let result = __context.renderer.renderInclude(includePath);
    insert(result);
  }

  ////////// start user code

  ***USER CODE SLOT***

  ////////// end user code

  ***SAVE USER MUTATIONS SLOT***

  return __new_bindings;
`;


export type EvalContext = {
  bindings: UserDefs;
  renderer: Renderer;
  output: string;
}


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
      lines.push('let settings = __context.bindings.settings;');
    }
    for (let key in userDefs) {
      lines.push(`let ${key} = __context.bindings.${key}`)
    }
    return lines.join('\n');
  }

  generateSaveUserMutationsCode(userDefs: UserDefs): string {
    let lines = [];
    if (userDefs.settings) {
      lines.push('__context.bindings.settings = settings;');
    }
    for (let key in userDefs) {
      lines.push(`__context.bindings.${key} = ${key};`)
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
    return new Function('__context', funcSrc).bind(funcContext);
  }

  /*
   * Execution results are stored in the passed-in context
   */
  execute(context: EvalContext) {
    let newBindings = this.toFunc(context.bindings)(context);
    validateUserDefs(newBindings);
    for (let [key, value] of Object.entries(newBindings)) {
      if (context.bindings.hasOwnProperty(key)) {
        throw new EvalBindingError(key);
      }
      context.bindings[key] = value;
    }
  }
}

