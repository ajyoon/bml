const evalApi = require('./evalApi.ts');


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


class EvalBlock {
  constructor(string) {
    this.string = string;
  }

  toString() {
    return `EvalBlock('${this.string}')`;
  }
  
  toFunc() {
    let funcSrc = evalFuncTemplate.replace('***USER CODE SLOT***', this.string);
    return new Function(funcSrc).bind(evalApi.api);
  }
  
  execute() {
    return this.toFunc()();
  }
}

exports.EvalBlock = EvalBlock;
